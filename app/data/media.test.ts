import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import * as assert from 'remix/assert'
import { createMemoryFileStorage } from 'remix/file-storage/memory'
import { describe, it } from 'remix/test'

import {
  MAX_UPLOAD_BYTES,
  createLocalMediaStore,
  createObjectMediaStore,
  serveMedia,
  setMediaStore,
  storeImage,
} from './media.ts'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])

function pngFile() {
  return new File([PNG], 'photo.bin', { type: 'application/octet-stream' })
}

describe('media storage', () => {
  it('stores to disk and streams the file back', async () => {
    let dir = await mkdtemp(path.join(tmpdir(), 'media-'))
    try {
      setMediaStore(createLocalMediaStore(dir))
      let stored = await storeImage(pngFile())
      assert.ok(stored.ok)
      let name = stored.url.replace('/media/', '')
      assert.match(stored.url, /^\/media\/[0-9a-f-]{36}\.png$/)
      assert.deepEqual(new Uint8Array(await readFile(path.join(dir, name))), PNG)

      let response = await serveMedia(name, new Request(`http://localhost${stored.url}`))
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Content-Type'), 'image/png')
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), PNG)
    } finally {
      setMediaStore(null)
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('stores to an object storage and streams it when the bucket is private', async () => {
    let storage = createMemoryFileStorage()
    setMediaStore(createObjectMediaStore(storage))
    try {
      let stored = await storeImage(pngFile())
      assert.ok(stored.ok)
      let name = stored.url.replace('/media/', '')
      assert.equal((await storage.get(name))?.type, 'image/png')

      let response = await serveMedia(name, new Request(`http://localhost${stored.url}`))
      assert.equal(response.status, 200)
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), PNG)
    } finally {
      setMediaStore(null)
    }
  })

  it('redirects to the public bucket URL when one is configured', async () => {
    let store = createObjectMediaStore(createMemoryFileStorage(), {
      publicUrl: 'https://ref.supabase.co/storage/v1/object/public/media/',
    })
    let name = '11111111-1111-4111-8111-111111111111.jpg'
    let response = await store.serve(name, new Request(`http://localhost/media/${name}`))
    assert.equal(response.status, 301)
    assert.equal(response.headers.get('Location'), `https://ref.supabase.co/storage/v1/object/public/media/${name}`)
  })

  it('rejects oversized, non-image and non-generated names', async () => {
    setMediaStore(createObjectMediaStore(createMemoryFileStorage()))
    try {
      let big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'big.png')
      assert.deepEqual(await storeImage(big), { ok: false, error: 'too-large' })
      assert.deepEqual(await storeImage(new File(['hello'], 'a.png')), { ok: false, error: 'unsupported-type' })
      let response = await serveMedia('../.env', new Request('http://localhost/media/..%2F.env'))
      assert.equal(response.status, 404)
    } finally {
      setMediaStore(null)
    }
  })
})
