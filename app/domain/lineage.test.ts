import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { diffIngredients, ingredientChangesOnly } from './lineage.ts'
import type { RecipeIngredientLine } from './types.ts'

const line = (id: string, quantity: number | null, unit: string | null): RecipeIngredientLine => ({
  ingredientId: id,
  name: id,
  quantity,
  unit,
  note: null,
  section: null,
})

describe('diffIngredients', () => {
  it('classifies added, removed, changed and unchanged ingredients', () => {
    let parent = [line('nasi', 2, 'piring'), line('kecap', 2, 'sdm'), line('cabai', 3, 'buah')]
    let variation = [line('nasi', 2, 'piring'), line('kecap', 1, 'sdm'), line('udang', 100, 'gram')]

    let changes = diffIngredients(parent, variation)

    assert.deepEqual(
      changes.map((change) => [change.kind, change.line.ingredientId]),
      [
        ['same', 'nasi'],
        ['changed', 'kecap'],
        ['added', 'udang'],
        ['removed', 'cabai'],
      ],
    )
    let changed = changes[1]
    assert.equal(changed?.kind === 'changed' && changed.previous.quantity, 2)
    assert.equal(ingredientChangesOnly(changes).length, 3)
  })

  it('treats a unit change as a change', () => {
    let [change] = diffIngredients([line('gula', 1, 'sdm')], [line('gula', 1, 'sdt')])
    assert.equal(change?.kind, 'changed')
  })
})
