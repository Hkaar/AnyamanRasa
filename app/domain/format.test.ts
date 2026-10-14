import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { formatIngredientAmount, formatMinutes, formatQuantity, initials, scaleQuantity } from './format.ts'

describe('format', () => {
  it('formats quantities with common fractions', () => {
    assert.equal(formatQuantity(0.5), '½')
    assert.equal(formatQuantity(1.5), '1½')
    assert.equal(formatQuantity(2), '2')
    assert.equal(formatQuantity(0.25), '¼')
    assert.equal(formatQuantity(1.2), '1,2')
  })

  it('formats amounts with and without units', () => {
    assert.equal(formatIngredientAmount(2, 'sdm'), '2 sdm')
    assert.equal(formatIngredientAmount(null, 'secukupnya'), 'secukupnya')
    assert.equal(formatIngredientAmount(3, null), '3')
  })

  it('formats durations', () => {
    assert.equal(formatMinutes(25), '25 menit')
    assert.equal(formatMinutes(60), '1 jam')
    assert.equal(formatMinutes(90), '1 jam 30 menit')
  })

  it('scales quantities to quarter steps', () => {
    assert.equal(scaleQuantity(2, 2, 3), 3)
    assert.equal(scaleQuantity(1, 2, 3), 1.5)
    assert.equal(scaleQuantity(1, 3, 2), 0.75)
  })

  it('builds initials', () => {
    assert.equal(initials('Sari Wulandari'), 'SW')
    assert.equal(initials('admin'), 'A')
  })
})
