import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import {
  getRecipe,
  getRecipeIngredients,
  isRecipeSaved,
  listExplicitRelations,
  listRelatedRecipes,
  listUsedCategories,
  listVariations,
  searchRecipes,
  setRecipeSaved,
  getRecipeOwner,
} from '../../data/recipes.ts'
import { diffIngredients } from '../../domain/lineage.ts'
import { routes } from '../../routes.ts'
import { getShell, notFound, requireViewer, safeRedirectTarget, setFlash } from '../shell.tsx'
import { RECIPE_NOT_FOUND } from '../../ui/error-page.tsx'
import { parseRecipeFilters } from './filters.ts'
import { RecipeCardsChunk, RecipeIndexPage } from './index-page.tsx'
import { RecipeShowPage } from './show-page.tsx'

export default createController(routes.recipes, {
  actions: {
    async index(context) {
      let filters = parseRecipeFilters(context.url.searchParams)
      // Infinite scroll asks for one page of cards at a time.
      if (context.url.searchParams.get('bagian') === 'kartu') {
        let result = await searchRecipes(context.db, filters)
        return context.render(<RecipeCardsChunk filters={filters} recipes={result.items} total={result.total} />)
      }
      // "Muat lebih banyak" without JavaScript shows every page up to the requested one.
      let [result, categories] = await Promise.all([
        searchRecipes(context.db, { ...filters, page: 1, pageSize: filters.page * filters.pageSize }),
        listUsedCategories(context.db),
      ])
      return context.render(
        <RecipeIndexPage
          shell={getShell(context)}
          filters={filters}
          categories={categories}
          recipes={result.items}
          total={result.total}
        />,
      )
    },

    async show(context) {
      let db = context.db
      let recipe = await getRecipe(db, context.params.id)
      let viewer = context.viewer
      let isOwner = viewer !== null && recipe?.author.id === viewer.id
      // Drafts are visible only to their author; archived recipes also to admins.
      if (
        !recipe ||
        (recipe.status === 'draft' && !isOwner) ||
        (recipe.status === 'archived' && !isOwner && !viewer?.isAdmin)
      ) {
        return notFound(context, RECIPE_NOT_FOUND)
      }

      let [variations, relations, related, saved, parentIngredients] = await Promise.all([
        listVariations(db, recipe.id),
        listExplicitRelations(db, 'recipe', recipe.id, ['similar_to', 'inspired_by', 'pairs_with']),
        listRelatedRecipes(db, recipe.id),
        viewer ? isRecipeSaved(db, viewer.id, recipe.id) : false,
        recipe.parent ? getRecipeIngredients(db, recipe.parent.id) : null,
      ])
      let variationIngredients = await Promise.all(
        variations.map((variation) => getRecipeIngredients(db, variation.id)),
      )

      return context.render(
        <RecipeShowPage
          shell={getShell(context)}
          recipe={recipe}
          isOwner={isOwner}
          isSaved={saved}
          variations={variations.map((variation, index) => ({
            recipe: variation,
            changes: diffIngredients(recipe.ingredients, variationIngredients[index] ?? []),
          }))}
          ownChanges={parentIngredients ? diffIngredients(parentIngredients, recipe.ingredients) : null}
          relations={relations}
          related={related}
        />,
      )
    },

    async save(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let owner = await getRecipeOwner(context.db, context.params.id)
      if (!owner || owner.status !== 'published') return notFound(context, RECIPE_NOT_FOUND)

      let save = context.formData.get('simpan') !== '0'
      await setRecipeSaved(context.db, viewer.id, context.params.id, save)
      setFlash(context, {
        message: save ? 'Resep disimpan.' : 'Resep dihapus dari simpanan.',
        action: save
          ? { label: 'Lihat', href: `${routes.profile.show.href({ username: viewer.username })}?tab=disimpan` }
          : undefined,
      })
      let back = safeRedirectTarget(
        context.formData.get('kembali'),
        routes.recipes.show.href({ id: context.params.id }),
      )
      return redirect(back, 303)
    },
  },
})
