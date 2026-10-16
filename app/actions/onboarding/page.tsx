import type { Handle, RemixNode } from 'remix/component'

import type { PantryRecipe } from '../../data/pantry.ts'
import type { CategoryTile } from '../../data/preferences.ts'
import type { Category } from '../../data/recipes.ts'
import { difficultyLabel, formatMinutes } from '../../domain/format.ts'
import { MIN_FAVORITE_CATEGORIES, type OnboardingStep, joinNames, previousStep, stepNumber } from '../../domain/onboarding.ts'
import type { PantryIngredient, PantryMatch } from '../../domain/pantry.ts'
import type { RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { Document } from '../../ui/document.tsx'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { inputClass } from '../../ui/input.tsx'
import { CsrfField, Logo } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { cn, pageX } from '../../ui/utils.ts'

export function onboardingHref(step: OnboardingStep): string {
  return step === 'selera' ? routes.onboarding.index.href() : `${routes.onboarding.index.href()}?langkah=${step}`
}

export type OnboardingView =
  | { step: 'selera'; tiles: CategoryTile[]; selected: number[]; preview: RecipeSummary[] }
  | {
      step: 'dapur'
      selected: PantryIngredient[]
      quickAdd: PantryIngredient[]
      matchCount: number
      matches: PantryMatch<PantryRecipe>[]
    }
  | {
      step: 'pantangan'
      options: PantryIngredient[]
      chosen: string[]
      favorites: Category[]
      avoided: PantryIngredient[]
      shownCount: number
      shown: RecipeSummary[]
      hidden: { recipe: RecipeSummary; avoided: PantryIngredient[] } | null
    }
  | {
      step: 'selesai'
      favorites: Category[]
      pantryCount: number
      avoided: PantryIngredient[]
      shownCount: number
      shown: RecipeSummary[]
    }

const headingClass = 'text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink lg:text-[52px] lg:leading-[57px] lg:tracking-[-0.52px]'
const leadClass = 'text-sm leading-[21px] tracking-[0.28px] text-muted lg:text-base lg:leading-6 lg:tracking-[0.32px]'
const groupHead = 'text-sm font-medium tracking-[0.28px] text-ink'
const chipClass =
  'inline-flex h-[33px] items-center gap-1.5 rounded-full border border-outline px-3.5 text-sm tracking-[0.28px] text-ink transition-colors'
const nextButton = 'h-[45px] w-full text-[15px] sm:w-[200px]'

interface PanelCopy {
  eyebrow: string
  line1: string
  line2: string
  body: string
}

const FEED_PANEL: PanelCopy = {
  eyebrow: 'Pratinjau berandamu',
  line1: 'Berandamu,',
  line2: 'sesuai seleramu.',
  body: 'Setiap pilihanmu langsung mengubah resep yang kami tampilkan.',
}

const PANELS: Record<OnboardingStep, PanelCopy> = {
  selera: FEED_PANEL,
  dapur: {
    eyebrow: 'Cari dari bahan',
    line1: 'Masak dari yang ada,',
    line2: 'bukan dari nol.',
    body: 'Tandai bahan yang sering kamu simpan, kami tunjukkan resep yang bisa langsung dimasak.',
  },
  pantangan: FEED_PANEL,
  selesai: {
    eyebrow: 'Semua siap',
    line1: 'Selamat datang',
    line2: 'di dapurmu.',
    body: 'Berandamu kini terisi resep yang sesuai selera, isi dapur, dan pantanganmu.',
  },
}

/** pen.dev 15a–15d. */
export function OnboardingPage(handle: Handle<{ shell: Shell; view: OnboardingView; error?: string }>) {
  return () => {
    let { shell, view, error } = handle.props
    let content: { title: string; lead: string; form: RemixNode; preview: RemixNode }
    if (view.step === 'selera') {
      content = {
        title: 'Masakan apa yang bikin kamu lapar?',
        lead: `Pilih minimal ${MIN_FAVORITE_CATEGORIES}. Kami pakai ini untuk menyusun berandamu — bisa diubah kapan saja.`,
        form: <TasteStep shell={shell} view={view} />,
        preview: <TastePreview recipes={view.preview} />,
      }
    } else if (view.step === 'dapur') {
      content = {
        title: 'Apa yang biasanya ada di dapurmu?',
        lead: 'Tambahkan bahan yang sering kamu simpan. Kami akan mencocokkan resep yang bisa langsung kamu masak.',
        form: <PantryStep shell={shell} view={view} />,
        preview: <PantryPreview view={view} />,
      }
    } else if (view.step === 'pantangan') {
      content = {
        title: 'Ada pantangan atau alergi?',
        lead: 'Pilih bahan yang kamu hindari. Resep yang memakainya tidak akan muncul di rekomendasimu.',
        form: <AvoidStep shell={shell} view={view} />,
        preview: <AvoidPreview view={view} />,
      }
    } else {
      content = {
        title: 'Dapurmu siap!',
        lead: 'Berandamu sudah disusun dari pilihanmu. Semua bisa diubah kapan saja lewat halaman ini.',
        form: <DoneStep view={view} />,
        preview: <DonePreview view={view} />,
      }
    }

    let panel = PANELS[view.step]
    return (
      <Document title={content.title} bodyClass="bg-bg">
        <div class="flex min-h-dvh flex-col">
          <header class={cn(pageX, 'flex h-[60px] shrink-0 items-center justify-between lg:h-[72px]')}>
            <Logo />
            <a href={routes.home.href()} class="flex items-center gap-1.5 text-sm tracking-[0.28px] text-muted hover:text-ink">
              Lewati untuk sekarang
              <Icon name="arrow-right" size={16} />
            </a>
          </header>
          <main
            id="konten"
            class={cn(
              pageX,
              'flex flex-1 flex-col pt-8 pb-10 lg:grid lg:grid-cols-[minmax(0,428px)_minmax(0,668px)] lg:justify-between lg:gap-12 lg:pt-2',
            )}
          >
            <div class="flex flex-col gap-10 lg:justify-center lg:py-10">
              <div class="flex flex-col gap-3">
                <StepProgress step={view.step} />
                <h1 class={headingClass}>{content.title}</h1>
                <p class={leadClass}>{content.lead}</p>
              </div>
              {error && <Alert variant="destructive">{error}</Alert>}
              {content.form}
            </div>
            <aside
              aria-label={panel.eyebrow}
              class="hidden min-w-0 flex-col justify-center gap-10 self-center rounded-lg bg-surface-dark bg-[radial-gradient(ellipse_65%_40%_at_50%_32%,#D2693F59_0%,#D2693F00_100%)] p-12 lg:flex"
            >
              <div class="flex flex-col gap-4 rounded-lg bg-bg p-6 text-ink shadow-[0_24px_60px_#00000033]">{content.preview}</div>
              <div class="flex flex-col gap-4">
                <p class="text-sm font-medium tracking-[0.28px] text-sand">{panel.eyebrow}</p>
                <p class="text-[48px] leading-[53px] tracking-[-0.48px] text-white">
                  {panel.line1}
                  <span class="block text-lilac">{panel.line2}</span>
                </p>
                <p class="max-w-[480px] text-[17px] leading-[26px] tracking-[0.34px] text-faint">{panel.body}</p>
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

function StepProgress(handle: Handle<{ step: OnboardingStep }>) {
  return () => {
    let current = stepNumber(handle.props.step)
    return (
      <p class="flex items-center gap-2.5 text-xs tracking-[0.24px] text-muted">
        <span class="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} class={cn('h-1 w-6 rounded-full', n <= current ? 'bg-accent' : 'bg-line-strong')} />
          ))}
        </span>
        Langkah {current} dari 4
      </p>
    )
  }
}

/** Footer row of each step: a status note or "Kembali" on the left, "Lanjut" on the right. */
function StepActions(handle: Handle<{ step: OnboardingStep; note?: string; label?: string }>) {
  return () => {
    let { step, note, label = 'Lanjut' } = handle.props
    let back = previousStep(step)
    return (
      <div class="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        {note ? (
          <p class="text-center text-sm tracking-[0.28px] text-muted sm:text-left">{note}</p>
        ) : back ? (
          <a href={onboardingHref(back)} class="flex items-center justify-center gap-1.5 text-sm tracking-[0.28px] text-muted hover:text-ink">
            <Icon name="arrow-left" size={16} />
            Kembali
          </a>
        ) : (
          <span />
        )}
        <Button type="submit" name="lanjut" value="1" class={nextButton}>
          {label}
          <Icon name="arrow-right" />
        </Button>
      </div>
    )
  }
}

