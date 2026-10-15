import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createClient } from '../../test/client.ts'
import { scriptEntry } from '../assets.ts'
import { db } from '../db.ts'

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

  it('serves scripts to signed-in users without querying the database', async () => {
    let client = createClient()
    await client.login('sari.wulandari@email.com')
    let exec = db.exec.bind(db)
    let queries = 0
    db.exec = ((...args: Parameters<typeof db.exec>) => {
      queries++
      return exec(...args)
    }) as typeof db.exec
    try {
      let response = await client.get(scriptEntry.href)
      assert.equal(response.status, 200)
      assert.equal(queries, 0)
    } finally {
      db.exec = exec
    }
  })

  it('shows a retryable error page when the database is unavailable', async () => {
    let exec = db.exec.bind(db)
    db.exec = (() =>
      Promise.reject(Object.assign(new Error('Database execution failed'), { code: 'DATA_TABLE_DATABASE_ERROR' }))) as typeof db.exec
    let log = console.error
    console.error = () => {}
    try {
      let response = await createClient().get('/')
      assert.equal(response.status, 503)
      assert.equal(response.headers.get('Retry-After'), '30')
      assert.match(await response.text(), /Server sedang sibuk/)
    } finally {
      db.exec = exec
      console.error = log
    }
  })

  it('serves uploaded media only for generated file names', async () => {
    let response = await createClient().get('/media/..%2F.env')
    assert.equal(response.status, 404)
  })
})
