import type { Handle } from 'remix/component'

import type { AdminRecipeFilters, AdminRecipeRow } from '../../data/admin.ts'
import type { Category } from '../../data/recipes.ts'
import { formatCount, formatRelative } from '../../domain/format.ts'
import type { RecipeStatus } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Document } from '../../ui/document.tsx'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { Select } from '../../ui/select.tsx'
import { CsrfField, Logo } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { BulkActions } from './public/bulk-actions.tsx'
import { Button, ButtonLink, buttonVariants } from '../../ui/button.tsx'
import { badgeVariants } from '../../ui/badge.tsx'
import { checkboxClass } from '../../ui/input.tsx'
import { cn } from '../../ui/utils.ts'
import { Avatar } from '../../ui/avatar.tsx'
import { Empty } from '../../ui/empty.tsx'
import { Toast } from '../../ui/toast.tsx'

const STATUS: Record<RecipeStatus, { label: string; icon: IconName; class: string }> = {
  published: { label: 'Terbit', icon: 'circle-check', class: 'bg-accent-subtle text-accent-strong' },
  draft: { label: 'Draf', icon: 'file', class: 'bg-hover text-muted' },
  archived: { label: 'Diarsipkan', icon: 'archive', class: 'bg-warning-subtle text-warning' },
}

export interface AdminRecipesPageProps {
  shell: Shell
  filters: AdminRecipeFilters
  rows: AdminRecipeRow[]
  total: number
  pageSize: number
  stats: { total: number; published: number; drafts: number; archived: number; this_week: number }
  categories: Category[]
}

