import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { SARI, TELUR, createClient } from '../../../test/client.ts'

describe('onboarding', () => {
  it('asks guests to sign in first', async () => {
    let response = await createClient().get('/mulai')
    assert.equal(response.status, 303)
    assert.match(response.headers.get('Location') ?? '', /^\/masuk/)
  })

  it('walks through the three steps and the finish screen, and personalises the home page', async () => {
    let client = createClient()
    await client.login(SARI)

    let taste = await (await client.get('/mulai')).text()
    assert.match(taste, /Masakan apa yang bikin kamu lapar\?/)
    assert.match(taste, /Langkah 1 dari 3/)
    let categories = [...taste.matchAll(/name="kategori" value="(\d+)"/g)].map((m) => m[1]!)
    assert.ok(categories.length >= 3)

    let tooFew = await client.post('/mulai', { langkah: 'selera', kategori: categories.slice(0, 2), lanjut: '1' })
    assert.equal(tooFew.status, 400)
    assert.match(await tooFew.text(), /Pilih minimal 3 kategori/)

    let preview = await client.post('/mulai', { langkah: 'selera', kategori: categories.slice(0, 3) })
    assert.equal(preview.status, 200)
    assert.match(await preview.text(), /3 dipilih · minimal 3/)

    let saved = await client.post('/mulai', { langkah: 'selera', kategori: categories.slice(0, 3), lanjut: '1' })
    assert.equal(saved.headers.get('Location'), '/mulai?langkah=dapur')

    // Typed names resolve to ingredients; chips stay a draft until "Lanjut".
    let pantry = await (await client.post('/mulai', { langkah: 'dapur', tambah: 'telur' })).text()
    assert.match(pantry, /aria-label="Hapus Telur"/)
    assert.match(pantry, /Di dapurmu · 1 bahan/)
    assert.match(pantry, /Sering dipakai bareng/)
    let missing = await (await client.post('/mulai', { langkah: 'dapur', tambah: 'bahan khayalan' })).text()
    assert.match(missing, /belum ada di AnyamanRasa/)
    let pantrySaved = await client.post('/mulai', { langkah: 'dapur', bahan: [TELUR], lanjut: '1' })
    assert.equal(pantrySaved.headers.get('Location'), '/mulai?langkah=pantangan')

    let avoid = await (await client.get('/mulai?langkah=pantangan')).text()
    assert.match(avoid, /Hindari bahan ini/)
    let udang = /name="hindari" value="([^"]+)"[^>]*>(?:(?!<\/label>).)*Udang/s.exec(avoid)?.[1]
    assert.ok(udang, 'Udang is offered')
    let avoidSaved = await client.post('/mulai', { langkah: 'pantangan', hindari: [udang!], lanjut: '1' })
    assert.equal(avoidSaved.headers.get('Location'), '/mulai?langkah=selesai')

    let done = await (await client.get('/mulai?langkah=selesai')).text()
    assert.match(done, /Berandamu siap disajikan\./)
    assert.match(done, /tanpa udang/)
    assert.match(done, /1 bahan di dapurmu/)

    let home = await (await client.get('/?tab=untukmu')).text()
    let inspiration = home.slice(home.indexOf('id="inspirasi"'), home.indexOf('</section>', home.indexOf('id="inspirasi"')))
    assert.match(inspiration, /aria-current="true"[^>]*>Untukmu/)
    assert.doesNotMatch(inspiration, /Udang Saus Tiram/)
  })
})
