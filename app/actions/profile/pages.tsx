import type { Handle } from 'remix/component'

import { AUTHOR_SORTS, type AuthorSort } from '../../data/recipes.ts'
import type { Profile } from '../../data/users.ts'
import { formatMonthYear } from '../../domain/format.ts'
import type { RecipeSummary } from '../../domain/types.ts'
import type { FieldErrors } from '../../domain/validation.ts'
import { routes } from '../../routes.ts'
import { Icon } from '../../ui/icon.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { CsrfField } from '../../ui/primitives.tsx'
import { RecipeCard } from '../../ui/recipe-card.tsx'
import type { Shell } from '../../ui/shell.ts'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { InlineSelect } from '../../ui/inline-select.tsx'
import { checkboxClass, inputClass, textareaClass } from '../../ui/input.tsx'
import { Field, fieldAttrs } from '../../ui/label.tsx'
import { tabsListClass, tabsTriggerClass } from '../../ui/tabs.tsx'
import { cn, pageX } from '../../ui/utils.ts'
import { Avatar } from '../../ui/avatar.tsx'
import { Breadcrumb } from '../../ui/breadcrumb.tsx'
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
}

export function ProfilePage(handle: Handle<ProfilePageProps>) {
  return () => {
    let { shell, profile, isOwn, tab, sort, page, recipes, total, variations } = handle.props
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
                      cn('flex-1 lg:flex-none', item.count !== undefined && 'lg:pr-2.5 lg:pl-[18px]', active && 'border-ink bg-ink'),
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
                <InlineSelect label="Urutkan" name="urut" value={sort}>
                  {AUTHOR_SORTS.map((value) => (
                    <option key={value} value={value} selected={value === sort}>
                      {SORT_LABELS[value]}
                    </option>
                  ))}
                </InlineSelect>
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
            <div class="grid gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-10 lg:grid-cols-4 lg:gap-y-12" data-reveal-group>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  hideAuthor={tab !== 'disimpan'}
                  showLineage={tab === 'variasi'}
                  size="default"
                  headingLevel={2}
                />
              ))}
            </div>
          )}

          {recipes.length < total && (
            <ButtonLink
              href={tabHref(tab, { ...(sort === 'terbaru' ? {} : { urut: sort }), hal: String(page + 1) })}
              variant="outline"
              size="lg"
              class="w-full lg:w-auto lg:self-center"
              data-preserve-scroll
            >
              Muat lebih banyak
            </ButtonLink>
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

export function ProfileEditPage(
  handle: Handle<{ shell: Shell; profile: Profile; errors?: FieldErrors<'name' | 'username' | 'bio' | 'location' | 'avatar'> }>,
) {
  return () => {
    let { shell, profile, errors = {} } = handle.props
    return (
      <SiteLayout shell={shell} title="Pengaturan profil">
        <div class={cn(pageX, 'flex flex-col gap-8 pt-8 pb-20 lg:pt-12')}>
          <div class="flex flex-col gap-3 border-b border-line pb-8">
            <Breadcrumb items={[{ label: 'Profil', href: routes.profile.show.href({ username: profile.username }) }, { label: 'Pengaturan' }]} />
            <h1 class="text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink lg:text-[52px] lg:leading-[57px] lg:tracking-[-0.52px]">
              Pengaturan Profil
            </h1>
            <p class="text-base leading-6 tracking-[0.32px] text-muted">Atur bagaimana kamu tampil di resep dan variasi yang kamu terbitkan.</p>
          </div>
          <form
            method="post"
            action={routes.profile.edit.action.href()}
            enctype="multipart/form-data"
            class="flex max-w-[640px] flex-col gap-6"
            novalidate
          >
            <CsrfField token={shell.csrfToken} />
            <Field id="avatar" label="Foto profil" error={errors.avatar} help="JPG, PNG, atau WebP, maks. 5 MB.">
              <div class="flex items-center gap-4">
                <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
                <input
                  {...fieldAttrs('avatar', errors.avatar)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="text-sm tracking-[0.28px] file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-outline file:bg-bg file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-hover"
                />
                {profile.avatarUrl && (
                  <label class="flex items-center gap-2 text-[13px] tracking-[0.26px] text-muted">
                    <input type="checkbox" name="hapus_avatar" value="1" class={checkboxClass} />
                    Hapus foto
                  </label>
                )}
              </div>
            </Field>
            <div class="grid gap-6 sm:grid-cols-2">
              <Field id="name" label="Nama tampilan" error={errors.name}>
                <input {...fieldAttrs('name', errors.name)} type="text" required maxLength={100} defaultValue={profile.name} class={inputClass} />
              </Field>
              <Field id="username" label="Nama pengguna" error={errors.username} help="Huruf kecil, angka, atau garis bawah.">
                <input
                  {...fieldAttrs('username', errors.username)}
                  type="text"
                  required
                  autocapitalize="none"
                  pattern="[a-z0-9_]{3,30}"
                  defaultValue={profile.username}
                  class={inputClass}
                />
              </Field>
            </div>
            <Field id="location" label="Kota" error={errors.location}>
              <input {...fieldAttrs('location', errors.location)} type="text" maxLength={100} defaultValue={profile.location} class={inputClass} placeholder="misal: Yogyakarta" />
            </Field>
            <Field id="bio" label="Bio" error={errors.bio} help="Maksimal 280 karakter.">
              <textarea {...fieldAttrs('bio', errors.bio)} rows={4} maxLength={280} class={textareaClass} defaultValue={profile.bio} />
            </Field>
            <div class="flex gap-2">
              <Button type="submit" variant="default" size="lg">
                Simpan perubahan
              </Button>
              <ButtonLink href={routes.profile.show.href({ username: profile.username })} variant="outline" size="lg">
                Batal
              </ButtonLink>
            </div>
          </form>
        </div>
      </SiteLayout>
    )
  }
}
