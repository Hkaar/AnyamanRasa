import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createClient } from '../../test/client.ts'

describe('root controller', () => {
  it('GET / renders the homepage with real recipes and pantry preview', async () => {
    let response = await createClient().get('/')
    let html = await response.text()

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    assert.match(html, /<html lang="id"/)
    assert.match(html, /Setiap Rasa/)
    assert.match(html, /resep cocok/)
  })

  it('returns a 404 page for unknown routes inside an area', async () => {
    let response = await createClient().get('/resep/bukan-uuid')
    assert.equal(response.status, 404)
    assert.match(await response.text(), /Halaman tidak ditemukan|tidak ada/)
  })

  it('serves uploaded media only for generated file names', async () => {
    let response = await createClient().get('/media/..%2F.env')
    assert.equal(response.status, 404)
  })
})
