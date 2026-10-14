// Copies photos from a local upload directory into the configured MEDIA_STORAGE (e.g. a
// Supabase Storage bucket) under the same names. Stored URLs stay `/media/<name>`, so the
// database needs no changes when moving from Docker to a hosted bucket.
//
// Usage: npm run media:copy -- [source-dir]   (default: uploads)
import { readdir, readFile } from 'node:fs/promises'
import * as path from 'node:path'

import { getMediaStore } from '../app/data/media.ts'

const source = path.resolve(process.argv[2] ?? 'uploads')
if ((process.env.MEDIA_STORAGE ?? 'local') === 'local') {
  console.error('Set MEDIA_STORAGE=s3 and the S3_* variables for the destination bucket first.')
  process.exit(1)
}

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const names = (await readdir(source)).filter((name) => /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name))
const store = getMediaStore()

for (let name of names) {
  let bytes = new Uint8Array(await readFile(path.join(source, name)))
  await store.save(name, bytes, TYPES[name.split('.').pop()!]!)
  console.log(`copied ${name}`)
}
console.log(`${names.length} file(s) copied from ${source}.`)
