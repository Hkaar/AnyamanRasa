import type { Handle, RemixNode } from 'remix/component'

import type { PantryRecipe } from '../data/pantry.ts'
import type { HomeTab } from '../data/recipes.ts'
import { difficultyLabel, formatCount, formatMinutes } from '../domain/format.ts'
import type { GraphNeighborhood } from '../domain/graph.ts'
import type { PantryIngredient, PantryMatch } from '../domain/pantry.ts'
import type { RecipeSummary } from '../domain/types.ts'
import { routes } from '../routes.ts'
import { GraphPreview } from '../ui/graph-preview.tsx'
import { Icon, type IconName } from '../ui/icon.tsx'
import { SiteLayout } from '../ui/layout.tsx'
import { RecipeCard } from '../ui/recipe-card.tsx'
import type { Shell } from '../ui/shell.ts'
import { Button, ButtonLink } from '../ui/button.tsx'
import { badgeVariants } from '../ui/badge.tsx'
import { tabsListClass, tabsTriggerClass } from '../ui/tabs.tsx'
import { cn, pageX } from '../ui/utils.ts'

export interface HomePageProps {
  shell: Shell
  tab: HomeTab
  recipes: RecipeSummary[]
  featured: RecipeSummary | null
  stats: { recipes: number; ingredients: number; variations: number }
  pantry: PantryIngredient[]
  suggestions: PantryIngredient[]
  pantryMatches: PantryMatch<PantryRecipe>[]
  pantryMatchCount: number
  graph: GraphNeighborhood | null
}

const TABS: { key: HomeTab; label: string }[] = [
  { key: 'populer', label: 'Populer' },
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'cepat', label: 'Cepat Saji' },
]

/** Large section headings (pen.dev "Section Title": 60/66, regular weight). */
const sectionTitle =
  'text-[36px] leading-[1.08] tracking-[-0.5px] lg:text-[60px] lg:leading-[66px] lg:tracking-[-0.6px]'
const sectionDesc = 'text-[15px] leading-[1.55] tracking-[0.02em] lg:text-[17px] lg:leading-[26px]'

export function HomePage(handle: Handle<HomePageProps>) {
  return () => {
    let { shell, recipes, featured, stats } = handle.props
    let signedIn = shell.viewer !== null
    return (
      <SiteLayout shell={shell} active="home">
        <Hero featured={featured} />
        <Highlights recipes={recipes} featured={featured} />
        <Inspiration tab={handle.props.tab} recipes={recipes} />
        <PantryIntro
          pantry={handle.props.pantry}
          suggestions={handle.props.suggestions}
          matches={handle.props.pantryMatches}
          matchCount={handle.props.pantryMatchCount}
        />
        <GraphIntro stats={stats} graph={handle.props.graph} />
        <Pricing />
        <Faq />
        <FinalCta recipes={recipes} featured={featured} signedIn={signedIn} />
      </SiteLayout>
    )
  }
}

function SearchForm(handle: Handle<{ id: string; placeholder: string; class?: string }>) {
  return () => (
    <form
      action={routes.recipes.index.href()}
      role="search"
      class={cn(
        'flex h-[52px] items-center gap-2.5 rounded-md border border-outline bg-bg pr-2 pl-4 focus-within:border-accent lg:h-14',
        handle.props.class,
      )}
    >
      <Icon name="search" size={18} class="text-muted" />
      <label class="sr-only" for={handle.props.id}>
        Cari resep, bahan, atau masakan
      </label>
      <input
        id={handle.props.id}
        type="search"
        name="q"
        placeholder={handle.props.placeholder}
        class="h-full min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.02em] placeholder:text-faint focus:outline-none"
      />
      <Button type="submit" variant="default" size="sm" class="h-9 px-4 text-sm">
        Cari
      </Button>
    </form>
  )
}

