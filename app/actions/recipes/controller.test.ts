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
    assert.match(html, /Belum ada resep “rendang jengkol” dengan filter ini/)
    assert.match(html, /Hapus semua filter/)
    assert.match(html, /≤\s15\smenit/)
  })

  it('renders placeholder cards for the loading state alongside the results', async () => {
    let html = await (await createClient().get('/resep')).text()
    assert.match(html, /data-results/)
    assert.match(html, /data-results-count/)
    assert.match(html, /group-data-loading\/results:grid/)
  })

  it('serves the next page of cards as a fragment for infinite scroll', async () => {
    let client = createClient()
    let page = await (await client.get('/resep')).text()
    let total = Number(/Menampilkan 10 dari (\d+) resep/.exec(page)?.[1])
    assert.ok(total > 10, 'the seed has more than one page of recipes')
    assert.match(page, /data-load-more="\/resep\?hal=2&amp;bagian=kartu"/)

    let fragment = await (await client.get('/resep?hal=2&bagian=kartu')).text()
    assert.doesNotMatch(fragment, /<html|<header/)
    assert.equal(fragment.match(/<article/g)?.length, Math.min(10, total - 10))
    assert.match(fragment, new RegExp(`data-count="Menampilkan ${Math.min(20, total)} dari ${total} resep"`))
    if (total > 20) assert.match(fragment, /data-next="\/resep\?hal=3&amp;bagian=kartu"/)
    else assert.doesNotMatch(fragment, /data-next=/)
  })

  it('keeps filters in the infinite scroll links', async () => {
    let fragment = await (await createClient().get('/resep?urut=terbaru&hal=1&bagian=kartu')).text()
    assert.match(fragment, /data-load-more-chunk/)
    assert.match(fragment, /urut=terbaru/)
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
