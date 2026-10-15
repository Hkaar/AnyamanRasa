// Precompiles the browser modules (the script entry, each clientEntry island and their
// whole import graphs) into public/assets/, at the same fingerprinted URLs the running
// server emits. Static hosts and CDNs (Vercel, a reverse proxy, the staticFiles middleware)
// then serve them as plain files, so those requests never reach a function or the app.
//
// Only .js/.mjs output is written: static servers type .ts/.tsx by extension (video/mp2t),
// which browsers reject for module scripts. The app's own ~30 TypeScript modules are served
// by the server with the right type, outside the session/database pipeline and with CDN
// caching (see publicAssets() in app/router.ts).
//
// Runs as part of `npm run build`.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

process.env.NODE_ENV = 'production'
const { assets, SCRIPT_ENTRY_FILE } = await import('../app/assets.ts')

const outDir = path.resolve('public/assets')
await rm(outDir, { recursive: true, force: true })

let entries = [SCRIPT_ENTRY_FILE, ...(await findClientEntries('app'))]
let urls = new Set<string>()
for (let file of entries) {
  let entry = await assets.getScriptEntry(file)
  urls.add(entry.href)
  for (let url of entry.preloads) urls.add(url)
  // Dynamically imported modules are not preloaded but are listed in the import map.
  let { imports = {}, scopes = {} } = entry.importMap as {
    imports?: Record<string, string>
    scopes?: Record<string, Record<string, string>>
  }
  for (let url of [...Object.values(imports), ...Object.values(scopes).flatMap(Object.values)]) {
    if (url.startsWith('/assets/')) urls.add(url)
  }
}

let bytes = 0
let written = 0
for (let url of urls) {
  if (!/\.m?js$/.test(url)) continue
  let response = await assets.fetch(new Request(`http://localhost${url}`))
  if (!response || !response.ok) throw new Error(`Could not compile ${url} (${response?.status ?? 'unhandled'})`)
  let body = new Uint8Array(await response.arrayBuffer())
  // URLs are percent-encoded (%40remix-run); static servers map them to decoded paths.
  let target = path.join(outDir, decodeURIComponent(url.slice('/assets/'.length)))
  if (!target.startsWith(outDir + path.sep)) throw new Error(`Refusing to write outside public/assets: ${url}`)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, body)
  bytes += body.length
  written++
}

await assets.close()
console.log(
  `Precompiled ${written} of ${urls.size} modules from ${entries.length} entries (${Math.round(bytes / 1024)} KB) into public/assets.`,
)

/** Browser-reachable modules that declare a clientEntry() island. */
async function findClientEntries(dir: string): Promise<string[]> {
  let found: string[] = []
  for (let entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || entry.name.includes('.test.')) continue
    let file = path.relative(process.cwd(), path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    if (!file.includes('/public/')) continue
    if (/\bclientEntry\(/.test(await readFile(file, 'utf8'))) found.push(file)
  }
  return found.sort()
}
