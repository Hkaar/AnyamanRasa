// A cookie-keeping client for router tests: sends requests straight to
// `router.fetch`, follows the session, and supplies CSRF tokens like a browser.
import { setAuthProvider } from '../app/data/auth-provider.ts'
import { router } from '../app/router.ts'
import { createFakeAuthProvider } from './fake-auth.ts'

const ORIGIN = 'http://localhost'

const SEEDED_EMAILS = [
  'sari.wulandari@email.com',
  'bagus.santoso@email.com',
  'rina.hapsari@email.com',
  'dimas.pratama@email.com',
  'fajar.nugroho@email.com',
  'wulan.pertiwi@email.com',
  'hendra.wijaya@email.com',
  'dewi.anggraini@email.com',
  'ayu.lestari@email.com',
  'admin@anyamanrasa.id',
]

/** Supabase Auth replaced by an in-memory fake for every router test. */
export const fakeAuth = createFakeAuthProvider(SEEDED_EMAILS)
setAuthProvider(fakeAuth)

export interface TestClient {
  get(path: string): Promise<Response>
  post(path: string, fields: Record<string, string | string[]>, options?: { csrf?: boolean }): Promise<Response>
  login(email: string, password?: string): Promise<Response>
}

export function createClient(): TestClient {
  let cookies = new Map<string, string>()

  async function send(path: string, init: RequestInit = {}) {
    let headers = new Headers(init.headers)
    if (cookies.size > 0) headers.set('Cookie', [...cookies].map(([k, v]) => `${k}=${v}`).join('; '))
    let response = await router.fetch(new Request(new URL(path, ORIGIN), { ...init, headers, redirect: 'manual' }))
    for (let header of response.headers.getSetCookie()) {
      let [pair] = header.split(';')
      let index = pair!.indexOf('=')
      cookies.set(pair!.slice(0, index), pair!.slice(index + 1))
    }
    return response
  }

  async function csrfToken(): Promise<string> {
    let html = await (await send('/')).text()
    let match = /name="_csrf" value="([^"]+)"/.exec(html) ?? /"_csrf"[^>]*value="([^"]+)"/.exec(html)
    if (match) return match[1]!
    // Guests have no CSRF form on the home page; the login page always has one.
    let login = await (await send('/masuk')).text()
    return /name="_csrf" value="([^"]+)"/.exec(login)![1]!
  }

  return {
    get: (path) => send(path),
    async post(path, fields, options = {}) {
      let body = new URLSearchParams()
      if (options.csrf !== false) body.set('_csrf', await csrfToken())
      for (let [key, value] of Object.entries(fields)) {
        for (let item of Array.isArray(value) ? value : [value]) body.append(key, item)
      }
      return send(path, { method: 'POST', body, headers: { Origin: ORIGIN } })
    },
    login(email, password = 'rahasia123') {
      return this.post('/masuk', { email, password })
    },
  }
}

export const SARI = 'sari.wulandari@email.com'
export const ADMIN = 'admin@anyamanrasa.id'
export const NASI_GORENG_KAMPUNG = '00000000-0000-4000-8000-300000000001'
export const NASI_GORENG_SEAFOOD = '00000000-0000-4000-8000-300000000022'
export const TELUR = '00000000-0000-4000-8000-200000000001'
export const SAYUR_LODEH_DRAFT = '00000000-0000-4000-8000-300000000030'
export const SAYUR_SOP_ARCHIVED = '00000000-0000-4000-8000-300000000032'
export const SOTO_AYAM = '00000000-0000-4000-8000-300000000002'
