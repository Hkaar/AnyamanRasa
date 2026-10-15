import type { Handle, RemixNode } from 'remix/component'

import { routes } from '../routes.ts'
import { Document } from './document.tsx'
import { Icon, type IconName } from './icon.tsx'
import { CsrfField, Logo } from './primitives.tsx'
import type { NavKey, Shell } from './shell.ts'
import { ButtonLink } from './button.tsx'
import { cn, eyebrow, pageX } from './utils.ts'
import { Avatar } from './avatar.tsx'
import { Toast } from './toast.tsx'

interface NavLink {
  key: Exclude<NavKey, null>
  label: string
  href: string
  icon: IconName
  hint: string
}

const NAV_LINKS: NavLink[] = [
  { key: 'home', label: 'Beranda', href: routes.home.href(), icon: 'house', hint: '' },
  {
    key: 'recipes',
    label: 'Jelajahi Resep',
    href: routes.recipes.index.href(),
    icon: 'book-open',
    hint: 'Ribuan resep rumahan',
  },
  {
    key: 'pantry',
    label: 'Cari dari Bahan',
    href: routes.pantry.index.href(),
    icon: 'shopping-basket',
    hint: 'Masak dari isi dapurmu',
  },
]
// The graph explorer is no longer a top-level nav item in the design; it stays reachable from
// the home page, recipe and ingredient pages, and the footer.

export interface SiteLayoutProps {
  shell: Shell
  title?: string
  description?: string
  active?: NavKey
  /** Hide the footer for app-like screens (graph, editor). */
  footer?: boolean
  /** Edge-to-edge header for full-screen tools (graph): 24px side padding instead of the page column. */
  fullWidth?: boolean
  children?: RemixNode
}

export function SiteLayout(handle: Handle<SiteLayoutProps>) {
  return () => {
    let { shell, title, description, active = null, footer = true, fullWidth = false, children } = handle.props
    return (
      <Document title={title} description={description}>
        <a
          href="#konten"
          class="sr-only z-50 rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Langsung ke konten
        </a>
        <SiteHeader shell={shell} active={active} fullWidth={fullWidth} />
        <OfflineBanner />
        <main id="konten" tabIndex={-1} class="outline-none">
          {children}
        </main>
        {footer && <SiteFooter />}
        {shell.flash && <Toast message={shell.flash.message} action={shell.flash.action} />}
      </Document>
    )
  }
}

/** pen.dev 12c. Shown by entry.ts while the browser reports no connection. */
function OfflineBanner() {
  return () => (
    <div data-offline-banner role="status" hidden class="bg-error-subtle">
      <div class={cn(pageX, 'flex flex-wrap items-center gap-x-3 gap-y-2 py-3 text-[13px] leading-5 tracking-[0.26px]')}>
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg/70 text-error">
          <Icon name="wifi-off" size={15} />
        </span>
        <p class="min-w-0 flex-1 text-ink">
          <span class="font-medium text-error">Kamu sedang offline.</span> Halaman ini tetap bisa dibaca, tapi
          pencarian dan perubahan baru perlu koneksi.
        </p>
        <button
          type="button"
          data-offline-retry
          class="flex h-8 items-center gap-1.5 rounded-sm bg-bg/70 px-3 font-medium text-error transition-colors hover:bg-bg"
        >
          <Icon name="rotate-cw" size={14} />
          Sambungkan lagi
        </button>
      </div>
    </div>
  )
}

