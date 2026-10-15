import { getCsrfToken } from 'remix/middleware/csrf'
import { redirect } from 'remix/response/redirect'
import { Session } from 'remix/session'

import type { Viewer } from '../domain/types.ts'
import type { AppContext } from '../router.ts'
import { loginHref } from '../ui/layout.tsx'
import { type NotFoundCopy, NotFoundPage } from '../ui/error-page.tsx'
import type { Flash, Shell } from '../ui/shell.ts'

const FLASH_KEY = 'flash'

export function getShell(context: AppContext): Shell {
  let flash = context.get(Session).get(FLASH_KEY)
  return {
    viewer: context.viewer,
    csrfToken: getCsrfToken(context),
    path: context.url.pathname + context.url.search,
    flash: isFlash(flash) ? flash : null,
  }
}

/** Shows a toast on the next page the browser loads. */
export function setFlash(context: AppContext, flash: Flash) {
  context.get(Session).flash(FLASH_KEY, flash)
}

function isFlash(value: unknown): value is Flash {
  return typeof value === 'object' && value !== null && typeof (value as Flash).message === 'string'
}

/** Redirects guests to the login page, returning them here afterwards. */
export function requireViewer(context: AppContext): Viewer | Response {
  if (context.viewer) return context.viewer
  let back = context.method === 'GET' ? context.url.pathname + context.url.search : '/'
  return redirect(loginHref(back), 303)
}

/** Only allow same-site relative redirect targets. */
export function safeRedirectTarget(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function notFound(context: AppContext, copy?: string | NotFoundCopy) {
  let page = typeof copy === 'string' ? { message: copy } : copy
  return context.render(<NotFoundPage shell={getShell(context)} copy={page} />, { status: 404 })
}

export function forbidden(context: AppContext) {
  return context.render(
    <NotFoundPage shell={getShell(context)} status={403} />,
    { status: 403 },
  )
}
