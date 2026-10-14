import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  DEFAULT_EDGE_KINDS,
  type GraphEdge,
  type GraphEdgeKind,
  type NodeKey,
  parseEdgeKinds,
  parseNodeKey,
  selectNeighborhood,
} from './graph.ts'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const recipe = (n: number) => `recipe:${id(n)}` as NodeKey
const ingredient = (n: number) => `ingredient:${id(n)}` as NodeKey

let edgeId = 0
const edge = (kind: GraphEdgeKind, source: NodeKey, target: NodeKey): GraphEdge => ({
  id: `e${++edgeId}`,
  kind,
  source,
  target,
  label: null,
})

const center = recipe(1)
const edges = [
  edge('variation_of', recipe(2), center),
  edge('similar_to', center, recipe(3)),
  edge('uses', center, ingredient(10)),
  edge('uses', center, ingredient(11)),
  edge('substitute_for', ingredient(10), ingredient(12)),
  edge('uses', recipe(3), ingredient(13)),
  edge('same_category', center, recipe(4)),
]

describe('selectNeighborhood', () => {
  it('returns the depth-1 neighbourhood plus substitutes of included ingredients', () => {
    let result = selectNeighborhood({ center, depth: 1, kinds: DEFAULT_EDGE_KINDS, edges })

    assert.deepEqual(new Set(result.nodeKeys), new Set([center, recipe(2), recipe(3), ingredient(10), ingredient(11), ingredient(12)]))
    assert.equal(result.edges.length, 5)
    assert.equal(result.truncated, false)
  })

  it('reaches two hops at depth 2', () => {
    let result = selectNeighborhood({ center, depth: 2, kinds: DEFAULT_EDGE_KINDS, edges })
    assert.ok(result.nodeKeys.includes(ingredient(13)))
  })

  it('drops filtered relationship kinds, including derived category edges by default', () => {
    let result = selectNeighborhood({ center, depth: 1, kinds: ['variation_of'], edges })
    assert.deepEqual(result.nodeKeys, [center, recipe(2)])
    assert.ok(!selectNeighborhood({ center, depth: 1, kinds: DEFAULT_EDGE_KINDS, edges }).nodeKeys.includes(recipe(4)))
  })

  it('caps the node count, keeping higher-priority relationships first', () => {
    let result = selectNeighborhood({ center, depth: 1, kinds: DEFAULT_EDGE_KINDS, edges, maxNodes: 3 })
    assert.deepEqual(result.nodeKeys, [center, recipe(2), recipe(3)])
    assert.equal(result.truncated, true)
    assert.ok(result.edges.every((e) => result.nodeKeys.includes(e.source) && result.nodeKeys.includes(e.target)))
  })
})

describe('graph params', () => {
  it('parses node keys strictly', () => {
    assert.deepEqual(parseNodeKey(`recipe:${id(1)}`), { type: 'recipe', id: id(1) })
    assert.equal(parseNodeKey('recipe:1; drop table'), null)
    assert.equal(parseNodeKey(`user:${id(1)}`), null)
  })

  it('falls back to the default kinds when none are valid', () => {
    assert.deepEqual(parseEdgeKinds(['bogus']), [...DEFAULT_EDGE_KINDS])
    assert.deepEqual(parseEdgeKinds(['uses', 'bogus']), ['uses'])
  })
})
