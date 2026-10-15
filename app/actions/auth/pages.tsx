import type { Handle, RemixNode } from 'remix/component'

import { routes } from '../../routes.ts'
import { authErrorMessage } from '../../data/auth-provider.ts'
import { Document } from '../../ui/document.tsx'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { CsrfField, Logo } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { PasswordInput } from './public/password-input.tsx'
import { UsernameInput } from './public/username-input.tsx'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { inputClass } from '../../ui/input.tsx'
import { Field, fieldAttrs, labelClass } from '../../ui/label.tsx'
import type { RegistrationInput } from '../../domain/validation.ts'
import { cn, pageX } from '../../ui/utils.ts'

const headingClass = 'text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink lg:text-[52px] lg:leading-[57px] lg:tracking-[-0.52px]'
const leadClass = 'text-sm leading-[21px] tracking-[0.28px] text-muted lg:text-base lg:leading-6 lg:tracking-[0.32px]'
/** Design inputs: 15px text on mobile, 14px on desktop. */
const authInputClass = 'text-[15px] tracking-[0.28px] lg:text-sm'

type AuthPanel = 'login' | 'register'

function AuthShell(
  handle: Handle<{
    title: string
    prompt: string
    linkLabel: string
    linkHref: string
    /** Decorative feature panel shown beside the form on large screens. */
    panel?: AuthPanel
    children?: RemixNode
  }>,
) {
  return () => {
    let { title, prompt, linkLabel, linkHref, panel, children } = handle.props
    return (
      <Document title={title} bodyClass="bg-bg">
        <div class="flex min-h-dvh flex-col">
          <header class={cn(pageX, 'flex h-[60px] shrink-0 items-center justify-between lg:h-[72px]')}>
            <Logo />
            <p class="hidden text-sm tracking-[0.26px] text-muted sm:block">
              {prompt}{' '}
              <a href={linkHref} class="font-medium text-ink hover:underline">
                {linkLabel}
              </a>
            </p>
            <a
              href={routes.home.href()}
              class="flex size-10 items-center justify-center rounded-full hover:bg-hover sm:hidden"
              aria-label="Tutup"
            >
              <Icon name="x" size={20} />
            </a>
          </header>
          {/* Same container as the landing page (pageX: 120px margins, 1200px content at 1440).
              Desktop: the 428px form on the left, the feature panel on the right. */}
          <main
            id="konten"
            class={cn(
              pageX,
              'flex flex-1 flex-col pt-8 pb-6 lg:pt-2 lg:pb-10',
              panel && 'lg:grid lg:grid-cols-[minmax(0,428px)_minmax(0,668px)] lg:justify-between lg:gap-12',
            )}
          >
            <div class="flex flex-1 flex-col items-center lg:items-stretch lg:justify-center">
              <div class="flex w-full max-w-[428px] flex-1 flex-col lg:flex-none">{children}</div>
            </div>
            {panel === 'login' && <LoginPanel />}
            {panel === 'register' && <RegisterPanel />}
          </main>
          <footer class={cn(pageX, 'hidden justify-between gap-2 pb-8 text-xs tracking-[0.26px] text-faint lg:flex')}>
            <p>© 2026 AnyamanRasa</p>
            <p>
              <a href={routes.legal.privacy.href()} class="hover:text-ink">
                Kebijakan Privasi
              </a>
              {' · '}
              <a href={routes.legal.terms.href()} class="hover:text-ink">
                Ketentuan Layanan
              </a>
            </p>
          </footer>
        </div>
      </Document>
    )
  }
}

const floatCard = 'absolute rounded-md shadow-[0_16px_40px_#3E2F281F]'

