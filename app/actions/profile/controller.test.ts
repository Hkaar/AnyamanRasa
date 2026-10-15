import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { SARI, createClient } from '../../../test/client.ts'

describe('profile settings', () => {
  it('shows the public profile and account sections', async () => {
    let client = createClient()
    await client.login(SARI)
    let html = await (await client.get('/profil/ubah')).text()
    assert.match(html, /<h1[^>]*>Pengaturan<\/h1>/)
    assert.match(html, /Profil publik/)
    assert.match(html, /sari.wulandari@email.com · dipakai untuk masuk/)
    assert.match(html, /id="keluar-form"/)
    assert.match(html, /form="profil-form"/)
  })

  it('re-renders with a summary when a field is invalid', async () => {
    let client = createClient()
    await client.login(SARI)
    let response = await client.post('/profil/ubah', { name: '', username: 'sariwulandari', bio: '', location: '' })
    let html = await response.text()
    assert.equal(response.status, 400)
    assert.match(html, /Ada 1 isian yang perlu diperbaiki/)
    assert.match(html, /Nama wajib diisi/)
  })
})
