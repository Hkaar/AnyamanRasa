import { type SqlStatement, sql } from 'remix/data-table'

import { type Database, joinSql, queryRow, queryRows } from '../db.ts'
import type {
  Difficulty,
  ExplicitRelation,
  NodeType,
  RecipeDetail,
  RecipeIngredientLine,
  RecipeStatus,
  RecipeStep,
  RecipeSummary,
  RelationType,
} from '../domain/types.ts'

// ---------------------------------------------------------------------------
// Row mapping

interface SummaryRow {
  id: string
  title: string
  description: string
  image_url: string | null
  categories: string[]
  total_minutes: number
  difficulty: Difficulty
  status: RecipeStatus
  created_at: Date
  author_id: string
  author_name: string
  author_username: string
  author_avatar: string | null
  parent_id: string | null
  parent_title: string | null
  parent_author: string | null
  variation_count: number
}

/** Columns for a recipe summary; expects `r` (recipes) in scope. One query, no N+1. */
const summaryColumns = sql`
  r.id, r.title, r.description, r.image_url, r.difficulty, r.status, r.created_at,
  (r.prep_time_minutes + r.cook_time_minutes)::int as total_minutes,
  u.id as author_id, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar,
  coalesce((
    select array_agg(c.name order by c.id)
    from recipe_categories rc join categories c on c.id = rc.category_id
    where rc.recipe_id = r.id
  ), '{}') as categories,
  parent.id as parent_id, parent.title as parent_title, parent_author.name as parent_author,
  (
    select count(*) from node_relations child_rel
    join recipes child on child.id = child_rel.source_id and child.status = 'published'
    where child_rel.relation_type = 'variation_of' and child_rel.target_id = r.id
  )::int as variation_count
`

const summaryJoins = sql`
  join users u on u.id = r.user_id
  left join node_relations parent_rel on parent_rel.relation_type = 'variation_of' and parent_rel.source_id = r.id
  left join recipes parent on parent.id = parent_rel.target_id
  left join users parent_author on parent_author.id = parent.user_id
`

function toSummary(row: SummaryRow): RecipeSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    categories: row.categories,
    totalMinutes: row.total_minutes,
    difficulty: row.difficulty,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    author: {
      id: row.author_id,
      name: row.author_name,
      username: row.author_username,
      avatarUrl: row.author_avatar,
    },
    parent:
      row.parent_id && row.parent_title && row.parent_author
        ? { id: row.parent_id, title: row.parent_title, authorName: row.parent_author }
        : null,
    variationCount: row.variation_count,
  }
}

const saveCount = sql`(select count(*) from saved_recipes s where s.recipe_id = r.id)`

// ---------------------------------------------------------------------------
// Discovery (SKPL-F-01.1, F-01.2)

export const RECIPE_SORTS = ['relevan', 'populer', 'terbaru', 'tercepat'] as const
export type RecipeSort = (typeof RECIPE_SORTS)[number]

export interface RecipeFilters {
  query: string
  categoryIds: number[]
  difficulties: Difficulty[]
  maxMinutes: number | null
  sort: RecipeSort
  page: number
  pageSize: number
}

