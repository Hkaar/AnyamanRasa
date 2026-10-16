import type { Handle, RemixNode } from 'remix/component'

import { AUTHOR_SORTS, type AuthorSort } from '../../data/recipes.ts'
import type { Profile } from '../../data/users.ts'
import { formatMonthYear } from '../../domain/format.ts'
import type { RecipeSummary } from '../../domain/types.ts'
import type { FieldErrors } from '../../domain/validation.ts'
import { FREE_SAVE_LIMIT, PAID_PLANS, PLANS, formatRupiah } from '../../domain/subscription.ts'
import { routes } from '../../routes.ts'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { CsrfField } from '../../ui/primitives.tsx'
import { RecipeCard } from '../../ui/recipe-card.tsx'
import type { Shell } from '../../ui/shell.ts'
import { Button, ButtonLink, buttonVariants } from '../../ui/button.tsx'
import { LoadMore, LoadMoreChunk } from '../../ui/load-more.tsx'
import { Select } from '../../ui/select.tsx'
import { checkboxClass, inputClass, textareaClass } from '../../ui/input.tsx'
import { Field, FieldMessage, fieldAttrs, labelClass } from '../../ui/label.tsx'
import { tabsListClass, tabsTriggerClass } from '../../ui/tabs.tsx'
import { cn, pageX } from '../../ui/utils.ts'
import { Avatar } from '../../ui/avatar.tsx'
import { Empty } from '../../ui/empty.tsx'

export type ProfileTab = 'resep' | 'variasi' | 'disimpan'

/** Recipes per "Muat lebih banyak" page (two desktop rows). */
export const PROFILE_PAGE_SIZE = 8

const SORT_LABELS: Record<AuthorSort, string> = { terbaru: 'Terbaru', populer: 'Terpopuler' }

export interface ProfilePageProps {
  shell: Shell
  profile: Profile
  isOwn: boolean
  tab: ProfileTab
  sort: AuthorSort
  page: number
  recipes: RecipeSummary[]
  /** All recipes in the tab (for paging). */
  total: number
  /** Variation preview shown under the Resep grid. */
  variations: RecipeSummary[]
  /** The viewer's saved-recipe count on their own profile (plan banner); null for others. */
  savedCount: number | null
}