/** Login feature panel: a decorative collage of what members can do (pantry search, variations). */
function LoginPanel() {
  return () => (
    <aside class="hidden min-w-0 flex-col justify-center gap-8 self-center overflow-hidden rounded-lg bg-[linear-gradient(#FFFFFF59,#FFFFFF59),linear-gradient(-137deg,var(--color-peach)_0.5%,var(--color-coral)_28%,#EBCFC0_52%,#F3E6D8_76%,var(--color-sand)_99.5%)] p-12 lg:flex">
      <div class="relative h-[330px] w-full max-w-[572px] shrink-0" aria-hidden="true">
        <div class={cn(floatCard, 'top-[18px] left-[15px] z-0 w-[270px] origin-top-left rotate-3 overflow-hidden bg-bg')}>
          <div class="relative flex h-[180px] items-start bg-accent-subtle p-3.5">
            <img src="/images/generated-2.webp" alt="" class="absolute inset-0 size-full scale-110 object-contain" />
            <span class="relative inline-flex items-center gap-1.5 rounded-full bg-surface-dark px-2.5 py-1 text-xs tracking-[0.24px] text-white">
              <span class="size-1.5 rounded-full bg-accent" />
              Resep asli
            </span>
          </div>
          <div class="flex flex-col gap-1.5 px-[18px] pt-4 pb-[18px]">
            <p class="text-[19px] leading-[23px] tracking-[-0.19px] text-ink">Rendang Sapi Padang</p>
            <div class="flex items-center gap-3 text-[13px] tracking-[0.26px] text-muted">
              <span class="inline-flex items-center gap-[5px]">
                <Icon name="clock-3" size={14} />
                4 jam
              </span>
              <span class="inline-flex items-center gap-[5px]">
                <Icon name="git-branch" size={14} />3 variasi
              </span>
            </div>
          </div>
        </div>
        <div class={cn(floatCard, 'top-2 left-[250px] z-[1] flex w-[322px] flex-col gap-4 bg-surface-dark p-6')}>
          <p class="flex items-center gap-2 text-[13px] tracking-[0.26px] text-sand">
            <Icon name="refrigerator" size={16} />
            Cari dari isi dapur
          </p>
          <p class="text-[26px] leading-[29px] tracking-[-0.26px] text-white">12 resep cocok dengan bahanmu</p>
          <div class="flex gap-2">
            {['bawang merah', 'cabai', 'serai'].map((name) => (
              <span key={name} class="flex-1 rounded-sm bg-white/8 px-3 py-2.5 text-xs tracking-[0.24px] whitespace-nowrap text-sand">
                {name}
              </span>
            ))}
          </div>
          <p class="text-[13px] tracking-[0.26px] text-white/70">Tambah bahan, lihat yang bisa dimasak</p>
        </div>
        <div class={cn(floatCard, 'top-[242px] left-[242px] z-[2] flex w-[330px] items-center gap-3.5 bg-bg py-3.5 pr-3.5 pl-[18px]')}>
          <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-strong">
            <Icon name="git-branch" size={18} />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="text-[15px] font-medium text-ink">Rendang Ayam Kampung</span>
            <span class="text-[13px] tracking-[0.26px] text-muted">Variasi dari Rendang Sapi</span>
          </span>
          <span class="rounded-sm border border-outline px-3.5 py-[7px] text-[13px] text-ink">Lihat</span>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <p class="text-sm font-medium tracking-[0.28px] text-accent-strong">Resep · Bahan · Variasi</p>
        <p class="text-[44px] leading-[46px] tracking-[-0.44px] text-ink">Masak bareng, belajar bareng, berbagi rasa.</p>
        <p class="max-w-[440px] text-[17px] leading-[26px] tracking-[0.34px] text-ink">
          Simpan resep favorit, tulis resepmu sendiri, dan buat variasi dari resep yang kamu suka.
        </p>
        <div class="flex items-center gap-3.5 pt-3">
          <div class="flex -space-x-1.5" aria-hidden="true">
            {[
              ['SW', 'bg-accent text-white'],
              ['RA', 'bg-surface-dark text-white'],
              ['BS', 'bg-sand text-surface-dark'],
              ['AL', 'bg-accent-strong text-white'],
            ].map(([label, tone]) => (
              <span key={label} class={cn('flex size-9 items-center justify-center rounded-full text-xs font-medium ring-1 ring-white', tone)}>
                {label}
              </span>
            ))}
          </div>
          <p class="text-sm leading-5 tracking-[0.28px] text-ink">
            Bergabung dengan juru masak rumahan
            <br />
            dari seluruh Indonesia
          </p>
        </div>
      </div>
    </aside>
  )
}

