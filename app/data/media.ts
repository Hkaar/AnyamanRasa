import { mkdir, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? 'uploads')
const MEDIA_FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/

const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
type Extension = keyof typeof CONTENT_TYPES

export type UploadError = 'too-large' | 'unsupported-type'

/** Detects JPEG, PNG or WebP from the file's leading bytes; client metadata is not trusted. */
function detectExtension(bytes: Uint8Array): Extension | null {
  let ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (ascii(1, 4) === 'PNG' && bytes[0] === 0x89) return 'png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
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
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, name), bytes, { flag: 'wx' })
  return { ok: true, url: `/media/${name}` }
}

/** Resolves a `/media/:file` name to a path inside the upload directory, or null. */
export function resolveMediaFile(name: string): { filePath: string; contentType: string } | null {
  let match = MEDIA_FILE_PATTERN.exec(name)
  if (!match) return null
  return {
    filePath: path.join(UPLOAD_DIR, name),
    contentType: CONTENT_TYPES[match[1] as Extension],
  }
}

export function uploadErrorMessage(error: UploadError): string {
  return error === 'too-large'
    ? 'Ukuran foto maksimal 5 MB.'
    : 'Format foto harus JPG, PNG, atau WebP.'
}

/** A file input that was left empty arrives as an empty, unnamed File. */
export function isProvidedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0
}
