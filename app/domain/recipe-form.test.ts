import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { parseQuantity, readRecipeForm, validateRecipeForm } from './recipe-form.ts'

function form(entries: [string, string][]) {
  let data = new FormData()
  for (let [key, value] of entries) data.append(key, value)
  return data
}

const complete: [string, string][] = [
  ['judul', 'Nasi Goreng Kampung'],
  ['deskripsi', 'Nasi goreng sederhana.'],
  ['persiapan', '10'],
  ['memasak', '15'],
  ['porsi', '2'],
  ['kesulitan', 'mudah'],
  ['kategori', '1'],
  ['bahan_nama', 'Nasi Putih'],
  ['bahan_jumlah', '2'],
  ['bahan_satuan', 'piring'],
  ['bahan_kelompok', ''],
  ['bahan_catatan', ''],
  ['bahan_nama', 'Garam'],
  ['bahan_jumlah', ''],
  ['bahan_satuan', 'secukupnya'],
  ['bahan_kelompok', 'Bumbu dasar'],
  ['bahan_catatan', ''],
  ['bahan_nama', ''],
  ['bahan_jumlah', ''],
  ['bahan_satuan', ''],
  ['bahan_kelompok', ''],
  ['bahan_catatan', ''],
  ['langkah_judul', 'Tumis'],
  ['langkah_teks', 'Tumis bumbu hingga harum.'],
  ['langkah_menit', '3'],
]
const options = { intent: 'publish' as const, isVariation: false, validCategoryIds: new Set([1, 2]) }

describe('parseQuantity', () => {
  it('parses decimals and fractions', () => {
    assert.equal(parseQuantity('2'), 2)
    assert.equal(parseQuantity('1,5'), 1.5)
    assert.equal(parseQuantity('½'), 0.5)
    assert.equal(parseQuantity('1 1/2'), 1.5)
    assert.equal(parseQuantity(''), null)
    assert.ok(Number.isNaN(parseQuantity('dua')!))
    assert.ok(Number.isNaN(parseQuantity('1/0')!))
  })
})

describe('validateRecipeForm', () => {
  it('accepts a complete recipe, skipping blank rows', () => {
    let result = validateRecipeForm(readRecipeForm(form(complete)), options)
    assert.ok(result.ok)
    if (!result.ok) return
    assert.equal(result.recipe.ingredients.length, 2)
    assert.deepEqual(result.recipe.ingredients[1], {
      name: 'Garam',
      quantity: null,
      unit: 'secukupnya',
      section: 'Bumbu dasar',
      note: null,
    })
    assert.deepEqual(result.recipe.steps, [{ text: 'Tumis bumbu hingga harum.', title: 'Tumis', minutes: 3 }])
    assert.equal(result.recipe.changeSummary, null)
  })

  it('requires quantities when publishing, but not for drafts', () => {
    let entries = complete.map(([k, v]): [string, string] => [k, k === 'bahan_jumlah' && v === '2' ? '' : v])
    let publish = validateRecipeForm(readRecipeForm(form(entries)), options)
    assert.ok(!publish.ok)
    if (!publish.ok) assert.equal(publish.errors.ingredientRows[0], 'Jumlah wajib diisi untuk Nasi Putih.')

    let draft = validateRecipeForm(readRecipeForm(form(entries)), { ...options, intent: 'draft' })
    assert.ok(draft.ok)
  })

  it('rejects unknown categories, units and duplicate ingredients', () => {
    let entries: [string, string][] = [
      ...complete.filter(([k]) => k !== 'kategori'),
      ['kategori', '99'],
      ['bahan_nama', 'nasi putih'],
      ['bahan_jumlah', '1'],
      ['bahan_satuan', 'ton'],
      ['bahan_kelompok', ''],
      ['bahan_catatan', ''],
    ]
    let result = validateRecipeForm(readRecipeForm(form(entries)), options)
    assert.ok(!result.ok)
    if (result.ok) return
    assert.equal(result.errors.fields.categoryIds, 'Pilih minimal satu kategori.')
    assert.equal(result.errors.ingredientRows[3], 'nasi putih sudah ada di daftar.')
  })

  it('requires a change summary for variations (SKPL-F-07.3)', () => {
    let result = validateRecipeForm(readRecipeForm(form(complete)), { ...options, isVariation: true })
    assert.ok(!result.ok)
    if (!result.ok) assert.equal(result.errors.fields.changeSummary, 'Jelaskan apa yang kamu ubah dari resep asli.')

    let withSummary = validateRecipeForm(readRecipeForm(form([...complete, ['perubahan', 'Ditambah udang.']])), {
      ...options,
      isVariation: true,
    })
    assert.ok(withSummary.ok)
  })

  it('enforces the 300-character description limit', () => {
    let entries = complete.map(([k, v]): [string, string] => [k, k === 'deskripsi' ? 'a'.repeat(301) : v])
    let result = validateRecipeForm(readRecipeForm(form(entries)), options)
    assert.ok(!result.ok)
  })
})