export function AdminRecipesPage(handle: Handle<AdminRecipesPageProps>) {
  return () => {
    let { shell, filters, rows, total, pageSize, stats, categories } = handle.props
    let viewer = shell.viewer!
    let base = routes.admin.recipes.index.href()
    let query = (page: number) => {
      let params = new URLSearchParams()
      if (filters.query) params.set('q', filters.query)
      if (filters.status) params.set('status', filters.status)
      if (filters.categoryId) params.set('kategori', String(filters.categoryId))
      if (page > 1) params.set('hal', String(page))
      return params.toString()
    }
    let first = total === 0 ? 0 : (filters.page - 1) * pageSize + 1
    let last = Math.min(total, filters.page * pageSize)
    let formId = 'moderasi'

    return (
      <Document title="Kelola Resep · Admin" bodyClass="bg-bg">
        <div class="flex min-h-dvh flex-col lg:flex-row">
          <aside class="flex shrink-0 flex-col gap-1 bg-hover px-4 py-5 lg:w-[248px]">
            <div class="flex items-center gap-2 px-2 pt-1 pb-5">
              <Logo />
              <span class={cn(badgeVariants(), 'px-2.5 py-[3px]')}>Admin</span>
            </div>
            <nav aria-label="Admin" class="flex flex-col gap-1">
              <a
                href={base}
                aria-current="page"
                class="flex items-center gap-2.5 rounded-full bg-ink px-3.5 py-[9px] text-sm font-medium tracking-[0.28px] text-white"
              >
                <Icon name="book-open" />
                Resep
              </a>
              <a
                href={routes.home.href()}
                class="flex items-center gap-2.5 rounded-full px-3.5 py-[9px] text-sm font-medium tracking-[0.28px] text-muted hover:bg-bg/60 hover:text-ink"
              >
                <Icon name="arrow-left" />
                Kembali ke situs
              </a>
            </nav>
            <div class="mt-auto hidden items-center gap-2.5 border-t border-line px-2 pt-3 pb-0 lg:flex">
              <Avatar name={viewer.name} src={viewer.avatarUrl} size={28} class="border-0" />
              <div class="flex flex-col gap-0.5">
                <span class="text-[13px] font-medium tracking-[0.26px] text-ink">{viewer.name}</span>
                <span class="text-xs tracking-[0.24px] text-muted">Administrator</span>
              </div>
            </div>
          </aside>

          <main id="konten" class="flex min-w-0 flex-1 flex-col gap-6 px-5 py-8 lg:px-10">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="flex flex-col gap-1.5">
                <h1 class="text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink lg:text-[48px] lg:leading-[53px] lg:tracking-[-0.48px]">
                  Kelola Resep
                </h1>
                <p class="text-[15px] leading-[23px] tracking-[0.3px] text-muted">Tinjau, terbitkan, atau arsipkan resep dari komunitas.</p>
              </div>
              <ButtonLink href={`${routes.admin.exportCsv.href()}?${query(1)}`} variant="dark" size="lg">
                <Icon name="download" />
                Ekspor CSV
              </ButtonLink>
            </div>

            <dl class="grid grid-cols-2 border-y border-line lg:grid-cols-4">
              {[
                ['Total resep', stats.total],
                ['Terbit', stats.published],
                ['Diarsipkan', stats.archived],
                ['Terbit minggu ini', stats.this_week],
              ].map(([label, value], index) => (
                <div key={String(label)} class={cn('flex flex-col gap-1 py-5', index > 0 && 'lg:border-l lg:border-line lg:pl-6', index % 2 === 1 && 'border-l border-line pl-6')}>
                  <dt class="text-xs tracking-[0.24px] text-muted">{label}</dt>
                  <dd class="text-[32px] leading-9 font-normal tracking-[-0.32px] text-ink lg:text-[40px] lg:leading-[44px] lg:tracking-[-0.4px]">
                    {formatCount(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <form method="get" action={base} data-autosubmit class="flex flex-wrap items-center gap-2" role="search">
                <label class="flex h-10 w-full items-center gap-2 rounded-md border border-line px-3 focus-within:border-ink sm:w-[320px]">
                  <Icon name="search" class="text-muted" />
                  <span class="sr-only">Cari judul atau penulis</span>
                  <input type="search" name="q" value={filters.query} placeholder="Cari judul atau penulis…" class="h-full min-w-0 flex-1 bg-transparent text-[13px] tracking-[0.26px] placeholder:text-faint focus:outline-none" />
                </label>
                <Select
                  label="Status"
                  name="status"
                  value={filters.status ?? ''}
                  options={[
                    { value: '', label: 'Semua' },
                    ...(Object.keys(STATUS) as RecipeStatus[]).map((status) => ({ value: status, label: STATUS[status].label })),
                  ]}
                />
                <Select
                  label="Kategori"
                  name="kategori"
                  value={filters.categoryId ? String(filters.categoryId) : ''}
                  options={[
                    { value: '', label: 'Semua' },
                    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                  ]}
                />
                <noscript>
                  <Button type="submit" variant="outline">Terapkan</Button>
                </noscript>
              </form>
              <BulkActions formId={formId} />
            </div>

            <form id={formId} method="post" action={routes.admin.recipes.action.href()} class="overflow-x-auto rounded-md border border-line">
              <CsrfField token={shell.csrfToken} />
              <input type="hidden" name="kembali" value={`${base}?${query(filters.page)}`} />
              {rows.length === 0 ? (
                <div class="p-8">
                  <Empty title="Tidak ada resep" description="Tidak ada resep yang cocok dengan pencarian atau filter ini." bordered={false} />
                </div>
              ) : (
                <table class="w-full min-w-[720px] text-left text-[13px]">
                  <thead class="bg-hover text-xs font-medium tracking-[0.24px] text-muted">
                    <tr class="h-[38px]">
                      <th scope="col" class="w-[52px] pl-4">
                        <input type="checkbox" data-select-all aria-label="Pilih semua resep di halaman ini" class={checkboxClass} />
                      </th>
                      <th scope="col" class="pl-4 font-medium">Resep</th>
                      <th scope="col" class="w-[176px] pl-4 font-medium">Kategori</th>
                      <th scope="col" class="w-[166px] pl-4 font-medium">Status</th>
                      <th scope="col" class="w-[146px] pl-4 font-medium">Diperbarui</th>
                      <th scope="col" class="w-16 px-4"><span class="sr-only">Buka</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      let status = STATUS[row.status]
                      let id = `resep-${row.id}`
                      return (
                        <tr key={row.id} class="h-[60px] border-t border-line tracking-[0.26px] has-checked:bg-hover">
                          <td class="pl-4">
                            <input id={id} type="checkbox" name="resep" value={row.id} disabled={row.status === 'draft'} aria-label={`Pilih ${row.title}`} class={checkboxClass} />
                          </td>
                          <td class="pl-4">
                            <div class="flex items-center gap-3">
                              <span class="size-10 shrink-0 overflow-hidden rounded-md bg-hover">
                                {row.imageUrl && <img src={row.imageUrl} alt="" class="size-full object-cover" loading="lazy" />}
                              </span>
                              <div class="flex min-w-0 flex-col">
                                <label for={id} class="truncate text-sm font-medium tracking-[0.28px] text-ink">
                                  {row.title}
                                </label>
                                <span class="text-xs tracking-[0.24px] text-muted">
                                  oleh {row.authorName}
                                  {row.isVariation && ' · variasi'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td class="pl-4 text-muted">{row.categories[0] ?? '–'}</td>
                          <td class="pl-4">
                            <span class={cn('inline-flex items-center gap-[5px] rounded-full px-2 py-[3px] text-xs leading-4 font-medium tracking-[0.24px]', status.class)}>
                              <Icon name={status.icon} size={12} />
                              {status.label}
                            </span>
                          </td>
                          <td class="pl-4 text-muted">{formatRelative(row.updatedAt)}</td>
                          <td class="px-4">
                            {row.status !== 'draft' && (
                              <a href={routes.recipes.show.href({ id: row.id })} class="flex size-8 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-ink" aria-label={`Buka ${row.title}`}>
                                <Icon name="arrow-up-right" />
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </form>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-[13px] tracking-[0.26px] text-muted">
                Menampilkan {first}–{last} dari {formatCount(total)} resep · Draf hanya dapat diubah oleh penulisnya.
              </p>
              <div class="flex gap-2">
                {filters.page > 1 ? (
                  <ButtonLink href={`${base}?${query(filters.page - 1)}`} variant="outline" size="sm" class="px-3">Sebelumnya</ButtonLink>
                ) : (
                  <span class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-3 opacity-40')} aria-disabled="true">Sebelumnya</span>
                )}
                {last < total ? (
                  <ButtonLink href={`${base}?${query(filters.page + 1)}`} variant="outline" size="sm" class="px-3">Berikutnya</ButtonLink>
                ) : (
                  <span class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-3 opacity-40')} aria-disabled="true">Berikutnya</span>
                )}
              </div>
            </div>
          </main>
        </div>
        {shell.flash && <Toast message={shell.flash.message} action={shell.flash.action} />}
      </Document>
    )
  }
}
