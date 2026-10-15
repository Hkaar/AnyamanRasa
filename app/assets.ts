import { createAssetServer } from 'remix/assets'
import { componentHmr } from 'remix/component-hmr/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'
const isHmr = Boolean(isDevelopment && process.env.REMIX_NODE_HMR)

export const assets = createAssetServer({
  basePath: '/assets',
  rootDir,

  // Browser-reachable source. app/data, app/middleware and app/db.ts are server-only
  // and must never be listed here.
  allowFiles: ['app/routes.ts', 'app/**/public/**', 'app/ui/**', 'app/domain/**'],
  allowPackages: ['remix', 'cytoscape', 'motion', 'lenis', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  // Production URLs carry a content hash, so `npm run build` can write them to public/assets
  // (scripts/build-assets.ts) and every host can cache them forever.
  fingerprint: !isDevelopment,
  watch: isDevelopment,
  hmr: isHmr
    ? {
        channel: async () => (await import('remix/node-hmr/runtime')).createBrowserHmrChannel(),
        moduleImporter: 'remix/multiple-import-maps-polyfill',
      }
    : undefined,
  scripts: {
    loaders: isHmr ? [componentHmr()] : undefined,
    // Browser packages such as motion read process.env.NODE_ENV, which only bundlers replace.
    define: { 'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production') },
  },
})

export const SCRIPT_ENTRY_FILE = 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(SCRIPT_ENTRY_FILE)