export function ProfilePage(handle: Handle<ProfilePageProps>) {
  return () => {
    let { shell, profile, isOwn, tab, sort, page, recipes, total, variations, savedCount } = handle.props
    let base = routes.profile.show.href({ username: profile.username })
    let tabHref = (key: ProfileTab, extra: Record<string, string> = {}) => {
      let params = new URLSearchParams({ ...(key === 'resep' ? {} : { tab: key }), ...extra })
      let query = params.toString()
      return query ? `${base}?${query}` : base
    }
    let tabs: { key: ProfileTab; label: string; count?: number }[] = [
      { key: 'resep', label: 'Resep', count: profile.recipeCount },
      { key: 'variasi', label: 'Variasi', count: profile.variationCount },
      ...(isOwn ? [{ key: 'disimpan' as const, label: 'Disimpan' }] : []),
    ]
    let empty = {
      resep: isOwn ? 'Kamu belum menulis resep. Mulai dari masakan andalan di rumah.' : 'Belum ada resep yang diterbitkan.',
      variasi: isOwn ? 'Belum ada variasi. Adaptasi resep favoritmu dari halaman resep.' : 'Belum ada variasi yang diterbitkan.',
      disimpan: 'Simpan resep dengan ikon penanda di halaman resep untuk membukanya lagi di sini.',
    }[tab]
    let sortable = tab !== 'disimpan'
    let firstName = profile.name.split(/\s+/)[0]

    return (
      <SiteLayout shell={shell} title={profile.name}>
        <div class={cn(pageX, 'flex flex-col gap-7 pt-7 pb-12 lg:gap-14 lg:pt-16 lg:pb-30')}>
          <header class="flex flex-col justify-between gap-4 rounded-lg bg-[linear-gradient(-133deg,var(--color-peach)_15%,var(--color-coral)_46%,var(--color-sand)_85%)] p-5 lg:flex-row lg:items-end lg:gap-8 lg:rounded-none lg:bg-none lg:p-0">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-7">
              <Avatar
                name={profile.name}
                src={profile.avatarUrl}
                size={112}
                class="border-0 max-lg:size-[72px]! max-lg:text-2xl! max-lg:bg-bg/70"
              />
              <div class="flex max-w-[560px] flex-col gap-1.5 lg:gap-2">
                <h1 class="text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink lg:text-[60px] lg:leading-[66px] lg:tracking-[-0.6px]">
                  {profile.name}
                </h1>
                <p class="text-[13px] tracking-[0.26px] text-surface-dark-line lg:text-[15px] lg:tracking-[0.3px] lg:text-muted">
                  @{profile.username}
                  {profile.location && ` · ${profile.location}`}
                  <span class="hidden lg:inline"> · Bergabung {formatMonthYear(profile.createdAt)}</span>
                </p>
                {profile.bio && (
                  <p class="text-sm leading-[22px] tracking-[0.28px] text-ink lg:text-[17px] lg:leading-[26px] lg:tracking-[0.34px]">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
            {isOwn && (
              <div class="grid grid-cols-2 gap-2 lg:flex">
                <ButtonLink
                  href={routes.profile.edit.index.href()}
                  variant="outline"
                  size="lg"
                  class="lg:border-surface-dark lg:bg-surface-dark lg:text-white lg:hover:bg-ink"
                >
                  <Icon name="pencil" />
                  Edit profil
                </ButtonLink>
                <ButtonLink href={routes.recipes.create.index.href()} variant="default" size="lg">
                  <Icon name="plus" />
                  Tulis resep
                </ButtonLink>
              </div>
            )}
          </header>

          {savedCount !== null && <PlanBanner savedCount={savedCount} />}

          <div class="flex items-center justify-between gap-6">
            <nav aria-label="Konten profil" class={cn(tabsListClass, 'flex-1 lg:flex-none')}>
              {tabs.map((item) => {
                let active = tab === item.key
                return (
                  <a
                    key={item.key}
                    href={tabHref(item.key)}
                    aria-current={active ? 'page' : undefined}
                    class={tabsTriggerClass(
                      active,
                      cn('flex-1 lg:flex-none', item.count !== undefined && 'lg:pr-2.5 lg:pl-[18px]'),
                    )}
                  >
                    {item.label}
                    {item.count !== undefined && (
                      <span
                        class={cn(
                          'rounded-full px-[7px] py-px text-xs leading-4 font-medium tracking-[0.24px]',
                          active ? 'bg-white/20 text-white' : 'bg-hover text-ink',
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </a>
                )
              })}
            </nav>
            {sortable && (
              <form method="get" action={base} data-autosubmit class="hidden items-center gap-2 lg:flex">
                {tab !== 'resep' && <input type="hidden" name="tab" value={tab} />}
                <Select
                  label="Urutkan"
                  name="urut"
                  align="end"
                  value={sort}
                  options={AUTHOR_SORTS.map((value) => ({ value, label: SORT_LABELS[value] }))}
                />
                <noscript>
                  <Button type="submit" variant="outline">
                    Terapkan
                  </Button>
                </noscript>
              </form>
            )}
          </div>

          {recipes.length === 0 ? (
            <Empty
              icon={tab === 'disimpan' ? 'bookmark' : tab === 'variasi' ? 'git-branch' : 'book-open'}
              title={tab === 'disimpan' ? 'Belum ada resep tersimpan' : 'Belum ada resep'}
              description={empty}
              action={
                isOwn && tab === 'resep' ? (
                  <ButtonLink href={routes.recipes.create.index.href()} variant="default">
                    <Icon name="plus" />
                    Tulis resep
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <div id="resep-profil" class="grid gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-y-12" data-reveal-group>
              {recipes.map((recipe) => (
                <ProfileRecipeCard key={recipe.id} recipe={recipe} tab={tab} />
              ))}
            </div>
          )}

          {recipes.length < total && (
            <LoadMore
              listId="resep-profil"
              variant="outline"
              shown={recipes.length}
              total={total}
              countLabel={(count) => profileCount(count, total)}
              href={tabHref(tab, { ...(sort === 'terbaru' ? {} : { urut: sort }), hal: String(page + 1) })}
              fragmentHref={tabHref(tab, { ...(sort === 'terbaru' ? {} : { urut: sort }), hal: String(page + 1), bagian: 'kartu' })}
            />
          )}

          {tab === 'resep' && variations.length > 0 && (
            <section aria-labelledby="variasi-dibuat" class="hidden flex-col gap-6 border-t border-line pt-12 lg:flex">
              <div class="flex items-end justify-between gap-6">
                <div class="flex flex-col gap-1.5">
                  <h2 id="variasi-dibuat" class="text-[32px] leading-[35px] font-normal tracking-[-0.32px] text-ink">
                    Variasi yang dibuat
                  </h2>
                  <p class="text-[15px] leading-[23px] tracking-[0.3px] text-muted">
                    Adaptasi {firstName} dari resep anggota lain. Setiap variasi tetap terhubung ke resep aslinya.
                  </p>
                </div>
                <ButtonLink href={tabHref('variasi')} variant="ghost" size="lg">
                  Lihat semua variasi
                  <Icon name="arrow-right" />
                </ButtonLink>
              </div>
              <div class="grid grid-cols-4 gap-6" data-reveal-group>
                {variations.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} hideAuthor showLineage size="default" headingLevel={3} />
                ))}
              </div>
            </section>
          )}
        </div>
      </SiteLayout>
    )
  }
}

/** pen.dev 09: slim upgrade banner on the viewer's own profile. */
function PlanBanner(handle: Handle<{ savedCount: number }>) {
  return () => (
    <aside
      aria-label="Paket langganan"
      class="flex flex-col gap-4 rounded-lg bg-[linear-gradient(90deg,var(--color-accent-subtle),#F7E3D8)] p-4 sm:flex-row sm:items-center sm:gap-5 sm:py-4 sm:pr-5 sm:pl-6"
    >
      <div class="flex flex-1 items-center gap-4">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg text-accent-strong" aria-hidden="true">
          <Icon name="sparkles" size={16} />
        </span>
        <div class="flex min-w-0 flex-col gap-0.5">
          <p class="text-sm font-medium tracking-[0.28px] text-ink">
            Kamu memakai paket Gratis — {handle.props.savedCount} dari {FREE_SAVE_LIMIT} resep tersimpan
          </p>
          <p class="text-xs tracking-[0.24px] text-muted">
            Upgrade ke Dapur Plus untuk simpan resep tanpa batas, mulai {formatRupiah(PLANS.plus.monthly)}/bulan.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-5">
        <SavedMeter count={handle.props.savedCount} class="hidden w-[150px] md:flex" compact />
        <ButtonLink href={`${routes.subscription.index.href()}?paket=plus`} variant="default" class="flex-1 sm:flex-none">
          <Icon name="arrow-up-right" />
          Upgrade
        </ButtonLink>
      </div>
    </aside>
  )
}

/** "Resep tersimpan n / 20": informational only, saving is never blocked. */
function SavedMeter(handle: Handle<{ count: number; compact?: boolean; class?: string }>) {
  return () => {
    let { count, compact } = handle.props
    let used = Math.min(100, Math.round((count / FREE_SAVE_LIMIT) * 100))
    return (
      <div class={cn('flex flex-col gap-1.5', handle.props.class)}>
        <p class={cn('flex justify-between gap-3 tracking-[0.24px]', compact ? 'text-[11px]' : 'text-xs')}>
          <span class={compact ? 'text-muted' : 'font-medium text-ink'}>Resep tersimpan</span>
          <span class="font-medium text-accent-strong tabular-nums">
            {count} / {FREE_SAVE_LIMIT}
          </span>
        </p>
        <div
          role="meter"
          aria-label="Resep tersimpan"
          aria-valuemin={0}
          aria-valuemax={FREE_SAVE_LIMIT}
          aria-valuenow={Math.min(count, FREE_SAVE_LIMIT)}
          class={cn('overflow-hidden rounded-full', compact ? 'h-1 bg-bg' : 'h-1.5 bg-hover')}
        >
          <div class="h-full rounded-full bg-accent" style={{ width: `${used}%` }} />
        </div>
        {!compact && (
          <p class="text-[11px] tracking-[0.22px] text-faint">
            {count < FREE_SAVE_LIMIT ? `${FREE_SAVE_LIMIT - count} slot tersisa` : 'Batas paket Gratis tercapai'}
          </p>
        )}
      </div>
    )
  }
}

const SETTINGS_SECTIONS = [
  { id: 'profil-publik', label: 'Profil publik', icon: 'user-round' },
  { id: 'akun', label: 'Akun', icon: 'shield-check' },
  { id: 'langganan', label: 'Langganan & tagihan', icon: 'crown' },
] as const

const settingsInput = 'h-12 bg-hover'

/** pen.dev 09b "Pengaturan", limited to what the app stores: the public profile and the account. */
export function ProfileEditPage(
  handle: Handle<{
    shell: Shell
    profile: Profile
    savedCount: number
    errors?: FieldErrors<'name' | 'username' | 'bio' | 'location' | 'avatar'>
  }>,
) {
  return () => {
    let { shell, profile, savedCount, errors = {} } = handle.props
    let profileHref = routes.profile.show.href({ username: profile.username })
    let errorCount = Object.keys(errors).length
    return (
      <SiteLayout shell={shell} title="Pengaturan">
        <div class={cn(pageX, 'flex flex-col gap-10 pt-8 pb-20 lg:gap-14 lg:pt-16 lg:pb-28')}>
          <div class="flex flex-col gap-3">
            <a href={profileHref} class="flex items-center gap-1.5 self-start text-[13px] tracking-[0.26px] text-muted hover:text-ink">
              <Icon name="arrow-left" size={14} />
              Kembali ke profil
            </a>
            <h1 class="text-[40px] leading-[1.1] font-normal tracking-[-0.4px] text-ink lg:text-[52px] lg:tracking-[-0.52px]">Pengaturan</h1>
            <p class="text-[15px] leading-6 tracking-[0.3px] text-muted lg:text-base">
              Atur bagaimana kamu tampil di resep dan variasi yang kamu terbitkan.
            </p>
          </div>

          <div class="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
            {/* Phones (pen.dev 09b mobile): the sections as a scrolling row of pills. */}
            <nav aria-label="Bagian pengaturan" class="-mx-5 -mt-4 overflow-x-auto px-5 md:-mx-10 md:px-10 lg:hidden">
              <ul class="flex gap-2">
                {SETTINGS_SECTIONS.map((section, index) => (
                  <li key={section.id} class="shrink-0">
                    <a
                      href={`#${section.id}`}
                      class={cn(
                        'flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] tracking-[0.26px] whitespace-nowrap',
                        index === 0 ? 'bg-surface-dark text-white' : 'border border-line text-ink',
                      )}
                    >
                      <Icon name={section.icon} size={15} />
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Bagian pengaturan" class="hidden lg:block">
              <ul class="sticky top-24 flex flex-col gap-1">
                {SETTINGS_SECTIONS.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      class={cn(
                        'flex h-10 items-center gap-3 rounded-md px-3.5 text-sm tracking-[0.28px] transition-colors hover:bg-hover',
                        index === 0 ? 'bg-hover font-medium text-ink' : 'text-muted hover:text-ink',
                      )}
                    >
                      <Icon name={section.icon} size={16} />
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div class="flex min-w-0 flex-col gap-14 lg:gap-16">
              <form
                id="profil-form"
                method="post"
                action={routes.profile.edit.action.href()}
                enctype="multipart/form-data"
                data-track-changes
                novalidate
              >
                <CsrfField token={shell.csrfToken} />
                <section id="profil-publik" aria-labelledby="profil-publik-judul" class="flex scroll-mt-24 flex-col gap-6">
                  <SettingsHeading
                    id="profil-publik-judul"
                    title="Profil publik"
                    description="Informasi ini terlihat oleh semua orang di halaman profil dan resepmu."
                  />
                  {errorCount > 0 && (
                    <p role="alert" class="flex items-center gap-2 rounded-md bg-error-subtle px-4 py-3 text-[13px] text-error">
                      <Icon name="circle-alert" />
                      {errorCount === 1 ? 'Ada 1 isian yang perlu diperbaiki.' : `Ada ${errorCount} isian yang perlu diperbaiki.`}
                    </p>
                  )}
                  <div data-slot="field" data-invalid={errors.avatar ? 'true' : undefined} class="flex flex-col gap-1.5">
                    <div
                      class={cn(
                        'flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center',
                        errors.avatar ? 'bg-error-subtle' : 'bg-subtle',
                      )}
                    >
                      <div class="flex flex-1 items-center gap-5">
                        <Avatar name={profile.name} src={profile.avatarUrl} size={80} class="border-0" />
                        <div class="flex flex-col gap-1">
                          <span id="avatar-label" class="text-[15px] font-medium text-ink">Foto profil</span>
                          <span id="avatar-name" class="text-[13px] tracking-[0.26px] text-muted" data-file-name-for="avatar">
                            JPG, PNG, atau WebP, maks. 4 MB.
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <label
                          class={cn(
                            buttonVariants({ variant: 'outline', size: 'lg' }),
                            'cursor-pointer bg-bg hover:bg-hover focus-within:ring-[3px] focus-within:ring-focus-ring',
                          )}
                        >
                          <Icon name="upload" />
                          Ganti foto
                          <input
                            {...fieldAttrs('avatar', errors.avatar)}
                            aria-labelledby="avatar-label avatar-name"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            class="sr-only"
                          />
                        </label>
                        {profile.avatarUrl && (
                          <label class={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'cursor-pointer text-muted has-checked:bg-error-subtle has-checked:text-error')}>
                            <input type="checkbox" name="hapus_avatar" value="1" class={checkboxClass} />
                            Hapus
                          </label>
                        )}
                      </div>
                    </div>
                    <FieldMessage id="avatar-help" error={errors.avatar} />
                  </div>
                  <div class="grid gap-6 sm:grid-cols-2">
                    <Field id="name" label="Nama tampilan" error={errors.name}>
                      <input
                        {...fieldAttrs('name', errors.name)}
                        type="text"
                        required
                        maxLength={100}
                        defaultValue={profile.name}
                        class={cn(inputClass, settingsInput)}
                      />
                    </Field>
                    <Field
                      id="username"
                      label="Nama pengguna"
                      error={errors.username}
                      help={`Huruf kecil, angka, atau garis bawah. Profilmu ada di /u/${profile.username}.`}
                    >
                      <input
                        {...fieldAttrs('username', errors.username)}
                        type="text"
                        required
                        autocapitalize="none"
                        pattern="[a-z0-9_]{3,30}"
                        defaultValue={profile.username}
                        class={cn(inputClass, settingsInput)}
                      />
                    </Field>
                  </div>
                  <div data-slot="field" data-invalid={errors.bio ? 'true' : undefined} class="flex flex-col gap-1.5">
                    <label for="bio" class={cn(labelClass, errors.bio && 'text-error')}>
                      Bio
                    </label>
                    <textarea
                      {...fieldAttrs('bio', errors.bio)}
                      rows={4}
                      maxLength={BIO_LIMIT}
                      data-char-count="bio-count"
                      class={cn(textareaClass, 'bg-hover')}
                      defaultValue={profile.bio}
                    />
                    <div class="flex items-start justify-between gap-4">
                      <FieldMessage id="bio-help" error={errors.bio}>
                        Ceritakan gaya masakmu dalam satu-dua kalimat.
                      </FieldMessage>
                      <span id="bio-count" class="ml-auto shrink-0 text-xs tracking-[0.24px] text-faint tabular-nums">
                        {profile.bio.length} / {BIO_LIMIT}
                      </span>
                    </div>
                  </div>
                  <Field id="location" label="Kota" error={errors.location} class="sm:max-w-[calc(50%-12px)]">
                    <input
                      {...fieldAttrs('location', errors.location)}
                      type="text"
                      maxLength={100}
                      defaultValue={profile.location}
                      class={cn(inputClass, settingsInput)}
                      placeholder="misal: Yogyakarta"
                    />
                  </Field>
                </section>
              </form>

              <section id="akun" aria-labelledby="akun-judul" class="flex scroll-mt-24 flex-col gap-6">
                <SettingsHeading id="akun-judul" title="Akun" description="Cara kamu masuk ke AnyamanRasa." />
                <ul class="flex flex-col gap-1.5">
                  <SettingsRow icon="mail" title="Email" description={`${profile.email} · dipakai untuk masuk.`} />
                  <SettingsRow
                    icon="log-out"
                    title="Sesi ini"
                    description="Keluar dari AnyamanRasa di perangkat ini."
                    action={
                      <Button type="submit" form="keluar-form" variant="outline" class="bg-bg hover:bg-hover">
                        Keluar
                      </Button>
                    }
                  />
                </ul>
                <form id="keluar-form" method="post" action={routes.auth.logout.href()} hidden>
                  <CsrfField token={shell.csrfToken} />
                </form>
              </section>

              <SubscriptionSettings savedCount={savedCount} />

              <div
                data-changes-bar
                class="group sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg bg-surface-dark p-3 pl-5 text-white shadow-modal sm:flex-row sm:items-center"
              >
                <p class="flex flex-1 items-center gap-3 text-sm tracking-[0.28px]" aria-live="polite">
                  <span class="size-2 shrink-0 rounded-full bg-white/30 group-data-dirty:bg-peach" data-changes-dot aria-hidden="true" />
                  <span data-changes-label="profil-form">Simpan setelah selesai mengubah profilmu.</span>
                </p>
                <div class="flex items-center gap-2">
                  <a href={profileHref} class="flex h-11 items-center rounded-sm px-4 text-[15px] text-white/85 hover:bg-white/10 hover:text-white">
                    Batalkan
                  </a>
                  <Button type="submit" form="profil-form" variant="default" size="lg" class="flex-1 sm:flex-none">
                    Simpan perubahan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }
}

/**
 * pen.dev 09b "Langganan & tagihan". Every account is on Gratis: the checkout is a simulation and
 * stores nothing, so there is no payment method or billing history to show yet.
 */
function SubscriptionSettings(handle: Handle<{ savedCount: number }>) {
  return () => (
    <section id="langganan" aria-labelledby="langganan-judul" class="flex scroll-mt-24 flex-col gap-6">
      <SettingsHeading
        id="langganan-judul"
        title="Langganan & tagihan"
        description="Lihat paketmu, pantau batas pemakaian, dan atur cara membayar."
      />
      <div class="flex flex-col gap-5 rounded-lg bg-subtle p-5">
        <div class="flex items-center gap-4">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-md bg-bg text-ink" aria-hidden="true">
            <Icon name="chef-hat" size={18} />
          </span>
          <div class="flex flex-1 flex-col gap-0.5">
            <p class="text-[11px] font-medium tracking-[0.8px] text-faint uppercase">Paket saat ini</p>
            <p class="flex items-center gap-2 text-[22px] leading-tight tracking-[-0.22px] text-ink">
              Gratis
              <span class="rounded-full bg-hover px-2 py-0.5 text-[11px] tracking-[0.22px] text-muted">Aktif</span>
            </p>
          </div>
          <p class="text-xs tracking-[0.24px] text-muted">Rp0 · tanpa kartu</p>
        </div>
        <SavedMeter count={handle.props.savedCount} />
      </div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PAID_PLANS.map((id) => {
          let plan = PLANS[id]
          let featured = id === 'plus'
          return (
            <article key={id} class={cn('flex flex-col gap-4 rounded-lg p-5', featured ? 'bg-accent-subtle' : 'bg-subtle')}>
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-[15px] font-medium text-ink">{plan.name}</h3>
                {featured && (
                  <span class="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white">
                    <Icon name="sparkles" size={11} />
                    Paling populer
                  </span>
                )}
              </div>
              <p class="flex items-baseline gap-1.5">
                <span class="text-[26px] leading-none tracking-[-0.26px] text-ink">{formatRupiah(plan.monthly)}</span>
                <span class="text-xs text-muted">/bulan</span>
              </p>
              <ul class="flex flex-1 flex-col gap-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} class="flex items-center gap-2 text-[13px] tracking-[0.26px] text-ink">
                    <Icon name="check" size={13} class="text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={`${routes.subscription.index.href()}?paket=${id}`}
                variant={featured ? 'default' : 'outline'}
                class={featured ? undefined : 'bg-bg hover:bg-hover'}
              >
                {featured && <Icon name="sparkles" />}
                {featured ? 'Upgrade ke Dapur Plus' : `Pilih ${plan.name}`}
              </ButtonLink>
            </article>
          )
        })}
      </div>
      <p class="flex items-center gap-2 text-xs tracking-[0.24px] text-muted">
        <Icon name="flask-conical" size={13} />
        Pembayaran masih berupa simulasi — tidak ada tagihan sungguhan.
      </p>
      <ul class="flex flex-col gap-1.5">
        <SettingsRow icon="credit-card" title="Metode pembayaran" description="Belum ada metode tersimpan." />
        <SettingsRow icon="receipt-text" title="Riwayat tagihan" description="Belum ada tagihan." />
      </ul>
    </section>
  )
}

/** Bio length allowed by the profile edit action. */
export const BIO_LIMIT = 280

function SettingsHeading(handle: Handle<{ id: string; title: string; description: string }>) {
  return () => (
    <div class="flex flex-col gap-1.5">
      <h2 id={handle.props.id} class="text-2xl leading-[1.2] font-normal tracking-[-0.24px] text-ink">
        {handle.props.title}
      </h2>
      <p class="text-sm leading-[22px] tracking-[0.28px] text-muted">{handle.props.description}</p>
    </div>
  )
}

function SettingsRow(handle: Handle<{ icon: IconName; title: string; description: string; action?: RemixNode }>) {
  return () => (
    <li class="flex items-center gap-4 rounded-md bg-subtle px-4 py-3.5">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-hover text-ink" aria-hidden="true">
        <Icon name={handle.props.icon} size={16} />
      </span>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <p class="text-sm font-medium tracking-[0.28px] text-ink">{handle.props.title}</p>
        <p class="truncate text-[13px] tracking-[0.26px] text-muted">{handle.props.description}</p>
      </div>
      {handle.props.action}
    </li>
  )
}

function ProfileRecipeCard(handle: Handle<{ recipe: RecipeSummary; tab: ProfileTab }>) {
  return () => (
    <RecipeCard
      recipe={handle.props.recipe}
      hideAuthor={handle.props.tab !== 'disimpan'}
      showLineage={handle.props.tab === 'variasi'}
      size="default"
      headingLevel={2}
    />
  )
}

function profileCount(shown: number, total: number): string {
  return `Menampilkan ${shown} dari ${total} resep`
}

/** Fragment for infinite scroll: one page of a profile tab's cards and the next page's links. */
export function ProfileCardsChunk(
  handle: Handle<{
    username: string
    tab: ProfileTab
    sort: AuthorSort
    page: number
    recipes: RecipeSummary[]
    total: number
  }>,
) {
  return () => {
    let { username, tab, sort, page, recipes, total } = handle.props
    let shown = Math.min(total, (page - 1) * PROFILE_PAGE_SIZE + recipes.length)
    let more = shown < total && recipes.length > 0
    let href = (extra: Record<string, string>) => {
      let params = new URLSearchParams({
        ...(tab === 'resep' ? {} : { tab }),
        ...(sort === 'terbaru' ? {} : { urut: sort }),
        hal: String(page + 1),
        ...extra,
      })
      return `${routes.profile.show.href({ username })}?${params}`
    }
    return (
      <LoadMoreChunk
        countLabel={profileCount(shown, total)}
        next={more ? href({ bagian: 'kartu' }) : undefined}
        nextHref={more ? href({}) : undefined}
      >
        {recipes.map((recipe) => (
          <ProfileRecipeCard key={recipe.id} recipe={recipe} tab={tab} />
        ))}
      </LoadMoreChunk>
    )
  }
}