/** Register feature panel: dark card with a decorative activity collage. */
function RegisterPanel() {
  return () => (
    <aside class="hidden min-w-0 flex-col justify-center gap-8 self-center overflow-hidden rounded-lg bg-surface-dark bg-[radial-gradient(ellipse_65%_40%_at_50%_32%,#D2693F59_0%,#D2693F00_100%)] p-12 lg:flex">
      <div class="relative h-[430px] w-full max-w-[572px] shrink-0" aria-hidden="true">
        <div class={cn(floatCard, 'top-3.5 left-[120px] z-0 h-[380px] w-[300px] origin-top-left rotate-3 overflow-hidden bg-[linear-gradient(160deg,var(--color-peach),var(--color-coral))]')}>
          <img src="/images/generated-2.webp" alt="" class="size-full scale-125 object-contain" />
        </div>
        <Activity class="top-[72px] left-[303px] z-[1]" initials="RA" tone="bg-accent text-white" name="Rina" action="menyimpan Rendang Sapi" icon="bookmark" tag="Simpan resep" time="baru saja" />
        <Activity class="top-[316px] left-0 z-[2]" initials="DP" tone="bg-sand text-surface-dark" name="Dimas" action="menulis resep Ayam Taliwang" icon="pencil" tag="Tulis resep" time="1 mnt lalu" />
      </div>
      <div class="flex flex-col gap-4">
        <p class="text-sm font-medium tracking-[0.28px] text-sand">Gratis untuk semua juru masak</p>
        <p class="text-[48px] leading-[53px] tracking-[-0.48px] text-white">
          Tulis resep. Buat variasi.
          <span class="block text-[#F3E6D8]">Rayakan rasa bersama.</span>
        </p>
        <p class="max-w-[440px] text-[17px] leading-[26px] tracking-[0.34px] text-faint">
          Bergabung dengan juru masak rumahan dari seluruh Nusantara yang saling berbagi resep dan variasinya.
        </p>
      </div>
    </aside>
  )
}

function Activity(
  handle: Handle<{ class: string; initials: string; tone: string; name: string; action: string; icon: 'bookmark' | 'pencil'; tag: string; time: string }>,
) {
  return () => {
    let p = handle.props
    return (
      <div class={cn(floatCard, 'flex items-center gap-3 bg-bg py-3 pr-[18px] pl-3', p.class)}>
        <span class={cn('flex size-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-medium', p.tone)}>{p.initials}</span>
        <span class="flex flex-col gap-[3px]">
          <span class="text-sm whitespace-nowrap text-ink">
            <span class="font-medium">{p.name}</span> {p.action}
          </span>
          <span class="flex items-center gap-1.5 text-xs tracking-[0.24px]">
            <Icon name={p.icon} size={12} class="text-accent-strong" />
            <span class="text-accent-strong">{p.tag}</span>
            <span class="text-muted">· {p.time}</span>
          </span>
        </span>
      </div>
    )
  }
}

/**
 * Google sign-in: a separate POST form (CSRF-protected) that starts the Supabase OAuth flow.
 * `data-rmx-document` makes it a full-page submit: client-side navigation fetches forms, and a
 * fetch cannot follow the redirect to Supabase/Google on another origin (it fell back to a GET
 * of this POST-only route, "Method Not Allowed").
 */
function GoogleButton(handle: Handle<{ shell: Shell; label: string; redirectTo?: string }>) {
  return () => (
    <form method="post" action={routes.auth.google.href()} data-rmx-document>
      <CsrfField token={handle.props.shell.csrfToken} />
      {handle.props.redirectTo && <input type="hidden" name="ke" value={handle.props.redirectTo} />}
      <Button type="submit" variant="outline" class="h-12 w-full gap-3 text-[15px]">
        <GoogleMark />
        {handle.props.label}
      </Button>
    </form>
  )
}

