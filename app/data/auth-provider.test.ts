import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { codeChallengeFor, createCodeVerifier, createSupabaseAuthProvider } from './auth-provider.ts'

function mockFetch(status: number, body: unknown) {
  let calls: { url: string; init: RequestInit }[] = []
  let fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof globalThis.fetch
  return { fetch, calls }
}

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'Sari@Email.com',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  identities: [{}],
  user_metadata: { full_name: 'Sari W', avatar_url: 'https://example.com/a.png' },
}

describe('Supabase auth provider', () => {
  it('signs in with the password grant and maps the user', async () => {
    let { fetch, calls } = mockFetch(200, { access_token: 't', user })
    let provider = createSupabaseAuthProvider({ url: 'https://ref.supabase.co/', anonKey: 'anon', fetch })
    let result = await provider.signInWithPassword('sari@email.com', 'pw')

    assert.deepEqual(result, {
      ok: true,
      value: { id: user.id, email: 'sari@email.com', emailConfirmed: true, name: 'Sari W', avatarUrl: 'https://example.com/a.png' },
    })
    assert.equal(calls[0]!.url, 'https://ref.supabase.co/auth/v1/token?grant_type=password')
    assert.equal(new Headers(calls[0]!.init.headers).get('apikey'), 'anon')
  })

  it('maps Supabase errors to domain failures', async () => {
    let cases: [number, unknown, string][] = [
      [400, { error_code: 'invalid_credentials' }, 'invalid-credentials'],
      [400, { error: 'invalid_grant', error_description: 'Email not confirmed' }, 'email-not-confirmed'],
      [429, { error_code: 'over_request_rate_limit' }, 'rate-limited'],
      [503, {}, 'unavailable'],
    ]
    for (let [status, body, expected] of cases) {
      let provider = createSupabaseAuthProvider({ url: 'https://x', anonKey: 'k', fetch: mockFetch(status, body).fetch })
      let result = await provider.signInWithPassword('a@b.c', 'pw')
      assert.equal(!result.ok && result.error, expected)
    }
  })

  it('treats an obfuscated sign-up (no identities) as an existing email', async () => {
    let provider = createSupabaseAuthProvider({
      url: 'https://x',
      anonKey: 'k',
      fetch: mockFetch(200, { ...user, identities: [] }).fetch,
    })
    let result = await provider.signUp('sari@email.com', 'pw12345678', { username: 'sari', emailRedirectTo: 'https://app/masuk' })
    assert.equal(!result.ok && result.error, 'email-taken')
  })

  it('reports whether sign-up needs email confirmation', async () => {
    let pending = createSupabaseAuthProvider({ url: 'https://x', anonKey: 'k', fetch: mockFetch(200, user).fetch })
    let confirmed = createSupabaseAuthProvider({ url: 'https://x', anonKey: 'k', fetch: mockFetch(200, { access_token: 't', user }).fetch })
    let a = await pending.signUp('a@b.c', 'pw12345678', { username: 'a', emailRedirectTo: 'https://app' })
    let b = await confirmed.signUp('a@b.c', 'pw12345678', { username: 'a', emailRedirectTo: 'https://app' })
    assert.equal(a.ok && a.value.needsConfirmation, true)
    assert.equal(b.ok && b.value.needsConfirmation, false)
  })

  it('builds a PKCE Google authorize URL and exchanges the code with the verifier', async () => {
    let { fetch, calls } = mockFetch(200, { access_token: 't', user })
    let provider = createSupabaseAuthProvider({ url: 'https://ref.supabase.co', anonKey: 'k', fetch })
    let verifier = createCodeVerifier()
    let url = new URL(provider.googleAuthorizeUrl('https://app/masuk/google/callback', codeChallengeFor(verifier))!)

    assert.equal(url.pathname, '/auth/v1/authorize')
    assert.equal(url.searchParams.get('provider'), 'google')
    assert.equal(url.searchParams.get('code_challenge_method'), 's256')
    assert.equal(url.searchParams.get('code_challenge'), codeChallengeFor(verifier))

    let result = await provider.exchangeCode('the-code', verifier)
    assert.ok(result.ok)
    assert.equal(calls[0]!.url, 'https://ref.supabase.co/auth/v1/token?grant_type=pkce')
    assert.deepEqual(JSON.parse(String(calls[0]!.init.body)), { auth_code: 'the-code', code_verifier: verifier })
  })

  it('returns "unavailable" when Supabase cannot be reached', async () => {
    let fetch = (async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof globalThis.fetch
    let provider = createSupabaseAuthProvider({ url: 'https://x', anonKey: 'k', fetch })
    let result = await provider.signInWithPassword('a@b.c', 'pw')
    assert.equal(!result.ok && result.error, 'unavailable')
  })
})