function Hero(handle: Handle<{ featured: RecipeSummary | null }>) {
  return () => {
    let featured = handle.props.featured
    return (
      <section
        class="relative overflow-hidden bg-hover lg:min-h-[972px]"
        style={{
          backgroundImage:
            'linear-gradient(180deg, #3e2f2800 60%, #3e2f2814 100%), radial-gradient(ellipse 40% 45% at 5% 10%, #f2c9a066 0%, #f2c9a000 100%), radial-gradient(ellipse 45% 60% at 78% 55%, #ffffffcc 0%, #ffffff00 100%)',
        }}
      >
        <HeroArtwork />
        <div class={cn(pageX, 'relative z-10 grid gap-8 pt-10 pb-12 lg:block lg:pt-[472px] lg:pb-24')}>
          <div class="flex max-w-[880px] flex-col">
            <h1 class="text-[46px] leading-none tracking-[-1px] lg:text-[112px] lg:tracking-[-1.12px]">
              Setiap rasa
              <br />
              punya cerita.
            </h1>
            <p class="mt-[18px] max-w-[620px] text-base leading-[1.55] tracking-[0.01em] text-muted lg:mt-7 lg:text-2xl lg:leading-8">
              <span class="lg:hidden">
                Temukan resep dari dapur-dapur Indonesia, cek bahan yang kamu punya, dan telusuri variasi
                tiap masakan.
              </span>
              <span class="hidden lg:inline">Masakan rumahan seharusnya diwariskan, bukan dilupakan.</span>
            </p>
            <SearchForm id="home-search-m" placeholder="Cari resep atau bahan…" class="mt-7 lg:hidden" />
            <div class="order-last mt-3 grid grid-cols-2 gap-2 lg:order-none lg:mt-9 lg:flex lg:gap-3">
              <ButtonLink href={routes.recipes.index.href()} variant="default" size="lg">
                Mulai jelajahi
              </ButtonLink>
              <ButtonLink href={routes.pantry.index.href()} variant="outline" size="lg" class="lg:hidden">
                Cari dari Bahan
              </ButtonLink>
            </div>
          </div>
          {featured && (
            <figure class="flex flex-col gap-3 lg:hidden">
              <a
                href={routes.recipes.show.href({ id: featured.id })}
                class="block aspect-[350/320] overflow-hidden rounded-md bg-bg"
              >
                {featured.imageUrl && (
                  <img src={featured.imageUrl} alt={featured.title} class="size-full object-cover" fetchPriority="high" />
                )}
              </a>
              <figcaption class="flex justify-between gap-3.5 text-xs tracking-[0.02em]">
                <span class="font-medium">{featured.title}</span>
                <span class="text-muted">{featured.author.name} · {formatMinutes(featured.totalMinutes)}</span>
              </figcaption>
            </figure>
          )}
        </div>
      </section>
    )
  }
}

function HeroArtwork(_handle: Handle) {
  return () => (
    <div class="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      <img src="/images/generated-5.webp" alt="" class="absolute -top-5 -left-52 h-[480px] w-[700px] -rotate-[18deg] object-contain blur-[5px]" />
      <img src="/images/generated-7.webp" alt="" class="absolute -top-5 left-[37.5%] size-[1240px] object-contain" />
      <img src="/images/generated-2.webp" alt="" class="absolute top-[237px] left-[55.5%] size-[720px] object-contain" />
      <img src="/images/generated-6.webp" alt="" class="absolute top-[152px] left-[32.6%] size-[260px] object-contain" />
      <img src="/images/generated-3.webp" alt="" class="absolute top-[308px] left-[16.4%] size-[190px] object-contain" />
      <img src="/images/generated-4.webp" alt="" class="absolute top-[72px] right-4 size-[120px] object-contain" />
      <img src="/images/generated-1.webp" alt="" class="absolute top-[712px] left-[48.6%] size-[210px] object-contain" />
      <img src="/images/generated.webp" alt="" class="absolute right-[-60px] bottom-12 h-[140px] w-[420px] object-contain" />
      <p class="absolute top-[200px] left-[69.4%] w-[300px] text-[26px] leading-[31px] tracking-[-0.26px] text-ink">
        Resep rumahan Nusantara, dari satu dapur ke dapur lainnya.
      </p>
    </div>
  )
}

const TICKER = [
  'Cari resep dari bahan di dapurmu',
  'Telusuri variasi tiap masakan di Graf Resep',
  'Tulis resep keluargamu, langsung terbit',
  'Simpan resep favorit untuk dimasak lagi',
  'Atur porsi, takaran bahan ikut menyesuaikan',
]

interface Highlight {
  tag: string
  title: string
  description: string
  cta: string
  href: string
  tone: 'peach' | 'dark' | 'sand' | 'blush'
  image?: string | null
}

