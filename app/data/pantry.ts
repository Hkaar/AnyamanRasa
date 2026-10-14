import { type SqlStatement, sql } from 'remix/data-table'

import { type Database, joinSql, queryRows } from '../db.ts'
import {
  type PantryCandidate,
  type PantryIngredient,
  type PantryMatch,
  rankPantryMatches,
} from '../domain/pantry.ts'
import type { Difficulty } from '../domain/types.ts'
import { listSubstitutionsFor } from './ingredients.ts'

export interface PantryRecipe {
  id: string
  title: string
  imageUrl: string | null
  categories: string[]
  totalMinutes: number
  difficulty: Difficulty
  authorName: string
}

export interface PantrySearch {
  ingredientIds: string[]
  assumeStaples: boolean
  maxMinutes: number | null
  difficulty: Difficulty | null
}

/**
 * Loads every published recipe that uses at least one pantry ingredient, with
 * its full ingredient list, in one query, then ranks them in the domain layer.
 */
export async function findPantryMatches(
  db: Database,
  search: PantrySearch,
): Promise<PantryMatch<PantryRecipe>[]> {
  if (search.ingredientIds.length === 0) return []

  let conditions: SqlStatement[] = [
    sql`r.status = 'published'`,
    sql`exists (select 1 from recipe_ingredients p where p.recipe_id = r.id
          and p.ingredient_id = any(${search.ingredientIds}::uuid[]))`,
  ]
  if (search.maxMinutes !== null) {
    conditions.push(sql`r.prep_time_minutes + r.cook_time_minutes <= ${search.maxMinutes}`)
  }
  if (search.difficulty !== null) {
    conditions.push(sql`r.difficulty = ${search.difficulty}::recipe_difficulty`)
  }

  let rows = await queryRows<{
    id: string
    title: string
    image_url: string | null
    categories: string[]
    total_minutes: number
    difficulty: Difficulty
    author_name: string
    ingredients: PantryIngredient[]
  }>(
    db,
    sql`select r.id, r.title, r.image_url, r.difficulty, u.name as author_name,
          (r.prep_time_minutes + r.cook_time_minutes)::int as total_minutes,
          coalesce((select array_agg(c.name order by c.id) from recipe_categories rc
            join categories c on c.id = rc.category_id where rc.recipe_id = r.id), '{}') as categories,
          (select json_agg(json_build_object('id', i.id, 'name', i.name) order by ri.position)
            from recipe_ingredients ri join ingredients i on i.id = ri.ingredient_id
            where ri.recipe_id = r.id) as ingredients
        from recipes r join users u on u.id = r.user_id
        where ${joinSql(conditions, ' and ')}`,
  )

  let candidates: PantryCandidate<PantryRecipe>[] = rows.map((row) => ({
    recipe: {
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      categories: row.categories,
      totalMinutes: row.total_minutes,
      difficulty: row.difficulty,
      authorName: row.author_name,
    },
    ingredients: row.ingredients ?? [],
  }))

  let allIngredientIds = [...new Set(candidates.flatMap((c) => c.ingredients.map((i) => i.id)))]
  let substitutions = await listSubstitutionsFor(db, allIngredientIds)

  return rankPantryMatches(candidates, new Set(search.ingredientIds), substitutions, {
    assumeStaples: search.assumeStaples,
  })
}