function GoogleMark() {
  return () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function Divider() {
  return () => (
    <div class="flex items-center gap-3.5 text-[13px] tracking-[0.26px] text-muted" role="separator" aria-label="atau">
      <span class="h-px flex-1 bg-line" />
      atau masuk dengan email
      <span class="h-px flex-1 bg-line" />
    </div>
  )
}

/** A message at the top of an auth form (pen.dev 12g/12h); with a title, the message reads as its detail. */
function FormAlert(handle: Handle<{ message: string; title?: string; tone?: 'error' | 'info' }>) {
  return () => {
    let { message, title, tone = 'error' } = handle.props
    return (
      <div
        role={tone === 'info' ? 'status' : 'alert'}
        class={cn(
          'flex items-start gap-2.5 rounded-md px-4 py-3.5 text-[13px] leading-5 tracking-[0.26px]',
          tone === 'info' ? 'bg-accent-subtle text-accent-strong' : 'bg-error-subtle text-error',
        )}
      >
        <Icon name={tone === 'info' ? 'circle-check' : 'circle-alert'} size={16} class="mt-0.5" />
        {title ? (
          <div class="flex flex-col gap-1">
            <p class="text-sm font-medium">{title}</p>
            <p class="text-ink">{message}</p>
          </div>
        ) : (
          <p class={tone === 'error' ? 'text-ink' : undefined}>{message}</p>
        )}
      </div>
    )
  }
}

export interface LoginPageProps {
  shell: Shell
  redirectTo: string
  values?: { email: string }
  errors?: { email?: string; password?: string; form?: string; formTitle?: string }
  notice?: string
}

export function LoginPage(handle: Handle<LoginPageProps>) {
  return () => {
    let { shell, redirectTo, values, errors = {}, notice } = handle.props
    return (
      <AuthShell
        title="Masuk"
        prompt="Belum punya akun?"
        linkLabel="Daftar"
        linkHref={routes.auth.register.index.href()}
        panel="login"
      >
        <div class="flex flex-1 flex-col gap-7 lg:gap-8">
          <div class="flex flex-col gap-2 lg:gap-3.5">
            <h1 class={headingClass}>Selamat datang kembali</h1>
            <p class={leadClass}>
              <span class="lg:hidden">Masuk untuk menulis resep dan membuat variasi.</span>
              <span class="hidden lg:inline">Masuk untuk menulis resep, membuat variasi, dan menyimpan temuanmu.</span>
            </p>
          </div>
          {notice && <FormAlert message={notice} tone="info" />}
          {errors.form && <FormAlert title={errors.formTitle} message={errors.form} />}
          <GoogleButton shell={shell} label="Masuk dengan Google" redirectTo={redirectTo} />
          <Divider />
          <form method="post" action={routes.auth.login.action.href()} class="flex flex-1 flex-col gap-7 lg:gap-8" novalidate>
            <CsrfField token={shell.csrfToken} />
            {redirectTo && <input type="hidden" name="ke" value={redirectTo} />}
            <div class="flex flex-col gap-[18px]">
              {/* Labelled "Email" per the design; the server also accepts a username here. */}
              <Field id="email" label="Email" error={errors.email}>
                <input
                  {...fieldAttrs('email', errors.email)}
                  type="text"
                  autocomplete="username"
                  autocapitalize="none"
                  required
                  defaultValue={values?.email ?? ''}
                  class={cn(inputClass, authInputClass, 'h-12')}
                />
              </Field>
              <Field id="password" label="Kata sandi" error={errors.password}>
                <PasswordInput id="password" name="password" autocomplete="current-password" invalid={Boolean(errors.password)} placeholder="Masukkan kata sandi" inputClass="h-12" />
              </Field>
            </div>
            <div class="mt-auto flex flex-col gap-4 lg:mt-0 lg:gap-8">
              <Button type="submit" variant="default" class="h-[52px] text-[15px] lg:h-12">
                Masuk
              </Button>
              <p class="text-center text-sm tracking-[0.28px] text-muted lg:hidden">
                Belum punya akun?{' '}
                <a href={routes.auth.register.index.href()} class="font-medium text-ink hover:underline">
                  Daftar
                </a>
              </p>
              <p class="hidden pt-1 text-center text-[13px] tracking-[0.26px] text-muted lg:block">
                Baru di AnyamanRasa?{' '}
                <a href={routes.auth.register.index.href()} class="font-medium text-ink hover:underline">
                  Buat akun gratis
                </a>
              </p>
            </div>
          </form>
        </div>
      </AuthShell>
    )
  }
}

export interface RegisterPageProps {
  shell: Shell
  /** `methods`: choose Google or email (10b). `email`: the email sign-up form (10c). */
  step?: 'methods' | 'email'
  values?: { username: string; email: string }
  errors?: { username?: string; email?: string; password?: string; confirm?: string; form?: string }
}

/** Sign-up form step, linked from the methods step (`/daftar?cara=email`). */
export const registerEmailHref = `${routes.auth.register.index.href()}?cara=email`

const termsClass = 'text-xs leading-[18px] tracking-[0.24px] text-muted'

export function RegisterPage(handle: Handle<RegisterPageProps>) {
  return () => {
    let { shell, step = 'methods' } = handle.props
    return (
      <AuthShell
        title={step === 'email' ? 'Daftar dengan email' : 'Daftar'}
        prompt="Sudah punya akun?"
        linkLabel="Masuk"
        linkHref={routes.auth.login.index.href()}
        panel="register"
      >
        {step === 'email' ? (
          <RegisterEmailForm shell={shell} values={handle.props.values} errors={handle.props.errors} />
        ) : (
          <RegisterMethods shell={shell} error={handle.props.errors?.form} />
        )}
      </AuthShell>
    )
  }
}

function RegisterMethods(handle: Handle<{ shell: Shell; error?: string }>) {
  return () => (
    <div class="flex flex-1 flex-col gap-8">
      <div class="flex flex-col gap-2 lg:gap-3.5">
        <h1 class={headingClass}>Buat akun AnyamanRasa</h1>
        <p class={leadClass}>Gratis. Simpan resep favorit, tulis resepmu sendiri, dan buat variasi.</p>
      </div>
      {handle.props.error && <FormAlert message={handle.props.error} />}
      <div class="flex flex-col gap-3">
        <GoogleButton shell={handle.props.shell} label="Daftar dengan Google" />
        <ButtonLink href={registerEmailHref} variant="outline" class="h-12 w-full gap-2.5 text-[15px] font-medium">
          <Icon name="mail" size={18} />
          Daftar dengan email
        </ButtonLink>
      </div>
      <div class="mt-auto flex flex-col gap-8 lg:mt-0">
        <p class={cn(termsClass, 'text-center')}>
          Sebelum akun dibuat, kamu akan diminta meninjau <LegalLink to="terms" /> dan <LegalLink to="privacy" />.
        </p>
        <p class="pt-1 text-center text-[13px] tracking-[0.26px] text-muted">
          Sudah punya akun?{' '}
          <a href={routes.auth.login.index.href()} class="font-medium text-ink hover:underline">
            Masuk
          </a>
        </p>
      </div>
    </div>
  )
}

function RegisterEmailForm(handle: Handle<Pick<RegisterPageProps, 'shell' | 'values' | 'errors'>>) {
  return () => {
    let { shell, values, errors = {} } = handle.props
    let fieldErrorCount = [errors.username, errors.email, errors.password, errors.confirm].filter(Boolean).length
    let emailTaken = errors.email === authErrorMessage('email-taken')
    return (
      <div class="flex flex-col gap-7">
        <a
          href={routes.auth.register.index.href()}
          class="flex items-center gap-1.5 self-start text-[13px] font-medium tracking-[0.26px] text-muted hover:text-ink"
        >
          <Icon name="arrow-left" />
          Pilihan daftar lainnya
        </a>
        <div class="flex flex-col gap-2 lg:gap-3.5">
          <h1 class={headingClass}>Daftar dengan email</h1>
          <p class={leadClass}>Isi data di bawah untuk membuat akun AnyamanRasa-mu.</p>
        </div>
        {errors.form ? (
          <FormAlert message={errors.form} />
        ) : (
          fieldErrorCount > 0 && (
            <FormAlert
              message={
                fieldErrorCount === 1
                  ? 'Ada 1 hal yang perlu diperbaiki sebelum akunmu dibuat.'
                  : `Ada ${fieldErrorCount} hal yang perlu diperbaiki sebelum akunmu dibuat.`
              }
            />
          )
        )}
        <form method="post" action={routes.auth.register.action.href()} class="flex flex-col gap-7" novalidate>
          <CsrfField token={shell.csrfToken} />
          <div class="flex flex-col gap-[18px]">
            <div class="flex flex-col gap-1.5">
              <label for="username" class={labelClass}>
                Nama pengguna
              </label>
              <UsernameInput id="username" value={values?.username ?? ''} error={errors.username} />
            </div>
            <Field id="email" label="Email" error={errors.email}>
              <input
                {...fieldAttrs('email', errors.email)}
                type="email"
                autocomplete="email"
                required
                defaultValue={values?.email ?? ''}
                class={cn(inputClass, authInputClass, 'h-12 lg:h-11')}
              />
              {emailTaken && (
                <a
                  href={`${routes.auth.login.index.href()}?${new URLSearchParams({ email: values?.email ?? '' })}`}
                  class="flex items-center gap-1 self-start pt-1 text-[13px] font-medium tracking-[0.26px] text-accent-strong hover:underline"
                >
                  Masuk dengan email ini
                  <Icon name="arrow-right" size={14} />
                </a>
              )}
            </Field>
            <div class="flex flex-col gap-1.5" data-invalid={errors.password ? 'true' : undefined}>
              <label for="password" class={labelClass}>
                Kata sandi
              </label>
              <PasswordInput
                id="password"
                name="password"
                autocomplete="new-password"
                invalid={Boolean(errors.password)}
                help="Minimal 8 karakter, kombinasi huruf dan angka."
                error={errors.password}
                meter
                inputClass="h-12 lg:h-11"
              />
            </div>
            <Field id="confirm" label="Konfirmasi kata sandi" error={errors.confirm}>
              <PasswordInput id="confirm" name="confirm" autocomplete="new-password" invalid={Boolean(errors.confirm)} inputClass="h-12 lg:h-11" />
            </Field>
          </div>
          <Button type="submit" variant="default" class="h-[52px] text-[15px] lg:h-12">
            Lanjut
          </Button>
          <p class={termsClass}>Langkah 1 dari 2 · Berikutnya kamu akan meninjau ketentuan dan kebijakan privasi.</p>
        </form>
      </div>
    )
  }
}

function LegalLink(handle: Handle<{ to: 'terms' | 'privacy' }>) {
  return () => (
    <a href={routes.legal[handle.props.to].href()} class="text-ink underline-offset-2 hover:underline">
      {handle.props.to === 'terms' ? 'Syarat & Ketentuan' : 'Kebijakan Privasi'}
    </a>
  )
}

const CONSENT_POINTS: { icon: IconName; text: string }[] = [
  { icon: 'shield-check', text: 'Kami tidak pernah menjual datamu.' },
  { icon: 'chef-hat', text: 'Resepmu tetap milikmu. Orang lain boleh membuat variasi dengan mencantumkan sumber.' },
  { icon: 'refrigerator', text: 'Isi dapurmu hanya dipakai untuk mencarikan resep yang cocok.' },
  { icon: 'mail', text: 'Ingin akunmu dihapus? Kirim permintaan lewat email kapan saja.' },
]

export interface ConsentPageProps {
  shell: Shell
  /** Email sign-up: the checked form values, carried as hidden fields to the final submit. */
  account?: RegistrationInput
  /** Google sign-up: the identity waiting in the session. */
  google?: { email: string }
  error?: string
}

/** pen.dev 10d: step 2 of sign-up. The account is created only after the required boxes are ticked. */
export function ConsentPage(handle: Handle<ConsentPageProps>) {
  return () => {
    let { shell, account, google, error } = handle.props
    let boxes: { name: string; label: RemixNode; read?: 'terms' | 'privacy' }[] = [
      { name: 'setuju_syarat', label: 'Saya menyetujui Syarat & Ketentuan', read: 'terms' },
      { name: 'setuju_privasi', label: 'Saya menyetujui Kebijakan Privasi dan pemrosesan data sesuai UU PDP', read: 'privacy' },
      { name: 'usia', label: 'Saya berusia 13 tahun atau lebih' },
    ]
    let backClass = 'flex items-center gap-1.5 self-start text-[13px] font-medium tracking-[0.26px] text-muted hover:text-ink'
    return (
      <AuthShell
        title="Setujui ketentuan"
        prompt="Sudah punya akun?"
        linkLabel="Masuk"
        linkHref={routes.auth.login.index.href()}
        panel="register"
      >
        <form
          method="post"
          action={account ? routes.auth.register.action.href() : routes.auth.consent.action.href()}
          class="flex flex-1 flex-col gap-7"
          novalidate
        >
          <CsrfField token={shell.csrfToken} />
          {account && (
            <>
              <input type="hidden" name="username" value={account.username} />
              <input type="hidden" name="email" value={account.email} />
              <input type="hidden" name="password" value={account.password} />
              <input type="hidden" name="confirm" value={account.password} />
              <button type="submit" name="langkah" value="data" formNoValidate class={backClass}>
                <Icon name="arrow-left" />
                Kembali ke data akun
              </button>
            </>
          )}
          {google && (
            <a href={routes.auth.register.index.href()} class={backClass}>
              <Icon name="arrow-left" />
              Pilihan daftar lainnya
            </a>
          )}
          <div class="flex flex-col gap-3">
            <p class="flex items-center gap-2.5 text-xs tracking-[0.24px] text-muted">
              <span class="flex gap-1.5" aria-hidden="true">
                <span class="h-[3px] w-6 rounded-full bg-accent" />
                <span class="h-[3px] w-6 rounded-full bg-accent" />
              </span>
              Langkah 2 dari 2
            </p>
            <h1 class={headingClass}>Satu langkah lagi</h1>
            <p class={leadClass}>
              {google ? (
                <>
                  Sebelum akun untuk <span class="text-ink">{google.email}</span> dibuat, baca ringkasan singkat ini dan setujui
                  ketentuan kami.
                </>
              ) : (
                'Sebelum akunmu dibuat, baca ringkasan singkat ini dan setujui ketentuan kami.'
              )}
            </p>
          </div>
          <div class="flex flex-col gap-3 rounded-md bg-[linear-gradient(135deg,var(--color-accent-subtle),var(--color-subtle))] p-5">
            <p class="flex items-center gap-2 text-[13px] font-medium tracking-[0.26px] text-accent-strong">
              <Icon name="sparkles" size={15} />
              Ringkasnya
            </p>
            <ul class="flex flex-col gap-2.5">
              {CONSENT_POINTS.map((point) => (
                <li key={point.text} class="flex gap-3 text-[13px] leading-5 tracking-[0.26px] text-ink">
                  <Icon name={point.icon} size={15} class="mt-0.5 shrink-0 text-muted" />
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
          {error && <FormAlert message={error} />}
          <fieldset class="flex flex-col gap-2">
            <legend class="sr-only">Persetujuan</legend>
            {boxes.map((box) => (
              <div
                key={box.name}
                class={cn(
                  'flex items-center gap-3 rounded-md px-3.5 py-3 transition-colors has-checked:bg-subtle',
                  error ? 'bg-error-subtle' : 'bg-subtle',
                )}
              >
                <input
                  id={box.name}
                  type="checkbox"
                  name={box.name}
                  value="1"
                  required
                  aria-invalid={error ? 'true' : undefined}
                  class="size-5 shrink-0 cursor-pointer rounded-xs accent-accent"
                />
                <label for={box.name} class="flex-1 cursor-pointer text-[13px] leading-5 tracking-[0.26px] text-ink">
                  {box.label}
                </label>
                {box.read && (
                  <a
                    href={routes.legal[box.read].href()}
                    target="_blank"
                    class="text-xs font-medium tracking-[0.24px] text-accent-strong hover:underline"
                  >
                    Baca
                    <span class="sr-only"> {box.read === 'terms' ? 'Syarat & Ketentuan' : 'Kebijakan Privasi'} (tab baru)</span>
                  </a>
                )}
              </div>
            ))}
          </fieldset>
          <div class="mt-auto flex flex-col gap-4 lg:mt-0">
            <Button type="submit" name="langkah" value="ketentuan" variant="default" class="h-[52px] text-[15px] lg:h-12">
              <Icon name="check" />
              Setuju &amp; buat akun
            </Button>
            <a href={routes.home.href()} class="text-center text-sm tracking-[0.28px] text-muted hover:text-ink lg:hidden">
              Batal
            </a>
          </div>
        </form>
      </AuthShell>
    )
  }
}

export function CheckEmailPage(handle: Handle<{ shell: Shell; email: string }>) {
  return () => (
    <AuthShell title="Cek email" prompt="Sudah konfirmasi?" linkLabel="Masuk" linkHref={routes.auth.login.index.href()}>
      <div class="flex flex-col items-start gap-5">
        <span class="flex size-11 items-center justify-center rounded-md bg-accent-subtle text-accent-strong">
          <Icon name="circle-check" size={20} />
        </span>
        <h1 class={headingClass}>Cek emailmu</h1>
        <p class={leadClass}>
          Kami mengirim tautan konfirmasi ke <span class="font-medium text-ink">{handle.props.email}</span>. Buka
          tautan itu, lalu masuk untuk mulai menulis resep.
        </p>
        <ButtonLink href={routes.auth.login.index.href()} variant="default" class="h-12 w-full text-[15px]">
          Ke halaman masuk
        </ButtonLink>
      </div>
    </AuthShell>
  )
}
