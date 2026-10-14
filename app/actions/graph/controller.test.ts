import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { MAX_GRAPH_NODES } from '../../domain/graph.ts'
import { NASI_GORENG_KAMPUNG, SAYUR_SOP_ARCHIVED, TELUR, createClient } from '../../../test/client.ts'

interface GraphJson {
  center: string
  nodes: { key: string; type: string }[]
  edges: { kind: string; source: string; target: string }[]
}

describe('recipe graph', () => {
  it('returns a bounded neighbourhood built from stored relationships', async () => {
    let graph: GraphJson = await (await createClient().get(`/api/graf?simpul=recipe:${NASI_GORENG_KAMPUNG}&kedalaman=2`)).json()
    assert.equal(graph.center, `recipe:${NASI_GORENG_KAMPUNG}`)
    assert.ok(graph.nodes.length <= MAX_GRAPH_NODES)
    let keys = new Set(graph.nodes.map((node) => node.key))
    assert.ok(graph.edges.every((edge) => keys.has(edge.source) && keys.has(edge.target)))
    assert.ok(graph.edges.some((edge) => edge.kind === 'variation_of'))
    assert.ok(!graph.edges.some((edge) => edge.kind === 'same_category'), 'derived category edges are opt-in')
  })

  it('applies relationship filters', async () => {
    let graph: GraphJson = await (await createClient().get(`/api/graf?simpul=recipe:${NASI_GORENG_KAMPUNG}&relasi=uses`)).json()
    assert.ok(graph.edges.length > 0)
    assert.ok(graph.edges.every((edge) => edge.kind === 'uses'))
  })

  it('centres on ingredients too', async () => {
    let graph: GraphJson = await (await createClient().get(`/api/graf?simpul=ingredient:${TELUR}`)).json()
    assert.ok(graph.nodes.some((node) => node.type === 'recipe'))
  })

  it('never exposes unpublished recipes', async () => {
    let response = await createClient().get(`/api/graf?simpul=recipe:${SAYUR_SOP_ARCHIVED}`)
    assert.equal(response.status, 404)
  })

  it('rejects malformed node keys', async () => {
    assert.equal((await createClient().get('/api/graf?simpul=recipe:1%20or%201=1')).status, 404)
    assert.equal((await createClient().get('/api/graf')).status, 400)
  })

  it('renders the graph page with a list alternative', async () => {
    let html = await (await createClient().get(`/graf?simpul=recipe:${NASI_GORENG_KAMPUNG}&tampilan=daftar`)).text()
    assert.match(html, /Serupa/)
    assert.match(html, /Jadikan pusat/)
  })
})