/** pen.dev "Promo Banner": a ticker and a scroller of feature cards. */
function Highlights(handle: Handle<{ recipes: RecipeSummary[]; featured: RecipeSummary | null }>) {
  return () => {
    let { recipes, featured } = handle.props
    let images = [...new Set([featured, ...recipes].map((recipe) => recipe?.imageUrl).filter(Boolean))]
    let cards: Highlight[] = [
      {
        tag: 'Komunitas',
        title: 'Tulis resep dari daerahmu',
        description: 'Bagikan masakan keluargamu, lalu lihat dapur lain membuat variasinya.',
        cta: 'Tulis resep',
        href: routes.recipes.create.index.href(),
        tone: 'peach',
        image: images[0],
      },
      {
        tag: 'Cari dari Bahan',
        title: 'Masak dari isi dapurmu',
        description: 'Pilih bahan yang kamu punya, kami urutkan resep yang paling lengkap bahannya.',
        cta: 'Coba sekarang',
        href: routes.pantry.index.href(),
        tone: 'dark',
      },
      {
        tag: 'Graf Resep',
        title: 'Telusuri silsilah sebuah resep',
        description: 'Lihat bagaimana satu masakan bercabang menjadi variasi di dapur lain.',
        cta: 'Buka graf',
        href: routes.graph.index.href(),
        tone: 'sand',
        image: images[1],
      },
      {
        tag: 'Porsi',
        title: 'Atur porsi sesuai mejamu',
        description: 'Ubah jumlah porsi di halaman resep, takaran bahan menyesuaikan otomatis.',
        cta: 'Pilih resep',
        href: routes.recipes.index.href(),
        tone: 'blush',
        image: images[2],
      },
    ]
    return (
      <section aria-labelledby="sorotan" class="overflow-hidden">
        <div class="flex h-12 items-center overflow-hidden bg-surface-dark lg:h-14" aria-hidden="true">
          <div class="flex w-max animate-marquee text-[15px] tracking-[0.02em] whitespace-nowrap text-white lg:text-base">
            {[...TICKER, ...TICKER].map((item, index) => (
              <span key={index} class="flex items-center gap-9 pr-9">
                <Icon name="sparkle" size={14} class="text-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div class="flex flex-col gap-6 pt-12 pb-14 lg:gap-7 lg:pt-14 lg:pb-[88px]">
          <div class={cn(pageX, 'flex items-end justify-between gap-6')} data-reveal>
            <div class="flex flex-col gap-2.5">
              <p class="text-sm font-medium tracking-[0.02em] text-accent-strong">Sorotan</p>
              <h2 id="sorotan" class="text-[28px] leading-[1.1] tracking-[-0.3px] lg:text-4xl lg:leading-10 lg:tracking-[-0.36px]">
                Yang bisa kamu lakukan di AnyamanRasa
              </h2>
            </div>
            <div class="hidden items-center gap-2 md:flex">
              <button
                type="button"
                class="flex size-11 cursor-pointer items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:bg-hover"
                aria-label="Sorotan sebelumnya"
                aria-controls="sorotan-list"
                data-scroll-by="-1"
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <button
                type="button"
                class="flex size-11 cursor-pointer items-center justify-center rounded-full border border-outline text-ink transition-colors hover:bg-hover"
                aria-label="Sorotan berikutnya"
                aria-controls="sorotan-list"
                data-scroll-by="1"
              >
                <Icon name="arrow-right" size={18} />
              </button>
            </div>
          </div>
          <ul
            id="sorotan-list"
            class="flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:scroll-px-10 md:px-10 lg:gap-5 xl:scroll-px-[max(120px,calc((100vw-1200px)/2))] xl:px-[max(120px,calc((100vw-1200px)/2))]"
            data-reveal-group
          >
            {cards.map((card) => (
              <li key={card.title} class="shrink-0 snap-start">
                <HighlightCard card={card} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }
}

const HIGHLIGHT_TONES: Record<Highlight['tone'], string> = {
  peach: 'bg-linear-[116deg] from-peach from-15% to-coral to-85%',
  dark: 'bg-surface-dark text-white',
  sand: 'bg-hover',
  blush: 'bg-accent-subtle',
}

function HighlightCard(handle: Handle<{ card: Highlight }>) {
  return () => {
    let { card } = handle.props
    let dark = card.tone === 'dark'
    let withImage = Boolean(card.image)
    return (
      <article
        class={cn(
          'group relative flex h-[260px] overflow-hidden rounded-lg',
          withImage ? 'w-[300px] sm:w-[520px]' : 'w-[300px] sm:w-[400px]',
          HIGHLIGHT_TONES[card.tone],
        )}
      >
        <div class="flex flex-1 flex-col justify-between p-6 lg:p-7">
          <div class="flex flex-col gap-3.5">
            <span
              class={cn(
                'self-start rounded-full border px-3 py-1 text-xs tracking-[0.02em]',
                dark ? 'border-white text-white' : 'border-outline text-ink',
              )}
            >
              {card.tag}
            </span>
            <h3 class="text-2xl leading-[1.1] tracking-[-0.28px] lg:text-[28px]">{card.title}</h3>
            <p class={cn('text-[15px] leading-[22px] tracking-[0.02em]', dark ? 'text-sand' : 'text-muted')}>
              {card.description}
            </p>
          </div>
          {dark ? (
            <ButtonLink href={card.href} variant="default" class="self-start after:absolute after:inset-0">
              {card.cta}
              <Icon name="arrow-right" />
            </ButtonLink>
          ) : (
            <a
              href={card.href}
              class="flex items-center gap-2 self-start text-[15px] tracking-[0.02em] after:absolute after:inset-0 group-hover:underline"
            >
              {card.cta}
              <Icon name="arrow-up-right" />
            </a>
          )}
        </div>
        {card.image && (
          <img src={card.image} alt="" loading="lazy" class="hidden w-[200px] shrink-0 object-cover sm:block" />
        )}
      </article>
    )
  }
}

function Inspiration(handle: Handle<{ tab: HomeTab; recipes: RecipeSummary[] }>) {
  return () => {
    let { tab, recipes } = handle.props
    let [first, ...rest] = recipes
    return (
      <section aria-labelledby="inspirasi" class="scroll-mt-[60px] bg-hover lg:scroll-mt-[72px]">
        <div class={cn(pageX, 'flex flex-col gap-8 py-14 lg:gap-16 lg:pt-32 lg:pb-[136px]')}>
          <div class="flex flex-col gap-6 lg:gap-9" data-reveal>
            <div class="flex flex-wrap items-end justify-between gap-6">
              <div class="flex flex-col gap-3 lg:gap-4">
                <h2 id="inspirasi" class={sectionTitle}>
                  Temukan Inspirasi Masakan
                </h2>
                <p class={cn(sectionDesc, 'text-muted')}>
                  Pilihan resep dari komunitas, dari sarapan cepat hingga masakan perayaan.
                </p>
              </div>
              <a
                href={routes.recipes.index.href()}
                class="hidden items-center gap-1.5 py-1 text-base tracking-[0.02em] hover:underline lg:flex"
              >
                Lihat semua resep
                <Icon name="arrow-up-right" size={18} />
              </a>
            </div>
            <nav aria-label="Urutan inspirasi" class="border-b border-line pb-5">
              <ul class={tabsListClass}>
                {TABS.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.key === 'populer' ? '/#inspirasi' : `/?tab=${item.key}#inspirasi`}
                      aria-current={tab === item.key ? 'true' : undefined}
                      class={tabsTriggerClass(tab === item.key)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {/* Desktop: 3-column grid. Mobile: one large card then a 2-column grid. */}
          <div class="hidden grid-cols-2 gap-x-6 gap-y-14 md:grid lg:grid-cols-3" data-reveal-group>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} size="large" />
            ))}
          </div>
          <div class="flex flex-col gap-6 md:hidden">
            {first && <RecipeCard recipe={first} size="large" />}
            <div class="grid grid-cols-2 gap-x-3.5 gap-y-6" data-reveal-group>
              {rest.slice(0, 4).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} size="compact" />
              ))}
            </div>
          </div>
          <ButtonLink href={routes.recipes.index.href()} variant="outline" size="lg" class="md:hidden">
            Lihat semua resep
          </ButtonLink>
        </div>
      </section>
    )
  }
}

function PantryIntro(
  handle: Handle<{
    pantry: PantryIngredient[]
    suggestions: PantryIngredient[]
    matches: PantryMatch<PantryRecipe>[]
    matchCount: number
  }>,
) {
  return () => {
    let { pantry, suggestions, matches, matchCount } = handle.props
    let pantryHref = `${routes.pantry.index.href()}?${pantry.map((i) => `bahan=${i.id}`).join('&')}`
    return (
      <section
        aria-labelledby="pantry-intro"
        class="bg-bg bg-linear-[107deg] from-peach/70 from-10% via-coral/70 to-[#ebcfc0b3] to-90%"
      >
        <div class={cn(pageX, 'grid items-center gap-6 py-14 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-24 lg:py-[136px]')}>
          <div class="flex flex-col gap-5 lg:gap-7" data-reveal>
            <h2 id="pantry-intro" class={sectionTitle}>
              Punya Bahan? <br class="hidden lg:inline" />
              Temukan Resepnya.
            </h2>
            <p class={sectionDesc}>
              <span class="lg:hidden">
                Pilih bahan di dapurmu, kami urutkan resep yang paling lengkap bahannya.
              </span>
              <span class="hidden lg:inline">
                Pilih bahan yang ada di dapurmu. AnyamanRasa mengurutkan resep dari yang paling lengkap
                bahannya, lengkap dengan bahan yang masih kurang.
              </span>
            </p>
            <ul class="hidden flex-col gap-2.5 pt-1 pb-3 lg:flex">
              {['Tanpa perlu belanja ulang', 'Lihat bahan yang kurang sekilas', 'Simpan daftar bahan favoritmu'].map(
                (point) => (
                  <li key={point} class="flex items-center gap-2.5 text-sm">
                    <Icon name="check" class="text-accent-strong" />
                    {point}
                  </li>
                ),
              )}
            </ul>
            <ButtonLink href={routes.pantry.index.href()} variant="default" size="lg" class="hidden self-start lg:inline-flex">
              <Icon name="carrot" />
              Cari dari Bahan
            </ButtonLink>
          </div>

          <div class="overflow-hidden rounded-lg bg-bg" data-reveal>
            <div class="flex flex-col gap-3 p-[18px] lg:gap-4 lg:p-7">
              <div class="flex items-baseline justify-between pb-1 lg:pb-0">
                <p class="text-sm font-medium lg:text-[15px]">Bahan di dapurmu</p>
                <p class="text-xs text-muted lg:text-[13px]">{pantry.length} dipilih</p>
              </div>
              <ul class="flex flex-wrap gap-2" aria-label="Bahan contoh">
                {pantry.map((ingredient) => (
                  <li key={ingredient.id} class={cn(badgeVariants({ variant: 'selected' }), 'border-surface-dark bg-surface-dark')}>
                    <Icon name="check" size={14} />
                    {ingredient.name}
                  </li>
                ))}
              </ul>
              <div class="flex flex-wrap items-center gap-2">
                <span class="hidden text-[13px] text-faint lg:inline">Tambah:</span>
                {suggestions.map((ingredient, index) => (
                  <a
                    key={ingredient.id}
                    href={`${pantryHref}&bahan=${ingredient.id}`}
                    class={cn(badgeVariants({ variant: 'chip' }), 'hover:bg-hover', index >= 2 && 'max-lg:hidden')}
                  >
                    {ingredient.name}
                    <Icon name="plus" size={14} class="text-muted" />
                  </a>
                ))}
              </div>
            </div>
            <div class="border-t border-line">
              <div class="flex justify-between bg-hover px-[18px] py-3 text-xs lg:px-7 lg:py-4 lg:text-[13px]">
                <p class="font-medium">{matchCount} resep cocok</p>
                <p class="hidden text-muted sm:block">Urut: bahan terlengkap</p>
              </div>
              <ul>
                {matches.map((match, index) => {
                  let complete = match.missing.length === 0
                  let width = `${match.percent}%`
                  return (
                    <li key={match.recipe.id} class={cn('border-t border-line first:border-t-0', index >= 2 && 'max-lg:hidden')}>
                      <a
                        href={routes.recipes.show.href({ id: match.recipe.id })}
                        class="flex items-center gap-3 px-[18px] py-3.5 hover:bg-subtle lg:gap-4 lg:px-7 lg:py-4"
                      >
                        <span class="size-11 shrink-0 overflow-hidden rounded-md bg-hover lg:size-[52px]">
                          {match.recipe.imageUrl && (
                            <img src={match.recipe.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
                          )}
                        </span>
                        <span class="flex min-w-0 flex-1 flex-col gap-[3px] lg:gap-1">
                          <span class="truncate text-sm font-medium tracking-[-0.2px] lg:text-[15px]">
                            {match.recipe.title}
                          </span>
                          <span class="text-xs text-muted lg:text-[13px]">
                            <span class="lg:hidden">
                              {complete ? 'Semua bahan tersedia' : `Kurang ${match.missing.length} bahan`}
                            </span>
                            <span class="hidden lg:inline">
                              {formatMinutes(match.recipe.totalMinutes)} · {difficultyLabel(match.recipe.difficulty)} ·{' '}
                              {complete ? 'semua bahan tersedia' : `kurang ${match.missing.length} bahan`}
                            </span>
                          </span>
                        </span>
                        <span class="flex shrink-0 flex-col items-end gap-1.5 lg:w-[120px]">
                          <span class={cn('text-[13px] font-medium', complete ? 'text-accent-strong' : 'text-ink')}>
                            {match.matchedCount}/{match.requiredCount}
                            <span class="hidden lg:inline"> bahan</span>
                          </span>
                          <span class="hidden h-1 w-[120px] rounded-full bg-hover lg:block" aria-hidden="true">
                            <span
                              class={cn('block h-1 origin-left rounded-full', complete ? 'bg-accent' : 'bg-muted')}
                              data-grow
                              style={{ width }}
                            />
                          </span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <ButtonLink href={pantryHref} variant="default" size="lg" class="lg:hidden">
            <Icon name="carrot" />
            Cari dari Bahan
          </ButtonLink>
        </div>
      </section>
    )
  }
}

function GraphIntro(handle: Handle<{ stats: HomePageProps['stats']; graph: GraphNeighborhood | null }>) {
  return () => {
    let { stats, graph } = handle.props
    let figures = [
      { value: formatCount(stats.recipes), label: 'resep' },
      { value: formatCount(stats.ingredients), label: 'bahan' },
      { value: formatCount(stats.variations), label: 'variasi' },
    ]
    return (
      <section aria-labelledby="graph-intro">
        <div class={cn(pageX, 'grid items-center gap-6 py-14 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)] lg:gap-14 lg:py-[136px]')}>
          <div class="flex flex-col gap-5 lg:order-last lg:gap-7" data-reveal>
            <h2 id="graph-intro" class={sectionTitle}>
              Jelajahi Hubungan Antar Resep.
            </h2>
            <p class={cn(sectionDesc, 'text-muted')}>
              Setiap resep terhubung dengan bahan, resep serupa, dan variasinya.
              <span class="hidden lg:inline">
                {' '}
                Telusuri anyaman rasa dari satu piring ke piring berikutnya.
              </span>
            </p>
            <dl class="hidden gap-8 pt-2 pb-4 lg:flex">
              {figures.map((figure) => (
                <div key={figure.label} class="flex flex-col-reverse gap-0.5">
                  <dt class="text-[13px] text-muted">{figure.label}</dt>
                  <dd class="text-[40px] leading-[44px] tracking-[-0.4px]">{figure.value}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={routes.graph.index.href()} variant="default" size="lg" class="hidden self-start lg:inline-flex">
              <Icon name="waypoints" />
              Jelajahi Graf
            </ButtonLink>
          </div>
          {graph && (
            <div data-reveal>
              <GraphPreview graph={graph} tone="dark" class="aspect-[350/320] w-full md:aspect-[700/500]" />
            </div>
          )}
          <ButtonLink href={routes.graph.index.href()} variant="default" size="lg" class="lg:hidden">
            <Icon name="waypoints" />
            Jelajahi Graf
          </ButtonLink>
        </div>
      </section>
    )
  }
}

interface Plan {
  name: string
  description: string
  /** Price per month and per year (yearly billing saves 20%). */
  monthly: string
  yearly: string
  cta: string
  featuresLabel: string
  features: string[]
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Gratis',
    description: 'Untuk kamu yang baru mulai menjelajah dapur Nusantara.',
    monthly: 'Rp0',
    yearly: 'Rp0',
    cta: 'Mulai Gratis',
    featuresLabel: 'Termasuk',
    features: [
      'Jelajahi ribuan resep komunitas',
      'Cari resep dari bahan di dapurmu',
      'Simpan hingga 20 resep',
      'Tulis & bagikan resepmu',
    ],
  },
  {
    name: 'Dapur Plus',
    description: 'Untuk juru masak rumahan yang ingin dapurnya lebih teratur.',
    monthly: 'Rp29.000',
    yearly: 'Rp278.400',
    cta: 'Coba Dapur Plus',
    featuresLabel: 'Yang kamu dapat',
    features: [
      'Semua fitur Gratis',
      'Simpan resep tanpa batas',
      'Perencana menu mingguan',
      'Daftar belanja otomatis',
      'Penjelajah Graf Resep',
      'Bebas iklan',
    ],
    featured: true,
  },
  {
    name: 'Keluarga',
    description: 'Untuk satu rumah yang memasak dan berbelanja bersama.',
    monthly: 'Rp49.000',
    yearly: 'Rp470.400',
    cta: 'Pilih Keluarga',
    featuresLabel: 'Termasuk',
    features: ['Semua fitur Dapur Plus', 'Hingga 5 anggota keluarga', 'Koleksi resep bersama', 'Daftar belanja bersama'],
  },
]

const BILLING = [
  { value: 'bulanan', label: 'Bulanan' },
  { value: 'tahunan', label: 'Tahunan' },
] as const

/**
 * pen.dev "Pricing". The Bulanan/Tahunan switch is a pair of radios; prices
 * swap with CSS (`group-has-*`), so it works without JavaScript.
 */
function Pricing(_handle: Handle) {
  return () => {
    let notes: { icon: IconName; text: string }[] = [
      { icon: 'rotate-ccw', text: 'Batalkan kapan saja, tanpa denda' },
      { icon: 'qr-code', text: 'Bayar via QRIS, GoPay, OVO, atau DANA' },
      { icon: 'shield-check', text: 'Harga sudah termasuk PPN' },
    ]
    return (
      <section aria-labelledby="harga" class="group/billing bg-mist">
        <div class={cn(pageX, 'flex flex-col gap-10 py-14 lg:gap-16 lg:py-[136px]')}>
          <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end" data-reveal>
            <div class="flex max-w-[820px] flex-col gap-3.5">
              <h2 id="harga" class={sectionTitle}>
                Pilih Paket Sesuai Dapurmu.
              </h2>
              <p class="max-w-[560px] text-[15px] leading-[1.55] text-muted lg:text-base lg:leading-6">
                Mulai gratis dan jelajahi resep komunitas. Upgrade kapan saja untuk merencanakan menu, belanja lebih
                rapi, dan memasak bersama keluarga.
              </p>
            </div>
            <fieldset class="flex gap-0.5 self-start rounded-full border border-outline bg-bg p-1 lg:self-auto">
              <legend class="sr-only">Periode tagihan</legend>
              {BILLING.map((option) => (
                <label
                  key={option.value}
                  class="flex cursor-pointer items-center gap-2 rounded-full px-[18px] py-2 text-sm tracking-[0.02em] transition-colors has-checked:bg-surface-dark has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
                >
                  <input
                    type="radio"
                    name="tagihan"
                    id={`tagihan-${option.value}`}
                    value={option.value}
                    checked={option.value === 'bulanan'}
                    class="sr-only"
                  />
                  {option.label}
                  {option.value === 'tahunan' && (
                    <span class="rounded-full border border-accent-strong bg-accent-subtle px-2 py-0.5 text-[11px] text-accent-strong">
                      Hemat 20%
                    </span>
                  )}
                </label>
              ))}
            </fieldset>
          </div>
          <ul class="grid items-center gap-4 lg:grid-cols-3 lg:gap-6" data-reveal-group>
            {PLANS.map((plan) => (
              <li key={plan.name}>
                <PlanCard plan={plan} />
              </li>
            ))}
          </ul>
          <ul class="flex flex-wrap justify-center gap-x-7 gap-y-3">
            {notes.map((note) => (
              <li key={note.text} class="flex items-center gap-2 text-sm tracking-[0.01em] text-muted">
                <Icon name={note.icon} />
                {note.text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }
}

function PlanCard(handle: Handle<{ plan: Plan }>) {
  return () => {
    let { plan } = handle.props
    let dark = plan.featured === true
    let free = plan.monthly === 'Rp0'
    let unit = cn('text-[15px] leading-6', dark ? 'text-white/70' : 'text-muted')
    return (
      <article
        class={cn(
          'flex flex-col gap-7 rounded-lg p-7 lg:p-9',
          dark ? 'bg-surface-dark text-white lg:py-14' : 'border border-line bg-bg',
        )}
      >
        <div class="flex flex-col gap-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class={cn('rounded-full border px-3.5 py-1.5 text-[13px] tracking-[0.02em]', dark ? 'border-white' : 'border-outline')}>
              {plan.name}
            </h3>
            {dark && (
              <span class="rounded-full bg-accent px-3.5 py-1.5 text-[13px] tracking-[0.02em]">Paling Direkomendasikan</span>
            )}
          </div>
          <p class={cn('text-[15px] leading-[23px]', dark ? 'text-white/70' : 'text-muted')}>{plan.description}</p>
          <p class="flex items-end gap-1.5">
            {free ? (
              <>
                <span class="text-[44px] leading-none tracking-[-0.52px] lg:text-[52px]">{plan.monthly}</span>
                <span class={unit}>/selamanya</span>
              </>
            ) : (
              <>
                <span class="text-[44px] leading-none tracking-[-0.52px] group-has-[#tagihan-tahunan:checked]/billing:hidden lg:text-[52px]">
                  {plan.monthly}
                </span>
                <span class={cn(unit, 'group-has-[#tagihan-tahunan:checked]/billing:hidden')}>/bulan</span>
                <span class="hidden text-[44px] leading-none tracking-[-0.52px] group-has-[#tagihan-tahunan:checked]/billing:inline lg:text-[52px]">
                  {plan.yearly}
                </span>
                <span class={cn(unit, 'hidden group-has-[#tagihan-tahunan:checked]/billing:inline')}>/tahun</span>
              </>
            )}
          </p>
          <ButtonLink
            href={routes.auth.register.index.href()}
            variant={dark ? 'default' : 'outline'}
            size="lg"
            class={cn('w-full', !dark && 'bg-transparent')}
          >
            {plan.cta}
            {dark && <Icon name="arrow-right" />}
          </ButtonLink>
        </div>
        <div class={cn('h-px', dark ? 'bg-white/15' : 'bg-line')} />
        <div class="flex flex-col gap-3.5">
          <p class={cn('text-[13px] tracking-[0.02em]', dark ? 'text-white/70' : 'text-muted')}>{plan.featuresLabel}</p>
          <ul class="flex flex-col gap-3.5">
            {plan.features.map((feature) => (
              <li key={feature} class="flex items-center gap-3 text-[15px] leading-[21px]">
                <span
                  class={cn(
                    'flex size-[22px] shrink-0 items-center justify-center rounded-full',
                    dark ? 'bg-accent text-white' : 'bg-accent-subtle text-accent-strong',
                  )}
                >
                  <Icon name="check" size={13} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </article>
    )
  }
}

const FAQ: { question: string; answer: RemixNode }[] = [
  {
    question: 'Apakah AnyamanRasa gratis digunakan?',
    answer:
      'Ya. Kamu bisa menjelajahi resep, mencari dari bahan, dan menyimpan hingga 20 resep tanpa biaya. Dapur Plus membuka fitur tambahan seperti rencana menu dan daftar belanja otomatis.',
  },
  {
    question: 'Bagaimana cara kerja Cari dari Bahan?',
    answer:
      'Pilih bahan yang ada di dapurmu. AnyamanRasa mengurutkan resep dari yang paling lengkap bahannya dan menunjukkan bahan yang masih kurang.',
  },
  {
    question: 'Siapa yang bisa menulis dan membagikan resep?',
    answer:
      'Siapa saja yang sudah punya akun. Resep langsung terbit setelah kamu kirim, dan admin menjaga agar isinya tetap layak.',
  },
  {
    question: 'Apa itu variasi resep dan graf resep?',
    answer:
      'Variasi adalah resep baru yang dibuat dari resep lain, misalnya versi lebih pedas atau tanpa santan. Graf Resep menampilkan hubungan itu bersama bahan dan resep terkait, jadi kamu bisa menelusuri dari satu piring ke piring berikutnya.',
  },
  {
    question: 'Bisakah saya menyimpan resep dan bahan di dapur?',
    answer:
      'Bisa. Simpan resep favorit untuk dibuka lagi dari profilmu, dan simpan bahan di dapurmu agar pencarian berikutnya lebih cepat.',
  },
  {
    question: 'Bisakah saya mengubah jumlah porsi?',
    answer: 'Bisa. Di halaman resep, ubah jumlah porsi dan takaran setiap bahan akan menyesuaikan otomatis.',
  },
]

function Faq(_handle: Handle) {
  return () => (
    <section aria-labelledby="faq">
      <div class={cn(pageX, 'grid gap-8 py-14 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-24 lg:py-[136px]')}>
        <div class="flex flex-col items-start gap-5 lg:gap-6" data-reveal>
          <h2 id="faq" class={cn(sectionTitle, 'lg:leading-[63px]')}>
            Pertanyaan <br class="hidden lg:inline" />
            yang sering <br class="hidden lg:inline" />
            diajukan
          </h2>
          <p class={cn(sectionDesc, 'text-muted')}>
            Belum menemukan jawabannya? Cara terbaik mengenal AnyamanRasa adalah langsung mencoba.
          </p>
          <ButtonLink href={routes.recipes.index.href()} variant="outline" size="lg">
            Jelajahi resep
          </ButtonLink>
        </div>
        <div class="border-t border-line-strong" data-reveal>
          {FAQ.map((item, index) => (
            <details key={item.question} class="group border-b border-line" open={index === 0}>
              <summary class="flex cursor-pointer list-none items-center justify-between gap-6 py-6 lg:py-7 [&::-webkit-details-marker]:hidden">
                <span class="text-lg leading-[1.25] tracking-[-0.2px] lg:text-2xl lg:leading-[30px] lg:tracking-[-0.24px]">
                  {item.question}
                </span>
                <span class="flex size-10 shrink-0 items-center justify-center rounded-full border border-outline text-ink transition-colors group-open:border-ink group-open:bg-ink group-open:text-white">
                  <Icon name="plus" size={18} class="group-open:hidden" />
                  <Icon name="minus" size={18} class="hidden group-open:block" />
                </span>
              </summary>
              <p class="max-w-[640px] pb-7 text-[15px] leading-[1.55] tracking-[0.02em] text-muted lg:-mt-3 lg:text-[17px] lg:leading-[26px]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta(handle: Handle<{ recipes: RecipeSummary[]; featured: RecipeSummary | null; signedIn: boolean }>) {
  return () => {
    let { recipes, featured, signedIn } = handle.props
    let photos = [featured, ...recipes].filter((recipe): recipe is RecipeSummary => Boolean(recipe?.imageUrl))
    let [back, front] = photos.filter((recipe, index) => photos.findIndex((other) => other.id === recipe.id) === index)
    return (
      <section aria-labelledby="ajakan" class={cn(pageX, 'pb-14 lg:pb-[120px]')}>
        <div
          class="relative flex overflow-hidden rounded-lg bg-linear-[104deg] from-accent-strong from-10% via-accent via-55% to-coral to-90% text-white lg:h-[520px]"
          data-reveal
        >
          <div class="flex max-w-[672px] shrink-0 flex-col justify-center gap-6 p-7 lg:gap-7 lg:py-0 lg:pr-0 lg:pl-[72px]">
            <h2 id="ajakan" class="text-[40px] leading-[1.02] tracking-[-0.5px] lg:text-[72px] lg:leading-[73px] lg:tracking-[-0.72px]">
              Masak hari ini, <br class="hidden lg:inline" />
              wariskan rasanya <br class="hidden lg:inline" />
              besok.
            </h2>
            <p class="max-w-[500px] text-[15px] leading-[1.55] tracking-[0.02em] text-white/90 lg:text-[17px] lg:leading-[26px]">
              Simpan resep favorit, cari dari bahan di dapurmu, dan bagikan masakan keluargamu ke dapur-dapur di
              Indonesia.
            </p>
            <div class="flex flex-wrap gap-3">
              {signedIn ? (
                <ButtonLink href={routes.recipes.create.index.href()} size="lg" class="bg-white text-ink hover:bg-hover">
                  Tulis resep
                </ButtonLink>
              ) : (
                <ButtonLink href={routes.auth.register.index.href()} size="lg" class="bg-white text-ink hover:bg-hover">
                  Daftar gratis
                </ButtonLink>
              )}
              <ButtonLink
                href={routes.recipes.index.href()}
                variant="outline"
                size="lg"
                class="border-white bg-transparent text-white hover:bg-white/10"
              >
                Jelajahi resep
              </ButtonLink>
            </div>
            {!signedIn && <p class="text-sm tracking-[0.02em] text-white/80">Gratis selamanya · tanpa kartu kredit</p>}
          </div>
          {back && front && (
            <div class="relative hidden flex-1 lg:block" aria-hidden="true">
              <img
                src={back.imageUrl!}
                alt=""
                loading="lazy"
                class="absolute top-[-40px] left-[250px] h-[380px] w-[300px] origin-top-left rotate-6 rounded-md object-cover"
              />
              <img
                src={front.imageUrl!}
                alt=""
                loading="lazy"
                class="absolute top-[170px] left-[60px] h-[400px] w-[320px] origin-top-left -rotate-4 rounded-md border-[6px] border-white object-cover"
              />
              <div class="absolute top-[330px] left-[300px] flex items-center gap-3 rounded-sm bg-bg px-4 py-3 text-ink">
                <Icon name="bookmark-check" size={20} class="text-accent" />
                <span class="flex flex-col gap-0.5">
                  <span class="text-[15px] font-medium">{front.title} disimpan</span>
                  <span class="text-[13px] tracking-[0.02em] text-muted">Tersimpan di profilmu</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }
}
