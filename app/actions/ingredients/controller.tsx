import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import {
  addPantryItem,
  getIngredient,
  listCoOccurringIngredients,
  listPantryItems,
  searchIngredients,
} from '../../data/ingredients.ts'
import {
  listCategoriesForIngredient,
  listExplicitRelations,
  listRecipesWithIngredient,
} from '../../data/recipes.ts'
import { routes } from '../../routes.ts'
import { getShell, notFound, requireViewer, setFlash } from '../shell.tsx'
import { IngredientPage } from './page.tsx'

export default createController(routes.ingredients, {
  actions: {
    async show(context) {
      let db = context.db
      let ingredient = await getIngredient(db, context.params.id)
      if (!ingredient) return notFound(context, 'Bahan ini tidak ditemukan.')

      let categories = await listCategoriesForIngredient(db, ingredient.id, 2)
      // Category tab (?kategori=<id>): only the tabs shown on the page are valid.
      let requested = Number(context.url.searchParams.get('kategori'))
      let activeCategory = categories.find((category) => category.id === requested) ?? null

      let [recipes, pairings, relations, pantry] = await Promise.all([
        listRecipesWithIngredient(db, ingredient.id, 4, activeCategory?.id ?? null),
        listCoOccurringIngredients(db, ingredient.id, 6),
        listExplicitRelations(db, 'ingredient', ingredient.id, ['substitute_for', 'pairs_with']),
        context.viewer ? listPantryItems(db, context.viewer.id) : [],
      ])

      return context.render(
        <IngredientPage
          shell={getShell(context)}
          ingredient={ingredient}
          recipes={recipes}
          categories={categories}
          activeCategoryId={activeCategory?.id ?? null}
          pairings={pairings}
          substitutes={relations.filter((r) => r.type === 'substitute_for' && r.direction === 'outgoing')}
          substituteFor={relations.filter((r) => r.type === 'substitute_for' && r.direction === 'incoming')}
          pairsWith={relations.filter((r) => r.type === 'pairs_with')}
          inPantry={pantry.some((item) => item.id === ingredient.id)}
        />,
      )
    },

    async search(context) {
      let query = (context.url.searchParams.get('q') ?? '').slice(0, 100)
      let results = await searchIngredients(context.db, query, 8)
      return Response.json(
        results.map(({ id, name, recipeCount }) => ({ id, name, recipeCount })),
        { headers: { 'Cache-Control': 'no-store' } },
      )
    },

    async addToPantry(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let ingredient = await getIngredient(context.db, context.params.id)
      if (!ingredient) return notFound(context)
      await addPantryItem(context.db, viewer.id, ingredient.id)
      setFlash(context, {
        message: `${ingredient.name} ditambahkan ke dapurmu.`,
        action: { label: 'Cari resep', href: routes.pantry.index.href() },
      })
      return redirect(routes.ingredients.show.href({ id: ingredient.id }), 303)
    },
  },
})
