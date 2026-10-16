// pen.dev 14a–14d: the simulated Dapur Plus checkout. Plan → payment → waiting → done; nothing is
// stored or charged, and every screen says so.
import type { Handle, RemixNode } from 'remix/component'

import {
  type Checkout,
  type PaymentErrors,
  type Period,
  PAID_PLANS,
  PAYMENT_METHODS,
  PERIODS,
  PLANS,
  checkoutQuery,
  formatRupiah,
  quote,
  renewalDate,
  yearlySaving,
} from '../../domain/subscription.ts'
import { routes } from '../../routes.ts'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { inputClass } from '../../ui/input.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { CsrfField } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { cn, pageX } from '../../ui/utils.ts'

const PERIOD_LABEL: Record<Period, string> = { bulanan: 'Bulanan', tahunan: 'Tahunan' }
const METHOD_ICON: Record<string, IconName> = {
  qris: 'qr-code',
  gopay: 'wallet',
  ovo: 'wallet',
  dana: 'wallet',
  kartu: 'credit-card',
}
const methodLabel = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id

const longDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const sectionTitle = 'text-xl leading-[1.2] tracking-[-0.2px] text-ink'
const sectionNote = 'text-[13px] tracking-[0.26px] text-muted'
/** Selectable tile: a cream fill that turns peach (or dark) when its radio is checked. */
const tileClass =
  'relative flex cursor-pointer rounded-md bg-subtle transition-colors hover:bg-hover has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink'

type Step = 1 | 2 | 3

