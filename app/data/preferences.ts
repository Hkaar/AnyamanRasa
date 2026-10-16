// Onboarding preferences (migration 0004): favourite categories and ingredients to avoid.
import { sql } from 'remix/data-table'

import { type Database, queryRows } from '../db.ts'
import type { Preferences } from '../domain/onboarding.ts'
import type { PantryIngredient } from '../domain/pantry.ts'
import { type Category, isUuid } from './recipes.ts'

export interface CategoryTile extends Category {
  count: number
  /** Photo of the most saved recipe in the category that has one. */
  imageUrl: string | null
}

/** The categories with the most published recipes, for the onboarding tiles (15a). */
export async function listCategoryTiles(db: Database, limit: number): Promise<CategoryTile[]> {
  return queryRows<CategoryTile>(
    db,
    sql`select c.id, c.name, count(r.id)::int as count,
          (select r2.image_url from recipe_categories rc2
            join recipes r2 on r2.id = rc2.recipe_id and r2.status = 'published' and r2.image_url is not null
            where rc2.category_id = c.id
            order by (select count(*) from saved_recipes s where s.recipe_id = r2.id) desc, r2.created_at desc
            limit 1) as "imageUrl"
        from categories c
        join recipe_categories rc on rc.category_id = c.id
        join recipes r on r.id = rc.recipe_id and r.status = 'published'
        group by c.id order by count(r.id) desc, c.id limit ${limit}`,
  )
}

export interface SavedPreferences {
  favoriteCategories: Category[]
  avoided: PantryIngredient[]
}

export async function getPreferences(db: Database, userId: string): Promise<SavedPreferences> {
  let [favoriteCategories, avoided] = await Promise.all([
    queryRows<Category>(
      db,
      sql`select c.id, c.name from user_favorite_categories f join categories c on c.id = f.category_id
          where f.user_id = ${userId} order by f.created_at, c.id`,
    ),
    queryRows<PantryIngredient>(
      db,
      sql`select i.id, i.name from user_avoided_ingredients a join ingredients i on i.id = a.ingredient_id
          where a.user_id = ${userId} order by a.created_at, i.name`,
    ),
  ])
  return { favoriteCategories, avoided }
}

export function toPreferences(saved: SavedPreferences): Preferences {
  return {
    favoriteCategoryIds: saved.favoriteCategories.map((category) => category.id),
    avoidedIngredientIds: saved.avoided.map((ingredient) => ingredient.id),
  }
}

export async function replaceFavoriteCategories(db: Database, userId: string, categoryIds: number[]) {
  let ids = [...new Set(categoryIds.filter(Number.isInteger))]
  await db.transaction(async (tx) => {
    await tx.exec(sql`delete from user_favorite_categories where user_id = ${userId}`)
    if (ids.length > 0) {
      await tx.exec(sql`
        insert into user_favorite_categories (user_id, category_id)
        select ${userId}, id from categories where id = any(${ids}::int[])
      `)
    }
  })
}

export async function replaceAvoidedIngredients(db: Database, userId: string, ingredientIds: string[]) {
  let ids = [...new Set(ingredientIds.filter(isUuid))]
  await db.transaction(async (tx) => {
    await tx.exec(sql`delete from user_avoided_ingredients where user_id = ${userId}`)
    if (ids.length > 0) {
      await tx.exec(sql`
        insert into user_avoided_ingredients (user_id, ingredient_id)
        select ${userId}, id from ingredients where id = any(${ids}::uuid[])
      `)
    }
  })
}
