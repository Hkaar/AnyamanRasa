import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { buildFeed, joinNames, nextStep, parseStep, pickCategoryIds, previousStep, validateFavorites } from './onboarding.ts'

const UDANG = { id: 'udang', name: 'Udang' }
const TELUR = { id: 'telur', name: 'Telur' }

describe('onboarding', () => {
  it('walks the three steps and the finish screen with a safe default', () => {
    assert.equal(parseStep('pantangan'), 'pantangan')
    assert.equal(parseStep('lain'), 'selera')
    assert.equal(nextStep('selera'), 'dapur')
    assert.equal(nextStep('selesai'), 'selesai')
    assert.equal(previousStep('dapur'), 'selera')
    assert.equal(previousStep('selera'), null)
  })

  it('keeps only offered categories and asks for at least three', () => {
    assert.deepEqual(pickCategoryIds(['3', '1', '3', '99', 'x'], [1, 2, 3]), [3, 1])
    assert.match(validateFavorites([1, 2]) ?? '', /minimal 3/)
    assert.equal(validateFavorites([1, 2, 3]), null)
  })

  it('ranks by favourite categories and hides recipes with avoided ingredients', () => {
    let feed = buildFeed(
      [
        { recipe: 'nasi goreng', categoryIds: [1], ingredients: [TELUR] },
        { recipe: 'udang balado', categoryIds: [1, 2], ingredients: [UDANG] },
        { recipe: 'soto', categoryIds: [1, 2], ingredients: [] },
        { recipe: 'sambal', categoryIds: [5], ingredients: [] },
      ],
      { favoriteCategoryIds: [1, 2], avoidedIngredientIds: ['udang'] },
    )
    assert.deepEqual(feed.shown, ['soto', 'nasi goreng'])
    assert.deepEqual(feed.hidden, [{ recipe: 'udang balado', avoided: [UDANG] }])
  })

  it('shows every recipe when no favourite is chosen', () => {
    let feed = buildFeed([{ recipe: 'a', categoryIds: [], ingredients: [] }], { favoriteCategoryIds: [], avoidedIngredientIds: [] })
    assert.deepEqual(feed.shown, ['a'])
  })

  it('joins names the Indonesian way', () => {
    assert.equal(joinNames(['kacang tanah']), 'kacang tanah')
    assert.equal(joinNames(['a', 'b', 'c']), 'a, b & c')
  })
})