export async function searchRecipes(
  db: Database,
  filters: RecipeFilters,
): Promise<{ items: RecipeSummary[]; total: number }> {
  let conditions: SqlStatement[] = [sql`r.status = 'published'`]
  let terms = filters.query.trim()

  if (terms) {
    let pattern = `%${escapeLike(terms)}%`
    conditions.push(sql`(
      r.title ilike ${pattern} or r.description ilike ${pattern}
      or exists (
        select 1 from recipe_ingredients ri join ingredients i on i.id = ri.ingredient_id
        where ri.recipe_id = r.id and i.name ilike ${pattern}
      )
      or exists (
        select 1 from recipe_categories rc join categories c on c.id = rc.category_id
        where rc.recipe_id = r.id and c.name ilike ${pattern}
      )
    )`)
  }
  if (filters.categoryIds.length > 0) {
    conditions.push(sql`exists (
      select 1 from recipe_categories rc
      where rc.recipe_id = r.id and rc.category_id = any(${filters.categoryIds}::int[])
    )`)
  }
  if (filters.difficulties.length > 0) {
    conditions.push(sql`r.difficulty = any(${filters.difficulties}::recipe_difficulty[])`)
  }
  if (filters.maxMinutes !== null) {
    conditions.push(sql`r.prep_time_minutes + r.cook_time_minutes <= ${filters.maxMinutes}`)
  }

  let where = joinSql(conditions, ' and ')
  let pattern = `%${escapeLike(terms)}%`
  let titleRank = terms ? sql`(case when r.title ilike ${pattern} then 0 else 1 end),` : sql``
  let orderBy = {
    relevan: sql`${titleRank} ${saveCount} desc, r.created_at desc`,
    populer: sql`${saveCount} desc, r.created_at desc`,
    terbaru: sql`r.created_at desc`,
    tercepat: sql`(r.prep_time_minutes + r.cook_time_minutes) asc, r.title asc`,
  }[filters.sort]

  let offset = (filters.page - 1) * filters.pageSize
  let [rows, count] = await Promise.all([
    queryRows<SummaryRow>(
      db,
      sql`select ${summaryColumns} from recipes r ${summaryJoins}
          where ${where} order by ${orderBy}, r.id
          limit ${filters.pageSize} offset ${offset}`,
    ),
    queryRow<{ total: number }>(
      db,
      sql`select count(*)::int as total from recipes r where ${where}`,
    ),
  ])
  return { items: rows.map(toSummary), total: count?.total ?? 0 }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export type HomeTab = 'populer' | 'terbaru' | 'cepat'

export async function listHomeRecipes(db: Database, tab: HomeTab, limit = 6) {
  let orderBy = {
    populer: sql`${saveCount} desc, r.created_at desc`,
    terbaru: sql`r.created_at desc`,
    cepat: sql`(r.prep_time_minutes + r.cook_time_minutes) asc, ${saveCount} desc`,
  }[tab]
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from recipes r ${summaryJoins}
        where r.status = 'published' order by ${orderBy}, r.id limit ${limit}`,
  )
  return rows.map(toSummary)
}

export async function getSiteStats(db: Database) {
  let row = await queryRow<{ recipes: number; ingredients: number; variations: number }>(
    db,
    sql`select
      (select count(*) from recipes where status = 'published')::int as recipes,
      (select count(*) from ingredients)::int as ingredients,
      (select count(*) from node_relations nr join recipes r on r.id = nr.source_id
        where nr.relation_type = 'variation_of' and r.status = 'published')::int as variations`,
  )
  return row ?? { recipes: 0, ingredients: 0, variations: 0 }
}

export interface Category {
  id: number
  name: string
}

export async function listCategories(db: Database): Promise<Category[]> {
  return queryRows<Category>(db, sql`select id, name from categories order by id`)
}

/** Categories that have at least one published recipe, for the browse filter. */
export async function listUsedCategories(db: Database): Promise<(Category & { count: number })[]> {
  return queryRows(
    db,
    sql`select c.id, c.name, count(r.id)::int as count
        from categories c
        join recipe_categories rc on rc.category_id = c.id
        join recipes r on r.id = rc.recipe_id and r.status = 'published'
        group by c.id order by c.id`,
  )
}

// ---------------------------------------------------------------------------
// Detail (SKPL-F-02.1, F-02.2)

interface DetailRow extends SummaryRow {
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  steps: RecipeStep[]
  change_summary: string | null
  updated_at: Date
  save_count: number
}

export async function getRecipe(db: Database, id: string): Promise<RecipeDetail | null> {
  if (!isUuid(id)) return null
  let row = await queryRow<DetailRow>(
    db,
    sql`select ${summaryColumns}, r.prep_time_minutes, r.cook_time_minutes, r.servings, r.steps,
          r.change_summary, r.updated_at, ${saveCount}::int as save_count
        from recipes r ${summaryJoins} where r.id = ${id}`,
  )
  if (!row) return null
  return {
    ...toSummary(row),
    prepMinutes: row.prep_time_minutes,
    cookMinutes: row.cook_time_minutes,
    servings: row.servings,
    steps: row.steps,
    changeSummary: row.change_summary,
    updatedAt: row.updated_at.toISOString(),
    saveCount: row.save_count,
    ingredients: await getRecipeIngredients(db, id),
  }
}

export async function getRecipeIngredients(
  db: Database,
  recipeId: string,
): Promise<RecipeIngredientLine[]> {
  let rows = await queryRows<{
    ingredient_id: string
    name: string
    quantity: string | null
    unit: string | null
    note: string | null
    section: string | null
  }>(
    db,
    sql`select ri.ingredient_id, i.name, ri.quantity, ri.unit, ri.note, ri.section
        from recipe_ingredients ri join ingredients i on i.id = ri.ingredient_id
        where ri.recipe_id = ${recipeId}
        order by ri.position, i.name`,
  )
  return rows.map((row) => ({
    ingredientId: row.ingredient_id,
    name: row.name,
    quantity: row.quantity === null ? null : Number(row.quantity),
    unit: row.unit,
    note: row.note,
    section: row.section,
  }))
}

/** Published variations of a recipe (its direct lineage children). */
export async function listVariations(db: Database, recipeId: string): Promise<RecipeSummary[]> {
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from recipes r ${summaryJoins}
        where parent.id = ${recipeId} and r.status = 'published'
        order by r.created_at desc`,
  )
  return rows.map(toSummary)
}

