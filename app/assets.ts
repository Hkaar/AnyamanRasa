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
  allowPackages: ['remix', 'cytoscape', 'motion', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
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

const entry = 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(entry)
