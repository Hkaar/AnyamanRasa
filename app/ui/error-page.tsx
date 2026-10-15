import type { Handle } from 'remix/component'

import { routes } from '../routes.ts'
import { SiteLayout } from './layout.tsx'
import type { Shell } from './shell.ts'
import { ButtonLink } from './button.tsx'
import type { IconName } from './icon.tsx'
import { StatusMessage } from './status.tsx'
import { cn, pageX } from './utils.ts'

/** What a not-found page says; anything left out falls back to the generic 404 (pen.dev 12a). */
export interface NotFoundCopy {
  title?: string
  message?: string
  /** A gradient mark instead of the status code chip (pen.dev 12d). */
  icon?: IconName
  action?: { href: string; label: string }
  link?: { href: string; label: string }
}

/** pen.dev 12d: a recipe that was deleted, archived or never published. */
export const RECIPE_NOT_FOUND: NotFoundCopy = {
  icon: 'book-x',
  title: 'Resep ini sudah tidak tersedia.',
  message: 'Pemiliknya mungkin telah menghapus atau menyembunyikan resep ini.',
  action: { href: routes.recipes.index.href(), label: 'Jelajahi resep lain' },
  link: { href: routes.home.href(), label: 'Kembali ke Beranda' },
}

export function NotFoundPage(handle: Handle<{ shell: Shell; copy?: NotFoundCopy; status?: 403 | 404 }>) {
  return () => {
    let { shell, copy = {}, status = 404 } = handle.props
    let denied = status === 403
    let action = copy.action ?? { href: routes.home.href(), label: 'Kembali ke Beranda' }
    let link = copy.link ?? { href: routes.recipes.index.href(), label: 'Jelajahi resep' }
    return (
      <SiteLayout shell={shell} title={denied ? 'Akses ditolak' : 'Tidak ditemukan'} footer={false}>
        <section class={cn(pageX, 'flex min-h-[calc(100dvh-72px)] flex-col items-center justify-center py-24')}>
          <StatusMessage
            size="page"
            code={copy.icon ? undefined : String(status)}
            icon={copy.icon}
            title={copy.title ?? (denied ? 'Dapur ini bukan milikmu.' : 'Halaman ini tidak ada di dapur kami.')}
            description={
              copy.message ??
              (denied ? 'Kamu tidak punya akses ke halaman ini.' : 'Tautannya mungkin salah atau resepnya sudah dipindahkan.')
            }
            action={
              <ButtonLink href={action.href} variant="dark" size="lg">
                {action.label}
              </ButtonLink>
            }
            link={link}
          />
        </section>
      </SiteLayout>
    )
  }
}
