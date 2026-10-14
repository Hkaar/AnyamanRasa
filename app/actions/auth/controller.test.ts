import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { SARI, createClient } from '../../../test/client.ts'
import { fakeAuthId } from '../../../test/fake-auth.ts'

describe('authentication', () => {
  it('rejects wrong passwords without revealing which field is wrong', async () => {
    let response = await createClient().login(SARI, 'salah12345')
    assert.equal(response.status, 400)
    assert.match(await response.text(), /Email atau kata sandi salah/)
  })

  it('signs in with email or username and returns to the requested page', async () => {
    let client = createClient()
    let response = await client.post('/masuk', { email: 'sariwulandari', password: 'rahasia123', ke: '/cari-bahan' })
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('Location'), '/cari-bahan')
    assert.match(await (await client.get('/')).text(), /Tulis Resep/)
  })

  it('never redirects off-site after login', async () => {
    let response = await createClient().post('/masuk', { email: SARI, password: 'rahasia123', ke: '//evil.example' })
    assert.equal(response.headers.get('Location'), '/')
  })

  it('validates registration and checks username availability', async () => {
    let client = createClient()
    let invalid = await client.post('/daftar', { username: 'A!', email: 'bukan-email', password: 'pendek', confirm: 'beda' })
    let html = await invalid.text()
    assert.equal(invalid.status, 400)
    assert.match(html, /huruf kecil, angka, atau garis bawah/)
    assert.match(html, /Format email tidak valid/)
    assert.match(html, /Minimal 8 karakter/)

    let taken = await (await client.get('/api/nama-pengguna?u=sariwulandari')).json()
    assert.equal(taken.available, false)
    let free = await (await client.get('/api/nama-pengguna?u=pengguna_baru_uji')).json()
    assert.equal(free.available, true)
  })

  it('registers, signs in, and logs out', async () => {
    let client = createClient()
    let response = await client.post('/daftar', {
      username: 'koki_uji',
      email: 'koki.uji@example.com',
      password: 'rahasia123',
      confirm: 'rahasia123',
    })
    assert.equal(response.status, 303)
    assert.match(await (await client.get('/u/koki_uji')).text(), /Edit profil/)

    let duplicate = await createClient().post('/daftar', {
      username: 'koki_uji',
      email: 'lain@example.com',
      password: 'rahasia123',
      confirm: 'rahasia123',
    })
    assert.match(await duplicate.text(), /Nama pengguna sudah dipakai/)

    await client.post('/keluar', {})
    assert.equal((await client.get('/resep/baru')).status, 303)
  })

  it('asks new accounts to confirm their email when Supabase requires it', async () => {
    let client = createClient()
    let response = await client.post('/daftar', {
      username: 'koki_konfirmasi',
      email: 'koki+konfirmasi@example.com',
      password: 'rahasia123',
      confirm: 'rahasia123',
    })
    assert.equal(response.status, 200)
    assert.match(await response.text(), /Cek emailmu/)
    assert.equal((await client.get('/resep/baru')).status, 303, 'not signed in yet')

    let login = await client.login('koki+konfirmasi@example.com')
    assert.equal(login.status, 400)
    assert.match(await login.text(), /Email belum dikonfirmasi/)
  })
})

describe('google sign-in', () => {
  async function startGoogle(client: ReturnType<typeof createClient>, ke = '/cari-bahan') {
    let start = await client.post('/masuk/google', { ke })
    assert.equal(start.status, 303)
    let location = new URL(start.headers.get('Location')!)
    assert.equal(location.hostname, 'fake.supabase.test')
    assert.equal(location.searchParams.get('redirect_to'), 'http://localhost/masuk/google/callback')
  }

  it('creates a profile for a first-time Google user and asks them to set it up', async () => {
    let client = createClient()
    await startGoogle(client)
    let callback = await client.get(`/masuk/google/callback?code=${encodeURIComponent('google|budi.google@gmail.com|Budi Google')}`)
    assert.equal(callback.status, 303)
    assert.equal(callback.headers.get('Location'), '/profil/ubah')

    let settings = await (await client.get('/profil/ubah')).text()
    assert.match(settings, /Budi Google/)
    assert.match(settings, /value="budi_google"/)
  })

  it('links Google to an existing account with the same verified email', async () => {
    let client = createClient()
    await startGoogle(client, '/cari-bahan')
    let callback = await client.get(`/masuk/google/callback?code=${encodeURIComponent(`google|${SARI}|Sari W`)}`)
    assert.equal(callback.headers.get('Location'), '/cari-bahan')
    assert.match(await (await client.get('/u/sariwulandari')).text(), /Edit profil/)
  })

  it('refuses a callback this browser did not start (login CSRF) or a wrong verifier', async () => {
    let stranger = createClient()
    let response = await stranger.get(`/masuk/google/callback?code=${encodeURIComponent(`google|${SARI}|Sari`)}`)
    assert.equal(response.headers.get('Location'), '/masuk?galat=oauth-failed')
    assert.equal((await stranger.get('/resep/baru')).status, 303)

    let client = createClient()
    await startGoogle(client)
    await startGoogle(createClient()) // another browser's flow changes the expected challenge
    let mismatched = await client.get(`/masuk/google/callback?code=${encodeURIComponent(`google|${SARI}|Sari`)}`)
    assert.equal(mismatched.headers.get('Location'), '/masuk?galat=oauth-failed')
  })

  it('does not let a different identity take over an already linked email', async () => {
    // Sari's email is already linked to her fake Supabase id by earlier sign-ins.
    let client = createClient()
    await client.login(SARI)
    let other = createClient()
    await startGoogle(other)
    let response = await other.get(`/masuk/google/callback?code=${encodeURIComponent(`google|${SARI}|Imposter|other`)}`)
    assert.equal(response.headers.get('Location'), '/masuk?galat=email-linked-elsewhere')
    assert.notEqual(fakeAuthId(SARI, 'other'), fakeAuthId(SARI))
  })

  it('shows only known error messages on the login page', async () => {
    let known = await (await createClient().get('/masuk?galat=oauth-failed')).text()
    assert.match(known, /Masuk dengan Google gagal/)
    let unknown = await (await createClient().get('/masuk?galat=Hubungi%20evil.example')).text()
    assert.doesNotMatch(unknown, /evil\.example/)
  })
})