/**
 * Explicit relationships stored in node_relations around one node, excluding
 * lineage (shown separately) and hiding recipes that are not published.
 */
export async function listExplicitRelations(
  db: Database,
  type: NodeType,
  id: string,
  types: RelationType[],
): Promise<ExplicitRelation[]> {
  let rows = await queryRows<{
    id: string
    relation_type: RelationType
    label: string | null
    direction: 'outgoing' | 'incoming'
    other_type: NodeType
    other_id: string
    other_name: string | null
    other_image: string | null
  }>(
    db,
    sql`with rel as (
          select nr.id, nr.relation_type, nr.label, 'outgoing' as direction,
            nr.target_type as other_type, nr.target_id as other_id
          from node_relations nr
          where nr.source_type = ${type}::node_type and nr.source_id = ${id}
            and nr.relation_type = any(${types}::relation_type[])
          union all
          select nr.id, nr.relation_type, nr.label, 'incoming',
            nr.source_type, nr.source_id
          from node_relations nr
          where nr.target_type = ${type}::node_type and nr.target_id = ${id}
            and nr.relation_type = any(${types}::relation_type[])
        )
        select rel.*,
          coalesce(r.title, i.name) as other_name,
          coalesce(r.image_url, i.image_url) as other_image
        from rel
        left join recipes r on rel.other_type = 'recipe' and r.id = rel.other_id
        left join ingredients i on rel.other_type = 'ingredient' and i.id = rel.other_id
        where rel.other_type = 'ingredient' or r.status = 'published'
        order by rel.relation_type, other_name`,
  )
  return rows.map((row) => ({
    id: row.id,
    type: row.relation_type,
    label: row.label,
    direction: row.direction,
    other: {
      type: row.other_type,
      id: row.other_id,
      name: row.other_name ?? '',
      imageUrl: row.other_image,
    },
  }))
}

/**
 * "Resep Terkait": published recipes that share a stored category with this
 * recipe, ranked by the number of shared categories and then shared
 * ingredients. Deterministic and traceable to recipe_categories and
 * recipe_ingredients; it does not create graph relationships.
 */
export async function listRelatedRecipes(
  db: Database,
  recipeId: string,
  limit = 4,
): Promise<RecipeSummary[]> {
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from recipes r ${summaryJoins}
        join lateral (
          select
            (select count(*) from recipe_categories a join recipe_categories b on a.category_id = b.category_id
              where a.recipe_id = ${recipeId} and b.recipe_id = r.id) as shared_categories,
            (select count(*) from recipe_ingredients a join recipe_ingredients b on a.ingredient_id = b.ingredient_id
              where a.recipe_id = ${recipeId} and b.recipe_id = r.id) as shared_ingredients
        ) shared on true
        where r.status = 'published' and r.id <> ${recipeId} and shared.shared_categories > 0
          and not exists (
            select 1 from node_relations lineage where lineage.relation_type = 'variation_of'
              and ((lineage.source_id = r.id and lineage.target_id = ${recipeId})
                or (lineage.source_id = ${recipeId} and lineage.target_id = r.id))
          )
        order by shared.shared_categories desc, shared.shared_ingredients desc, r.created_at desc
        limit ${limit}`,
  )
  return rows.map(toSummary)
}

export interface SharedIngredients {
  recipeId: string
  names: string[]
}

/** Ingredient names two recipes both list (used to explain an explicit relation). */
export async function sharedIngredientNames(db: Database, a: string, b: string): Promise<string[]> {
  let rows = await queryRows<{ name: string }>(
    db,
    sql`select i.name from recipe_ingredients x
        join recipe_ingredients y on y.ingredient_id = x.ingredient_id and y.recipe_id = ${b}
        join ingredients i on i.id = x.ingredient_id
        where x.recipe_id = ${a} order by x.position`,
  )
  return rows.map((row) => row.name)
}

// ---------------------------------------------------------------------------
// Profiles and bookmarks

export const AUTHOR_SORTS = ['terbaru', 'populer'] as const
export type AuthorSort = (typeof AUTHOR_SORTS)[number]

export interface AuthorRecipeOptions {
  includeUnpublished: boolean
  kind: 'original' | 'variation'
  /** Default `terbaru` (newest first); `populer` orders by bookmark count. */
  sort?: AuthorSort
  /** Maximum rows to return; all when omitted. */
  limit?: number
}

function authorConditions(userId: string, options: AuthorRecipeOptions): SqlStatement {
  let status = options.includeUnpublished
    ? sql`r.status in ('draft', 'published')`
    : sql`r.status = 'published'`
  let kind = options.kind === 'variation' ? sql`parent.id is not null` : sql`parent.id is null`
  return sql`r.user_id = ${userId} and ${status} and ${kind}`
}

export async function listRecipesByAuthor(
  db: Database,
  userId: string,
  options: AuthorRecipeOptions,
): Promise<RecipeSummary[]> {
  let orderBy = options.sort === 'populer' ? sql`${saveCount} desc, r.created_at desc` : sql`r.created_at desc`
  let limit = options.limit === undefined ? sql`` : sql`limit ${options.limit}`
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from recipes r ${summaryJoins}
        where ${authorConditions(userId, options)}
        order by ${orderBy}, r.id ${limit}`,
  )
  return rows.map(toSummary)
}

