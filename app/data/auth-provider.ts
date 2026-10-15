// Identity provider adapter (SKPL §2.4.5: external services behind an adapter).
// Supabase Auth verifies credentials and Google sign-in; the app keeps its own
// users table and signed session cookie, so no Supabase tokens are stored.

import { createHash, randomBytes } from 'node:crypto'

export interface AuthIdentity {
  /** Supabase `auth.users.id`. */
  id: string
  email: string
  emailConfirmed: boolean
  name: string | null
  avatarUrl: string | null
}

export type AuthFailure =
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'email-taken'
  | 'weak-password'
  | 'rate-limited'
  | 'oauth-failed'
  | 'unavailable'

export type AuthResult<value> = { ok: true; value: value } | { ok: false; error: AuthFailure }

export interface AuthProvider {
  signInWithPassword(email: string, password: string): Promise<AuthResult<AuthIdentity>>
  signUp(
    email: string,
    password: string,
    options: { username: string; emailRedirectTo: string },
  ): Promise<AuthResult<{ identity: AuthIdentity; needsConfirmation: boolean }>>
  /** URL to send the browser to for Google sign-in (PKCE). */
  googleAuthorizeUrl(redirectTo: string, codeChallenge: string): string | null
  exchangeCode(code: string, codeVerifier: string): Promise<AuthResult<AuthIdentity>>
}

// --- PKCE (RFC 7636) -------------------------------------------------------

export function createCodeVerifier(): string {
  return randomBytes(48).toString('base64url')
}

export function codeChallengeFor(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

// --- Supabase Auth (GoTrue REST API) ----------------------------------------

interface SupabaseUser {
  id: string
  email?: string
  email_confirmed_at?: string | null
  identities?: unknown[]
  user_metadata?: Record<string, unknown>
}

interface SupabaseError {
  error_code?: string
  code?: string | number
  error?: string
  error_description?: string
  msg?: string
  message?: string
}

function toIdentity(user: SupabaseUser): AuthIdentity {
  let meta = user.user_metadata ?? {}
  let text = (key: string) => (typeof meta[key] === 'string' && meta[key] ? (meta[key] as string) : null)
  return {
    id: user.id,
    email: (user.email ?? '').toLowerCase(),
    emailConfirmed: Boolean(user.email_confirmed_at),
    name: text('full_name') ?? text('name'),
    avatarUrl: text('avatar_url') ?? text('picture'),
  }
}

function classify(status: number, body: SupabaseError): AuthFailure {
  let code = String(body.error_code ?? body.code ?? '')
  let message = `${body.error_description ?? ''} ${body.msg ?? ''} ${body.message ?? ''}`.toLowerCase()
  if (status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') return 'rate-limited'
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'email-not-confirmed'
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) return 'email-taken'
  if (code === 'weak_password' || message.includes('password should')) return 'weak-password'
  if (code === 'invalid_credentials' || body.error === 'invalid_grant') return 'invalid-credentials'
  return status >= 500 ? 'unavailable' : 'invalid-credentials'
}

export function createSupabaseAuthProvider(options: {
  url: string
  anonKey: string
  fetch?: typeof fetch
}): AuthProvider {
  let base = options.url.replace(/\/+$/, '') + '/auth/v1'
  let send = options.fetch ?? fetch

  async function call(path: string, body: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
    let response = await send(`${base}${path}`, {
      method: 'POST',
      headers: {
        apikey: options.anonKey,
        Authorization: `Bearer ${options.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    let json = (await response.json().catch(() => ({}))) as Record<string, unknown>
    return { status: response.status, json }
  }

  async function guarded<value>(run: () => Promise<AuthResult<value>>): Promise<AuthResult<value>> {
    try {
      return await run()
    } catch (error) {
      console.error('Supabase Auth request failed', error)
      return { ok: false, error: 'unavailable' }
    }
  }

  return {
    signInWithPassword(email, password) {
      return guarded(async () => {
        let { status, json } = await call('/token?grant_type=password', { email, password })
        if (status !== 200 || !json.user) return { ok: false, error: classify(status, json) }
        return { ok: true, value: toIdentity(json.user as SupabaseUser) }
      })
    },

    signUp(email, password, { username, emailRedirectTo }) {
      return guarded(async () => {
        let { status, json } = await call(`/signup?redirect_to=${encodeURIComponent(emailRedirectTo)}`, {
          email,
          password,
          data: { username },
        })
        if (status !== 200) return { ok: false, error: classify(status, json) }
        // With autoconfirm the response is a session ({ user, access_token }); otherwise the user.
        let user = (json.user ?? json) as SupabaseUser
        if (!user.id) return { ok: false, error: 'unavailable' }
        // With confirmation enabled, an already-registered email yields a user with no identities.
        if (Array.isArray(user.identities) && user.identities.length === 0) return { ok: false, error: 'email-taken' }
        return { ok: true, value: { identity: toIdentity(user), needsConfirmation: !json.access_token } }
      })
    },

    googleAuthorizeUrl(redirectTo, codeChallenge) {
      let params = new URLSearchParams({
        provider: 'google',
        redirect_to: redirectTo,
        code_challenge: codeChallenge,
        code_challenge_method: 's256',
      })
      return `${base}/authorize?${params}`
    },

    exchangeCode(code, codeVerifier) {
      return guarded(async () => {
        let { status, json } = await call('/token?grant_type=pkce', { auth_code: code, code_verifier: codeVerifier })
        if (status !== 200 || !json.user) {
          console.warn('Supabase PKCE code exchange failed', { status, error: json.error_code ?? json.error, message: json.msg ?? json.error_description })
          return { ok: false, error: 'oauth-failed' }
        }
        return { ok: true, value: toIdentity(json.user as SupabaseUser) }
      })
    },
  }
}

/** Used when SUPABASE_URL / SUPABASE_ANON_KEY are not configured. */
const unavailableProvider: AuthProvider = {
  signInWithPassword: async () => ({ ok: false, error: 'unavailable' }),
  signUp: async () => ({ ok: false, error: 'unavailable' }),
  googleAuthorizeUrl: () => null,
  exchangeCode: async () => ({ ok: false, error: 'unavailable' }),
}

let override: AuthProvider | null = null
let configured: AuthProvider | null = null

export function getAuthProvider(): AuthProvider {
  if (override) return override
  if (!configured) {
    let url = process.env.SUPABASE_URL
    let anonKey = process.env.SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in production.')
      }
      console.warn('SUPABASE_URL / SUPABASE_ANON_KEY not set: sign-in is disabled.')
      return unavailableProvider
    }
    configured = createSupabaseAuthProvider({ url, anonKey })
  }
  return configured
}

/** Tests swap in a fake provider; pass null to restore the configured one. */
export function setAuthProvider(provider: AuthProvider | null) {
  override = provider
}

export function authErrorMessage(error: AuthFailure): string {
  switch (error) {
    case 'invalid-credentials':
      return 'Email atau kata sandi salah.'
    case 'email-not-confirmed':
      return 'Email belum dikonfirmasi. Buka tautan konfirmasi yang kami kirim ke emailmu.'
    case 'email-taken':
      return 'Email ini sudah terdaftar di AnyamanRasa.'
    case 'weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter, kombinasi huruf dan angka.'
    case 'rate-limited':
      return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.'
    case 'oauth-failed':
      return 'Masuk dengan Google gagal atau dibatalkan. Silakan coba lagi.'
    case 'unavailable':
      return 'Layanan masuk sedang tidak tersedia. Coba lagi nanti.'
  }
}
