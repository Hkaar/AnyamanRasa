import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { ADMIN, NASI_GORENG_KAMPUNG, SARI, createClient } from '../../../../test/client.ts'

const validRecipe = {
  aksi: 'terbitkan',
  judul: 'Tumis Kangkung Uji',
  deskripsi: 'Tumis kangkung cepat untuk makan siang.',
  persiapan: '5',
  memasak: '10',
  porsi: '2',
  kesulitan: 'mudah',
  kategori: '5',
  bahan_nama: ['Kangkung', 'Bawang Putih', 'Bumbu Rahasia Uji'],
  bahan_jumlah: ['1', '3', '½'],
  bahan_satuan: ['ikat', 'siung', 'sdt'],
  bahan_kelompok: ['', '', 'Bumbu dasar'],
  bahan_catatan: ['', '', ''],
  langkah_judul: ['Tumis'],
  langkah_teks: ['Tumis bawang lalu masukkan kangkung.'],
  langkah_menit: ['5'],
}

describe('recipe editor', () => {
  it('requires login to open the editor', async () => {
    let response = await createClient().get('/resep/baru')
    assert.equal(response.status, 303)
    assert.match(response.headers.get('Location') ?? '', /\/masuk\?ke=%2Fresep%2Fbaru/)
  })

  it('rejects submissions without a CSRF token', async () => {
    let client = createClient()
    await client.login(SARI)
    let response = await client.post('/resep/baru', validRecipe, { csrf: false })
    assert.equal(response.status, 403)
  })

  it('re-renders the form with errors for invalid input', async () => {
    let client = createClient()
    await client.login(SARI)
    let response = await client.post('/resep/baru', { ...validRecipe, bahan_jumlah: ['', '3', '½'], judul: '' })
    let html = await response.text()
    assert.equal(response.status, 400)
    assert.match(html, /Judul resep wajib diisi/)
    assert.match(html, /Jumlah wajib diisi untuk Kangkung/)
  })

  it('creates a recipe, adding unknown ingredients to the ingredient list', async () => {
    let client = createClient()
    await client.login(SARI)
    let response = await client.post('/resep/baru', validRecipe)
    assert.equal(response.status, 303)
    let location = response.headers.get('Location')!
    let html = await (await client.get(location)).text()
    assert.match(html, /Tumis Kangkung Uji/)
    assert.match(html, /Bumbu Rahasia Uji/)

    let search = await (await client.get('/api/bahan?q=rahasia')).json()
    assert.equal(search[0].name, 'Bumbu Rahasia Uji')
  })

  it('lets only the owner edit a recipe', async () => {
    let owner = createClient()
    await owner.login(SARI)
    let location = (await owner.post('/resep/baru', { ...validRecipe, judul: 'Milik Sari Uji' })).headers.get('Location')!
    let id = location.split('/').pop()!

    let other = createClient()
    await other.login(ADMIN)
    assert.equal((await other.get(`/resep/${id}/ubah`)).status, 403)
    assert.equal((await other.post(`/resep/${id}/ubah`, { ...validRecipe, judul: 'Diambil alih' })).status, 403)

    let edited = await owner.post(`/resep/${id}/ubah`, { ...validRecipe, judul: 'Milik Sari Diubah' })
    assert.equal(edited.status, 303)
    assert.match(await (await owner.get(`/resep/${id}`)).text(), /Milik Sari Diubah/)
  })

  it('creates a variation with explicit lineage and a required change summary', async () => {
    let client = createClient()
    await client.login(ADMIN)
    let missing = await client.post(`/resep/${NASI_GORENG_KAMPUNG}/variasi`, validRecipe)
    assert.equal(missing.status, 400)
    assert.match(await missing.text(), /Jelaskan apa yang kamu ubah/)

    let created = await client.post(`/resep/${NASI_GORENG_KAMPUNG}/variasi`, {
      ...validRecipe,
      judul: 'Variasi Uji',
      perubahan: 'Nasi diganti kangkung.',
    })
    assert.equal(created.status, 303)
    let html = await (await client.get(created.headers.get('Location')!)).text()
    assert.match(html, /Variasi dari Nasi Goreng Kampung/)
    assert.match(html, /Nasi diganti kangkung/)

    let graph = await (await client.get(`/api/graf?simpul=recipe:${NASI_GORENG_KAMPUNG}`)).json()
    assert.ok(graph.nodes.some((node: { name: string }) => node.name === 'Variasi Uji'))
  })

  it('keeps drafts out of public listings', async () => {
    let client = createClient()
    await client.login(SARI)
    let response = await client.post('/resep/baru', { aksi: 'draf', judul: 'Draf Rahasia Uji', kesulitan: 'mudah' })
    assert.equal(response.status, 303)
    assert.doesNotMatch(await (await createClient().get('/resep?q=Draf%20Rahasia')).text(), /Draf Rahasia Uji/)
  })
})
