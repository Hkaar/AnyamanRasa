// Input validation shared by server actions (authoritative) and browser hints.
// Messages are user-facing Bahasa Indonesia.

export type FieldErrors<field extends string> = Partial<Record<field, string>>

export type ValidationResult<value, field extends string> =
  | { ok: true; value: value }
  | { ok: false; errors: FieldErrors<field> }

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function text(value: FormDataEntryValue | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Nama pengguna wajib diisi.'
  if (!USERNAME_PATTERN.test(username)) {
    return '3–30 karakter: huruf kecil, angka, atau garis bawah.'
  }
  return null
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email wajib diisi.'
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) return 'Format email tidak valid.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Kata sandi wajib diisi.'
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Minimal 8 karakter, kombinasi huruf dan angka.'
  }
  if (password.length > 128) return 'Kata sandi terlalu panjang.'
  return null
}

/** 0–4 bars for the sign-up strength meter. */
export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++
  if (password.length >= 12 || /[^a-zA-Z0-9]/.test(password)) score++
  let labels = ['Sangat lemah', 'Lemah', 'Cukup', 'Baik', 'Kuat']
  return { score, label: labels[score]! }
}

export interface RegistrationInput {
  username: string
  email: string
  password: string
}

type RegistrationField = 'username' | 'email' | 'password' | 'confirm'

export function validateRegistration(
  form: FormData,
): ValidationResult<RegistrationInput, RegistrationField> {
  let username = text(form.get('username')).toLowerCase()
  let email = text(form.get('email')).toLowerCase()
  let password = typeof form.get('password') === 'string' ? (form.get('password') as string) : ''
  let confirm = typeof form.get('confirm') === 'string' ? (form.get('confirm') as string) : ''

  let errors: FieldErrors<RegistrationField> = {}
  let usernameError = validateUsername(username)
  let emailError = validateEmail(email)
  let passwordError = validatePassword(password)
  if (usernameError) errors.username = usernameError
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  if (!confirm) errors.confirm = 'Konfirmasi kata sandi wajib diisi.'
  else if (confirm !== password) errors.confirm = 'Konfirmasi kata sandi tidak sama.'

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { username, email, password } }
}
