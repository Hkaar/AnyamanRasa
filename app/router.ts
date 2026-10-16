import { csrf } from 'remix/middleware/csrf'
import { formData } from 'remix/middleware/form-data'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { createMiddleware, createRouter, type Middleware, type MiddlewareContext } from 'remix/router'

import adminController from './actions/admin/controller.tsx'
import adminRecipesController from './actions/admin/recipes/controller.tsx'
import authController from './actions/auth/controller.tsx'
import consentController from './actions/auth/consent/controller.tsx'
import loginController from './actions/auth/login/controller.tsx'
import registerController from './actions/auth/register/controller.tsx'
import controller from './actions/controller.tsx'
import graphController from './actions/graph/controller.tsx'
import ingredientsController from './actions/ingredients/controller.tsx'
import legalController from './actions/legal/controller.tsx'
import onboardingController from './actions/onboarding/controller.tsx'
import pantryController from './actions/pantry/controller.tsx'
import profileController from './actions/profile/controller.tsx'
import profileEditController from './actions/profile/edit/controller.tsx'
import subscriptionController from './actions/subscription/controller.tsx'
import subscriptionPaymentController from './actions/subscription/payment/controller.tsx'
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
import { notFound } from './actions/shell.tsx'

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
  // pen.dev 12b. No SiteLayout here (it needs the database), so the logo stands in for the nav.
  let message = database
    ? 'Server sedang sibuk menyiapkan dapur. Coba lagi dalam beberapa saat.'
    : 'Ada gangguan di sisi kami. Coba lagi dalam beberapa saat.'
  let icon = (paths: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Terjadi kesalahan · AnyamanRasa</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="bg-bg text-ink">
    <header class="border-b border-line">
      <a href="/" class="mx-auto flex h-[72px] max-w-[1440px] items-center gap-2.5 px-5 text-[17px] font-medium md:px-10 xl:px-[120px]">
        <img src="/logo.png" alt="" width="34" height="28" />
        AnyamanRasa
      </a>
    </header>
    <main class="flex min-h-[calc(100dvh-73px)] flex-col items-center justify-center gap-5 px-5 py-24 text-center lg:gap-7">
      <span class="rounded-full bg-[linear-gradient(135deg,var(--color-peach),var(--color-pink)_60%,var(--color-lilac))] px-[18px] py-2 font-mono text-[13px] leading-none tracking-[1px]">${database ? 503 : 500}</span>
      <h1 class="max-w-[760px] text-[44px] leading-[1.05] font-normal tracking-[-0.9px] text-balance lg:text-[72px] lg:tracking-[-1.8px]">Dapur kami sedang kewalahan.</h1>
      <p class="max-w-[620px] text-base leading-6 tracking-[0.2px] text-muted lg:text-lg lg:leading-7">${message}</p>
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pt-1">
        <a href="" class="inline-flex h-11 items-center gap-2 rounded-sm bg-surface-dark px-4 text-[15px] text-white hover:bg-ink lg:h-[46px] lg:px-5">${icon('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>')}Coba lagi</a>
        <a href="/" class="inline-flex items-center gap-1.5 text-[15px] underline-offset-4 hover:underline">Kembali ke Beranda${icon('<path d="M7 7h10v10"/><path d="M7 17 17 7"/>')}</a>
      </div>
    </main>
  </body>
</html>`
}

/** URLs no route matches get the designed 404 page (pen.dev 12a) instead of the router's plain text. */
function pageNotFound(): Middleware {
  return async (context, next) => {
    let response = await next()
    let html = response.headers.get('Content-Type')?.includes('text/html')
    if (response.status !== 404 || html || context.request.method !== 'GET') return response
    if (context.url.pathname.startsWith('/api/')) return response
    // Runs after render() and loadViewer(), so the page gets the usual layout and signed-in user.
    return notFound(context as unknown as AppContext)
  }
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
  pageNotFound(),
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
router.map(routes.auth.consent, consentController)
router.map(routes.onboarding, onboardingController)
router.map(routes.profile, profileController)
router.map(routes.profile.edit, profileEditController)
router.map(routes.legal, legalController)
router.map(routes.subscription, subscriptionController)
router.map(routes.subscription.payment, subscriptionPaymentController)
router.map(routes.admin, adminController)
router.map(routes.admin.recipes, adminRecipesController)
