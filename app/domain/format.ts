import type { Difficulty, RelationType } from './types.ts'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
}

export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTY_LABELS[difficulty]
}

/** "25 menit", "1 jam", "1 jam 30 menit". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`
  let hours = Math.floor(minutes / 60)
  let rest = minutes % 60
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} menit`
}

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
  [1 / 3, '⅓'],
  [2 / 3, '⅔'],
]

/** Formats a quantity for a recipe line: 0.5 → "½", 1.5 → "1½", 2 → "2", 1.25 → "1¼". */
export function formatQuantity(quantity: number): string {
  let whole = Math.floor(quantity + 1e-9)
  let fraction = quantity - whole
  if (fraction < 0.02) return String(whole)

  let match = FRACTIONS.find(([value]) => Math.abs(value - fraction) < 0.02)
  if (match) return whole === 0 ? match[1] : `${whole}${match[1]}`

  return quantity.toLocaleString('id-ID', { maximumFractionDigits: 1 })
}

export function formatIngredientAmount(quantity: number | null, unit: string | null): string {
  if (quantity === null) return unit ?? ''
  return unit ? `${formatQuantity(quantity)} ${unit}` : formatQuantity(quantity)
}

/** Rescales a quantity for a different number of servings, rounded to quarters. */
export function scaleQuantity(quantity: number, fromServings: number, toServings: number): number {
  let scaled = (quantity * toServings) / fromServings
  return Math.round(scaled * 4) / 4 || scaled
}

const DATE_FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

/** "12 Sep 2026" */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso)).replace('.', '')
}

/** "Maret 2025" */
export function formatMonthYear(iso: string): string {
  return MONTH_YEAR_FORMAT.format(new Date(iso))
}

/** "2 jam lalu", "3 hari lalu" relative to `now`. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  let seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'baru saja'
  let minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  let hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  let days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return formatDate(iso)
}

export function formatCategories(categories: string[]): string {
  return categories.join(' · ')
}

export function initials(name: string): string {
  let parts = name.trim().split(/\s+/).filter(Boolean)
  let letters = parts.length > 1 ? [parts[0]![0], parts[parts.length - 1]![0]] : [parts[0]?.[0]]
  return letters.filter(Boolean).join('').toUpperCase()
}

export function formatCount(count: number): string {
  return count.toLocaleString('id-ID')
}

/** Labels used in the graph legend and relationship lists. */
export const RELATION_LABELS: Record<RelationType, string> = {
  uses: 'Bahan',
  variation_of: 'Variasi',
  substitute_for: 'Pengganti',
  similar_to: 'Serupa',
  inspired_by: 'Terinspirasi',
  pairs_with: 'Pasangan',
}