export async function countRecipesByAuthor(db: Database, userId: string, options: AuthorRecipeOptions) {
  let row = await queryRow<{ total: number }>(
    db,
    sql`select count(*)::int as total from recipes r ${summaryJoins} where ${authorConditions(userId, options)}`,
  )
  return row?.total ?? 0
}

export async function listSavedRecipes(db: Database, userId: string): Promise<RecipeSummary[]> {
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from saved_recipes s
        join recipes r on r.id = s.recipe_id ${summaryJoins}
        where s.user_id = ${userId} and r.status = 'published'
        order by s.created_at desc`,
  )
  return rows.map(toSummary)
}

export async function isRecipeSaved(db: Database, userId: string, recipeId: string) {
  let row = await queryRow(
    db,
    sql`select 1 from saved_recipes where user_id = ${userId} and recipe_id = ${recipeId}`,
  )
  return row !== null
}

export async function savedRecipeIds(db: Database, userId: string, recipeIds: string[]) {
  if (recipeIds.length === 0) return new Set<string>()
  let rows = await queryRows<{ recipe_id: string }>(
    db,
    sql`select recipe_id from saved_recipes
        where user_id = ${userId} and recipe_id = any(${recipeIds}::uuid[])`,
  )
  return new Set(rows.map((row) => row.recipe_id))
}

export async function setRecipeSaved(
  db: Database,
  userId: string,
  recipeId: string,
  saved: boolean,
) {
  if (saved) {
    await db.exec(sql`insert into saved_recipes (user_id, recipe_id) values (${userId}, ${recipeId})
      on conflict do nothing`)
  } else {
    await db.exec(
      sql`delete from saved_recipes where user_id = ${userId} and recipe_id = ${recipeId}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Writes (SKPL-F-06.x, F-07.x)

export interface RecipeWrite {
  title: string
  description: string
  imageUrl: string | null
  prepMinutes: number
  cookMinutes: number
  servings: number
  difficulty: Difficulty
  categoryIds: number[]
  steps: RecipeStep[]
  ingredients: {
    ingredientId: string
    quantity: number | null
    unit: string | null
    note: string | null
    section: string | null
  }[]
  status: Extract<RecipeStatus, 'draft' | 'published'>
  changeSummary: string | null
}

export async function createRecipe(
  db: Database,
  authorId: string,
  input: RecipeWrite,
  parent?: { recipeId: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    let row = await queryRow<{ id: string }>(
      tx,
      sql`insert into recipes (user_id, title, description, image_url, prep_time_minutes,
            cook_time_minutes, servings, difficulty, steps, change_summary, status)
          values (${authorId}, ${input.title}, ${input.description}, ${input.imageUrl},
            ${input.prepMinutes}, ${input.cookMinutes}, ${input.servings},
            ${input.difficulty}::recipe_difficulty, ${JSON.stringify(input.steps)}::jsonb,
            ${input.changeSummary}, ${input.status}::recipe_status)
          returning id`,
    )
    if (!row) throw new Error('Failed to create recipe')
    await writeRecipeChildren(tx, row.id, input)
    if (parent) {
      // Lineage is stored explicitly as recipe --variation_of--> source (SKPL-F-07.2).
      await tx.exec(sql`
        insert into node_relations (source_type, source_id, target_type, target_id, relation_type, label, created_by)
        values ('recipe', ${row.id}, 'recipe', ${parent.recipeId}, 'variation_of', null, ${authorId})
      `)
    }
    return row.id
  })
}

