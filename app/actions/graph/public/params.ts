import {
  DEFAULT_EDGE_KINDS,
  GRAPH_EDGE_KINDS,
  type GraphEdgeKind,
  MAX_GRAPH_DEPTH,
  parseEdgeKinds,
} from '../../../domain/graph.ts'

export type GraphView = 'graf' | 'daftar'

export interface GraphParams {
  center: string | null
  depth: number
  kinds: GraphEdgeKind[]
  view: GraphView
}

/** `?simpul=recipe:<uuid>&kedalaman=1&relasi=uses&relasi=…&tampilan=daftar` */
export function parseGraphParams(params: URLSearchParams): GraphParams {
  let depth = Number(params.get('kedalaman'))
  let kinds = params.getAll('relasi')
  return {
    center: params.get('simpul'),
    depth: Number.isInteger(depth) && depth >= 1 && depth <= MAX_GRAPH_DEPTH ? depth : 1,
    kinds: kinds.length > 0 ? parseEdgeKinds(kinds) : [...DEFAULT_EDGE_KINDS],
    view: params.get('tampilan') === 'daftar' ? 'daftar' : 'graf',
  }
}

export function graphQuery(state: GraphParams): string {
  let params = new URLSearchParams()
  if (state.center) params.set('simpul', state.center)
  if (state.depth !== 1) params.set('kedalaman', String(state.depth))
  let isDefault =
    state.kinds.length === DEFAULT_EDGE_KINDS.length &&
    DEFAULT_EDGE_KINDS.every((kind) => state.kinds.includes(kind))
  if (!isDefault) {
    for (let kind of GRAPH_EDGE_KINDS) if (state.kinds.includes(kind)) params.append('relasi', kind)
  }
  if (state.view === 'daftar') params.set('tampilan', 'daftar')
  return params.toString()
}
