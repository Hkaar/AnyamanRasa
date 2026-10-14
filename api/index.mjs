// Vercel Function entry: every request that is not a static file in public/ is rewritten
// here (vercel.json). Plain .mjs on purpose, so Vercel runs it as-is: it registers the same
// TypeScript/JSX loader `npm start` uses (remix/node-tsx), then loads the app router, which
// is a standard fetch handler. Docker and self-hosting keep using server.ts.
import 'remix/node-tsx'

const { router } = await import('../app/router.ts')

export default {
  fetch(request) {
    return router.fetch(request)
  },
}