function Steps(handle: Handle<{ current: Step; done?: boolean; class?: string }>) {
  return () => {
    let { current, done = false } = handle.props
    let labels = ['Paket', 'Pembayaran', 'Selesai']
    return (
      <ol class={cn('flex items-center', handle.props.class)} aria-label="Langkah berlangganan">
        {labels.map((label, index) => {
          let step = index + 1
          let complete = done || step < current
          let active = !done && step === current
          return (
            <li key={label} class="flex items-center">
              {index > 0 && <span class={cn('mx-1 h-0.5 w-3 rounded-full sm:mx-2 sm:w-8', step <= current || done ? 'bg-accent' : 'bg-pressed')} aria-hidden="true" />}
              <span
                aria-current={active ? 'step' : undefined}
                class={cn(
                  'flex items-center gap-1.5 rounded-full py-1.5 pr-2.5 pl-1.5 text-xs tracking-[0.24px] whitespace-nowrap sm:gap-2 sm:pr-3 sm:text-[13px] sm:tracking-[0.26px]',
                  active ? 'bg-accent-subtle font-medium text-accent-strong' : complete ? 'text-ink' : 'text-muted',
                )}
              >
                <span
                  class={cn(
                    'flex size-[22px] items-center justify-center rounded-full text-[11px]',
                    complete || active ? 'bg-accent text-white' : 'bg-hover text-muted',
                  )}
                >
                  {complete ? <Icon name="check" size={12} /> : step}
                </span>
                {label}
                {complete && <span class="sr-only">(selesai)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    )
  }
}

function RadioDot() {
  return () => (
    <span
      aria-hidden="true"
      class="flex size-5 shrink-0 items-center justify-center rounded-full bg-pressed transition-colors group-has-checked:bg-accent"
    >
      <span class="size-3.5 rounded-full bg-white transition-[width,height] group-has-checked:size-2" />
    </span>
  )
}

function CheckoutLayout(
  handle: Handle<{ shell: Shell; title: string; back: { href: string; label: string }; step: Step; summary: RemixNode; children?: RemixNode }>,
) {
  return () => {
    let { shell, title, back, step, summary, children } = handle.props
    return (
      <SiteLayout shell={shell} title={title}>
        <div class={cn(pageX, 'grid gap-10 pt-8 pb-16 lg:grid-cols-[minmax(0,700px)_420px] lg:justify-between lg:gap-12 lg:pt-14 lg:pb-[136px]')}>
          <div class="flex min-w-0 flex-col gap-10 lg:gap-12">
            <div class="flex flex-col gap-4 lg:gap-5">
              <a href={back.href} class="flex items-center gap-1.5 self-start text-[13px] tracking-[0.26px] text-muted hover:text-ink">
                <Icon name="arrow-left" size={14} />
                {back.label}
              </a>
              <h1 class="text-[28px] leading-[1.15] tracking-[-0.3px] text-ink lg:text-[48px] lg:tracking-[-0.96px]">{title}</h1>
              <Steps current={step} />
            </div>
            {children}
          </div>
          <div class="hidden lg:sticky lg:top-[104px] lg:block lg:self-start">{summary}</div>
        </div>
      </SiteLayout>
    )
  }
}

/** Phones (pen.dev 14a/14b mobile): a compact total that opens into the full order summary. */
function MobileTotal(handle: Handle<{ checkout: Checkout; withPromo: boolean }>) {
  return () => {
    let { checkout, withPromo } = handle.props
    let plan = PLANS[checkout.plan]
    let price = quote(checkout.plan, checkout.period, withPromo ? checkout.promoPercent : 0)
    let label = withPromo && price.discount > 0 ? `Total · setelah promo ${checkout.promoCode}` : `${plan.name} · ${PERIOD_LABEL[checkout.period]}`
    return (
      <details class="group/total rounded-md bg-subtle lg:hidden">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span class="flex flex-col gap-0.5">
            <span class="text-xs tracking-[0.24px] text-muted">{label}</span>
            <span class="text-[22px] leading-tight tracking-[-0.22px] text-ink">{formatRupiah(price.total)}</span>
          </span>
          <span class="flex items-center gap-1 text-[13px] font-medium text-accent-strong">
            Lihat rincian
            <Icon name="chevron-down" size={14} class="transition-transform group-open/total:rotate-180" />
          </span>
        </summary>
        <div class="px-1 pb-1">
          <OrderSummary checkout={checkout} withPromo={withPromo} id="ringkasan-ponsel" />
        </div>
      </details>
    )
  }
}

function OrderSummary(handle: Handle<{ checkout: Checkout; withPromo: boolean; id?: string }>) {
  return () => {
    let { checkout, withPromo, id = 'ringkasan' } = handle.props
    let plan = PLANS[checkout.plan]
    let percent = withPromo ? checkout.promoPercent : 0
    let price = quote(checkout.plan, checkout.period, percent)
    let row = 'flex justify-between gap-4 text-sm tracking-[0.28px]'
    return (
      <aside aria-labelledby={id} class="flex flex-col gap-6 rounded-lg bg-subtle p-6 lg:p-8">
        <p id={id} class="text-[13px] tracking-[0.26px] text-muted">
          Ringkasan pesanan
        </p>
        <div class="flex items-center gap-3.5">
          <span class="flex size-12 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--color-peach),var(--color-pink)_60%,var(--color-lilac))] text-ink">
            <Icon name="chef-hat" size={20} />
          </span>
          <span class="flex flex-col gap-0.5">
            <span class="text-lg tracking-[-0.18px] text-ink">{plan.name}</span>
            <span class="text-[13px] tracking-[0.26px] text-muted">
              {PERIOD_LABEL[checkout.period]} · {plan.seats}
            </span>
          </span>
        </div>
        <ul class="flex flex-col gap-3 pb-4">
          {plan.features.map((feature) => (
            <li key={feature} class="flex items-center gap-3 text-sm tracking-[0.28px] text-ink">
              <Icon name="check" size={14} class="text-accent" />
              {feature}
            </li>
          ))}
        </ul>
        <div class="flex flex-col gap-3 border-t border-line pt-5">
          <p class={row}>
            <span class="text-muted">
              {plan.name} {PERIOD_LABEL[checkout.period]}
            </span>
            <span class="text-ink">{formatRupiah(price.subtotal)}</span>
          </p>
          {price.discount > 0 && (
            <p class={row}>
              <span class="text-muted">
                Promo {checkout.promoCode} ({percent}%)
              </span>
              <span class="text-accent-strong">−{formatRupiah(price.discount)}</span>
            </p>
          )}
          <p class={row}>
            <span class="text-muted">PPN 11%</span>
            <span class="text-muted">Termasuk</span>
          </p>
        </div>
        <div class="flex items-end justify-between gap-4 rounded-md bg-bg px-5 py-4">
          <span class="flex flex-col gap-1">
            <span class="text-[13px] tracking-[0.26px] text-muted">{withPromo ? 'Total hari ini' : 'Total'}</span>
            <span class="text-[11px] tracking-[0.22px] text-faint">Berikutnya {shortDate(renewalDate(checkout.period))}</span>
          </span>
          <span class="text-[28px] leading-none tracking-[-0.28px] text-ink">{formatRupiah(price.total)}</span>
        </div>
        <p class="flex gap-2.5 text-[13px] leading-5 tracking-[0.26px] text-muted">
          <Icon name="rotate-ccw" size={15} class="mt-0.5 shrink-0" />
          Batalkan dalam 7 hari pertama untuk pengembalian dana penuh. Setelahnya, langganan tetap aktif hingga akhir periode.
        </p>
      </aside>
    )
  }
}

function PeriodOptions(handle: Handle<{ checkout: Checkout }>) {
  return () => {
    let { checkout } = handle.props
    let plan = PLANS[checkout.plan]
    return (
      <fieldset class="flex flex-col gap-4">
        <div class="flex items-end justify-between gap-4">
          <legend class={sectionTitle}>Periode tagihan</legend>
          <span class={sectionNote}>Ganti kapan saja</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {PERIODS.map((period) => {
            let yearly = period === 'tahunan'
            return (
              <label key={period} class={cn(tileClass, 'group flex-col gap-3.5 p-5 has-checked:bg-accent-subtle')}>
                <input type="radio" name="periode" value={period} checked={checkout.period === period} class="sr-only" />
                <span class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-2.5 text-[15px] font-medium text-ink">
                    <RadioDot />
                    {PERIOD_LABEL[period]}
                  </span>
                  {yearly && (
                    <span class="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white">
                      Hemat {yearlySaving(checkout.plan)}%
                    </span>
                  )}
                </span>
                <span class="flex items-baseline gap-1.5">
                  <span class="text-[26px] leading-none tracking-[-0.26px] text-ink">
                    {formatRupiah(yearly ? plan.yearly : plan.monthly)}
                  </span>
                  <span class="text-xs text-muted">/{yearly ? 'tahun' : 'bulan'}</span>
                </span>
                <span class={cn('text-xs tracking-[0.24px]', yearly ? 'text-accent-strong' : 'text-muted')}>
                  {yearly ? `Setara ${formatRupiah(quote(checkout.plan, 'tahunan').perMonth)}/bulan` : 'Ditagih setiap bulan'}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }
}

/** pen.dev 14a. Changing a choice refreshes the summary (`data-autosubmit` on this GET form). */
export function PlanPage(handle: Handle<{ shell: Shell; checkout: Checkout }>) {
  return () => {
    let { shell, checkout } = handle.props
    return (
      <CheckoutLayout
        shell={shell}
        title="Pilih paket langgananmu"
        back={{ href: routes.home.href(), label: 'Kembali ke Beranda' }}
        step={1}
        summary={<OrderSummary checkout={checkout} withPromo={false} />}
      >
        <form method="get" action={routes.subscription.index.href()} data-autosubmit class="flex flex-col gap-10 lg:gap-12">
          <fieldset class="flex flex-col gap-4">
            <div class="flex items-end justify-between gap-4">
              <legend class={sectionTitle}>Paket</legend>
              <span class={sectionNote}>Harga sudah termasuk PPN</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-4 rounded-md bg-subtle p-5" aria-label="Gratis, paket saat ini">
                <span class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-2.5 text-[15px] font-medium text-ink">
                    <span class="size-5 rounded-full bg-pressed p-[3px]" aria-hidden="true">
                      <span class="block size-full rounded-full bg-white" />
                    </span>
                    Gratis
                  </span>
                  <span class="rounded-full bg-hover px-2.5 py-1 text-[11px] text-muted">Paket saat ini</span>
                </span>
                <PlanPrice amount={0} unit="selamanya" />
                <PlanBody plan="gratis" />
              </div>
              {PAID_PLANS.map((id) => (
                <label
                  key={id}
                  class={cn(
                    tileClass,
                    'group flex-col gap-4 p-5 has-checked:bg-surface-dark has-checked:text-white has-checked:hover:bg-surface-dark',
                  )}
                >
                  <input type="radio" name="paket" value={id} checked={checkout.plan === id} class="sr-only" />
                  <span class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-2.5 text-[15px] font-medium text-ink group-has-checked:text-white">
                      <RadioDot />
                      {PLANS[id].name}
                    </span>
                    {id === 'plus' && <span class="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white">Populer</span>}
                  </span>
                  <PlanPrice amount={PLANS[id].monthly} unit="bulan" />
                  <PlanBody plan={id} />
                </label>
              ))}
            </div>
          </fieldset>
          <PeriodOptions checkout={checkout} />
          <div class="flex flex-col gap-4">
            <MobileTotal checkout={checkout} withPromo={false} />
            <Button type="submit" formAction={routes.subscription.payment.index.href()} size="lg" class="h-[52px] w-full text-[15px] font-medium lg:h-[54px]">
              <Icon name="arrow-right" />
              Lanjut ke pembayaran
            </Button>
            <p class="text-center text-xs tracking-[0.24px] text-muted">
              Kamu belum akan ditagih di langkah ini. Batalkan kapan saja dari Pengaturan.
            </p>
          </div>
        </form>
      </CheckoutLayout>
    )
  }
}

function PlanPrice(handle: Handle<{ amount: number; unit: string }>) {
  return () => (
    <span class="flex items-baseline gap-1.5">
      <span class="text-[24px] leading-none tracking-[-0.24px] text-ink group-has-checked:text-white">{formatRupiah(handle.props.amount)}</span>
      <span class="text-[11px] text-muted group-has-checked:text-white/70">/{handle.props.unit}</span>
    </span>
  )
}

function PlanBody(handle: Handle<{ plan: keyof typeof PLANS }>) {
  return () => {
    let plan = PLANS[handle.props.plan]
    return (
      <>
        <span class="text-xs leading-[18px] tracking-[0.24px] text-muted group-has-checked:text-white/75">{plan.description}</span>
        <ul class="flex flex-col gap-2">
          {plan.highlights.map((item) => (
            <li key={item} class="flex items-center gap-2 text-xs tracking-[0.24px] text-ink group-has-checked:text-white">
              <Icon name="check" size={12} class="text-accent group-has-checked:text-white" />
              {item}
            </li>
          ))}
        </ul>
      </>
    )
  }
}

export interface PaymentPageProps {
  shell: Shell
  checkout: Checkout
  phone: string
  acceptedTerms: boolean
  errors?: PaymentErrors
}

/**
 * pen.dev 14b. One POST form: choosing a period or method re-posts it without `intent` to
 * refresh the summary; "Terapkan" checks the promo; the pay button validates and continues.
 */
export function PaymentPage(handle: Handle<PaymentPageProps>) {
  return () => {
    let { shell, checkout, phone, acceptedTerms, errors = {} } = handle.props
    let method = PAYMENT_METHODS.find((m) => m.id === checkout.method)!
    let price = quote(checkout.plan, checkout.period, checkout.promoPercent)
    let promoApplied = checkout.promoPercent > 0
    return (
      <CheckoutLayout
        shell={shell}
        title={`Berlangganan ${PLANS[checkout.plan].name}`}
        back={{ href: `${routes.subscription.index.href()}?${checkoutQuery(checkout)}`, label: 'Kembali ke paket' }}
        step={2}
        summary={<OrderSummary checkout={checkout} withPromo />}
      >
        <form method="post" action={routes.subscription.payment.action.href()} data-autosubmit class="flex flex-col gap-10 lg:gap-12" novalidate>
          <CsrfField token={shell.csrfToken} />
          <input type="hidden" name="paket" value={checkout.plan} />
          <PeriodOptions checkout={checkout} />

          <fieldset class="flex flex-col gap-4">
            <div class="flex items-end justify-between gap-4">
              <legend class={sectionTitle}>Metode pembayaran</legend>
              <span class={cn(sectionNote, 'flex items-center gap-1.5')}>
                <Icon name="lock" size={13} />
                Pembayaran terenkripsi
              </span>
            </div>
            <div class="flex flex-col gap-2 sm:grid sm:grid-cols-5 sm:gap-2.5">
              {PAYMENT_METHODS.map((option) => (
                <label
                  key={option.id}
                  class={cn(
                    tileClass,
                    'items-center gap-3 px-4 py-3 text-[13px] font-medium text-ink sm:flex-col sm:gap-2.5 sm:px-3.5 sm:py-4 has-checked:bg-ink has-checked:text-white has-checked:hover:bg-ink',
                  )}
                >
                  <input type="radio" name="metode" value={option.id} checked={checkout.method === option.id} class="sr-only" />
                  <Icon name={METHOD_ICON[option.id]!} size={18} />
                  {option.label}
                </label>
              ))}
            </div>
            {method.wallet ? (
              <div class="flex flex-col gap-3.5 rounded-md bg-subtle p-5" data-invalid={errors.phone ? 'true' : undefined}>
                <label for="hp" class="text-[13px] font-medium text-ink">
                  Nomor {method.label}
                </label>
                <span
                  class={cn(
                    'flex h-12 items-center gap-2.5 rounded-md px-3.5 transition-colors focus-within:bg-pink',
                    errors.phone ? 'bg-error-subtle' : 'bg-bg',
                  )}
                >
                  <span class="rounded-xs bg-hover px-2 py-1 text-xs text-muted">+62</span>
                  <input
                    id="hp"
                    name="hp"
                    type="tel"
                    inputMode="tel"
                    autocomplete="tel-national"
                    placeholder="812 3456 7890"
                    defaultValue={phone}
                    aria-invalid={errors.phone ? 'true' : undefined}
                    aria-describedby={errors.phone ? 'hp-error' : 'hp-help'}
                    class="h-full min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.3px] text-ink outline-none placeholder:text-faint"
                  />
                </span>
                {errors.phone ? (
                  <p id="hp-error" class="text-xs text-error">
                    {errors.phone}
                  </p>
                ) : (
                  <p id="hp-help" class="flex items-center gap-2 text-xs tracking-[0.24px] text-muted">
                    <Icon name="smartphone" size={13} />
                    Kami akan mengirim notifikasi ke aplikasi {method.label === 'GoPay' ? 'Gojek' : method.label} untuk konfirmasi.
                  </p>
                )}
              </div>
            ) : (
              <p class="flex items-center gap-2 rounded-md bg-subtle px-5 py-4 text-xs tracking-[0.24px] text-muted">
                <Icon name={METHOD_ICON[method.id]!} size={14} />
                {method.id === 'qris'
                  ? 'Kode QRIS muncul di langkah berikutnya. Pindai dengan aplikasi bank atau e-wallet apa pun.'
                  : 'Konfirmasi kartu lewat aplikasi bankmu di langkah berikutnya.'}
              </p>
            )}
          </fieldset>

          <div class="flex flex-col gap-4">
            <h2 class={sectionTitle}>
              <label for="promo">Kode promo</label>
            </h2>
            <span
              class={cn(
                'flex h-12 items-center gap-2.5 rounded-md pr-1.5 pl-3.5 transition-colors focus-within:bg-pink',
                errors.promo ? 'bg-error-subtle' : 'bg-subtle',
              )}
            >
              <Icon name="ticket-percent" size={16} class="text-muted" />
              <input
                id="promo"
                name="promo"
                defaultValue={checkout.promoCode}
                placeholder="Masukkan kode"
                autocapitalize="characters"
                aria-invalid={errors.promo ? 'true' : undefined}
                aria-describedby={errors.promo ? 'promo-error' : undefined}
                class="h-full min-w-0 flex-1 bg-transparent text-sm tracking-[0.6px] text-ink uppercase outline-none placeholder:tracking-[0.28px] placeholder:normal-case placeholder:text-faint"
              />
              {promoApplied ? (
                <span class="flex items-center gap-1.5 rounded-sm bg-accent-subtle px-3 py-2 text-xs font-medium text-accent-strong" role="status">
                  <Icon name="check" size={12} />
                  Diskon {checkout.promoPercent}% diterapkan
                </span>
              ) : (
                <Button type="submit" name="intent" value="promo" variant="outline" size="sm" class="bg-bg">
                  Terapkan
                </Button>
              )}
            </span>
            {errors.promo && (
              <p id="promo-error" class="text-xs text-error">
                {errors.promo}
              </p>
            )}
          </div>

          <div class="flex flex-col gap-5">
            <MobileTotal checkout={checkout} withPromo />
            <label class="flex cursor-pointer items-start gap-3 text-[13px] leading-5 tracking-[0.26px] text-muted">
              <input
                type="checkbox"
                name="setuju"
                value="1"
                checked={acceptedTerms}
                aria-invalid={errors.terms ? 'true' : undefined}
                aria-describedby={errors.terms ? 'setuju-error' : undefined}
                class="mt-0.5 size-5 shrink-0 cursor-pointer rounded-xs accent-accent"
              />
              <span>
                Saya setuju dengan{' '}
                <a href={routes.legal.terms.href()} class="text-ink underline-offset-2 hover:underline">
                  Syarat &amp; Ketentuan
                </a>{' '}
                dan{' '}
                <a href={routes.legal.privacy.href()} class="text-ink underline-offset-2 hover:underline">
                  Kebijakan Privasi
                </a>{' '}
                AnyamanRasa. Langganan diperpanjang otomatis setiap {checkout.period === 'tahunan' ? 'tahun' : 'bulan'} dan bisa
                dibatalkan kapan saja dari Pengaturan.
              </span>
            </label>
            {errors.terms && (
              <p id="setuju-error" class="-mt-2 text-xs text-error">
                {errors.terms}
              </p>
            )}
            <Button type="submit" name="intent" value="bayar" size="lg" class="h-[52px] w-full text-[15px] font-medium lg:h-[54px]">
              <Icon name="lock" />
              Bayar {formatRupiah(price.total)} dengan {method.label}
            </Button>
            <SimulationNote>Mode simulasi — tidak ada tagihan sungguhan yang dibuat.</SimulationNote>
          </div>
        </form>
      </CheckoutLayout>
    )
  }
}

function SimulationNote(handle: Handle<{ children?: RemixNode; class?: string }>) {
  return () => (
    <p
      class={cn(
        'flex items-center justify-center gap-2 rounded-sm bg-warning-subtle px-3.5 py-2.5 text-center text-xs tracking-[0.24px] text-warning',
        handle.props.class,
      )}
    >
      <Icon name="flask-conical" size={14} class="shrink-0" />
      {handle.props.children}
    </p>
  )
}

/** The quiet, centred layout of 14c/14d (no footer, like the error states). */
function CenteredStep(handle: Handle<{ shell: Shell; title: string; step: Step; done?: boolean; children?: RemixNode }>) {
  return () => (
    <SiteLayout shell={handle.props.shell} title={handle.props.title} footer={false}>
      <div class={cn(pageX, 'flex min-h-[calc(100dvh-60px)] flex-col items-center pt-8 pb-16 lg:min-h-[calc(100dvh-72px)] lg:pt-10')}>
        <Steps current={handle.props.step} done={handle.props.done} class="justify-center" />
        <div class="flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
          {handle.props.children}
        </div>
      </div>
    </SiteLayout>
  )
}

const markClass =
  'flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-peach),var(--color-pink)_60%,var(--color-lilac))] text-ink'
const stepHeading = 'text-[30px] leading-[1.15] tracking-[-0.5px] text-balance text-ink lg:text-[52px] lg:tracking-[-1px]'
const stepLead = 'max-w-[560px] text-[15px] leading-6 tracking-[0.2px] text-pretty text-muted'

const PENDING_COPY: Record<string, { title: string; lead: (amount: string, phone: string | null) => string }> = {
  wallet: {
    title: 'Selesaikan di aplikasi {app}.',
    lead: (amount, phone) =>
      `Kami sudah mengirim permintaan ${amount}${phone ? ` ke ${phone}` : ''}. Halaman ini akan lanjut otomatis setelah pembayaran dikonfirmasi.`,
  },
  qris: {
    title: 'Pindai kode QRIS.',
    lead: (amount) => `Bayar ${amount} dengan aplikasi bank atau e-wallet apa pun. Halaman ini akan lanjut otomatis setelah pembayaran dikonfirmasi.`,
  },
  kartu: {
    title: 'Konfirmasi di aplikasi bankmu.',
    lead: (amount) => `Bankmu meminta konfirmasi untuk tagihan ${amount}. Halaman ini akan lanjut otomatis setelah pembayaran dikonfirmasi.`,
  },
}

/** pen.dev 14c. entry.ts runs the countdown and moves on to 14d after a few seconds. */
export function PendingPage(handle: Handle<{ shell: Shell; checkout: Checkout; phone: string | null }>) {
  return () => {
    let { shell, checkout, phone } = handle.props
    let method = PAYMENT_METHODS.find((m) => m.id === checkout.method)!
    let copy = PENDING_COPY[method.wallet ? 'wallet' : method.id]!
    let app = method.id === 'gopay' ? 'Gojek' : method.label
    let amount = formatRupiah(quote(checkout.plan, checkout.period, checkout.promoPercent).total)
    let doneHref = `${routes.subscription.done.href()}?${checkoutQuery(checkout)}`
    return (
      <CenteredStep shell={shell} title="Menunggu konfirmasi" step={2}>
        <div data-auto-advance={doneHref} data-advance-after="6" class="contents">
          <span class={markClass} aria-hidden="true">
            <Icon name={method.wallet ? 'smartphone' : (METHOD_ICON[method.id] ?? 'smartphone')} size={22} />
          </span>
          <h1 class={stepHeading}>{copy.title.replace('{app}', app)}</h1>
          <p class={stepLead}>{copy.lead(amount, phone)}</p>
          <p class="flex items-center gap-2 rounded-full bg-accent-subtle px-3.5 py-1.5 text-[13px] tracking-[0.26px] text-accent-strong" role="status">
            <span class="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            Menunggu konfirmasi · sisa <span data-countdown="300">05:00</span>
          </p>
            <div class="flex w-full flex-col items-center gap-x-5 gap-y-4 pt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
            <ButtonLink href={doneHref} variant="dark" size="lg" class="w-full sm:w-auto">
              <Icon name="check" />
              Saya sudah bayar
            </ButtonLink>
            <a
              href={`${routes.subscription.payment.index.href()}?${checkoutQuery(checkout)}`}
              class="group inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline"
            >
              Ganti metode pembayaran
              <Icon name="arrow-up-right" size={15} />
            </a>
          </div>
          <SimulationNote class="rounded-full px-4">Mode simulasi — pembayaran akan dikonfirmasi otomatis.</SimulationNote>
        </div>
      </CenteredStep>
    )
  }
}

/** pen.dev 14d. A receipt for the simulated payment; the account stays on Gratis. */
export function DonePage(handle: Handle<{ shell: Shell; checkout: Checkout; orderNumber: string }>) {
  return () => {
    let { shell, checkout, orderNumber } = handle.props
    let plan = PLANS[checkout.plan]
    let price = quote(checkout.plan, checkout.period, checkout.promoPercent)
    let rows: [string, string][] = [
      ['Paket', `${plan.name} · ${PERIOD_LABEL[checkout.period]}`],
      ['Dibayar', `${formatRupiah(price.total)} via ${methodLabel(checkout.method)}`],
      ['Diperpanjang', longDate(renewalDate(checkout.period))],
      ['No. pesanan', orderNumber],
    ]
    return (
      <CenteredStep shell={shell} title="Pembayaran selesai" step={3} done>
        <span class={markClass} aria-hidden="true">
          <Icon name="check" size={22} />
        </span>
        <h1 class={stepHeading}>Selamat datang di {plan.name}.</h1>
        <p class={stepLead}>Pembayaran simulasi berhasil. Tidak ada tagihan sungguhan, jadi akunmu tetap memakai paket Gratis.</p>
        <dl class="flex w-full max-w-[400px] flex-col gap-2.5 rounded-md bg-subtle px-5 py-4 text-left text-[13px] tracking-[0.26px]">
          {rows.map(([label, value]) => (
            <div key={label} class="flex justify-between gap-4">
              <dt class="text-muted">{label}</dt>
              <dd class="text-right text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div class="flex w-full flex-col items-center gap-x-5 gap-y-4 pt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
          <ButtonLink href={routes.recipes.index.href()} variant="dark" size="lg" class="w-full sm:w-auto">
            <Icon name="book-open" />
            Jelajahi resep
          </ButtonLink>
          <a
            href={`${routes.profile.edit.index.href()}#langganan`}
            class="group inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline"
          >
            Lihat langganan
            <Icon name="arrow-up-right" size={15} />
          </a>
        </div>
      </CenteredStep>
    )
  }
}