function StepForm(handle: Handle<{ shell: Shell; step: OnboardingStep; children?: RemixNode }>) {
  return () => (
    <form method="post" action={routes.onboarding.action.href()} data-autosubmit class="flex flex-col gap-10">
      <CsrfField token={handle.props.shell.csrfToken} />
      <input type="hidden" name="langkah" value={handle.props.step} />
      {handle.props.children}
    </form>
  )
}

// ---------------------------------------------------------------------------
// 15a Selera

function TasteStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'selera' }> }>) {
  return () => {
    let { shell, view } = handle.props
    return (
      <StepForm shell={shell} step="selera">
        <fieldset class="flex flex-col gap-3.5">
          <legend class={cn(groupHead, 'mb-3.5')}>Kategori favorit</legend>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {view.tiles.map((tile) => (
              <label
                key={tile.id}
                class="group relative flex aspect-[136/132] cursor-pointer flex-col justify-between overflow-hidden rounded-md border-2 border-line bg-hover p-2 transition-colors has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
              >
                {tile.imageUrl && <img src={tile.imageUrl} alt="" class="absolute inset-0 size-full object-cover" loading="lazy" />}
                <input type="checkbox" name="kategori" value={String(tile.id)} checked={view.selected.includes(tile.id)} class="peer sr-only" />
                <span
                  class="relative flex size-5 items-center justify-center self-end rounded-full border border-white/70 bg-white/20 text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white"
                  aria-hidden="true"
                >
                  <Icon name="check" size={12} />
                </span>
                <span class="relative self-start rounded-full bg-ink/80 px-2.5 py-1 text-xs tracking-[0.24px] text-white">
                  {tile.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <StepActions step="selera" note={`${view.selected.length} dipilih · minimal ${MIN_FAVORITE_CATEGORIES}`} />
      </StepForm>
    )
  }
}

function TastePreview(handle: Handle<{ recipes: RecipeSummary[] }>) {
  return () => {
    let [featured, ...rest] = handle.props.recipes
    return (
      <>
        <p class="text-[15px] font-medium tracking-[0.3px]">Untukmu hari ini</p>
        {featured ? (
          <>
            <div class="relative flex h-[240px] items-end overflow-hidden rounded-md bg-hover p-3.5">
              {featured.imageUrl && <img src={featured.imageUrl} alt="" class="absolute inset-0 size-full object-cover" />}
              <div class="relative flex flex-col gap-1 rounded-sm bg-ink/85 px-3.5 py-2.5">
                <span class="text-xs tracking-[0.24px] text-peach">Paling cocok</span>
                <span class="text-lg leading-[22px] text-white">{featured.title}</span>
              </div>
            </div>
            {rest.map((recipe) => (
              <RecipeRow key={recipe.id} recipe={recipe} />
            ))}
          </>
        ) : (
          <PreviewEmpty text="Pilih kategori untuk melihat resep yang cocok." />
        )}
      </>
    )
  }
}

function RecipeRow(handle: Handle<{ recipe: RecipeSummary; note?: RemixNode; badge?: RemixNode; muted?: boolean }>) {
  return () => {
    let { recipe, note, badge, muted } = handle.props
    return (
      <div class={cn('flex items-center gap-3.5 rounded-md border border-line p-3', muted ? 'bg-subtle' : 'bg-subtle/60')}>
        <Thumb src={recipe.imageUrl} class={cn('size-14', muted && 'opacity-50 grayscale')} />
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span class={cn('truncate text-[15px]', muted ? 'text-faint' : 'text-ink')}>{recipe.title}</span>
          {note ?? (
            <span class="truncate text-[13px] tracking-[0.26px] text-muted">
              {[recipe.categories[0], formatMinutes(recipe.totalMinutes), difficultyLabel(recipe.difficulty)].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        {badge}
      </div>
    )
  }
}

function Thumb(handle: Handle<{ src: string | null; class?: string }>) {
  return () =>
    handle.props.src ? (
      <img src={handle.props.src} alt="" class={cn('shrink-0 rounded-sm object-cover', handle.props.class)} loading="lazy" />
    ) : (
      <span class={cn('shrink-0 rounded-sm bg-hover', handle.props.class)} />
    )
}

function PreviewEmpty(handle: Handle<{ text: string }>) {
  return () => <p class="rounded-md bg-subtle px-4 py-10 text-center text-sm text-muted">{handle.props.text}</p>
}

// ---------------------------------------------------------------------------
// 15b Dapurmu

function PantryStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'dapur' }> }>) {
  return () => {
    let { shell, view } = handle.props
    return (
      <StepForm shell={shell} step="dapur">
        {view.selected.map((ingredient) => (
          <input key={ingredient.id} type="hidden" name="bahan" value={ingredient.id} />
        ))}
        <div class="flex flex-col gap-8">
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
              class={cn(inputClass, 'h-full flex-1 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0')}
            />
            <Button type="submit" size="sm" class="h-[37px] px-4 text-sm">
              Tambah
            </Button>
          </div>
          <div class="flex flex-col gap-3.5">
            <div class="flex items-center justify-between gap-3">
              <p class={groupHead}>Sudah ada di dapurmu</p>
              {view.selected.length > 0 && (
                <button type="submit" name="hapus_semua" value="1" class="text-[13px] tracking-[0.26px] text-muted hover:text-ink">
                  Hapus semua
                </button>
              )}
            </div>
            {view.selected.length > 0 ? (
              <ul class="flex flex-wrap gap-2">
                {view.selected.map((ingredient) => (
                  <li key={ingredient.id} class={cn(chipClass, 'bg-hover pr-2')}>
                    {ingredient.name}
                    <button
                      type="submit"
                      name="hapus"
                      value={ingredient.id}
                      aria-label={`Hapus ${ingredient.name}`}
                      class="flex size-6 items-center justify-center rounded-full text-muted hover:bg-hover-strong hover:text-ink"
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
          {view.quickAdd.length > 0 && (
            <div class="flex flex-col gap-3.5">
              <p class={groupHead}>Saran cepat</p>
              <ul class="flex flex-wrap gap-2">
                {view.quickAdd.map((ingredient) => (
                  <li key={ingredient.id}>
                    <button type="submit" name="tambah_id" value={ingredient.id} class={cn(chipClass, 'bg-bg hover:bg-hover')}>
                      <Icon name="plus" size={14} />
                      {ingredient.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <StepActions step="dapur" note={`${view.selected.length} bahan · bisa ditambah nanti`} />
      </StepForm>
    )
  }
}

function PantryPreview(handle: Handle<{ view: Extract<OnboardingView, { step: 'dapur' }> }>) {
  return () => {
    let { view } = handle.props
    return (
      <>
        <p class="text-[15px] font-medium tracking-[0.3px]">Bisa kamu masak</p>
        <div class="flex flex-col gap-2 py-6">
          <p class="flex items-baseline gap-2.5">
            <span class="text-[96px] leading-none tracking-[-2px]">{view.matchCount}</span>
            <span class="text-2xl text-muted">resep</span>
          </p>
          <p class="text-sm tracking-[0.28px] text-muted">
            {view.selected.length > 0 ? `memakai ${view.selected.length} bahan di dapurmu` : 'Tambahkan bahan untuk mulai mencocokkan.'}
          </p>
        </div>
        {view.matches.map((match) => (
          <div key={match.recipe.id} class="flex items-center gap-3.5 rounded-md border border-line bg-subtle p-3">
            <Thumb src={match.recipe.imageUrl} class="size-14" />
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <div class="flex items-center justify-between gap-3">
                <span class="truncate text-[15px]">{match.recipe.title}</span>
                <span class={cn('shrink-0 text-xs', match.missing.length === 0 ? 'text-accent-strong' : 'text-muted')}>
                  {match.matchedCount}/{match.requiredCount} bahan
                </span>
              </div>
              <span class="h-1 overflow-hidden rounded-full bg-line">
                <span
                  class={cn('block h-full rounded-full', match.missing.length === 0 ? 'bg-accent' : 'bg-coral')}
                  style={{ width: `${match.percent}%` }}
                />
              </span>
              <span class="truncate text-xs text-faint">
                {match.missing.length === 0 ? 'Semua bahan tersedia' : `Kurang: ${match.missing.map((i) => i.name).join(', ')}`}
              </span>
            </div>
          </div>
        ))}
      </>
    )
  }
}

// ---------------------------------------------------------------------------
// 15c Pantangan

function AvoidStep(handle: Handle<{ shell: Shell; view: Extract<OnboardingView, { step: 'pantangan' }> }>) {
  return () => {
    let { shell, view } = handle.props
    return (
      <StepForm shell={shell} step="pantangan">
        <fieldset class="flex flex-col gap-3.5">
          <div class="flex items-center justify-between gap-3">
            <legend class={groupHead}>Hindari bahan ini</legend>
            <span class="text-xs text-faint">{view.chosen.length} dipilih</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {view.options.map((ingredient) => (
              <label
                key={ingredient.id}
                class={cn(
                  chipClass,
                  'cursor-pointer bg-hover has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
                )}
              >
                <input type="checkbox" name="hindari" value={ingredient.id} checked={view.chosen.includes(ingredient.id)} class="peer sr-only" />
                <Icon name="check" size={14} class="hidden peer-checked:block" />
                {ingredient.name}
              </label>
            ))}
          </div>
          <div class="flex h-11 items-center gap-2 rounded-md border border-line pr-1.5 pl-3.5 focus-within:border-outline">
            <label for="tambah-pantangan" class="sr-only">
              Tambah bahan lain yang dihindari
            </label>
            <input
              id="tambah-pantangan"
              type="text"
              name="tambah"
              placeholder="Tambah lainnya, mis. jamur"
              autocomplete="off"
              class={cn(inputClass, 'h-full flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0')}
            />
            <Button type="submit" variant="ghost" size="sm" class="text-accent-strong">
              <Icon name="plus" />
              Tambah
            </Button>
          </div>
          <p class="text-xs leading-[18px] text-muted">
            Kami menyaring dari daftar bahan resep. Tetap periksa bahan dan label kemasan jika kamu punya alergi.
          </p>
        </fieldset>
        <StepActions step="pantangan" />
      </StepForm>
    )
  }
}

function AvoidPreview(handle: Handle<{ view: Extract<OnboardingView, { step: 'pantangan' }> }>) {
  return () => {
    let { view } = handle.props
    let pills: { icon: IconName; label: string }[] = [
      ...view.favorites.map((category) => ({ icon: 'chef-hat' as const, label: category.name })),
      ...view.avoided.map((ingredient) => ({ icon: 'x' as const, label: `Tanpa ${ingredient.name.toLowerCase()}` })),
    ]
    return (
      <>
        {pills.length > 0 && (
          <div class="flex flex-col gap-2.5">
            <p class="text-[13px] tracking-[0.26px] text-muted">Filter aktif dari pilihanmu</p>
            <ul class="flex flex-wrap gap-1.5">
              {pills.map((pill) => (
                <li key={pill.label} class="flex items-center gap-1 rounded-full border border-line bg-subtle px-2.5 py-1 text-xs text-muted">
                  <Icon name={pill.icon} size={12} />
                  {pill.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div class="flex items-center justify-between gap-3 pt-2">
          <p class="text-base">Untukmu hari ini</p>
          <p class="text-xs text-faint">{view.shownCount} resep cocok</p>
        </div>
        {view.shown.map((recipe) => (
          <RecipeRow
            key={recipe.id}
            recipe={recipe}
            badge={
              <span class="flex shrink-0 items-center gap-1 rounded-full bg-accent-subtle px-2 py-1 text-[11px] text-accent-strong">
                <Icon name="check" size={11} />
                Cocok
              </span>
            }
          />
        ))}
        {view.hidden && (
          <RecipeRow
            recipe={view.hidden.recipe}
            muted
            note={
              <span class="flex items-center gap-1.5 truncate text-[13px] text-error">
                <Icon name="eye-off" size={13} />
                Disembunyikan · mengandung {joinNames(view.hidden.avoided.map((i) => i.name.toLowerCase()))}
              </span>
            }
          />
        )}
        {view.shown.length === 0 && !view.hidden && <PreviewEmpty text="Belum ada resep yang cocok dengan pilihanmu." />}
      </>
    )
  }
}

// ---------------------------------------------------------------------------
// 15d Selesai

function DoneStep(handle: Handle<{ view: Extract<OnboardingView, { step: 'selesai' }> }>) {
  return () => {
    let { view } = handle.props
    let rows: { icon: IconName; label: string; value: string; step: OnboardingStep }[] = [
      {
        icon: 'chef-hat',
        label: 'Kategori favorit',
        value: view.favorites.length > 0 ? view.favorites.map((c) => c.name).join(', ') : 'Belum dipilih',
        step: 'selera',
      },
      {
        icon: 'refrigerator',
        label: 'Isi dapur',
        value: view.pantryCount > 0 ? `${view.pantryCount} bahan tersimpan di dapurmu` : 'Belum ada bahan',
        step: 'dapur',
      },
      {
        icon: 'shield-check',
        label: 'Pantangan',
        value: view.avoided.length > 0 ? `Tanpa ${joinNames(view.avoided.map((i) => i.name.toLowerCase()))}` : 'Tidak ada',
        step: 'pantangan',
      },
    ]
    return (
      <div class="flex flex-col gap-10">
        <ul class="flex flex-col rounded-md bg-subtle px-[18px] py-1">
          {rows.map((row) => (
            <li key={row.label} class="flex items-center gap-3.5 border-b border-line py-3.5 last:border-b-0">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-muted">
                <Icon name={row.icon} size={16} />
              </span>
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-xs text-faint">{row.label}</span>
                <span class="text-sm text-ink">{row.value}</span>
              </span>
              <a href={onboardingHref(row.step)} class="text-[13px] font-medium text-accent-strong hover:underline">
                Ubah<span class="sr-only"> {row.label.toLowerCase()}</span>
              </a>
            </li>
          ))}
        </ul>
        <div class="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href={onboardingHref('pantangan')} class="flex items-center justify-center gap-1.5 text-sm tracking-[0.28px] text-muted hover:text-ink">
            <Icon name="arrow-left" size={16} />
            Kembali
          </a>
          <ButtonLink href={`${routes.home.href()}?tab=untukmu#inspirasi`} class={nextButton}>
            Mulai Jelajahi
            <Icon name="arrow-right" />
          </ButtonLink>
        </div>
      </div>
    )
  }
}

function DonePreview(handle: Handle<{ view: Extract<OnboardingView, { step: 'selesai' }> }>) {
  return () => {
    let { view } = handle.props
    return (
      <>
        <span class="flex items-center gap-1.5 self-start rounded-full border border-line bg-subtle px-3 py-1 text-[13px] text-muted">
          <Icon name="circle-check" size={14} class="text-accent" />4 dari 4 langkah selesai
        </span>
        <p class="flex items-end gap-3 py-2">
          <span class="text-[128px] leading-none tracking-[-3px]">{view.shownCount}</span>
          <span class="pb-3 text-xl leading-6 text-muted">
            resep cocok
            <br />
            untukmu
          </span>
        </p>
        <div class="grid grid-cols-4 gap-3">
          {view.shown.map((recipe) => (
            <div key={recipe.id} class="relative flex h-[170px] items-end overflow-hidden rounded-md bg-hover p-2">
              {recipe.imageUrl && <img src={recipe.imageUrl} alt="" class="absolute inset-0 size-full object-cover" loading="lazy" />}
              <span class="relative flex w-full flex-col rounded-[8px] bg-white/90 px-2 py-1.5">
                <span class="line-clamp-2 text-xs text-ink">{recipe.title}</span>
                {recipe.categories[0] && <span class="text-[11px] text-muted">{recipe.categories[0]}</span>}
              </span>
            </div>
          ))}
        </div>
      </>
    )
  }
}
