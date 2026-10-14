// Recipe editor input: parsing and validation (SKPL-F-06.1, F-06.2, F-07.3).
// The same rules serve create, edit and variation; the server is authoritative.

import { DIFFICULTIES, type Difficulty, type RecipeStep } from './types.ts'

export const UNITS = [
  'butir',
  'siung',
  'sdm',
  'sdt',
  'gram',
  'kg',
  'ml',
  'liter',
  'buah',
  'batang',
  'lembar',
  'ruas',
  'ikat',
  'potong',
  'piring',
  'cangkir',
  'secukupnya',
] as const

export const INGREDIENT_SECTIONS = ['Bahan utama', 'Bumbu dasar', 'Pelengkap'] as const

export const LIMITS = {
  title: 255,
  description: 300,
  changeSummary: 1000,
  ingredientName: 150,
  note: 255,
  stepText: 2000,
  stepTitle: 120,
  maxIngredients: 60,
  maxSteps: 40,
  maxCategories: 3,
  maxMinutes: 24 * 60,
} as const

export interface IngredientRowInput {
  name: string
  quantity: string
  unit: string
  section: string
  note: string
}

export interface StepRowInput {
  title: string
  text: string
  minutes: string
}

/** Raw editor values, echoed back into the form on validation errors. */
export interface RecipeFormValues {
  title: string
  description: string
  prepMinutes: string
  cookMinutes: string
  servings: string
  difficulty: string
  categoryIds: number[]
  ingredients: IngredientRowInput[]
  steps: StepRowInput[]
  changeSummary: string
  imageUrl: string | null
}

export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: string | null
  section: string | null
  note: string | null
}

export interface ParsedRecipe {
  title: string
  description: string
  prepMinutes: number
  cookMinutes: number
  servings: number
  difficulty: Difficulty
  categoryIds: number[]
  ingredients: ParsedIngredient[]
  steps: RecipeStep[]
  changeSummary: string | null
}

export type RecipeFormField =
  | 'title'
  | 'description'
  | 'image'
  | 'prepMinutes'
  | 'cookMinutes'
  | 'servings'
  | 'difficulty'
  | 'categoryIds'
  | 'ingredients'
  | 'steps'
  | 'changeSummary'

export interface RecipeFormErrors {
  fields: Partial<Record<RecipeFormField, string>>
  /** Per-row ingredient errors by index. */
  ingredientRows: Record<number, string>
  stepRows: Record<number, string>
}

export type RecipeIntent = 'publish' | 'draft'

const str = (form: FormData, name: string) => {
  let value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}
const all = (form: FormData, name: string) =>
  form.getAll(name).map((value) => (typeof value === 'string' ? value.trim() : ''))

export function readRecipeForm(form: FormData): RecipeFormValues {
  let names = all(form, 'bahan_nama')
  let quantities = all(form, 'bahan_jumlah')
  let units = all(form, 'bahan_satuan')
  let sections = all(form, 'bahan_kelompok')
  let notes = all(form, 'bahan_catatan')
  let stepTitles = all(form, 'langkah_judul')
  let stepTexts = all(form, 'langkah_teks')
  let stepMinutes = all(form, 'langkah_menit')

  return {
    title: str(form, 'judul'),
    description: str(form, 'deskripsi'),
    prepMinutes: str(form, 'persiapan'),
    cookMinutes: str(form, 'memasak'),
    servings: str(form, 'porsi'),
    difficulty: str(form, 'kesulitan'),
    categoryIds: [...new Set(all(form, 'kategori').map(Number).filter((n) => Number.isInteger(n) && n > 0))],
    ingredients: names.map((name, i) => ({
      name,
      quantity: quantities[i] ?? '',
      unit: units[i] ?? '',
      section: sections[i] ?? '',
      note: notes[i] ?? '',
    })),
    steps: stepTexts.map((text, i) => ({ title: stepTitles[i] ?? '', text, minutes: stepMinutes[i] ?? '' })),
    changeSummary: str(form, 'perubahan'),
    imageUrl: str(form, 'foto_lama') || null,
  }
}

/** Accepts "2", "1,5", "1.5", "½", "1/2", "1 1/2". */
export function parseQuantity(raw: string): number | null {
  let value = raw.trim().replace(',', '.')
  if (!value) return null
  let unicode: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }
  let match = /^(\d+(?:\.\d+)?)?\s*([¼½¾⅓⅔]|(\d+)\/(\d+))?$/.exec(value)
  if (!match || (!match[1] && !match[2])) return Number.NaN
  let whole = match[1] ? Number(match[1]) : 0
  let fraction = 0
  if (match[2]) {
    if (match[3] && match[4]) {
      if (Number(match[4]) === 0) return Number.NaN
      fraction = Number(match[3]) / Number(match[4])
    } else fraction = unicode[match[2]] ?? 0
  }
  return Math.round((whole + fraction) * 100) / 100
}

function parseMinutes(raw: string): number | null {
  if (!raw) return 0
  let value = Number(raw)
  return Number.isInteger(value) && value >= 0 && value <= LIMITS.maxMinutes ? value : null
}

