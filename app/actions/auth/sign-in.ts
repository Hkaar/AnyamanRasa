import { Session } from 'remix/session'

import { SESSION_USER_KEY } from '../../middleware/viewer.ts'
import type { AppContext } from '../../router.ts'

/** Session keys holding the in-flight Google sign-in (PKCE verifier and return path). */
export const OAUTH_VERIFIER_KEY = 'oauthVerifier'
export const OAUTH_RETURN_KEY = 'oauthReturnTo'

export function signIn(context: AppContext, userId: string) {
  let session = context.get(Session)!
  // Rotate the session id on privilege change to prevent fixation.
  session.regenerateId()
  session.set(SESSION_USER_KEY, userId)
}

/**
 * Absolute URL for links Supabase sends users back to. PUBLIC_URL wins so a
 * proxy's internal origin never leaks into redirect URLs.
 */
export function publicUrl(context: AppContext, path: string): string {
  let origin = process.env.PUBLIC_URL?.replace(/\/+$/, '') ?? context.url.origin
  return `${origin}${path}`
}

/** Errors the Google flow reports back to the login page (`?galat=`); never free text. */
export const LOGIN_ERRORS = {
  'oauth-failed': 'Masuk dengan Google gagal atau dibatalkan. Silakan coba lagi.',
  unavailable: 'Layanan masuk sedang tidak tersedia. Coba lagi nanti.',
  'email-unverified': 'Email Google ini belum terverifikasi.',
  'email-linked-elsewhere': 'Email ini sudah tertaut ke akun lain. Masuk dengan cara yang biasa kamu pakai.',
} as const

export type LoginErrorCode = keyof typeof LOGIN_ERRORS

export function loginErrorMessage(code: string | null): string | undefined {
  return code && code in LOGIN_ERRORS ? LOGIN_ERRORS[code as LoginErrorCode] : undefined
}
