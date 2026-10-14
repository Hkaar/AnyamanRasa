import { createCookie } from 'remix/cookie'
import { session } from 'remix/middleware/session'
import { createCookieSessionStorage } from 'remix/session-storage/cookie'

const THIRTY_DAYS = 60 * 60 * 24 * 30

function readSecrets(): string[] {
  let secrets = (process.env.SESSION_SECRETS ?? '')
    .split(',')
    .map((secret) => secret.trim())
    .filter(Boolean)
  if (secrets.length > 0) return secrets
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRETS must be set in production.')
  }
  return ['anyaman-rasa-development-secret']
}

export const sessionCookie = createCookie('__anyaman_session', {
  secrets: readSecrets(),
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: THIRTY_DAYS,
})

/** Cookie-backed sessions: only the user id and CSRF token are stored. */
export function sessionMiddleware() {
  return session(sessionCookie, createCookieSessionStorage())
}