export function validateRecipeForm(
  values: RecipeFormValues,
  options: { intent: RecipeIntent; isVariation: boolean; validCategoryIds: ReadonlySet<number> },
): { ok: true; recipe: ParsedRecipe } | { ok: false; errors: RecipeFormErrors } {
  let publishing = options.intent === 'publish'
  let errors: RecipeFormErrors = { fields: {}, ingredientRows: {}, stepRows: {} }
  let fields = errors.fields

  if (!values.title) fields.title = 'Judul resep wajib diisi.'
  else if (values.title.length > LIMITS.title) fields.title = `Judul maksimal ${LIMITS.title} karakter.`

  if (values.description.length > LIMITS.description) {
    fields.description = `Deskripsi maksimal ${LIMITS.description} karakter.`
  } else if (publishing && !values.description) {
    fields.description = 'Tulis deskripsi singkat agar orang tahu masakan ini.'
  }

  let prep = parseMinutes(values.prepMinutes)
  let cook = parseMinutes(values.cookMinutes)
  if (prep === null) fields.prepMinutes = 'Isi dengan menit (angka bulat).'
  if (cook === null) fields.cookMinutes = 'Isi dengan menit (angka bulat).'
  if (publishing && prep === 0 && cook === 0 && !fields.prepMinutes && !fields.cookMinutes) {
    fields.cookMinutes = 'Isi waktu memasak.'
  }

  let servings = values.servings ? Number(values.servings) : 2
  if (!Number.isInteger(servings) || servings < 1 || servings > 50) fields.servings = 'Porsi antara 1 dan 50.'

  let difficulty = (DIFFICULTIES as readonly string[]).includes(values.difficulty)
    ? (values.difficulty as Difficulty)
    : null
  if (!difficulty) fields.difficulty = 'Pilih tingkat kesulitan.'

  let categoryIds = values.categoryIds.filter((id) => options.validCategoryIds.has(id))
  if (categoryIds.length > LIMITS.maxCategories) fields.categoryIds = `Pilih maksimal ${LIMITS.maxCategories} kategori.`
  else if (publishing && categoryIds.length === 0) fields.categoryIds = 'Pilih minimal satu kategori.'

  let ingredients: ParsedIngredient[] = []
  let seen = new Set<string>()
  values.ingredients.forEach((row, index) => {
    if (!row.name && !row.quantity && !row.note) return // blank row
    if (!row.name) {
      errors.ingredientRows[index] = 'Nama bahan wajib diisi.'
      return
    }
    if (row.name.length > LIMITS.ingredientName) {
      errors.ingredientRows[index] = 'Nama bahan terlalu panjang.'
      return
    }
    let key = row.name.toLowerCase()
    if (seen.has(key)) {
      errors.ingredientRows[index] = `${row.name} sudah ada di daftar.`
      return
    }
    seen.add(key)
    let unit = row.unit && (UNITS as readonly string[]).includes(row.unit) ? row.unit : null
    if (row.unit && !unit) {
      errors.ingredientRows[index] = 'Pilih satuan dari daftar.'
      return
    }
    let quantity = parseQuantity(row.quantity)
    if (quantity !== null && (Number.isNaN(quantity) || quantity <= 0 || quantity > 99999)) {
      errors.ingredientRows[index] = `Jumlah ${row.name} tidak valid.`
      return
    }
    if (publishing && quantity === null && unit !== 'secukupnya') {
      errors.ingredientRows[index] = `Jumlah wajib diisi untuk ${row.name}.`
      return
    }
    let section = (INGREDIENT_SECTIONS as readonly string[]).includes(row.section) ? row.section : null
    ingredients.push({
      name: row.name,
      quantity: unit === 'secukupnya' ? null : quantity,
      unit,
      section,
      note: row.note ? row.note.slice(0, LIMITS.note) : null,
    })
  })
  if (ingredients.length > LIMITS.maxIngredients) fields.ingredients = `Maksimal ${LIMITS.maxIngredients} bahan.`
  else if (publishing && ingredients.length < 2) fields.ingredients = 'Tambahkan minimal 2 bahan.'

  let steps: RecipeStep[] = []
  values.steps.forEach((row, index) => {
    if (!row.text && !row.title && !row.minutes) return
    if (!row.text) {
      errors.stepRows[index] = 'Tulis isi langkah.'
      return
    }
    if (row.text.length > LIMITS.stepText || row.title.length > LIMITS.stepTitle) {
      errors.stepRows[index] = 'Langkah terlalu panjang.'
      return
    }
    let minutes = row.minutes ? Number(row.minutes) : undefined
    if (minutes !== undefined && (!Number.isInteger(minutes) || minutes < 0 || minutes > LIMITS.maxMinutes)) {
      errors.stepRows[index] = 'Waktu langkah harus berupa menit.'
      return
    }
    steps.push({
      text: row.text,
      ...(row.title ? { title: row.title } : {}),
      ...(minutes ? { minutes } : {}),
    })
  })
  if (steps.length > LIMITS.maxSteps) fields.steps = `Maksimal ${LIMITS.maxSteps} langkah.`
  else if (publishing && steps.length === 0) fields.steps = 'Tambahkan minimal satu langkah memasak.'

  let changeSummary = values.changeSummary || null
  if (options.isVariation) {
    if (!changeSummary) fields.changeSummary = 'Jelaskan apa yang kamu ubah dari resep asli.'
    else if (changeSummary.length > LIMITS.changeSummary) fields.changeSummary = 'Penjelasan terlalu panjang.'
  } else {
    changeSummary = null
  }

  let hasErrors =
    Object.keys(fields).length > 0 ||
    Object.keys(errors.ingredientRows).length > 0 ||
    Object.keys(errors.stepRows).length > 0
  if (hasErrors) return { ok: false, errors }

  return {
    ok: true,
    recipe: {
      title: values.title,
      description: values.description,
      prepMinutes: prep!,
      cookMinutes: cook!,
      servings,
      difficulty: difficulty!,
      categoryIds,
      ingredients,
      steps,
      changeSummary,
    },
  }
}

export function emptyRecipeErrors(): RecipeFormErrors {
  return { fields: {}, ingredientRows: {}, stepRows: {} }
}