function SiteHeader(handle: Handle<{ shell: Shell; active: NavKey; fullWidth: boolean }>) {
  return () => {
    let { shell, active, fullWidth } = handle.props
    let viewer = shell.viewer
    return (
      <header
        class={cn(
          'sticky top-0 z-40 border-b border-line bg-bg has-[details[open]_.fixed]:z-[60]',
          // Home: the bar floats over the hero and stays pinned. While the page is at the top
          // (`data-at-top`, kept in sync by entry.ts) it blends into the hero; once scrolled it
          // turns into a tinted, blurred bar so content underneath stays legible.
          active === 'home' &&
            'lg:fixed lg:inset-x-0 lg:border-line/60 lg:bg-hover/80 lg:backdrop-blur-md lg:transition-[background-color,border-color,backdrop-filter] lg:duration-300 lg:data-at-top:border-transparent lg:data-at-top:bg-transparent lg:data-at-top:backdrop-blur-none',
        )}
        data-blend={active === 'home' ? 'true' : undefined}
        data-at-top={active === 'home' ? 'true' : undefined}
      >
        <div
          class={cn(
            fullWidth ? 'w-full px-5 md:px-10 lg:px-6' : pageX,
            'flex h-[59px] items-center justify-between lg:h-[71px]',
          )}
        >
          <div class="flex items-center gap-12">
            <Logo />
            <nav aria-label="Navigasi utama" class="hidden lg:block">
              <ul class="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      aria-current={active === link.key ? 'page' : undefined}
                      class={cn(
                        'rounded-full transition-colors',
                        // Nav/Guest: 15px regular; Nav/User: 14px medium, tighter padding.
                        viewer ? 'px-3 py-2 text-sm font-medium' : 'px-3.5 py-2 text-[15px] tracking-[0.02em]',
                        active === link.key ? 'bg-hover text-ink' : 'text-muted hover:bg-hover/60 hover:text-ink',
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div class="hidden items-center gap-2 lg:flex">
            {viewer ? (
              <>
                <ButtonLink href={routes.recipes.create.index.href()} variant="outline">
                  <Icon name="plus" />
                  Tulis Resep
                </ButtonLink>
                <details class="group relative" data-pop>
                  <summary
                    class="flex cursor-pointer list-none items-center rounded-full [&::-webkit-details-marker]:hidden"
                    aria-label={`Menu akun ${viewer.name}`}
                  >
                    <Avatar name={viewer.name} src={viewer.avatarUrl} size={36} />
                  </summary>
                  <div class="absolute top-[calc(100%+8px)] right-0 w-56 rounded-lg border border-line bg-bg p-1.5 shadow-modal">
                    <div class="border-b border-line px-2.5 pt-1.5 pb-2.5">
                      <p class="text-sm font-medium">{viewer.name}</p>
                      <p class="text-xs text-muted">@{viewer.username}</p>
                    </div>
                    <AccountLinks shell={shell} compact />
                  </div>
                </details>
              </>
            ) : (
              <>
                <ButtonLink href={loginHref(shell.path)} variant="ghost">
                  Masuk
                </ButtonLink>
                <ButtonLink href={routes.auth.register.index.href()} variant="default">
                  Daftar
                </ButtonLink>
              </>
            )}
          </div>

          <MobileMenu shell={shell} active={active} />
        </div>
      </header>
    )
  }
}

export function loginHref(redirectTo: string): string {
  let href = routes.auth.login.index.href()
  return redirectTo && redirectTo !== '/' ? `${href}?ke=${encodeURIComponent(redirectTo)}` : href
}

function AccountLinks(handle: Handle<{ shell: Shell; compact?: boolean }>) {
  return () => {
    let { shell, compact } = handle.props
    let viewer = shell.viewer!
    let profile = routes.profile.show.href({ username: viewer.username })
    let items: { href: string; icon: IconName; label: string }[] = [
      { href: profile, icon: 'book-marked', label: 'Resep Saya' },
      { href: `${profile}?tab=variasi`, icon: 'git-branch', label: 'Variasi Saya' },
      { href: routes.profile.edit.index.href(), icon: 'settings', label: 'Pengaturan' },
    ]
    // The mobile menu design lists only Resep Saya, Variasi Saya, Pengaturan, Keluar.
    if (compact) items.splice(2, 0, { href: `${profile}?tab=disimpan`, icon: 'bookmark', label: 'Disimpan' })
    if (viewer.isAdmin) items.push({ href: routes.admin.recipes.index.href(), icon: 'shield', label: 'Admin' })

    let row = compact
      ? 'flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-ink hover:bg-hover'
      : 'flex h-11 w-full items-center gap-3 px-1 text-[15px] text-ink'
    return (
      <ul class={compact ? 'pt-1.5' : 'flex flex-col gap-1'}>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} class={row}>
              <Icon name={item.icon} size={compact ? 16 : 18} class="text-muted" />
              {item.label}
            </a>
          </li>
        ))}
        <li>
          <form method="post" action={routes.auth.logout.href()}>
            <CsrfField token={shell.csrfToken} />
            <button type="submit" class={cn(row, 'text-error')}>
              <Icon name="log-out" size={compact ? 16 : 18} />
              Keluar
            </button>
          </form>
        </li>
      </ul>
    )
  }
}

