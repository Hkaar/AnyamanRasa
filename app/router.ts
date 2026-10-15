import { csrf } from 'remix/middleware/csrf'
import { formData } from 'remix/middleware/form-data'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createMiddleware, createRouter, type Middleware, type MiddlewareContext } from 'remix/router'

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
import { MAX_UPLOAD_BYTES, serveMedia } from './data/media.ts'

/**
 * Compiled scripts and uploaded photos need no session, CSRF check or signed-in user, so
 * they are answered before that work. Otherwise every script module a page loads would
 * look up the viewer in the database (dozens of queries per page view).
 */
function publicAssets(): Middleware {
  return async (context, next) => {
    let method = context.request.method
    if (method !== 'GET' && method !== 'HEAD') return next()
    let { pathname } = context.url
    if (pathname.startsWith('/assets/')) {
      return cacheOnCdn((await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 }))
    }
    if (pathname.startsWith('/media/')) return cacheOnCdn(await serveMedia(pathname.slice('/media/'.length), context.request))
    return next()
  }
}

/**
 * Fingerprinted scripts and uploaded photos never change at the same URL. Let shared caches
 * (Vercel's CDN, a reverse proxy) keep them too, so each is produced once rather than per visitor.
 */
function cacheOnCdn(response: Response): Response {
  let cacheControl = response.headers.get('Cache-Control') ?? ''
  if (response.ok && cacheControl.includes('immutable') && !cacheControl.includes('s-maxage')) {
    response.headers.set('Cache-Control', `${cacheControl}, s-maxage=31536000`)
  }
  return response
}

/**
 * Last line of defence: an unexpected error (most often the database being unreachable or
 * out of connections) becomes a small self-contained page instead of the platform's bare
 * 500. It cannot use SiteLayout, which needs the database for the signed-in user.
 */
function handleErrors(): Middleware {
  return async (_context, next) => {
    try {
      return await next()
    } catch (error) {
      console.error(error)
      let database = (error as { code?: unknown })?.code === 'DATA_TABLE_DATABASE_ERROR'
      return new Response(errorPage(database), {
        status: database ? 503 : 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          ...(database ? { 'Retry-After': '30' } : {}),
        },
      })
    }
  }
}

function errorPage(database: boolean): string {
  let message = database
    ? 'Server sedang sibuk menyiapkan dapur. Coba muat ulang halaman ini sebentar lagi.'
    : 'Terjadi kesalahan di sisi kami. Coba muat ulang halaman ini, atau kembali ke beranda.'
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Terjadi kesalahan · AnyamanRasa</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 py-24 text-center">
      <img src="/logo.png" alt="AnyamanRasa" width="34" height="28" />
      <h1 class="text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink">Ada yang tidak beres</h1>
      <p class="max-w-md text-base leading-6 text-muted">${message}</p>
      <div class="flex gap-2">
        <a href="" class="inline-flex h-11 items-center rounded-sm bg-accent px-4 text-[15px] text-white hover:bg-accent-strong">Muat ulang</a>
        <a href="/" class="inline-flex h-11 items-center rounded-sm bg-hover px-4 text-[15px] text-ink hover:bg-hover-strong">Ke Beranda</a>
      </div>
    </main>
  </body>
</html>`
}

const IMMUTABLE = 'public, max-age=31536000, s-maxage=31536000, immutable'

const middleware = createMiddleware(
  handleErrors(),
  // Precompiled, fingerprinted modules from `npm run build` (scripts/build-assets.ts).
  staticFiles('./public', { index: false, filter: (file) => file.startsWith('assets/'), cacheControl: IMMUTABLE }),
  staticFiles('./public', { index: false }),
  publicAssets(),
  formData({ maxFiles: 1, maxFileSize: MAX_UPLOAD_BYTES, maxTotalSize: MAX_UPLOAD_BYTES + 256 * 1024 }),
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
