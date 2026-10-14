// In-memory stand-in for Supabase Auth used by router tests. It enforces the
// same contract: password checks, confirmation, and PKCE challenge/verifier.
import { createHash } from 'node:crypto'

import { type AuthIdentity, type AuthProvider, codeChallengeFor } from '../app/data/auth-provider.ts'

export const DEMO_PASSWORD = 'rahasia123'

/** Stable fake Supabase user id per email (+ optional variant). */
export function fakeAuthId(email: string, variant = ''): string {
  let hex = createHash('md5').update(email.toLowerCase() + variant).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

interface Account {
  password: string
  confirmed: boolean
}

export function createFakeAuthProvider(seedEmails: string[]): AuthProvider & { lastChallenge: string | null } {
  let accounts = new Map<string, Account>(seedEmails.map((email) => [email, { password: DEMO_PASSWORD, confirmed: true }]))
  let identity = (email: string, name: string | null = null, variant = ''): AuthIdentity => ({
    id: fakeAuthId(email, variant),
    email,
    emailConfirmed: accounts.get(email)?.confirmed ?? true,
    name,
    avatarUrl: null,
  })

  let provider = {
    lastChallenge: null as string | null,

    async signInWithPassword(email: string, password: string) {
      let account = accounts.get(email.toLowerCase())
      if (!account || account.password !== password) return { ok: false as const, error: 'invalid-credentials' as const }
      if (!account.confirmed) return { ok: false as const, error: 'email-not-confirmed' as const }
      return { ok: true as const, value: identity(email.toLowerCase()) }
    },

    async signUp(email: string, password: string) {
      if (accounts.has(email)) return { ok: false as const, error: 'email-taken' as const }
      // Addresses containing "+konfirmasi" simulate a project with email confirmation on.
      let needsConfirmation = email.includes('+konfirmasi')
      accounts.set(email, { password, confirmed: !needsConfirmation })
      return { ok: true as const, value: { identity: identity(email), needsConfirmation } }
    },

    googleAuthorizeUrl(redirectTo: string, codeChallenge: string) {
      provider.lastChallenge = codeChallenge
      return `https://fake.supabase.test/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
    },

    /** Codes look like `google|<email>|<name>|<id variant>`. */
    async exchangeCode(code: string, codeVerifier: string) {
      let [kind, email, name, variant] = code.split('|')
      if (kind !== 'google' || !email || codeChallengeFor(codeVerifier) !== provider.lastChallenge) {
        return { ok: false as const, error: 'oauth-failed' as const }
      }
      accounts.set(email, accounts.get(email) ?? { password: '', confirmed: true })
      return { ok: true as const, value: identity(email, name ?? null, variant ?? '') }
    },
  }
  return provider
}
