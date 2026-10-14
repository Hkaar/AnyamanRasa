import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  NASI_GORENG_KAMPUNG,
  NASI_GORENG_SEAFOOD,
  SARI,
  SAYUR_LODEH_DRAFT,
  SAYUR_SOP_ARCHIVED,
  createClient,
} from '../../../test/client.ts'

describe('recipe discovery', () => {
  it('searches by keyword, including ingredient names', async () => {
    let html = await (await createClient().get('/resep?q=kecap')).text()
    assert.match(html, /resep ditemukan/)
    assert.match(html, /Nasi Goreng Kampung/)
  })

  it('shows an empty state with the active filters', async () => {
    let html = await (await createClient().get('/resep?q=rendang%20jengkol&durasi=15')).text()
    assert.match(html, /Tidak ada resep yang cocok/)
    assert.match(html, /≤\s15\smenit/)
  })

  it('ignores invalid filter values instead of failing', async () => {
    let response = await createClient().get('/resep?kategori=abc&kesulitan=mustahil&urut=zzz&hal=-4')
    assert.equal(response.status, 200)
  })
})

describe('recipe detail', () => {
  it('renders ingredients, steps and explicit relations', async () => {
    let html = await (await createClient().get(`/resep/${NASI_GORENG_KAMPUNG}`)).text()
    assert.match(html, /Cara Memasak/)
    assert.match(html, /Variasi &amp; Hubungan/)
    assert.match(html, /Nasi Goreng Seafood/)
  })

  it('shows a variation with its source and computed ingredient changes', async () => {
    let html = await (await createClient().get(`/resep/${NASI_GORENG_SEAFOOD}`)).text()
    assert.match(html, /Variasi dari Nasi Goreng Kampung/)
    assert.match(html, /Perubahan bahan|Apa yang diubah/)
  })

  it('hides drafts from everyone but their author', async () => {
    assert.equal((await createClient().get(`/resep/${SAYUR_LODEH_DRAFT}`)).status, 404)
    let author = createClient()
    await author.login(SARI)
    assert.equal((await author.get(`/resep/${SAYUR_LODEH_DRAFT}`)).status, 200)
  })

  it('hides archived recipes from the public', async () => {
    assert.equal((await createClient().get(`/resep/${SAYUR_SOP_ARCHIVED}`)).status, 404)
  })
})

describe('saving recipes', () => {
  it('requires login', async () => {
    let response = await createClient().post(`/resep/${NASI_GORENG_KAMPUNG}/simpan`, { simpan: '1' })
    assert.equal(response.status, 303)
    assert.match(response.headers.get('Location') ?? '', /\/masuk/)
  })

  it('saves and unsaves for the signed-in user', async () => {
    let client = createClient()
    await client.login(SARI)
    await client.post(`/resep/${NASI_GORENG_SEAFOOD}/simpan`, { simpan: '1' })
    assert.match(await (await client.get('/u/sariwulandari?tab=disimpan')).text(), /Nasi Goreng Seafood/)

    await client.post(`/resep/${NASI_GORENG_SEAFOOD}/simpan`, { simpan: '0' })
    assert.doesNotMatch(await (await client.get('/u/sariwulandari?tab=disimpan')).text(), /Nasi Goreng Seafood/)
  })

  it('does not reveal saved recipes on other profiles', async () => {
    let html = await (await createClient().get('/u/sariwulandari?tab=disimpan')).text()
    assert.doesNotMatch(html, /Belum ada resep tersimpan/)
    assert.doesNotMatch(html, /tab=disimpan/)
  })
})
