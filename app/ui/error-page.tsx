import type { Handle } from 'remix/component'

import { routes } from '../routes.ts'
import { Icon } from './icon.tsx'
import { SiteLayout } from './layout.tsx'
import type { Shell } from './shell.ts'
import { ButtonLink } from './button.tsx'
import { cn, pageX } from './utils.ts'

export function NotFoundPage(handle: Handle<{ shell: Shell; message: string; status?: number }>) {
  return () => {
    let { shell, message, status = 404 } = handle.props
    return (
      <SiteLayout shell={shell} title={status === 404 ? 'Tidak ditemukan' : 'Akses ditolak'}>
        <section class={cn(pageX, 'flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center')}>
          <span class="flex size-11 items-center justify-center rounded-md bg-accent-subtle text-accent-strong">
            <Icon name={status === 404 ? 'search-x' : 'circle-alert'} size={20} />
          </span>
          <h1 class="text-[36px] leading-10 font-normal tracking-[-0.36px] text-ink md:text-[60px] md:leading-[66px] md:tracking-[-0.6px]">
            {status === 404 ? 'Halaman tidak ditemukan' : 'Akses ditolak'}
          </h1>
          <p class="max-w-md text-base leading-6 tracking-[0.32px] text-muted">{message}</p>
          <div class="flex gap-2">
            <ButtonLink href={routes.home.href()} variant="outline" size="lg">Ke Beranda</ButtonLink>
            <ButtonLink href={routes.recipes.index.href()} variant="default" size="lg">Jelajahi Resep</ButtonLink>
          </div>
        </section>
      </SiteLayout>
    )
  }
}