export async function updateRecipe(db: Database, recipeId: string, input: RecipeWrite) {
  await db.transaction(async (tx) => {
    await tx.exec(sql`
      update recipes set
        title = ${input.title},
        description = ${input.description},
        image_url = ${input.imageUrl},
        prep_time_minutes = ${input.prepMinutes},
        cook_time_minutes = ${input.cookMinutes},
        servings = ${input.servings},
        difficulty = ${input.difficulty}::recipe_difficulty,
        steps = ${JSON.stringify(input.steps)}::jsonb,
        change_summary = ${input.changeSummary},
        status = ${input.status}::recipe_status,
        updated_at = now()
      where id = ${recipeId}
    `)
    await tx.exec(sql`delete from recipe_ingredients where recipe_id = ${recipeId}`)
    await tx.exec(sql`delete from recipe_categories where recipe_id = ${recipeId}`)
    await writeRecipeChildren(tx, recipeId, input)
  })
}

async function writeRecipeChildren(tx: Database, recipeId: string, input: RecipeWrite) {
  if (input.ingredients.length > 0) {
    let values = input.ingredients.map(
      (line, index) =>
        sql`(${recipeId}, ${line.ingredientId}, ${line.quantity}, ${line.unit}, ${line.note}, ${line.section}, ${index})`,
    )
    await tx.exec(sql`
      insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, section, position)
      values ${joinSql(values, ', ')}
    `)
  }
  if (input.categoryIds.length > 0) {
    await tx.exec(sql`
      insert into recipe_categories (recipe_id, category_id)
      select ${recipeId}, unnest(${input.categoryIds}::int[])
    `)
  }
}

export async function setRecipeStatus(db: Database, recipeIds: string[], status: RecipeStatus) {
  if (recipeIds.length === 0) return 0
  let result = await db.exec(sql`
    update recipes set status = ${status}::recipe_status, updated_at = now()
    where id = any(${recipeIds}::uuid[])
  `)
  return result.affectedRows ?? 0
}

export async function getRecipeOwner(db: Database, recipeId: string) {
  if (!isUuid(recipeId)) return null
  return queryRow<{ user_id: string; status: RecipeStatus }>(
    db,
    sql`select user_id, status from recipes where id = ${recipeId}`,
  )
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/** Published recipes that list an ingredient (SKPL-F-04.1), optionally within one category. */
export async function listRecipesWithIngredient(
  db: Database,
  ingredientId: string,
  limit = 8,
  categoryId: number | null = null,
): Promise<RecipeSummary[]> {
  let inCategory = categoryId
    ? sql`and exists (select 1 from recipe_categories rc where rc.recipe_id = r.id and rc.category_id = ${categoryId})`
    : sql``
  let rows = await queryRows<SummaryRow>(
    db,
    sql`select ${summaryColumns} from recipes r ${summaryJoins}
        where r.status = 'published' and exists (
          select 1 from recipe_ingredients ri where ri.recipe_id = r.id and ri.ingredient_id = ${ingredientId}
        ) ${inCategory}
        order by ${saveCount} desc, r.created_at desc limit ${limit}`,
  )
  return rows.map(toSummary)
}

/** Categories among the published recipes that use an ingredient, most common first. */
export async function listCategoriesForIngredient(
  db: Database,
  ingredientId: string,
  limit = 2,
): Promise<(Category & { count: number })[]> {
  return queryRows(
    db,
    sql`select c.id, c.name, count(*)::int as count
        from recipe_ingredients ri
        join recipes r on r.id = ri.recipe_id and r.status = 'published'
        join recipe_categories rc on rc.recipe_id = r.id
        join categories c on c.id = rc.category_id
        where ri.ingredient_id = ${ingredientId}
        group by c.id order by count(*) desc, c.id limit ${limit}`,
  )
}
