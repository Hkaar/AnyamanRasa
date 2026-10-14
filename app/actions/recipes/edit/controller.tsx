import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { getRecipe, listCategories, updateRecipe } from '../../../data/recipes.ts'
import { routes } from '../../../routes.ts'
import { forbidden, getShell, notFound, requireViewer, setFlash } from '../../shell.tsx'
import { RecipeEditorPage } from '../editor/page.tsx'
import { categoryIdsFor, flashFor, processSubmission, valuesFromRecipe } from '../editor/submission.ts'

export default createController(routes.recipes.edit, {
  actions: {
    async index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let recipe = await getRecipe(context.db, context.params.id)
      if (!recipe || recipe.status === 'archived') return notFound(context)
      if (recipe.author.id !== viewer.id) return forbidden(context)
      return context.render(
        <RecipeEditorPage
          shell={getShell(context)}
          mode="edit"
          recipe={recipe}
          values={valuesFromRecipe(recipe, 'edit', await categoryIdsFor(context, recipe))}
          categories={await listCategories(context.db)}
          action={routes.recipes.edit.action.href({ id: recipe.id })}
        />,
      )
    },

    async action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let recipe = await getRecipe(context.db, context.params.id)
      if (!recipe || recipe.status === 'archived') return notFound(context)
      // Ownership is enforced on the server for every mutation (SKPL-F-09.2).
      if (recipe.author.id !== viewer.id) return forbidden(context)

      let result = await processSubmission(context, recipe.parent !== null)
      if (!result.ok) {
        return context.render(
          <RecipeEditorPage
            shell={getShell(context)}
            mode="edit"
            recipe={recipe}
            values={result.values}
            errors={result.errors}
            categories={await listCategories(context.db)}
            action={routes.recipes.edit.action.href({ id: recipe.id })}
          />,
          { status: 400 },
        )
      }
      // A published recipe stays published unless explicitly saved as draft.
      await updateRecipe(context.db, recipe.id, result.write)
      setFlash(context, flashFor(result.write, 'edit', recipe.id))
      return redirect(routes.recipes.show.href({ id: recipe.id }), 303)
    },
  },
})
