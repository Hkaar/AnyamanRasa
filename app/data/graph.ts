import { sql } from 'remix/data-table'

import { type Database, queryRows } from '../db.ts'
import {
  type GraphEdge,
  type GraphEdgeKind,
  type GraphNeighborhood,
  type GraphNode,
  MAX_GRAPH_DEPTH,
  type NodeKey,
  GRAPH_EDGE_KINDS,
  countKinds,
  nodeKey,
  parseNodeKey,
  selectNeighborhood,
} from '../domain/graph.ts'
import type { Difficulty, NodeType } from '../domain/types.ts'

const SAME_CATEGORY_LIMIT = 6
// Bounds each expansion query; the domain cap keeps the rendered graph to MAX_GRAPH_NODES.
const MAX_EDGES_PER_LEVEL = 400

interface EdgeRow {
  id: string
  kind: GraphEdgeKind
  source_type: NodeType
  source_id: string
  target_type: NodeType
  target_id: string
  label: string | null
}

/**
 * Loads the stored edges touching any of the given nodes: recipe_ingredients
 * as "uses" and node_relations as typed relations. Unpublished recipes are
 * excluded at both ends.
 */
async function loadEdges(
  db: Database,
  keys: NodeKey[],
  options: { substitutesOnly: boolean } = { substitutesOnly: false },
): Promise<GraphEdge[]> {
  if (options.substitutesOnly) return loadSubstituteEdges(db, keys)
  let recipeIds = keys.filter((k) => k.startsWith('recipe:')).map((k) => k.slice(7))
  let ingredientIds = keys.filter((k) => k.startsWith('ingredient:')).map((k) => k.slice(11))

  let rows = await queryRows<EdgeRow>(
    db,
    sql`with published as (select id from recipes where status = 'published')
        select ri.id, 'uses' as kind, 'recipe' as source_type, ri.recipe_id as source_id,
          'ingredient' as target_type, ri.ingredient_id as target_id, null as label
        from recipe_ingredients ri
        where ri.recipe_id in (select id from published)
          and (ri.recipe_id = any(${recipeIds}::uuid[]) or ri.ingredient_id = any(${ingredientIds}::uuid[]))
        union all
        select nr.id, nr.relation_type::text, nr.source_type::text, nr.source_id,
          nr.target_type::text, nr.target_id, nr.label
        from node_relations nr
        where nr.relation_type <> 'uses'
          and (
            (nr.source_type = 'recipe' and nr.source_id = any(${recipeIds}::uuid[]))
            or (nr.target_type = 'recipe' and nr.target_id = any(${recipeIds}::uuid[]))
            or (nr.source_type = 'ingredient' and nr.source_id = any(${ingredientIds}::uuid[]))
            or (nr.target_type = 'ingredient' and nr.target_id = any(${ingredientIds}::uuid[]))
          )
          and (nr.source_type = 'ingredient' or nr.source_id in (select id from published))
          and (nr.target_type = 'ingredient' or nr.target_id in (select id from published))
        limit ${MAX_EDGES_PER_LEVEL}`,
  )
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    source: nodeKey(row.source_type, row.source_id),
    target: nodeKey(row.target_type, row.target_id),
    label: row.label,
  }))
}

async function loadSubstituteEdges(db: Database, keys: NodeKey[]): Promise<GraphEdge[]> {
  let ingredientIds = keys.filter((k) => k.startsWith('ingredient:')).map((k) => k.slice(11))
  if (ingredientIds.length === 0) return []
  let rows = await queryRows<EdgeRow>(
    db,
    sql`select nr.id, 'substitute_for' as kind, 'ingredient' as source_type, nr.source_id,
          'ingredient' as target_type, nr.target_id, nr.label
        from node_relations nr
        where nr.relation_type = 'substitute_for' and nr.source_id = any(${ingredientIds}::uuid[])`,
  )
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    source: nodeKey(row.source_type, row.source_id),
    target: nodeKey(row.target_type, row.target_id),
    label: row.label,
  }))
}

/** Derived edges to recipes sharing a stored category with the centre recipe. */
async function loadSameCategoryEdges(db: Database, recipeId: string): Promise<GraphEdge[]> {
  let rows = await queryRows<{ other_id: string; category: string }>(
    db,
    sql`select distinct on (other.recipe_id) other.recipe_id as other_id, c.name as category
        from recipe_categories mine
        join recipe_categories other on other.category_id = mine.category_id and other.recipe_id <> mine.recipe_id
        join recipes r on r.id = other.recipe_id and r.status = 'published'
        join categories c on c.id = mine.category_id
        where mine.recipe_id = ${recipeId}
        order by other.recipe_id, c.id
        limit ${SAME_CATEGORY_LIMIT}`,
  )
  return rows.map((row) => ({
    id: `same_category:${recipeId}:${row.other_id}`,
    kind: 'same_category',
    source: nodeKey('recipe', recipeId),
    target: nodeKey('recipe', row.other_id),
    label: `Kategori sama: ${row.category}`,
  }))
}

