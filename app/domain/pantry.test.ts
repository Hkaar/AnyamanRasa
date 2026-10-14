import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { matchRecipe, rankPantryMatches } from './pantry.ts'

const telur = { id: 'telur', name: 'Telur' }
const nasi = { id: 'nasi', name: 'Nasi Putih' }
const garam = { id: 'garam', name: 'Garam' }
const bawangMerah = { id: 'bm', name: 'Bawang Merah' }
const cabaiMerah = { id: 'cm', name: 'Cabai Merah' }
const cabaiRawit = { id: 'cr', name: 'Cabai Rawit' }
const udang = { id: 'udang', name: 'Udang' }

const nasiGoreng = {
  recipe: { title: 'Nasi Goreng Kampung' },
  ingredients: [nasi, telur, garam, bawangMerah, cabaiMerah],
}

describe('matchRecipe', () => {
  it('counts have and missing ingredients from explicit recipe ingredients', () => {
    let match = matchRecipe(nasiGoreng, new Set(['nasi', 'telur']), [], { assumeStaples: false })

    assert.deepEqual(
      match.have.map((i) => i.name),
      ['Nasi Putih', 'Telur'],
    )
    assert.deepEqual(
      match.missing.map((i) => i.name),
      ['Garam', 'Bawang Merah', 'Cabai Merah'],
    )
    assert.equal(match.requiredCount, 5)
    assert.equal(match.percent, 40)
  })

  it('leaves staples out of the counts when they are assumed available', () => {
    let match = matchRecipe(nasiGoreng, new Set(['nasi', 'telur']), [], { assumeStaples: true })

    assert.deepEqual(
      match.assumed.map((i) => i.name),
      ['Garam', 'Bawang Merah'],
    )
    assert.equal(match.requiredCount, 3)
    assert.equal(match.matchedCount, 2)
    assert.equal(match.percent, 67)
  })

  it('still counts a staple the user explicitly has', () => {
    let match = matchRecipe(nasiGoreng, new Set(['garam']), [], { assumeStaples: true })
    assert.equal(match.matchedCount, 1)
    assert.equal(match.requiredCount, 4)
  })

  it('suggests only explicit substitutions for missing ingredients, owned ones first', () => {
    let substitutions = [
      { sourceId: 'cm', target: udang, label: 'tidak masuk akal tapi eksplisit' },
      { sourceId: 'cm', target: cabaiRawit, label: 'Lebih pedas' },
      { sourceId: 'telur', target: cabaiRawit, label: 'tidak relevan: telur sudah ada' },
    ]
    let match = matchRecipe(nasiGoreng, new Set(['nasi', 'telur', 'cr']), substitutions, {
      assumeStaples: true,
    })

    assert.deepEqual(
      match.substitutions.map((s) => [s.missing.name, s.substitute.name, s.inPantry]),
      [
        ['Cabai Merah', 'Cabai Rawit', true],
        ['Cabai Merah', 'Udang', false],
      ],
    )
  })

  it('ignores duplicate ingredient rows', () => {
    let match = matchRecipe(
      { recipe: { title: 'x' }, ingredients: [telur, telur] },
      new Set(['telur']),
      [],
      { assumeStaples: false },
    )
    assert.equal(match.requiredCount, 1)
  })
})

describe('rankPantryMatches', () => {
  const telurDadar = { recipe: { title: 'Telur Dadar' }, ingredients: [telur, cabaiMerah] }
  const udangGoreng = { recipe: { title: 'Udang Goreng' }, ingredients: [udang, garam] }
  const nasiTelur = { recipe: { title: 'Nasi Telur' }, ingredients: [nasi, telur, udang] }

  it('ranks by match ratio, then matched count, and drops recipes with no match', () => {
    let ranked = rankPantryMatches(
      [nasiGoreng, telurDadar, udangGoreng, nasiTelur],
      new Set(['nasi', 'telur']),
      [],
      { assumeStaples: true },
    )

    assert.deepEqual(
      ranked.map((m) => [m.recipe.title, m.percent]),
      [
        ['Nasi Goreng Kampung', 67],
        ['Nasi Telur', 67],
        ['Telur Dadar', 50],
      ],
    )
  })

  it('returns nothing for an empty pantry', () => {
    assert.deepEqual(rankPantryMatches([nasiGoreng], new Set(), [], { assumeStaples: true }), [])
  })
})