function MobileMenu(handle: Handle<{ shell: Shell; active: NavKey }>) {
  return () => {
    let { shell, active } = handle.props
    let viewer = shell.viewer
    return (
      <div class="flex items-center gap-1 lg:hidden">
        <a
          href={routes.recipes.index.href()}
          class="flex size-10 items-center justify-center rounded-full text-ink hover:bg-hover"
          aria-label="Cari resep"
        >
          <Icon name="search" size={20} />
        </a>
        <details class="group" data-pop>
          <summary
            class="flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-ink group-open:bg-hover [&::-webkit-details-marker]:hidden"
            aria-label="Menu"
          >
            <Icon name="menu" size={20} class="group-open:hidden" />
            <Icon name="x" size={20} class="hidden group-open:block" />
          </summary>
          <div class="fixed inset-x-0 top-[60px] bottom-0 z-40 flex flex-col gap-6 overflow-y-auto bg-bg px-5 pt-5 pb-6">
            <form action={routes.recipes.index.href()} role="search">
              <label class="flex h-12 items-center gap-2.5 rounded-lg border border-line bg-subtle px-3.5">
                <Icon name="search" size={18} class="text-muted" />
                <span class="sr-only">Cari resep atau bahan</span>
                <input
                  type="search"
                  name="q"
                  placeholder="Cari resep atau bahan…"
                  class="h-full w-full bg-transparent text-[15px] placeholder:text-faint focus:outline-none"
                />
              </label>
            </form>

            <ul>
              {NAV_LINKS.map((link) => {
                let current = active === link.key
                return (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      aria-current={current ? 'page' : undefined}
                      class="flex min-h-16 items-center gap-3.5 border-b border-line px-1"
                    >
                      <span
                        class={cn(
                          'flex size-9 items-center justify-center rounded-md border',
                          current
                            ? 'border-accent bg-accent-subtle text-accent-strong'
                            : 'border-line bg-subtle text-ink',
                        )}
                      >
                        <Icon name={link.icon} size={18} />
                      </span>
                      <span class="flex flex-1 flex-col">
                        <span
                          class={cn('text-[17px] tracking-[-0.3px]', current ? 'font-medium' : '')}
                        >
                          {link.label}
                        </span>
                        {!current && link.hint && <span class="text-xs text-muted">{link.hint}</span>}
                      </span>
                      {current ? (
                        <span class="rounded-sm bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent-strong">
                          Halaman ini
                        </span>
                      ) : (
                        <Icon name="chevron-right" size={18} class="text-faint" />
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>

            {viewer && (
              <div class="flex flex-col gap-1">
                <p class={cn(eyebrow, 'tracking-[1px]')}>Akun</p>
                <AccountLinks shell={shell} />
              </div>
            )}

            <div class="mt-auto flex flex-col gap-3">
              {viewer ? (
                <>
                  <a
                    href={routes.profile.show.href({ username: viewer.username })}
                    class="flex h-16 items-center gap-3 rounded-lg border border-line bg-subtle p-3"
                  >
                    <Avatar name={viewer.name} src={viewer.avatarUrl} size={40} />
                    <span class="flex flex-1 flex-col">
                      <span class="text-[15px] font-medium">{viewer.name}</span>
                      <span class="text-[13px] text-muted">Lihat profil</span>
                    </span>
                    <Icon name="chevron-right" size={18} class="text-faint" />
                  </a>
                  <ButtonLink href={routes.recipes.create.index.href()} variant="default" size="lg" class="h-12 text-[15px] w-full">
                    <Icon name="plus" />
                    Tulis Resep
                  </ButtonLink>
                </>
              ) : (
                <>
                  <p class="text-center text-[13px] text-muted">
                    Masuk untuk menulis resep dan membuat variasi.
                  </p>
                  <div class="grid grid-cols-2 gap-2">
                    <ButtonLink href={loginHref(shell.path)} variant="outline" size="lg" class="h-12 text-[15px]">
                      Masuk
                    </ButtonLink>
                    <ButtonLink href={routes.auth.register.index.href()} variant="default" size="lg" class="h-12 text-[15px]">
                      Daftar
                    </ButtonLink>
                  </div>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    )
  }
}

function SiteFooter() {
  return () => {
    let columns: { title: string; links: { label: string; href: string }[] }[] = [
      {
        title: 'Jelajahi',
        links: [
          { label: 'Jelajahi Resep', href: routes.recipes.index.href() },
          { label: 'Cari dari Bahan', href: routes.pantry.index.href() },
          { label: 'Jelajahi Graf', href: routes.graph.index.href() },
        ],
      },
      {
        title: 'Komunitas',
        links: [
          { label: 'Tulis Resep', href: routes.recipes.create.index.href() },
          { label: 'Buat Variasi', href: routes.recipes.index.href() },
          { label: 'Profil', href: routes.profile.edit.index.href() },
        ],
      },
    ]
    return (
      <footer class="bg-surface-dark text-white">
        <div class={cn(pageX, 'flex flex-col gap-7 pt-10 pb-8 lg:gap-14 lg:pt-16 lg:pb-10')}>
          <div class="flex flex-col justify-between gap-7 lg:flex-row">
            <div class="flex max-w-[340px] flex-col gap-3 lg:gap-3.5">
              <Logo inverted />
              <p class="text-[13px] leading-[1.55] tracking-[0.02em] text-sand lg:text-sm lg:leading-[22px]">
                Platform penemuan resep yang menganyam hubungan antar masakan, bahan, dan variasi.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4 lg:flex lg:gap-24">
              {columns.map((column) => (
                <div key={column.title} class="flex flex-col gap-2.5 lg:gap-3">
                  <p class="text-[13px] font-medium tracking-[0.02em] text-white">{column.title}</p>
                  <ul class="flex flex-col gap-2.5 lg:gap-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} class="block text-[13px] leading-[17px] tracking-[0.02em] text-sand hover:text-white lg:text-sm lg:leading-[18px]">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div class="flex flex-wrap justify-between gap-2 border-t border-surface-dark-line pt-5 text-xs tracking-[0.02em] text-sand lg:pt-6 lg:text-[13px]">
            <p>© 2026 AnyamanRasa. Dibuat dengan rasa.</p>
            <p class="hidden lg:block">Bahasa Indonesia</p>
          </div>
        </div>
      </footer>
    )
  }
}