async function loadNodes(db: Database, keys: NodeKey[]): Promise<Map<NodeKey, GraphNode>> {
  let recipeIds = keys.filter((k) => k.startsWith('recipe:')).map((k) => k.slice(7))
  let ingredientIds = keys.filter((k) => k.startsWith('ingredient:')).map((k) => k.slice(11))

  let [recipes, ingredients] = await Promise.all([
    queryRows<{
      id: string
      title: string
      image_url: string | null
      description: string
      total_minutes: number
      difficulty: Difficulty
      author_name: string
    }>(
      db,
      sql`select r.id, r.title, r.image_url, r.description, r.difficulty, u.name as author_name,
            (r.prep_time_minutes + r.cook_time_minutes)::int as total_minutes
          from recipes r join users u on u.id = r.user_id
          where r.id = any(${recipeIds}::uuid[]) and r.status = 'published'`,
    ),
    queryRows<{ id: string; name: string; image_url: string | null }>(
      db,
      sql`select id, name, image_url from ingredients where id = any(${ingredientIds}::uuid[])`,
    ),
  ])

  let nodes = new Map<NodeKey, GraphNode>()
  for (let row of recipes) {
    let key = nodeKey('recipe', row.id)
    nodes.set(key, {
      key,
      type: 'recipe',
      id: row.id,
      name: row.title,
      imageUrl: row.image_url,
      recipe: {
        description: row.description,
        totalMinutes: row.total_minutes,
        difficulty: row.difficulty,
        authorName: row.author_name,
      },
    })
  }
  for (let row of ingredients) {
    let key = nodeKey('ingredient', row.id)
    nodes.set(key, { key, type: 'ingredient', id: row.id, name: row.name, imageUrl: row.image_url })
  }
  return nodes
}

export interface NeighborhoodRequest {
  center: string
  depth: number
  kinds: GraphEdgeKind[]
}

/**
 * Loads a bounded neighbourhood (SKPL-F-03.2, NF-02.1): one edge query per
 * depth level plus one node query, then selection in the domain layer.
 */
export async function loadNeighborhood(
  db: Database,
  request: NeighborhoodRequest,
): Promise<GraphNeighborhood | null> {
  let parsed = parseNodeKey(request.center)
  if (!parsed) return null
  let center = nodeKey(parsed.type, parsed.id)
  let depth = Math.min(Math.max(1, request.depth), MAX_GRAPH_DEPTH)

  let centerNodes = await loadNodes(db, [center])
  if (!centerNodes.has(center)) return null

  let edges = new Map<string, GraphEdge>()
  let visited = new Set<NodeKey>([center])
  let frontier: NodeKey[] = [center]
  // One extra level loads only substitutes of boundary ingredients.
  for (let level = 0; level <= depth && frontier.length > 0; level++) {
    let loaded = await loadEdges(db, frontier, { substitutesOnly: level === depth })
    let next: NodeKey[] = []
    for (let edge of loaded) {
      edges.set(edge.id, edge)
      for (let key of [edge.source, edge.target]) {
        if (!visited.has(key)) {
          visited.add(key)
          next.push(key)
        }
      }
    }
    frontier = next
  }

  let sameCategory = parsed.type === 'recipe' ? await loadSameCategoryEdges(db, parsed.id) : []
  if (request.kinds.includes('same_category')) {
    for (let edge of sameCategory) edges.set(edge.id, edge)
  }

  let allEdges = [...edges.values()]
  let selection = selectNeighborhood({ center, depth, kinds: request.kinds, edges: allEdges })
  let nodes = await loadNodes(db, selection.nodeKeys)

  return {
    center,
    depth,
    nodes: selection.nodeKeys.flatMap((key) => nodes.get(key) ?? []),
    edges: selection.edges.filter((edge) => nodes.has(edge.source) && nodes.has(edge.target)),
    // Per-kind totals in the unfiltered neighbourhood, so the filter list shows what each toggle adds.
    kindCounts: countKinds(
      selectNeighborhood({ center, depth, kinds: [...GRAPH_EDGE_KINDS], edges: [...allEdges, ...sameCategory] }).edges,
    ),
    truncated: selection.truncated,
  }
}

/** Search box on the graph toolbar: recipes and ingredients by name. */
export async function searchGraphNodes(db: Database, query: string, limit = 8) {
  let term = query.trim()
  if (!term) return []
  let pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
  return queryRows<{ key: NodeKey; type: NodeType; name: string }>(
    db,
    sql`(select 'recipe:' || id as key, 'recipe' as type, title as name from recipes
          where status = 'published' and title ilike ${pattern} order by title limit ${limit})
        union all
        (select 'ingredient:' || id, 'ingredient', name from ingredients
          where name ilike ${pattern} order by name limit ${limit})`,
  )
}

/** The published recipe with the most stored relationships: a good default graph centre. */
export async function mostConnectedRecipeKey(db: Database): Promise<NodeKey | null> {
  let rows = await queryRows<{ id: string }>(
    db,
    sql`select r.id from recipes r
        join node_relations nr on (nr.source_type = 'recipe' and nr.source_id = r.id)
          or (nr.target_type = 'recipe' and nr.target_id = r.id)
        where r.status = 'published'
        group by r.id order by count(*) desc, r.created_at limit 1`,
  )
  return rows[0] ? nodeKey('recipe', rows[0].id) : null
}
