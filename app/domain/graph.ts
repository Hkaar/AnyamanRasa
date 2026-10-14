// Recipe Graph neighbourhood selection (SKPL-F-03.1–03.4, SKPL-NF-02.1).
// Edges come only from stored data: recipe_ingredients ("uses"), node_relations,
// and recipe_categories ("same_category", off by default). Nothing is inferred
// from similarity scores or layout.

import type { Difficulty, NodeType } from './types.ts'

export const GRAPH_EDGE_KINDS = [
  'similar_to',
  'variation_of',
  'uses',
  'substitute_for',
  'pairs_with',
  'inspired_by',
  'same_category',
] as const
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number]

export const DEFAULT_EDGE_KINDS: readonly GraphEdgeKind[] = GRAPH_EDGE_KINDS.filter(
  (kind) => kind !== 'same_category',
)

export const GRAPH_EDGE_LABELS: Record<GraphEdgeKind, string> = {
  similar_to: 'serupa',
  variation_of: 'variasi',
  uses: 'bahan',
  substitute_for: 'pengganti',
  pairs_with: 'pasangan',
  inspired_by: 'terinspirasi',
  same_category: 'kategori sama',
}

export const GRAPH_FILTER_LABELS: Record<GraphEdgeKind, string> = {
  similar_to: 'Serupa',
  variation_of: 'Variasi',
  uses: 'Bahan',
  substitute_for: 'Pengganti',
  pairs_with: 'Pasangan',
  inspired_by: 'Terinspirasi',
  same_category: 'Kategori sama',
}

export const MAX_GRAPH_NODES = 30
export const MAX_GRAPH_DEPTH = 2

export type NodeKey = `${NodeType}:${string}`

export function nodeKey(type: NodeType, id: string): NodeKey {
  return `${type}:${id}`
}

export function parseNodeKey(value: string): { type: NodeType; id: string } | null {
  let match = /^(recipe|ingredient):([0-9a-f-]{36})$/i.exec(value)
  return match ? { type: match[1] as NodeType, id: match[2]!.toLowerCase() } : null
}

export interface GraphNode {
  key: NodeKey
  type: NodeType
  id: string
  name: string
  imageUrl: string | null
  /** Recipe-only details for the side panel. */
  recipe?: {
    description: string
    totalMinutes: number
    difficulty: Difficulty
    authorName: string
  }
}

export interface GraphEdge {
  id: string
  kind: GraphEdgeKind
  /** Direction as stored (variation → source recipe, original → substitute). */
  source: NodeKey
  target: NodeKey
  label: string | null
}

export interface GraphNeighborhood {
  center: NodeKey
  depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** Edge counts per kind in the unfiltered neighbourhood, for the filter list. */
  kindCounts: Record<GraphEdgeKind, number>
  /** True when the node cap cut the neighbourhood short. */
  truncated: boolean
}

// When the cap is reached, keep the most informative relationships first.
const KIND_PRIORITY: Record<GraphEdgeKind, number> = {
  variation_of: 0,
  similar_to: 1,
  uses: 2,
  substitute_for: 3,
  pairs_with: 4,
  inspired_by: 5,
  same_category: 6,
}

export interface SelectNeighborhoodInput {
  center: NodeKey
  depth: number
  kinds: readonly GraphEdgeKind[]
  /** All candidate edges loaded around the centre, up to `depth` hops. */
  edges: readonly GraphEdge[]
  maxNodes?: number
}

/**
 * Breadth-first selection of the centre's neighbourhood. Ingredient substitutes
 * of included ingredients are attached one hop further, so a recipe's
 * depth-1 view still shows what its ingredients can be swapped for.
 */
export function selectNeighborhood(input: SelectNeighborhoodInput): {
  nodeKeys: NodeKey[]
  edges: GraphEdge[]
  truncated: boolean
} {
  let maxNodes = input.maxNodes ?? MAX_GRAPH_NODES
  let depth = Math.min(Math.max(1, input.depth), MAX_GRAPH_DEPTH)
  let kinds = new Set(input.kinds)
  let edges = input.edges.filter((edge) => kinds.has(edge.kind))

  let adjacency = new Map<NodeKey, GraphEdge[]>()
  for (let edge of edges) {
    for (let key of [edge.source, edge.target]) {
      let list = adjacency.get(key) ?? []
      list.push(edge)
      adjacency.set(key, list)
    }
  }
  for (let list of adjacency.values()) {
    list.sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] || a.id.localeCompare(b.id))
  }

  let included = new Set<NodeKey>([input.center])
  let order: NodeKey[] = [input.center]
  let truncated = false
  let frontier: NodeKey[] = [input.center]

  for (let level = 0; level < depth && frontier.length > 0; level++) {
    let next: NodeKey[] = []
    for (let key of frontier) {
      for (let edge of adjacency.get(key) ?? []) {
        let other = edge.source === key ? edge.target : edge.source
        if (included.has(other)) continue
        if (included.size >= maxNodes) {
          truncated = true
          break
        }
        included.add(other)
        order.push(other)
        next.push(other)
      }
    }
    frontier = next
  }

  // Attach substitutes of included ingredients (one extra hop, still capped).
  for (let key of [...order]) {
    if (!key.startsWith('ingredient:')) continue
    for (let edge of adjacency.get(key) ?? []) {
      if (edge.kind !== 'substitute_for' || edge.source !== key || included.has(edge.target)) continue
      if (included.size >= maxNodes) {
        truncated = true
        break
      }
      included.add(edge.target)
      order.push(edge.target)
    }
  }

  return {
    nodeKeys: order,
    edges: edges.filter((edge) => included.has(edge.source) && included.has(edge.target)),
    truncated,
  }
}

export function countKinds(edges: readonly GraphEdge[]): Record<GraphEdgeKind, number> {
  let counts = Object.fromEntries(GRAPH_EDGE_KINDS.map((kind) => [kind, 0])) as Record<
    GraphEdgeKind,
    number
  >
  for (let edge of edges) counts[edge.kind]++
  return counts
}

export function parseEdgeKinds(values: readonly string[]): GraphEdgeKind[] {
  let kinds = values.filter((value): value is GraphEdgeKind =>
    (GRAPH_EDGE_KINDS as readonly string[]).includes(value),
  )
  return kinds.length > 0 ? kinds : [...DEFAULT_EDGE_KINDS]
}
