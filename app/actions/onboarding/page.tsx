import type { Handle, RemixNode } from 'remix/component'

import type { PantryRecipe } from '../../data/pantry.ts'
import type { CategoryTile } from '../../data/preferences.ts'
import { difficultyLabel, formatMinutes } from '../../domain/format.ts'
import {
  MIN_FAVORITE_CATEGORIES,
  type OnboardingStep,
  QUESTION_STEPS,
  joinNames,
  previousStep,
  stepNumber,
} from '../../domain/onboarding.ts'
import type { PantryMatch } from '../../domain/pantry.ts'
import type { IngredientSummary, RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { Document } from '../../ui/document.tsx'
import { Icon } from '../../ui/icon.tsx'
import { inputClass } from '../../ui/input.tsx'
import { CsrfField, Logo } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { cn } from '../../ui/utils.ts'

export function onboardingHref(step: OnboardingStep): string {
  return step === 'selera' ? routes.onboarding.index.href() : `${routes.onboarding.index.href()}?langkah=${step}`
}

export type OnboardingView =
  | { step: 'selera'; tiles: CategoryTile[]; selected: number[]; shownCount: number }
  | {
      step: 'dapur'
      selected: IngredientSummary[]
      suggestions: IngredientSummary[]
      /** Recipes using at least one pantry ingredient, and those with nothing missing. */
      matchCount: number
      readyCount: number
      top: PantryMatch<PantryRecipe> | null
      panelIngredients: IngredientSummary[]
    }
  | {
      step: 'pantangan'
      options: IngredientSummary[]
      chosen: string[]
      avoided: IngredientSummary[]
      /** Favourite-category recipes hidden by the avoided ingredients. */
      hidden: RecipeSummary[]
      safe: RecipeSummary | null
    }
  | {
      step: 'selesai'
      hasFavorites: boolean
      pantryCount: number
      avoided: IngredientSummary[]
      shown: RecipeSummary[]
    }

const pageX = 'px-5 lg:px-10'
const headingClass = 'text-[32px] leading-[1.1] font-normal tracking-[-0.32px] text-ink lg:text-[52px] lg:tracking-[-0.52px]'
const leadClass = 'text-sm leading-[1.5] tracking-[0.28px] text-muted lg:text-base lg:tracking-[0.32px]'
const groupHead = 'text-sm font-medium tracking-[0.28px] text-ink'
const noteClass = 'flex items-center gap-3 rounded-md bg-accent-subtle py-2.5 pr-3.5 pl-2.5 text-[13px] leading-[1.45] text-ink lg:py-3 lg:pr-4 lg:pl-3 lg:text-sm lg:tracking-[0.14px]'
/** Floating photo tiles in the feature panels: white rim, soft glow. */
const floatTile = 'absolute border-2 border-white bg-hover bg-cover bg-center shadow-[0_14px_28px_#D2693F40]'

interface PanelCopy {
  eyebrow: string
  line1: string
  line2: string
}

const PANELS: Record<OnboardingStep, PanelCopy> = {
  selera: { eyebrow: 'Beranda yang personal', line1: 'Berandamu,', line2: 'sesuai seleramu.' },
  dapur: { eyebrow: 'Masak dari dapurmu', line1: 'Masak dari yang ada,', line2: 'bukan dari nol.' },
  pantangan: { eyebrow: 'Aman untukmu', line1: 'Yang kamu hindari,', line2: 'tak akan muncul.' },
  selesai: { eyebrow: 'Onboarding selesai', line1: 'Selamat datang', line2: 'di dapurmu.' },
}

/** pen.dev 15a–15d (desktop and mobile). */
export function OnboardingPage(handle: Handle<{ shell: Shell; view: OnboardingView; error?: string }>) {
  return () => {
    let { shell, view, error } = handle.props
    let content: { title: string; lead: string; form: RemixNode; panel: RemixNode; hero?: RemixNode }
    if (view.step === 'selera') {
      content = {
        title: 'Masakan apa yang bikin kamu lapar?',
        lead: `Pilih minimal ${MIN_FAVORITE_CATEGORIES} — bisa diubah kapan saja.`,
        form: <TasteStep shell={shell} view={view} />,
        panel: <TastePanel view={view} />,
      }
    } else if (view.step === 'dapur') {
      content = {
        title: 'Apa yang biasanya ada di dapurmu?',
        lead: 'Tandai bahan yang sering kamu simpan di dapur.',
        form: <PantryStep shell={shell} view={view} />,
        panel: <PantryPanel view={view} />,
        hero: <PantryHero view={view} />,
      }
    } else if (view.step === 'pantangan') {
      content = {
        title: 'Ada pantangan atau alergi?',
        lead: 'Resep yang tidak cocok akan kami sembunyikan.',
        form: <AvoidStep shell={shell} view={view} />,
        panel: <AvoidPanel view={view} />,
        hero: <AvoidHero view={view} />,
      }
    } else {
      content = {
        title: 'Berandamu siap disajikan.',
        lead: doneLead(view),
        form: <DoneStep />,
        panel: <CardFan recipes={view.shown} />,
        hero: (
          <div class="relative h-[320px] overflow-hidden rounded-lg bg-surface-dark bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,#D2693F59_0%,#D2693F00_100%)]">
            <CardFan recipes={view.shown} compact />
          </div>
        ),
      }
    }

    let back = view.step === 'selesai' ? null : previousStep(view.step)
    let panel = PANELS[view.step]
    return (
      <Document title={content.title} bodyClass="bg-bg">
        <div class="flex min-h-dvh flex-col">
          <header class={cn(pageX, 'flex h-[60px] shrink-0 items-center justify-between lg:h-[72px]')}>
            {back ? <BackLink step={back} class="lg:invisible" /> : <span />}
            {view.step !== 'selesai' && (
              <a href={routes.home.href()} class="flex items-center gap-1.5 text-sm tracking-[0.28px] text-muted hover:text-ink">
                Lewati
                <Icon name="arrow-right" size={16} class="max-lg:hidden" />
              </a>
            )}
          </header>
          <main
            id="konten"
            class={cn(pageX, 'flex flex-1 flex-col pt-1 pb-40 lg:grid lg:grid-cols-2 lg:gap-6 lg:pt-2 lg:pb-10')}
          >
            <div class="flex flex-col justify-center lg:py-10">
              <div class="flex w-full flex-col gap-6 lg:mx-auto lg:max-w-[428px] lg:gap-7">
                {view.step === 'selera' && (
                  <div class="flex flex-col gap-4">
                    <Logo large />
                    <p class="tracking-[0.18px] text-muted max-lg:hidden">Selamat datang! Yuk, kenalan dulu.</p>
                  </div>
                )}
                {back && <BackLink step={back} class="self-start max-lg:hidden" />}
                {content.hero && <div class="lg:hidden">{content.hero}</div>}
                <div class="flex flex-col gap-2 lg:gap-3.5">
                  <StepProgress step={view.step} />
                  <h1 class={headingClass}>{content.title}</h1>
                  <p class={cn(leadClass, view.step === 'pantangan' && 'max-lg:hidden')}>{content.lead}</p>
                </div>
                {error && <Alert variant="destructive">{error}</Alert>}
                {content.form}
              </div>
            </div>
            <aside
              aria-label={panel.eyebrow}
              class="relative hidden min-h-[780px] min-w-0 flex-col gap-8 overflow-hidden rounded-lg bg-surface-dark bg-[radial-gradient(ellipse_65%_40%_at_50%_32%,#D2693F59_0%,#D2693F00_100%)] p-12 lg:flex"
            >
              <div class="relative min-h-0 flex-1" aria-hidden="true">
                {content.panel}
              </div>
              <div class="relative flex flex-col gap-4">
                <p class="text-sm font-medium tracking-[0.28px] text-sand">{panel.eyebrow}</p>
                <p class="text-[48px] leading-[1.1] tracking-[-0.48px] text-white">
                  {panel.line1}
                  <span class="block text-lilac">{panel.line2}</span>
                </p>
              </div>
            </aside>
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

function doneLead(view: Extract<OnboardingView, { step: 'selesai' }>): string {
  let parts = [
    view.hasFavorites && 'masakan favoritmu',
    view.pantryCount > 0 && `${view.pantryCount} bahan di dapurmu`,
    view.avoided.length > 0 && `tanpa ${joinNames(view.avoided.map((i) => i.name.toLowerCase()))}`,
  ].filter((part): part is string => Boolean(part))
  if (parts.length === 0) return 'Pilihanmu bisa diisi atau diubah kapan saja lewat halaman ini.'
  let list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')}, dan ${parts.at(-1)}`
  return `Disusun dari ${list}.`
}

/** Desktop: three dash bars + "Langkah X dari 3". Phones: an accent label only. */
function StepProgress(handle: Handle<{ step: OnboardingStep }>) {
  return () => {
    let { step } = handle.props
    let current = stepNumber(step)
    let label = step === 'selesai' ? 'Selesai' : `Langkah ${current} dari ${QUESTION_STEPS}`
    let mobile = step === 'selesai' ? 'Onboarding selesai' : step === 'selera' ? `Selamat datang · ${label}` : label
    return (
      <>
        <p class="text-xs font-medium tracking-[0.24px] text-accent-strong lg:hidden">{mobile}</p>
        <div class="flex items-center gap-2 max-lg:hidden">
          <span class="flex gap-2" aria-hidden="true">
            {Array.from({ length: QUESTION_STEPS }, (_, i) => (
              <span key={i} class={cn('h-1 w-6 rounded-full', i < current ? 'bg-accent' : 'bg-line')} />
            ))}
          </span>
          <p class="text-xs tracking-[0.2px] text-muted">{label}</p>
        </div>
      </>
    )
  }
}

/** The main button with an optional note under it. Pinned to the bottom on phones. */
function ActionBar(handle: Handle<{ children?: RemixNode; note?: RemixNode; noteClass?: string }>) {
  return () => (
    <div class="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3.5 bg-bg px-5 pt-4 pb-6 shadow-[0_-4px_16px_#2A1F1A0D] lg:static lg:p-0 lg:shadow-none">
      {handle.props.children}
      {handle.props.note && <p class={cn('text-[13px] text-muted', handle.props.noteClass)}>{handle.props.note}</p>}
    </div>
  )
}

const mainButton = 'h-[52px] w-full text-[15px] lg:h-12'

function SubmitButton(handle: Handle<{ label?: string }>) {
  return () => (
    <Button type="submit" name="lanjut" value="1" class={mainButton}>
      {handle.props.label ?? 'Lanjut'}
    </Button>
  )
}

function BackLink(handle: Handle<{ step: OnboardingStep; class?: string }>) {
  return () => (
    <a
      href={onboardingHref(handle.props.step)}
      class={cn('flex items-center gap-1.5 text-[13px] font-medium tracking-[0.26px] text-muted hover:text-ink', handle.props.class)}
    >
      <Icon name="arrow-left" size={16} />
      Kembali
    </a>
  )
}

function StepForm(handle: Handle<{ shell: Shell; step: OnboardingStep; children?: RemixNode }>) {
  return () => (
    <form method="post" action={routes.onboarding.action.href()} data-autosubmit class="flex flex-col gap-7">
      <CsrfField token={handle.props.shell.csrfToken} />
      <input type="hidden" name="langkah" value={handle.props.step} />
      {handle.props.children}
    </form>
  )
}

/** Round ingredient photo inside a chip (24px), or its initial when there is no photo. */
function ChipPhoto(handle: Handle<{ ingredient: IngredientSummary }>) {
  return () => {
    let { ingredient } = handle.props
    return ingredient.imageUrl ? (
      <img src={ingredient.imageUrl} alt="" class="size-6 shrink-0 rounded-full object-cover" loading="lazy" />
    ) : (
      <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-hover-strong text-[11px] text-muted" aria-hidden="true">
        {ingredient.name.charAt(0)}
      </span>
    )
  }
}

const chipBase = 'inline-flex h-[34px] items-center gap-2 rounded-full border py-[5px] pr-3 pl-[5px] text-sm tracking-[0.28px] transition-colors'
const chipOn = 'border-ink bg-ink text-white'
const chipOff = 'border-outline bg-hover text-ink hover:bg-hover-strong'

/** A rounded photo tile for the feature panels (`style` carries the photo). */
function PhotoTile(
  handle: Handle<{ src: string | null; class: string; label?: string; style?: Record<string, string>; children?: RemixNode }>,
) {
  return () => {
    let { src, label } = handle.props
    return (
      <div class={cn(floatTile, handle.props.class)} style={{ ...handle.props.style, ...(src ? { backgroundImage: `url("${src}")` } : {}) }}>
        {!src && label && <span class="flex size-full items-center justify-center p-2 text-center text-xs text-muted">{label}</span>}
        {handle.props.children}
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// 15a Selera

function TasteStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'selera' }> }>) {
  return () => {
    let { shell, view } = handle.props
    return (
      <StepForm shell={shell} step="selera">
        <fieldset>
          <legend class="sr-only">Kategori favorit</legend>
          <div class="grid grid-cols-3 gap-2.5 lg:grid-cols-2 lg:gap-4">
            {view.tiles.map((tile) => (
              <label
                key={tile.id}
                class="relative flex h-[156px] cursor-pointer flex-col justify-between overflow-hidden rounded-md border-2 border-line bg-hover p-2 transition-colors has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink lg:h-[132px] lg:p-3 lg:has-checked:border-ink"
              >
                {tile.imageUrl && <img src={tile.imageUrl} alt="" class="absolute inset-0 size-full object-cover" loading="lazy" />}
                <input type="checkbox" name="kategori" value={String(tile.id)} checked={view.selected.includes(tile.id)} class="peer sr-only" />
                <span
                  class="relative flex size-5 items-center justify-center self-end rounded-full border border-white/70 bg-white/20 text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white lg:peer-checked:border-ink lg:peer-checked:bg-ink"
                  aria-hidden="true"
                >
                  <Icon name="check" size={12} />
                </span>
                <span class="relative self-start rounded-full bg-ink/80 px-2 py-[3px] text-xs font-medium tracking-[0.24px] text-white">
                  {tile.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <ActionBar note={`${view.selected.length} dipilih · minimal ${MIN_FAVORITE_CATEGORIES}`}>
          <SubmitButton />
        </ActionBar>
      </StepForm>
    )
  }
}

/** Slots of the tilted tray (row, column) that hold the chosen cuisines, in order. */
const TRAY_SLOTS: [number, number][] = [
  [0, 2],
  [0, 5],
  [1, 3],
  [1, 6],
  [0, 7],
  [1, 1],
]
const TRAY_DOT_COLORS = ['bg-accent', 'bg-accent-strong', 'bg-success', 'bg-coral', 'bg-sand', 'bg-outline']

function TastePanel(handle: Handle<{ view: Extract<OnboardingView, { step: 'selera' }> }>) {
  return () => {
    let { view } = handle.props
    let chosen = view.tiles.filter((tile) => view.selected.includes(tile.id))
    let next = view.tiles.find((tile) => !view.selected.includes(tile.id))
    return (
      <>
        <div class="absolute top-[150px] -left-[230px] flex w-[943px] rotate-[14deg] flex-col gap-3.5 rounded-[44px] border border-white/15 bg-white/[0.07] p-[22px] shadow-[0_28px_64px_#00000033]">
          {[0, 1].map((row) => (
            <div key={row} class="flex gap-3.5">
              {Array.from({ length: 8 }, (_, col) => {
                let tile = chosen[TRAY_SLOTS.findIndex(([r, c]) => r === row && c === col)]
                return tile ? (
                  <PhotoTile key={col} src={tile.imageUrl} label={tile.name} class="relative size-24 shrink-0 rounded-[26px]">
                    <span class="absolute top-2.5 right-2.5 flex size-[22px] items-center justify-center rounded-full bg-accent text-white">
                      <Icon name="check" size={13} />
                    </span>
                  </PhotoTile>
                ) : (
                  <span
                    key={col}
                    class="grid size-24 shrink-0 grid-cols-[repeat(3,3px)] place-content-center gap-[5px] rounded-[26px] bg-white/[0.06] shadow-[inset_0_2px_6px_#00000026]"
                  >
                    {Array.from({ length: 9 }, (_, i) => (
                      <span key={i} class="size-[3px] rounded-full bg-white/20" />
                    ))}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        {next && (
          <>
            <PhotoTile src={next.imageUrl} label={next.name} class="-top-6 right-9 size-[118px] -rotate-[9deg] rounded-[32px] shadow-[0_26px_44px_#D2693F66]" />
            <span class="absolute top-[124px] right-[170px] flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_10px_24px_#5A3A2A1F]">
              <Icon name="plus" size={14} class="text-accent-strong" />
              {next.name}
            </span>
          </>
        )}
        <div class="absolute top-[470px] -right-[68px] flex w-[430px] flex-col gap-4 rounded-[22px] bg-white px-6 py-[22px] shadow-[0_24px_56px_#5A3A2A26]">
          <p class="flex items-center gap-2 text-[13px] text-muted">
            <Icon name="sparkles" size={15} class="text-accent" />
            Berandamu diracik dari
          </p>
          {chosen.length > 0 ? (
            <ul class="flex flex-wrap gap-2 pr-16">
              {chosen.map((tile, i) => (
                <li key={tile.id} class="flex items-center gap-[7px] rounded-full border border-line bg-subtle px-3 py-1.5 text-[13px] font-medium text-ink">
                  <span class={cn('size-[7px] rounded-full', TRAY_DOT_COLORS[i % TRAY_DOT_COLORS.length])} />
                  {tile.name}
                </li>
              ))}
            </ul>
          ) : (
            <p class="text-[13px] text-faint">Pilih kategori untuk mulai meracik.</p>
          )}
          <p class="flex items-end gap-2.5 border-t border-line pt-3.5">
            <span class="text-[34px] leading-none tracking-[-0.8px] text-ink">{view.shownCount}</span>
            <span class="text-[13px] text-muted">resep siap dijelajahi</span>
          </p>
        </div>
      </>
    )
  }
}

// ---------------------------------------------------------------------------
// 15b Dapurmu

function pantryNote(view: Extract<OnboardingView, { step: 'dapur' }>): string | null {
  let { top, selected } = view
  if (!top) return null
  if (view.readyCount > 0) {
    return `${selected.length} bahan ini cukup untuk ${view.readyCount} resep — termasuk ${top.recipe.title}.`
  }
  return `${selected.length} bahan ini dipakai di ${view.matchCount} resep — ${top.recipe.title} tinggal kurang ${top.missing.length} bahan.`
}

function PantryStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'dapur' }> }>) {
  return () => {
    let { shell, view } = handle.props
    let note = pantryNote(view)
    return (
      <StepForm shell={shell} step="dapur">
        {view.selected.map((ingredient) => (
          <input key={ingredient.id} type="hidden" name="bahan" value={ingredient.id} />
        ))}
        <div class="flex flex-col gap-3.5 lg:gap-7">
          <div class="flex h-[52px] items-center gap-2.5 rounded-md border border-outline bg-hover pr-[7px] pl-4 focus-within:bg-bg">
            <Icon name="search" size={18} class="shrink-0 text-muted" />
            <label for="tambah-bahan" class="sr-only">
              Tambah bahan
            </label>
            <input
              id="tambah-bahan"
              type="text"
              name="tambah"
              placeholder="Ketik bahan, mis. tempe atau santan…"
              autocomplete="off"
              class={cn(inputClass, 'h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0')}
            />
            <Button type="submit" variant="dark" size="sm" class="h-[37px] rounded-full px-4 text-sm max-lg:rounded-sm max-lg:bg-accent max-lg:hover:bg-accent-strong">
              Tambah
            </Button>
          </div>
          <div class="flex flex-col gap-2.5 lg:gap-3">
            <div class="flex items-center justify-between gap-3">
              <p class={groupHead}>Di dapurmu · {view.selected.length} bahan</p>
              {view.selected.length > 0 && (
                <button type="submit" name="hapus_semua" value="1" class="text-[13px] text-ink hover:text-accent-strong max-lg:hidden">
                  Hapus semua
                </button>
              )}
            </div>
            {view.selected.length > 0 ? (
              <ul class="flex flex-wrap gap-2">
                {view.selected.map((ingredient) => (
                  <li key={ingredient.id} class={cn(chipBase, chipOn)}>
                    <ChipPhoto ingredient={ingredient} />
                    {ingredient.name}
                    <button
                      type="submit"
                      name="hapus"
                      value={ingredient.id}
                      aria-label={`Hapus ${ingredient.name}`}
                      class="-mr-1 flex size-6 items-center justify-center rounded-full text-white/70 hover:bg-white/15 hover:text-white"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="text-sm text-muted">Belum ada bahan. Ketik di atas atau pilih saran di bawah.</p>
            )}
          </div>
          {view.suggestions.length > 0 && (
            <div class="flex flex-col gap-2.5 max-lg:order-last lg:gap-3">
              <p class={groupHead}>{view.selected.length > 0 ? 'Sering dipakai bareng' : 'Saran cepat'}</p>
              <ul class="flex flex-wrap gap-2">
                {view.suggestions.map((ingredient) => (
                  <li key={ingredient.id}>
                    <button type="submit" name="tambah_id" value={ingredient.id} class={cn(chipBase, chipOff)}>
                      <ChipPhoto ingredient={ingredient} />
                      {ingredient.name}
                      <Icon name="plus" size={14} class="text-muted max-lg:text-accent" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {note && view.top && (
            <p class={noteClass}>
              <RoundPhoto src={view.top.recipe.imageUrl} />
              {note}
            </p>
          )}
        </div>
        <ActionBar note={`${view.selected.length} bahan dipilih · bisa kamu ubah kapan saja`} noteClass="max-lg:hidden">
          <SubmitButton />
        </ActionBar>
      </StepForm>
    )
  }
}

function RoundPhoto(handle: Handle<{ src: string | null }>) {
  return () =>
    handle.props.src ? (
      <img src={handle.props.src} alt="" class="size-10 shrink-0 rounded-full object-cover lg:size-9" loading="lazy" />
    ) : (
      <span class="size-10 shrink-0 rounded-full bg-hover-strong lg:size-9" />
    )
}

/** Ingredient tiles around the pot (positions from the 15b panel). */
const POT_TILES: { side: 'left' | 'right'; x: number; top: number; size: number; rotate: number }[] = [
  { side: 'left', x: -43, top: 42, size: 108, rotate: 10 },
  { side: 'left', x: 147, top: -17, size: 98, rotate: -7 },
  { side: 'left', x: 302, top: 6, size: 88, rotate: 8 },
  { side: 'right', x: 45, top: 70, size: 78, rotate: -11 },
  { side: 'right', x: 53, top: 212, size: 68, rotate: 6 },
  { side: 'right', x: 125, top: 308, size: 58, rotate: -9 },
]

function PantryPanel(handle: Handle<{ view: Extract<OnboardingView, { step: 'dapur' }> }>) {
  return () => {
    let { view } = handle.props
    let { top } = view
    let count = view.readyCount > 0 ? view.readyCount : view.matchCount
    return (
      <>
        <span class="absolute top-[175px] left-[calc(50%-120px)] size-60 rounded-full bg-[radial-gradient(circle,#D2693F59_0%,#D2693F00_70%)]" />
        <PhotoTile
          src={top?.recipe.imageUrl ?? null}
          class="top-[217px] left-[calc(50%-78px)] size-[156px] rounded-full shadow-[0_26px_52px_#D2693F70]"
        />
        {view.panelIngredients.map((ingredient, i) => {
          let spot = POT_TILES[i]!
          return (
            <PhotoTile
              key={ingredient.id}
              src={ingredient.imageUrl}
              label={ingredient.name}
              class="rounded-[26px]"
              style={{
                [spot.side]: `${spot.x}px`,
                top: `${spot.top}px`,
                width: `${spot.size}px`,
                height: `${spot.size}px`,
                transform: `rotate(${spot.rotate}deg)`,
              }}
            />
          )
        })}
        {view.selected.length > 0 && (
          <span class="absolute top-[166px] -left-5 rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_10px_24px_#5A3A2A1F]">
            {view.selected.length} bahan dari dapurmu
          </span>
        )}
        {top && (
          <>
            <div class="absolute top-[290px] -left-1 flex -rotate-[4deg] flex-col gap-0.5 rounded-[20px] bg-white px-5 py-4 shadow-[0_16px_36px_#5A3A2A1F]">
              <span class="text-[40px] leading-none tracking-[-1px] text-ink">{count}</span>
              <span class="text-[13px] text-muted">{view.readyCount > 0 ? 'resep bisa dimasak' : 'resep memakai bahanmu'}</span>
            </div>
            <div class="absolute top-[430px] -right-[68px] flex w-[540px] items-center gap-5 rounded-[24px] bg-white py-3.5 pr-10 pl-3.5 shadow-[0_24px_56px_#5A3A2A26]">
              {top.recipe.imageUrl ? (
                <img src={top.recipe.imageUrl} alt="" class="size-[132px] shrink-0 rounded-2xl object-cover" />
              ) : (
                <span class="size-[132px] shrink-0 rounded-2xl bg-hover" />
              )}
              <div class="flex min-w-0 flex-col gap-3.5">
                <p class="text-xs font-medium tracking-[0.24px] text-accent-strong">
                  {top.missing.length === 0 ? 'Bisa dimasak sekarang' : 'Paling mendekati'}
                </p>
                <div class="flex flex-col gap-1">
                  <p class="truncate text-[22px] tracking-[-0.3px] text-ink">{top.recipe.title}</p>
                  <p class="text-[13px] text-muted">
                    {formatMinutes(top.recipe.totalMinutes)} · {difficultyLabel(top.recipe.difficulty)}
                  </p>
                </div>
                <p class="flex items-center gap-2.5">
                  <span class="flex">
                    {Array.from({ length: Math.min(top.requiredCount, 8) }, (_, i) => (
                      <span
                        key={i}
                        class={cn(
                          'size-5 rounded-full border border-white not-first:-ml-[5px]',
                          i < top!.matchedCount ? TRAY_DOT_COLORS[i % TRAY_DOT_COLORS.length] : 'bg-line',
                        )}
                      />
                    ))}
                  </span>
                  <span class="text-[13px] font-medium text-accent-strong">
                    {top.matchedCount}/{top.requiredCount} bahan ada
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </>
    )
  }
}

/** Phones: a small cream version of the pot composition above the heading. */
function PantryHero(handle: Handle<{ view: Extract<OnboardingView, { step: 'dapur' }> }>) {
  return () => {
    let { view } = handle.props
    let spots = [
      'left-[18px] top-[34px] size-[62px] rotate-[10deg] rounded-[17px]',
      'left-[96px] top-[10px] size-[50px] -rotate-[7deg] rounded-[14px]',
      'right-[66px] top-[14px] size-[52px] rotate-[8deg] rounded-[15px]',
      'right-[22px] top-[70px] size-11 -rotate-[11deg] rounded-[12px]',
    ]
    return (
      <div class="relative h-[146px] overflow-hidden rounded-lg bg-subtle" aria-hidden="true">
        <span class="absolute top-3 left-[calc(50%-68px)] size-[136px] rounded-full bg-[radial-gradient(circle,#D2693F40_0%,#D2693F00_70%)]" />
        <PhotoTile src={view.top?.recipe.imageUrl ?? null} class="top-[34px] left-[calc(50%-46px)] size-[92px] rounded-full" />
        {view.panelIngredients.slice(0, spots.length).map((ingredient, i) => (
          <PhotoTile key={ingredient.id} src={ingredient.imageUrl} label={ingredient.name} class={spots[i]!} />
        ))}
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// 15c Pantangan

function hiddenNote(hidden: RecipeSummary[]): string {
  let names = hidden.slice(0, 2).map((recipe) => recipe.title)
  let rest = hidden.length - names.length
  let list = rest > 0 ? `${names.join(', ')} & ${rest} resep lain` : joinNames(names)
  return `${list} akan kami sembunyikan dari berandamu.`
}

function AvoidStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'pantangan' }> }>) {
  return () => {
    let { shell, view } = handle.props
    return (
      <StepForm shell={shell} step="pantangan">
        <fieldset class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <legend class={groupHead}>Hindari bahan ini</legend>
            <span class="text-xs text-ink max-lg:hidden">{view.chosen.length} dipilih</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {view.options.map((ingredient) => (
              <label
                key={ingredient.id}
                class={cn(
                  chipBase,
                  chipOff,
                  'cursor-pointer has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
                )}
              >
                <input type="checkbox" name="hindari" value={ingredient.id} checked={view.chosen.includes(ingredient.id)} class="peer sr-only" />
                <ChipPhoto ingredient={ingredient} />
                {ingredient.name}
                <Icon name="plus" size={14} class="text-muted peer-checked:hidden max-lg:text-accent" />
                <Icon name="x" size={14} class="hidden opacity-70 peer-checked:block" />
              </label>
            ))}
          </div>
          <details open={view.options.length === 0}>
            <summary class="cursor-pointer list-none text-[13px] font-medium text-ink hover:text-accent-strong max-lg:text-accent-strong [&::-webkit-details-marker]:hidden">
              + Tambah lainnya
            </summary>
            <div class="mt-2.5 flex h-11 items-center gap-2 rounded-md border border-line pr-1.5 pl-3.5 focus-within:border-outline">
              <label for="tambah-pantangan" class="sr-only">
                Tambah bahan lain yang dihindari
              </label>
              <input
                id="tambah-pantangan"
                type="text"
                name="tambah"
                placeholder="mis. jamur"
                autocomplete="off"
                class={cn(inputClass, 'h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0')}
              />
              <Button type="submit" variant="ghost" size="sm" class="text-accent-strong">
                <Icon name="plus" />
                Tambah
              </Button>
            </div>
          </details>
          {view.hidden.length > 0 && (
            <p class={noteClass}>
              <RoundPhoto src={view.hidden[0]!.imageUrl} />
              {hiddenNote(view.hidden)}
            </p>
          )}
          <p class="text-xs leading-[18px] text-muted">
            Kami menyaring dari daftar bahan resep. Tetap periksa bahan dan label kemasan jika kamu punya alergi.
          </p>
        </fieldset>
        <ActionBar>
          <SubmitButton label="Selesai" />
        </ActionBar>
      </StepForm>
    )
  }
}

function AvoidPanel(handle: Handle<{ view: Extract<OnboardingView, { step: 'pantangan' }> }>) {
  return () => {
    let { view } = handle.props
    let safe = view.options.filter((ingredient) => !view.chosen.includes(ingredient.id) && ingredient.imageUrl).slice(0, 3)
    let safeSpots = [
      'left-1.5 top-2.5 size-[100px] rotate-[8deg] rounded-[28px]',
      'right-[15px] top-6 size-[92px] -rotate-[10deg] rounded-[26px]',
      'left-[30px] top-[340px] size-24 -rotate-[6deg] rounded-[27px]',
    ]
    let hiddenSpots = [
      'left-[120px] top-[104px] size-28 -rotate-[8deg] rounded-[31px]',
      'right-[100px] top-[270px] size-[104px] rotate-[10deg] rounded-[29px]',
    ]
    return (
      <>
        {safe.map((ingredient, i) => (
          <PhotoTile key={ingredient.id} src={ingredient.imageUrl} class={safeSpots[i]!} />
        ))}
        {view.avoided.slice(0, 2).map((ingredient, i) => (
          <PhotoTile key={ingredient.id} src={ingredient.imageUrl} label={ingredient.name} class={hiddenSpots[i]!} />
        ))}
        <Lens class="top-[110px] left-[calc(50%-145px)] size-[290px]" />
        <FilterLabel view={view} class="top-[410px] left-1/2 -translate-x-1/2" />
        {view.safe && (
          <div class="absolute top-[470px] -right-[68px] flex w-[400px] items-center gap-4 rounded-[22px] bg-white p-4 pr-[84px] shadow-[0_24px_56px_#5A3A2A26]">
            {view.safe.imageUrl ? (
              <img src={view.safe.imageUrl} alt="" class="size-[76px] shrink-0 rounded-[14px] object-cover" />
            ) : (
              <span class="size-[76px] shrink-0 rounded-[14px] bg-hover" />
            )}
            <div class="flex min-w-0 flex-col gap-2.5">
              <p class="truncate font-medium text-ink">{view.safe.title}</p>
              <p class="flex flex-wrap gap-1.5">
                {[view.safe.categories[0], ...view.avoided.slice(0, 1).map((i) => `Bebas ${i.name.toLowerCase()}`)]
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} class="rounded-full bg-success-subtle px-[9px] py-1 text-xs font-medium text-success">
                      {tag}
                    </span>
                  ))}
              </p>
            </div>
          </div>
        )}
      </>
    )
  }
}

function Lens(handle: Handle<{ class: string }>) {
  return () => (
    <span
      class={cn(
        'absolute rounded-full border-2 border-white/80 bg-[linear-gradient(200deg,#FFFFFF59,#FFFFFF1A)] shadow-[0_24px_60px_#8A5A3A40] backdrop-blur-[22px]',
        handle.props.class,
      )}
    />
  )
}

function FilterLabel(handle: Handle<{ view: Extract<OnboardingView, { step: 'pantangan' }>; class: string }>) {
  return () => {
    let { avoided } = handle.props.view
    return (
      <span
        class={cn(
          'absolute rounded-full bg-ink px-4 py-2 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_12px_24px_#2A1F1A33]',
          handle.props.class,
        )}
      >
        {avoided.length > 0 ? `Disaring: ${joinNames(avoided.slice(0, 2).map((i) => i.name.toLowerCase()))}` : 'Belum ada yang disaring'}
      </span>
    )
  }
}

/** Phones: the frosted lens in a short cream panel above the heading. */
function AvoidHero(handle: Handle<{ view: Extract<OnboardingView, { step: 'pantangan' }> }>) {
  return () => {
    let { view } = handle.props
    let safe = view.options.filter((ingredient) => !view.chosen.includes(ingredient.id) && ingredient.imageUrl).slice(0, 3)
    let safeSpots = [
      'left-3.5 top-[96px] size-[58px] rotate-[8deg] rounded-[16px]',
      'right-[22px] top-3 size-[52px] -rotate-[10deg] rounded-[15px]',
      'right-3 top-[100px] size-12 rotate-[6deg] rounded-[14px]',
    ]
    let hiddenSpots = ['left-[74px] top-4 size-[60px] -rotate-[8deg] rounded-[17px]', 'right-[78px] top-[80px] size-14 rotate-[10deg] rounded-[16px]']
    return (
      <div class="relative h-[170px] overflow-hidden rounded-lg bg-subtle" aria-hidden="true">
        {safe.map((ingredient, i) => (
          <PhotoTile key={ingredient.id} src={ingredient.imageUrl} class={safeSpots[i]!} />
        ))}
        {view.avoided.slice(0, 2).map((ingredient, i) => (
          <PhotoTile key={ingredient.id} src={ingredient.imageUrl} label={ingredient.name} class={hiddenSpots[i]!} />
        ))}
        <Lens class="top-2 left-[calc(50%-75px)] size-[150px]" />
        <FilterLabel view={view} class="bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5" />
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// 15d Selesai

function DoneStep() {
  return () => (
    <ActionBar
      note={
        <a href={onboardingHref('selera')} class="text-sm font-medium text-muted hover:text-ink">
          Ubah pilihan
        </a>
      }
    >
      <ButtonLink href={`${routes.home.href()}?tab=untukmu#inspirasi`} class={mainButton}>
        Mulai jelajahi
      </ButtonLink>
    </ActionBar>
  )
}

/** A fanned stack of the top three "Untukmu" recipes, best match in front. */
function CardFan(handle: Handle<{ recipes: RecipeSummary[]; compact?: boolean }>) {
  return () => {
    let { recipes, compact } = handle.props
    let [front, left, right] = recipes
    if (!front) {
      return <p class="absolute inset-x-6 top-1/3 text-center text-sm text-faint">Resep untukmu akan muncul di sini.</p>
    }
    let card = (recipe: RecipeSummary, tag: boolean, place: string) => (
      <div
        key={recipe.id}
        class={cn(
          'absolute flex flex-col bg-white shadow-[0_28px_60px_#00000059]',
          compact ? 'w-[200px] gap-2.5 rounded-[18px] p-2' : 'w-[288px] gap-3.5 rounded-[25px] p-3',
          place,
        )}
      >
        <div
          class={cn('relative bg-hover bg-cover bg-center', compact ? 'h-[184px] rounded-xl p-2' : 'h-[265px] rounded-2xl p-3')}
          style={recipe.imageUrl ? { backgroundImage: `url("${recipe.imageUrl}")` } : undefined}
        >
          {tag && (
            <span class={cn('inline-block rounded-full bg-bg font-medium text-ink', compact ? 'px-[9px] py-1 text-[11px]' : 'px-3 py-1.5 text-sm')}>
              Paling cocok untukmu
            </span>
          )}
        </div>
        <div class={cn('flex flex-col', compact ? 'gap-0.5 px-[5px] pb-[5px]' : 'gap-[3px] px-[7px] pb-[7px]')}>
          <p class={cn('truncate font-medium text-ink', compact ? 'text-sm' : 'text-xl')}>{recipe.title}</p>
          <p class={cn('truncate text-muted', compact ? 'text-[11px]' : 'text-[15px]')}>
            {[recipe.categories[0], formatMinutes(recipe.totalMinutes)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    )
    return (
      <div class={cn('absolute left-1/2 -translate-x-1/2', compact ? 'top-9 h-[248px] w-[200px]' : 'top-[100px] h-[357px] w-[288px]')}>
        {left && card(left, false, cn('-rotate-12', compact ? '-left-[54px] top-0' : '-left-[122px] top-0'))}
        {right && card(right, false, cn('rotate-12', compact ? '-right-[54px] top-0' : '-right-[122px] -top-5'))}
        {card(front, true, 'inset-x-0 top-0')}
      </div>
    )
  }
}
