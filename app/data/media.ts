// Uploaded photos (recipe images, avatars). Files are validated here and handed to a
// MediaStore; the stored URL is always `/media/<name>`, so the database does not
// depend on where the bytes live and a deployment can switch backends by copying files.
//
//   MEDIA_STORAGE=local (default): files on disk in UPLOAD_DIR, streamed by the app
//                                  (Docker / self-hosted, with a volume).
//   MEDIA_STORAGE=s3:              any S3-compatible bucket (Supabase Storage, R2, MinIO, AWS)
//                                  through remix/file-storage/s3. With MEDIA_PUBLIC_URL set
//                                  (a public bucket), /media/<name> redirects there; otherwise
//                                  the app streams the object.
import { mkdir, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import type { FileStorage } from 'remix/file-storage'
import { createS3FileStorage } from 'remix/file-storage/s3'
import { openLazyFile } from 'remix/fs'
import { createFileResponse } from 'remix/response/file'

/** Kept under Vercel's 4.5 MB request-body cap so every host accepts the same uploads. */
export const MAX_UPLOAD_MB = 4
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

const MEDIA_FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/
const IMMUTABLE = 'public, max-age=31536000, immutable'

const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
type Extension = keyof typeof CONTENT_TYPES

export type UploadError = 'too-large' | 'unsupported-type'

export interface MediaStore {
  /** Saves bytes under a generated, never reused name. */
  save(name: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<void>
  /** Responds to `GET /media/<name>` (stream, redirect or 404). */
  serve(name: string, request: Request): Promise<Response>
}

/** Plain files in one directory: `uploads/<uuid>.jpg`. */
export function createLocalMediaStore(directory: string): MediaStore {
  let root = path.resolve(directory)
  return {
    async save(name, bytes) {
      await mkdir(root, { recursive: true })
      await writeFile(path.join(root, name), bytes, { flag: 'wx' })
    },
    async serve(name, request) {
      try {
        let file = openLazyFile(path.join(root, name), { type: contentTypeFor(name) })
        return await createFileResponse(file, request, { cacheControl: IMMUTABLE })
      } catch {
        return notFound()
      }
    },
  }
}

/** Any remix FileStorage (S3 in production, memory in tests), optionally fronted by a public URL. */
export function createObjectMediaStore(storage: FileStorage, options: { publicUrl?: string } = {}): MediaStore {
  let publicUrl = options.publicUrl?.replace(/\/+$/, '')
  return {
    async save(name, bytes, contentType) {
      await storage.set(name, new File([bytes], name, { type: contentType }))
    },
    async serve(name) {
      if (publicUrl) {
        return new Response(null, {
          status: 301,
          headers: { Location: `${publicUrl}/${name}`, 'Cache-Control': IMMUTABLE },
        })
      }
      let file = await storage.get(name)
      if (!file) return notFound()
      return new Response(file.stream(), {
        headers: { 'Content-Type': file.type || contentTypeFor(name), 'Content-Length': String(file.size), 'Cache-Control': IMMUTABLE },
      })
    },
  }
}

function createConfiguredStore(env: NodeJS.ProcessEnv): MediaStore {
  let kind = env.MEDIA_STORAGE ?? 'local'
  if (kind === 'local') return createLocalMediaStore(env.UPLOAD_DIR ?? 'uploads')
  if (kind !== 's3') throw new Error(`MEDIA_STORAGE must be "local" or "s3", got "${kind}".`)

  let required = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const
  let missing = required.filter((name) => !env[name])
  if (missing.length > 0) throw new Error(`MEDIA_STORAGE=s3 needs ${missing.join(', ')}.`)

  let storage = createS3FileStorage({
    bucket: env.S3_BUCKET!,
    region: env.S3_REGION!,
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    // Supabase: https://<ref>.storage.supabase.co/storage/v1/s3 (path-style is implied).
    endpoint: env.S3_ENDPOINT || undefined,
  })
  return createObjectMediaStore(storage, { publicUrl: env.MEDIA_PUBLIC_URL || undefined })
}

let override: MediaStore | null = null
let configured: MediaStore | null = null

export function getMediaStore(): MediaStore {
  if (override) return override
  configured ??= createConfiguredStore(process.env)
  return configured
}

/** Tests swap in an in-memory store; pass null to restore the configured one. */
export function setMediaStore(store: MediaStore | null) {
  override = store
}

/** Detects JPEG, PNG or WebP from the file's leading bytes; client metadata is not trusted. */
function detectExtension(bytes: Uint8Array): Extension | null {
  let ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (ascii(1, 4) === 'PNG' && bytes[0] === 0x89) return 'png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

function contentTypeFor(name: string): string {
  let extension = name.slice(name.lastIndexOf('.') + 1) as Extension
  return CONTENT_TYPES[extension] ?? 'application/octet-stream'
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

/** Stores an uploaded image under a generated name and returns its public URL. */
export async function storeImage(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: UploadError }> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too-large' }
  let bytes = new Uint8Array(await file.arrayBuffer())
  let extension = detectExtension(bytes)
  if (!extension) return { ok: false, error: 'unsupported-type' }

  let name = `${crypto.randomUUID()}.${extension}`
  await getMediaStore().save(name, bytes, CONTENT_TYPES[extension])
  return { ok: true, url: `/media/${name}` }
}

/** Serves `/media/:file`; anything but a generated file name is a 404 (no path traversal). */
export async function serveMedia(name: string, request: Request): Promise<Response> {
  if (!MEDIA_FILE_PATTERN.test(name)) return notFound()
  return getMediaStore().serve(name, request)
}

export function uploadErrorMessage(error: UploadError): string {
  return error === 'too-large'
    ? `Ukuran foto maksimal ${MAX_UPLOAD_MB} MB.`
    : 'Format foto harus JPG, PNG, atau WebP.'
}

/** A file input that was left empty arrives as an empty, unnamed File. */
export function isProvidedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0
}
