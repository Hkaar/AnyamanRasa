import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { checkoutQuery, formatRupiah, normalizePhone, parseCheckout, quote, renewalDate, validatePayment, yearlySaving } from './subscription.ts'

describe('subscription', () => {
  it('reads a checkout with safe defaults and a known promo', () => {
    let checkout = parseCheckout(new URLSearchParams('paket=keluarga&periode=bulanan&metode=ovo&promo=dapurbaru'))
    assert.deepEqual(checkout, { plan: 'keluarga', period: 'bulanan', method: 'ovo', promoCode: 'DAPURBARU', promoPercent: 10 })
    let fallback = parseCheckout(new URLSearchParams('paket=emas&periode=x&metode=bitcoin&promo=GRATIS'))
    assert.equal(fallback.plan, 'plus')
    assert.equal(fallback.period, 'tahunan')
    assert.equal(fallback.method, 'gopay')
    assert.equal(fallback.promoPercent, 0)
    assert.equal(checkoutQuery(fallback), 'paket=plus&periode=tahunan&metode=gopay')
  })

  it('prices plans like the design (Rp290.000 − 10% = Rp261.000)', () => {
    assert.deepEqual(quote('plus', 'tahunan', 10), { subtotal: 290_000, discount: 29_000, total: 261_000, perMonth: 24_167 })
    assert.equal(quote('keluarga', 'bulanan').total, 49_000)
    assert.equal(quote('usaha', 'tahunan').total, 990_000)
    assert.equal(yearlySaving('plus'), 17)
    assert.equal(formatRupiah(261_000), 'Rp261.000')
    assert.equal(renewalDate('tahunan', new Date(2026, 9, 15)).getFullYear(), 2027)
  })

  it('validates the phone for e-wallets, the promo and the terms', () => {
    assert.equal(normalizePhone('0812-3456-7890'), '81234567890')
    assert.equal(normalizePhone('+62 812 3456 7890'), '81234567890')
    assert.equal(normalizePhone('12345'), null)

    let gopay = parseCheckout(new URLSearchParams('metode=gopay&promo=SALAH'))
    let result = validatePayment(gopay, { phone: '', acceptedTerms: false })
    assert.equal(result.ok, false)
    if (!result.ok) assert.deepEqual(Object.keys(result.errors).sort(), ['phone', 'promo', 'terms'])

    let qris = parseCheckout(new URLSearchParams('metode=qris'))
    assert.deepEqual(validatePayment(qris, { phone: '', acceptedTerms: true }), { ok: true, phone: null })
  })
})
