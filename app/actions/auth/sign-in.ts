import { Session } from 'remix/session'

import type { AuthIdentity } from '../../data/auth-provider.ts'
import { SESSION_USER_KEY } from '../../middleware/viewer.ts'
import type { AppContext } from '../../router.ts'

/** Session keys holding the in-flight Google sign-in (PKCE verifier and return path). */
export const OAUTH_VERIFIER_KEY = 'oauthVerifier'
export const OAUTH_RETURN_KEY = 'oauthReturnTo'
/** A first-time Google identity waiting for the consent step (pen.dev 10d). */
export const PENDING_SIGNUP_KEY = 'pendingSignup'

export function pendingSignup(context: AppContext): AuthIdentity | null {
  let value = context.get(Session)!.get(PENDING_SIGNUP_KEY)
  if (typeof value !== 'object' || value === null) return null
  let identity = value as Partial<AuthIdentity>
  if (typeof identity.id !== 'string' || typeof identity.email !== 'string') return null
  return {
    id: identity.id,
    email: identity.email,
    emailConfirmed: identity.emailConfirmed === true,
    name: typeof identity.name === 'string' ? identity.name : null,
    avatarUrl: typeof identity.avatarUrl === 'string' ? identity.avatarUrl : null,
  }
}

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
  return `${configuredOrigin() ?? context.url.origin}${path}`
}

let warnedInvalidPublicUrl = false

/** PUBLIC_URL as an origin, or null when unset or not a real URL (e.g. a "<your-domain>" placeholder). */
function configuredOrigin(): string | null {
  let value = process.env.PUBLIC_URL?.trim()
  if (!value) return null
  try {
    let url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin
  } catch {}
  if (!warnedInvalidPublicUrl) {
    warnedInvalidPublicUrl = true
    console.warn(`PUBLIC_URL "${value}" is not a valid http(s) URL; using the request origin instead.`)
  }
  return null
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
