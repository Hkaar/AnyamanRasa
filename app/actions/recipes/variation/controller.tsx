import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { createRecipe, getRecipe, listCategories } from '../../../data/recipes.ts'
import { routes } from '../../../routes.ts'
import { getShell, notFound, requireViewer, setFlash } from '../../shell.tsx'
import { RECIPE_NOT_FOUND } from '../../../ui/error-page.tsx'
import { RecipeEditorPage } from '../editor/page.tsx'
import { categoryIdsFor, flashFor, processSubmission, valuesFromRecipe } from '../editor/submission.ts'

export default createController(routes.recipes.variation, {
  actions: {
    async index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let parent = await getRecipe(context.db, context.params.id)
      if (!parent || parent.status !== 'published') return notFound(context, RECIPE_NOT_FOUND)
      return context.render(
        <RecipeEditorPage
          shell={getShell(context)}
          mode="variation"
          parent={parent}
          values={valuesFromRecipe(parent, 'variation', await categoryIdsFor(context, parent))}
          categories={await listCategories(context.db)}
          action={routes.recipes.variation.action.href({ id: parent.id })}
        />,
      )
    },

    async action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let parent = await getRecipe(context.db, context.params.id)
      if (!parent || parent.status !== 'published') return notFound(context, RECIPE_NOT_FOUND)

      let result = await processSubmission(context, true)
      if (!result.ok) {
        return context.render(
          <RecipeEditorPage
            shell={getShell(context)}
            mode="variation"
            parent={parent}
            values={result.values}
            errors={result.errors}
            categories={await listCategories(context.db)}
            action={routes.recipes.variation.action.href({ id: parent.id })}
          />,
          { status: 400 },
        )
      }
      let id = await createRecipe(context.db, viewer.id, result.write, { recipeId: parent.id })
      setFlash(context, flashFor(result.write, 'variation', id))
      return redirect(routes.recipes.show.href({ id }), 303)
    },
  },
})
