import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { SARI, TELUR, createClient } from '../../../test/client.ts'

const NASI_PUTIH = '00000000-0000-4000-8000-200000000002'

describe('pantry search', () => {
  it('ranks recipes by match and lists missing ingredients', async () => {
    let html = await (await createClient().get(`/cari-bahan?bahan=${TELUR}&bahan=${NASI_PUTIH}`)).text()
    assert.match(html, /resep bisa kamu masak/)
    assert.match(html, /Paling cocok/)
    assert.match(html, /Bahan cocok: \d+ dari \d+/)
    assert.match(html, /Kurang \d+/)
  })

  it('resolves typed ingredient names without JavaScript', async () => {
    let response = await createClient().get('/cari-bahan?tambah=telur,%20nasi%20putih')
    assert.equal(response.status, 303)
    let location = response.headers.get('Location') ?? ''
    assert.match(location, new RegExp(TELUR))
    assert.match(location, new RegExp(NASI_PUTIH))
  })

  it('loads and saves the signed-in user pantry', async () => {
    let client = createClient()
    await client.login(SARI)
    assert.match(await (await client.get('/cari-bahan')).text(), /Dimuat dari dapurmu/)

    let saved = await client.post('/cari-bahan/dapur', { bahan: [TELUR] })
    assert.equal(saved.status, 303)
    let html = await (await client.get('/cari-bahan')).text()
    // Exactly one removable chip (the saved Telur) is loaded from the pantry.
    assert.equal(html.match(/aria-label="Hapus [^"]+"/g)?.length, 1)
    assert.match(html, /aria-label="Hapus Telur"/)
  })

  it('serves ingredient suggestions as JSON', async () => {
    let suggestions = await (await createClient().get('/api/bahan?q=bawang')).json()
    assert.ok(suggestions.length > 0)
    assert.ok(suggestions.every((s: { name: string }) => /bawang/i.test(s.name)))
  })
})
