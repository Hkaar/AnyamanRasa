import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { SARI, createClient } from '../../../test/client.ts'

describe('simulated subscription checkout', () => {
  it('sends guests to the login page first', async () => {
    let response = await createClient().get('/langganan?paket=plus')
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('Location'), '/masuk?ke=%2Flangganan%3Fpaket%3Dplus')
  })

  it('walks from plan to payment to the receipt without storing anything', async () => {
    let client = createClient()
    await client.login(SARI)

    let plans = await (await client.get('/langganan?paket=keluarga&periode=bulanan')).text()
    assert.match(plans, /Pilih paket langgananmu/)
    assert.match(plans, /name="paket" value="keluarga" checked/)
    assert.match(plans, /Rp49\.000/)

    let payment = await (await client.get('/langganan/pembayaran?paket=plus&periode=tahunan&metode=gopay')).text()
    assert.match(payment, /Berlangganan Dapur Plus/)
    assert.match(payment, /Bayar Rp290\.000 dengan GoPay/)
    assert.match(payment, /Mode simulasi/)

    let promo = await client.post('/langganan/pembayaran', { paket: 'plus', periode: 'tahunan', metode: 'gopay', promo: 'dapurbaru', intent: 'promo' })
    assert.match(await promo.text(), /Bayar Rp261\.000 dengan GoPay/)

    let invalid = await client.post('/langganan/pembayaran', { paket: 'plus', periode: 'tahunan', metode: 'gopay', hp: '12', intent: 'bayar' })
    assert.equal(invalid.status, 400)
    let invalidHtml = await invalid.text()
    assert.match(invalidHtml, /Masukkan nomor HP yang valid/)
    assert.match(invalidHtml, /Setujui Syarat &amp; Ketentuan/)

    let paid = await client.post('/langganan/pembayaran', {
      paket: 'plus',
      periode: 'tahunan',
      metode: 'gopay',
      promo: 'DAPURBARU',
      hp: '0812 3456 7890',
      setuju: '1',
      intent: 'bayar',
    })
    assert.equal(paid.status, 303)
    let pendingHref = paid.headers.get('Location')!
    assert.match(pendingHref, /^\/langganan\/menunggu\?/)

    let pending = await (await client.get(pendingHref)).text()
    assert.match(pending, /Selesaikan di aplikasi Gojek/)
    assert.match(pending, /Rp261\.000 ke \+62 812 3456 7890/)
    assert.match(pending, /data-auto-advance="\/langganan\/selesai\?/)

    let done = await (await client.get('/langganan/selesai?paket=plus&periode=tahunan&metode=gopay&promo=DAPURBARU')).text()
    assert.match(done, /Selamat datang di Dapur Plus/)
    assert.match(done, /Rp261\.000 via GoPay/)
    assert.match(done, /tetap memakai paket Gratis/)

    let settings = await (await client.get('/profil/ubah')).text()
    assert.match(settings, /Langganan &amp; tagihan/)
    assert.match(settings, /Belum ada tagihan/)
    assert.match(settings, /href="\/langganan\?paket=plus"/)
  })

  it('shows the Gratis banner only on your own profile', async () => {
    let client = createClient()
    await client.login(SARI)
    assert.match(await (await client.get('/u/sariwulandari')).text(), /Kamu memakai paket Gratis/)
    assert.doesNotMatch(await (await createClient().get('/u/sariwulandari')).text(), /Kamu memakai paket Gratis/)
  })
})
