import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { createRecipe, listCategories } from '../../../data/recipes.ts'
import { routes } from '../../../routes.ts'
import { getShell, requireViewer, setFlash } from '../../shell.tsx'
import { RecipeEditorPage } from '../editor/page.tsx'
import { emptyValues, flashFor, processSubmission } from '../editor/submission.ts'

export default createController(routes.recipes.create, {
  actions: {
    async index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      return context.render(
        <RecipeEditorPage
          shell={getShell(context)}
          mode="create"
          values={emptyValues()}
          categories={await listCategories(context.db)}
          action={routes.recipes.create.action.href()}
        />,
      )
    },

    async action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let result = await processSubmission(context, false)
      if (!result.ok) {
        return context.render(
          <RecipeEditorPage
            shell={getShell(context)}
            mode="create"
            values={result.values}
            errors={result.errors}
            categories={await listCategories(context.db)}
            action={routes.recipes.create.action.href()}
          />,
          { status: 400 },
        )
      }
      let id = await createRecipe(context.db, viewer.id, result.write)
      setFlash(context, flashFor(result.write, 'create', id))
      return redirect(routes.recipes.show.href({ id }), 303)
    },
  },
})
