import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import {
  findIngredientsByNames,
  getIngredientsByIds,
  listPantryItems,
  listPopularIngredients,
  replacePantry,
  searchIngredients,
} from '../../data/ingredients.ts'
import { findPantryMatches } from '../../data/pantry.ts'
import { savedRecipeIds } from '../../data/recipes.ts'
import { routes } from '../../routes.ts'
import { getShell, requireViewer, setFlash } from '../shell.tsx'
import { PantryPage } from './page.tsx'
import { MAX_PANTRY_INGREDIENTS, pantryHref, parsePantryParams } from './params.ts'

export default createController(routes.pantry, {
  actions: {
    async index(context) {
      let db = context.db
      let base = routes.pantry.index.href()
      let state = parsePantryParams(context.url.searchParams)
      let viewer = context.viewer

      // No-JS path: resolve typed names to ingredients, then redirect to the canonical URL.
      if (state.addNames.length > 0) {
        let exact = await findIngredientsByNames(db, state.addNames)
        let added: string[] = []
        for (let name of state.addNames) {
          let match = exact.get(name.toLowerCase()) ?? (await searchIngredients(db, name, 1))[0]
          if (match) added.push(match.id)
        }
        let ids = [...new Set([...state.ingredientIds, ...added])].slice(0, MAX_PANTRY_INGREDIENTS)
        return redirect(pantryHref(base, state, { ingredientIds: ids, addNames: [] }), 303)
      }

      // Signed-in users start from their saved pantry ("Dapurku").
      let usingSavedPantry = false
      if (state.ingredientIds.length === 0 && viewer && !context.url.searchParams.has('kosong')) {
        let saved = await listPantryItems(db, viewer.id)
        if (saved.length > 0) {
          state = { ...state, ingredientIds: saved.map((item) => item.id) }
          usingSavedPantry = true
        }
      }

      let [selected, quickAdd, matches] = await Promise.all([
        getIngredientsByIds(db, state.ingredientIds),
        listPopularIngredients(db, 12),
        findPantryMatches(db, {
          ingredientIds: state.ingredientIds,
          assumeStaples: state.assumeStaples,
          maxMinutes: state.maxMinutes,
          difficulty: state.difficulty,
        }),
      ])
      let saved = viewer
        ? await savedRecipeIds(db, viewer.id, matches.map((match) => match.recipe.id))
        : new Set<string>()

      return context.render(
        <PantryPage
          shell={getShell(context)}
          state={{ ...state, ingredientIds: selected.map((i) => i.id) }}
          selected={selected}
          quickAdd={quickAdd.filter((i) => !state.ingredientIds.includes(i.id)).slice(0, 10)}
          matches={matches}
          savedRecipeIds={[...saved]}
          usingSavedPantry={usingSavedPantry}
        />,
      )
    },

    async save(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let ids = context.formData
        .getAll('bahan')
        .filter((value): value is string => typeof value === 'string')
        .slice(0, MAX_PANTRY_INGREDIENTS)
      await replacePantry(context.db, viewer.id, ids)
      setFlash(context, {
        message: ids.length > 0 ? 'Daftar bahan disimpan ke dapurmu.' : 'Dapurmu dikosongkan.',
      })
      let state = parsePantryParams(new URLSearchParams(ids.map((id) => ['bahan', id])))
      return redirect(pantryHref(routes.pantry.index.href(), state), 303)
    },
  },
})
