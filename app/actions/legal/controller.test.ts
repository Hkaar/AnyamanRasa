import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createClient } from '../../../test/client.ts'

describe('legal pages', () => {
  it('shows the terms of service', async () => {
    let response = await createClient().get('/syarat-ketentuan')
    let html = await response.text()
    assert.equal(response.status, 200)
    assert.match(html, /<h1[^>]*>Syarat &amp; Ketentuan<\/h1>/)
    assert.match(html, /id="langganan"/)
    assert.match(html, /href="\/kebijakan-privasi"/)
  })

  it('shows the privacy policy', async () => {
    let response = await createClient().get('/kebijakan-privasi')
    let html = await response.text()
    assert.equal(response.status, 200)
    assert.match(html, /<h1[^>]*>Kebijakan Privasi<\/h1>/)
    assert.match(html, /UU PDP/)
    assert.match(html, /aria-current="page"[^>]*>Kebijakan Privasi/)
  })
})
