import { sql } from 'remix/data-table'

import { type Database, queryRow, queryRows } from '../db.ts'
import type { PantryIngredient, Substitution } from '../domain/pantry.ts'
import type { IngredientSummary } from '../domain/types.ts'
import { isUuid } from './recipes.ts'

export interface IngredientDetail extends IngredientSummary {
  description: string
  recipeCount: number
}

export async function getIngredient(db: Database, id: string): Promise<IngredientDetail | null> {
  if (!isUuid(id)) return null
  let row = await queryRow<{
    id: string
    name: string
    image_url: string | null
    description: string
    recipe_count: number
  }>(
    db,
    sql`select i.id, i.name, i.image_url, i.description,
          (select count(*) from recipe_ingredients ri join recipes r on r.id = ri.recipe_id
            where ri.ingredient_id = i.id and r.status = 'published')::int as recipe_count
        from ingredients i where i.id = ${id}`,
  )
  return row
    ? {
        id: row.id,
        name: row.name,
        imageUrl: row.image_url,
        description: row.description,
        recipeCount: row.recipe_count,
      }
    : null
}

export interface IngredientSuggestion extends IngredientSummary {
  recipeCount: number
}

/** Autocomplete: prefix matches first, then substring matches, by usage. */
export async function searchIngredients(
  db: Database,
  query: string,
  limit = 8,
): Promise<IngredientSuggestion[]> {
  let term = query.trim()
  if (!term) return []
  let escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`)
  let rows = await queryRows<{
    id: string
    name: string
    image_url: string | null
    recipe_count: number
  }>(
    db,
    sql`select i.id, i.name, i.image_url,
          (select count(*) from recipe_ingredients ri where ri.ingredient_id = i.id)::int as recipe_count
        from ingredients i
        where i.name ilike ${`%${escaped}%`}
        order by (case when i.name ilike ${`${escaped}%`} then 0 else 1 end), recipe_count desc, i.name
        limit ${limit}`,
  )
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    recipeCount: row.recipe_count,
  }))
}

/** Most-used ingredients across published recipes ("Tambah cepat"). */
export async function listPopularIngredients(db: Database, limit = 10): Promise<IngredientSummary[]> {
  let rows = await queryRows<{ id: string; name: string; image_url: string | null }>(
    db,
    sql`select i.id, i.name, i.image_url from ingredients i
        join recipe_ingredients ri on ri.ingredient_id = i.id
        join recipes r on r.id = ri.recipe_id and r.status = 'published'
        group by i.id order by count(*) desc, i.name limit ${limit}`,
  )
  return rows.map((row) => ({ id: row.id, name: row.name, imageUrl: row.image_url }))
}

export async function getIngredientsByIds(db: Database, ids: string[]): Promise<PantryIngredient[]> {
  let valid = ids.filter(isUuid)
  if (valid.length === 0) return []
  return queryRows<PantryIngredient>(
    db,
    // Keep the caller's (URL insertion) order.
    sql`select id, name from ingredients where id = any(${valid}::uuid[])
        order by array_position(${valid}::uuid[], id)`,
  )
}

export async function findIngredientsByNames(
  db: Database,
  names: string[],
): Promise<Map<string, PantryIngredient>> {
  let lowered = [...new Set(names.map((name) => name.trim().toLowerCase()))]
  if (lowered.length === 0) return new Map()
  let rows = await queryRows<PantryIngredient>(
    db,
    sql`select id, name from ingredients where lower(name) = any(${lowered}::text[])`,
  )
  return new Map(rows.map((row) => [row.name.toLowerCase(), row]))
}

/** Creates ingredients that do not exist yet (case-insensitive) and returns all by lower-cased name. */
export async function ensureIngredients(
  db: Database,
  names: string[],
): Promise<Map<string, PantryIngredient>> {
  let unique = [...new Map(names.map((name) => [name.trim().toLowerCase(), name.trim()])).values()]
  if (unique.length > 0) {
    await db.exec(sql`
      insert into ingredients (name)
      select unnest(${unique}::text[])
      on conflict ((lower(name))) do nothing
    `)
  }
  return findIngredientsByNames(db, unique)
}

/** Explicit substitute_for relations whose source is one of the given ingredients. */
export async function listSubstitutionsFor(db: Database, ingredientIds: string[]): Promise<Substitution[]> {
  if (ingredientIds.length === 0) return []
  let rows = await queryRows<{ source_id: string; target_id: string; target_name: string; label: string | null }>(
    db,
    sql`select nr.source_id, nr.target_id, i.name as target_name, nr.label
        from node_relations nr join ingredients i on i.id = nr.target_id
        where nr.relation_type = 'substitute_for' and nr.source_type = 'ingredient'
          and nr.source_id = any(${ingredientIds}::uuid[])
        order by i.name`,
  )
  return rows.map((row) => ({
    sourceId: row.source_id,
    target: { id: row.target_id, name: row.target_name },
    label: row.label,
  }))
}

export interface CoOccurrence {
  id: string
  name: string
  percent: number
}

/**
 * "Sering dipadukan": share of published recipes using this ingredient that
 * also use the other ingredient. Derived from recipe_ingredients only.
 */
export async function listCoOccurringIngredients(
  db: Database,
  ingredientId: string,
  limit = 6,
): Promise<CoOccurrence[]> {
  return queryRows<CoOccurrence>(
    db,
    sql`with base as (
          select ri.recipe_id from recipe_ingredients ri
          join recipes r on r.id = ri.recipe_id and r.status = 'published'
          where ri.ingredient_id = ${ingredientId}
        )
        select i.id, i.name,
          round(100.0 * count(*) / nullif((select count(*) from base), 0))::int as percent
        from base
        join recipe_ingredients other on other.recipe_id = base.recipe_id and other.ingredient_id <> ${ingredientId}
        join ingredients i on i.id = other.ingredient_id
        group by i.id order by count(*) desc, i.name limit ${limit}`,
  )
}

// Saved pantry ("Dapurku").

export async function listPantryItems(db: Database, userId: string): Promise<PantryIngredient[]> {
  return queryRows<PantryIngredient>(
    db,
    sql`select i.id, i.name from pantry_items p join ingredients i on i.id = p.ingredient_id
        where p.user_id = ${userId} order by p.created_at, i.name`,
  )
}

export async function replacePantry(db: Database, userId: string, ingredientIds: string[]) {
  let valid = [...new Set(ingredientIds.filter(isUuid))]
  await db.transaction(async (tx) => {
    await tx.exec(sql`delete from pantry_items where user_id = ${userId}`)
    if (valid.length > 0) {
      await tx.exec(sql`
        insert into pantry_items (user_id, ingredient_id)
        select ${userId}, id from ingredients where id = any(${valid}::uuid[])
      `)
    }
  })
}

export async function addPantryItem(db: Database, userId: string, ingredientId: string) {
  await db.exec(sql`
    insert into pantry_items (user_id, ingredient_id) values (${userId}, ${ingredientId})
    on conflict do nothing
  `)
}
