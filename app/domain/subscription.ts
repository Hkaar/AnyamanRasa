// Dapur Plus / Keluarga plans and the simulated checkout (pen.dev 14a–14d). Nothing is stored or
// charged: the checkout is a walkthrough, so every step is derived from its query/form values.

export type PaidPlanId = 'plus' | 'keluarga'
export type Period = 'bulanan' | 'tahunan'
export type PaymentMethod = 'qris' | 'gopay' | 'ovo' | 'dana' | 'kartu'

export interface Plan {
  id: PaidPlanId | 'gratis'
  name: string
  description: string
  /** Rupiah per month and per year (yearly = 10 months, "Hemat 17%"). */
  monthly: number
  yearly: number
  /** Short list on the plan tiles (14a). */
  highlights: string[]
  /** Full list in the order summary. */
  features: string[]
  seats: string
}

/** Free accounts may save this many recipes (shown as a meter; not enforced). */
export const FREE_SAVE_LIMIT = 20

export const PLANS: Record<Plan['id'], Plan> = {
  gratis: {
    id: 'gratis',
    name: 'Gratis',
    description: 'Untuk mulai menjelajah.',
    monthly: 0,
    yearly: 0,
    highlights: ['Ribuan resep komunitas', 'Cari dari bahan', `Simpan ${FREE_SAVE_LIMIT} resep`],
    features: [],
    seats: 'untuk 1 akun',
  },
  plus: {
    id: 'plus',
    name: 'Dapur Plus',
    description: 'Dapur rumahan yang lebih teratur.',
    monthly: 29_000,
    yearly: 290_000,
    highlights: ['Simpan tanpa batas', 'Perencana menu', 'Graf Resep'],
    features: ['Simpan resep tanpa batas', 'Perencana menu mingguan', 'Daftar belanja otomatis', 'Penjelajah Graf Resep', 'Bebas iklan'],
    seats: 'untuk 1 akun',
  },
  keluarga: {
    id: 'keluarga',
    name: 'Keluarga',
    description: 'Satu rumah, masak bersama.',
    monthly: 49_000,
    yearly: 490_000,
    highlights: ['Hingga 5 anggota', 'Koleksi bersama', 'Belanja bersama'],
    features: ['Semua fitur Dapur Plus', 'Hingga 5 anggota keluarga', 'Koleksi resep bersama', 'Daftar belanja bersama'],
    seats: 'hingga 5 anggota',
  },
}

export const PAID_PLANS: PaidPlanId[] = ['plus', 'keluarga']
export const PERIODS: Period[] = ['bulanan', 'tahunan']

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; wallet: boolean }[] = [
  { id: 'qris', label: 'QRIS', wallet: false },
  { id: 'gopay', label: 'GoPay', wallet: true },
  { id: 'ovo', label: 'OVO', wallet: true },
  { id: 'dana', label: 'DANA', wallet: true },
  { id: 'kartu', label: 'Kartu', wallet: false },
]

/** Promo codes the simulation accepts, as a percentage off the first payment. */
const PROMO_CODES: Record<string, number> = { DAPURBARU: 10 }

export interface Checkout {
  plan: PaidPlanId
  period: Period
  method: PaymentMethod
  /** Normalised code the user typed, valid or not. */
  promoCode: string
  promoPercent: number
}

function pick<value extends string>(raw: unknown, allowed: readonly value[], fallback: value): value {
  return allowed.find((option) => option === raw) ?? fallback
}

/** Reads a checkout from query or form values, falling back to Dapur Plus, yearly, GoPay. */
export function parseCheckout(values: { get(name: string): unknown }): Checkout {
  let promoCode = String(values.get('promo') ?? '').trim().toUpperCase().slice(0, 32)
  return {
    plan: pick(values.get('paket'), PAID_PLANS, 'plus'),
    period: pick(values.get('periode'), PERIODS, 'tahunan'),
    method: pick(values.get('metode'), PAYMENT_METHODS.map((m) => m.id), 'gopay'),
    promoCode,
    promoPercent: PROMO_CODES[promoCode] ?? 0,
  }
}

/** Query string carrying a checkout to the next step. */
export function checkoutQuery(checkout: Checkout, extra: Record<string, string> = {}): string {
  let params = new URLSearchParams({ paket: checkout.plan, periode: checkout.period, metode: checkout.method })
  if (checkout.promoPercent > 0) params.set('promo', checkout.promoCode)
  for (let [key, value] of Object.entries(extra)) params.set(key, value)
  return params.toString()
}

export interface Quote {
  subtotal: number
  discount: number
  total: number
  /** Yearly price spread over 12 months ("Setara Rp24.167/bulan"). */
  perMonth: number
}

export function quote(plan: PaidPlanId, period: Period, promoPercent = 0): Quote {
  let subtotal = period === 'tahunan' ? PLANS[plan].yearly : PLANS[plan].monthly
  let discount = Math.round((subtotal * promoPercent) / 100)
  return { subtotal, discount, total: subtotal - discount, perMonth: Math.round(PLANS[plan].yearly / 12) }
}

/** Whole-percent saving of yearly over twelve monthly payments (17 for 10× monthly). */
export function yearlySaving(plan: PaidPlanId): number {
  let { monthly, yearly } = PLANS[plan]
  return Math.round((1 - yearly / (monthly * 12)) * 100)
}

export function renewalDate(period: Period, from: Date = new Date()): Date {
  let next = new Date(from)
  if (period === 'tahunan') next.setFullYear(next.getFullYear() + 1)
  else next.setMonth(next.getMonth() + 1)
  return next
}

export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat('id-ID').format(amount)}`
}

/** Indonesian mobile number without the +62/0 prefix: 8xx, 9–12 digits. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s-]/g, '').replace(/^\+?62/, '').replace(/^0/, '')
  return /^8\d{8,11}$/.test(digits) ? digits : null
}

export function formatPhone(digits: string): string {
  return `+62 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`.trim()
}

export interface PaymentErrors {
  phone?: string
  promo?: string
  terms?: string
}

/** Server-side checks before the simulated payment starts. */
export function validatePayment(
  checkout: Checkout,
  input: { phone: string; acceptedTerms: boolean },
): { ok: true; phone: string | null } | { ok: false; errors: PaymentErrors } {
  let errors: PaymentErrors = {}
  let wallet = PAYMENT_METHODS.find((m) => m.id === checkout.method)?.wallet ?? false
  let phone = wallet ? normalizePhone(input.phone) : null
  if (wallet && !phone) errors.phone = 'Masukkan nomor HP yang valid, misalnya 812 3456 7890.'
  if (checkout.promoCode && checkout.promoPercent === 0) errors.promo = 'Kode promo tidak dikenal.'
  if (!input.acceptedTerms) errors.terms = 'Setujui Syarat & Ketentuan dan Kebijakan Privasi untuk melanjutkan.'
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, phone }
}
