import { csrf } from 'remix/middleware/csrf'
import { formData } from 'remix/middleware/form-data'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createMiddleware, createRouter, type MiddlewareContext } from 'remix/router'

import adminController from './actions/admin/controller.tsx'
import adminRecipesController from './actions/admin/recipes/controller.tsx'
import authController from './actions/auth/controller.tsx'
import loginController from './actions/auth/login/controller.tsx'
import registerController from './actions/auth/register/controller.tsx'
import controller from './actions/controller.tsx'
import graphController from './actions/graph/controller.tsx'
import ingredientsController from './actions/ingredients/controller.tsx'
import pantryController from './actions/pantry/controller.tsx'
import profileController from './actions/profile/controller.tsx'
import profileEditController from './actions/profile/edit/controller.tsx'
import recipesController from './actions/recipes/controller.tsx'
import createRecipeController from './actions/recipes/create/controller.tsx'
import editRecipeController from './actions/recipes/edit/controller.tsx'
import variationController from './actions/recipes/variation/controller.tsx'
import { assets } from './assets.ts'
import { loadDatabase } from './middleware/database.ts'
import { sessionMiddleware } from './middleware/session.ts'
import { loadViewer } from './middleware/viewer.ts'
import { routes } from './routes.ts'
import { MAX_UPLOAD_BYTES } from './data/media.ts'

const middleware = createMiddleware(
  staticFiles('./public', { index: false }),
  formData({ maxFiles: 1, maxFileSize: MAX_UPLOAD_BYTES, maxTotalSize: MAX_UPLOAD_BYTES + 1024 * 1024 }),
  sessionMiddleware(),
  csrf(),
  loadDatabase(),
  loadViewer(),
  render({ assets }),
)

export type AppContext = MiddlewareContext<typeof middleware>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export const router = createRouter<AppContext>({ middleware })

router.map(routes, controller)
router.map(routes.recipes, recipesController)
router.map(routes.recipes.create, createRecipeController)
router.map(routes.recipes.edit, editRecipeController)
router.map(routes.recipes.variation, variationController)
router.map(routes.ingredients, ingredientsController)
router.map(routes.pantry, pantryController)
router.map(routes.graph, graphController)
router.map(routes.auth, authController)
router.map(routes.auth.login, loginController)
router.map(routes.auth.register, registerController)
router.map(routes.profile, profileController)
router.map(routes.profile.edit, profileEditController)
router.map(routes.admin, adminController)
router.map(routes.admin.recipes, adminRecipesController)
