import { type SqlStatement, sql } from 'remix/data-table'

import { type Database, joinSql, queryRow, queryRows } from '../db.ts'
import type { RecipeStatus } from '../domain/types.ts'

export interface AdminRecipeFilters {
  query: string
  status: RecipeStatus | null
  categoryId: number | null
  page: number
}

export interface AdminRecipeRow {
  id: string
  title: string
  imageUrl: string | null
  authorName: string
  categories: string[]
  status: RecipeStatus
  updatedAt: string
  isVariation: boolean
}

export const ADMIN_PAGE_SIZE = 20

function conditions(filters: AdminRecipeFilters): SqlStatement {
  let parts: SqlStatement[] = [sql`true`]
  if (filters.query) {
    let pattern = `%${filters.query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    parts.push(sql`(r.title ilike ${pattern} or u.name ilike ${pattern} or u.username ilike ${pattern})`)
  }
  if (filters.status) parts.push(sql`r.status = ${filters.status}::recipe_status`)
  if (filters.categoryId) {
    parts.push(sql`exists (select 1 from recipe_categories rc where rc.recipe_id = r.id and rc.category_id = ${filters.categoryId})`)
  }
  return joinSql(parts, ' and ')
}

export async function listAdminRecipes(db: Database, filters: AdminRecipeFilters, limit = ADMIN_PAGE_SIZE) {
  let where = conditions(filters)
  let offset = (filters.page - 1) * ADMIN_PAGE_SIZE
  let [rows, count] = await Promise.all([
    queryRows<{
      id: string
      title: string
      image_url: string | null
      author_name: string
      categories: string[]
      status: RecipeStatus
      updated_at: Date
      is_variation: boolean
    }>(
      db,
      sql`select r.id, r.title, r.image_url, u.name as author_name, r.status, r.updated_at,
            coalesce((select array_agg(c.name order by c.id) from recipe_categories rc
              join categories c on c.id = rc.category_id where rc.recipe_id = r.id), '{}') as categories,
            exists (select 1 from node_relations nr where nr.relation_type = 'variation_of' and nr.source_id = r.id) as is_variation
          from recipes r join users u on u.id = r.user_id
          where ${where}
          order by r.updated_at desc, r.id limit ${limit} offset ${offset}`,
    ),
    queryRow<{ total: number }>(db, sql`select count(*)::int as total from recipes r join users u on u.id = r.user_id where ${where}`),
  ])
  return {
    total: count?.total ?? 0,
    rows: rows.map(
      (row): AdminRecipeRow => ({
        id: row.id,
        title: row.title,
        imageUrl: row.image_url,
        authorName: row.author_name,
        categories: row.categories,
        status: row.status,
        updatedAt: row.updated_at.toISOString(),
        isVariation: row.is_variation,
      }),
    ),
  }
}

export async function getAdminStats(db: Database) {
  let row = await queryRow<{ total: number; published: number; drafts: number; archived: number; this_week: number }>(
    db,
    sql`select count(*)::int as total,
          count(*) filter (where status = 'published')::int as published,
          count(*) filter (where status = 'draft')::int as drafts,
          count(*) filter (where status = 'archived')::int as archived,
          count(*) filter (where status = 'published' and created_at > now() - interval '7 days')::int as this_week
        from recipes`,
  )
  return row ?? { total: 0, published: 0, drafts: 0, archived: 0, this_week: 0 }
}

export type ModerationAction = 'archive' | 'restore'

/**
 * Moderation transitions: published → archived and archived → published.
 * Drafts belong to their authors and are never changed by moderation.
 */
export async function moderateRecipes(db: Database, ids: string[], action: ModerationAction): Promise<string[]> {
  if (ids.length === 0) return []
  let [from, to] = action === 'archive' ? ['published', 'archived'] : ['archived', 'published']
  let result = await db.exec(sql`
    update recipes set status = ${to}::recipe_status, updated_at = now()
    where id = any(${ids}::uuid[]) and status = ${from}::recipe_status
    returning title
  `)
  return ((result.rows ?? []) as { title: string }[]).map((row) => row.title)
}
