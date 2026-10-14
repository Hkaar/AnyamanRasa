import { createController } from 'remix/router'

import { loadNeighborhood, mostConnectedRecipeKey, searchGraphNodes } from '../../data/graph.ts'
import { routes } from '../../routes.ts'
import { getShell, notFound } from '../shell.tsx'
import { GraphPage } from './page.tsx'
import { parseGraphParams } from './public/params.ts'

export default createController(routes.graph, {
  actions: {
    async index(context) {
      let state = parseGraphParams(context.url.searchParams)
      let center = state.center ?? (await mostConnectedRecipeKey(context.db))
      if (!center) return notFound(context, 'Belum ada resep untuk ditampilkan di graf.')

      let graph = await loadNeighborhood(context.db, { center, depth: state.depth, kinds: state.kinds })
      if (!graph) return notFound(context, 'Simpul graf ini tidak ditemukan.')

      return context.render(<GraphPage shell={getShell(context)} graph={graph} state={{ ...state, center }} />)
    },

    /** JSON neighbourhood for client-side refocusing and filtering. */
    async data(context) {
      let state = parseGraphParams(context.url.searchParams)
      if (!state.center) return Response.json({ error: 'simpul wajib diisi' }, { status: 400 })
      let graph = await loadNeighborhood(context.db, {
        center: state.center,
        depth: state.depth,
        kinds: state.kinds,
      })
      if (!graph) return Response.json({ error: 'Simpul tidak ditemukan' }, { status: 404 })
      return Response.json(graph, { headers: { 'Cache-Control': 'no-store' } })
    },

    async search(context) {
      let query = (context.url.searchParams.get('q') ?? '').slice(0, 100)
      return Response.json(await searchGraphNodes(context.db, query), {
        headers: { 'Cache-Control': 'no-store' },
      })
    },
  },
})
