// shadcn/ui Breadcrumb.
import type { Handle } from 'remix/component'

import { Icon } from './icon.tsx'

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumb(handle: Handle<{ items: Crumb[]; class?: string }>) {
  return () => (
    <nav data-slot="breadcrumb" aria-label="Breadcrumb" class={handle.props.class}>
      <ol class="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        {handle.props.items.map((item, index) => (
          <li key={index} class="flex items-center gap-2">
            {index > 0 && <Icon name="chevron-right" size={14} class="text-faint" />}
            {item.href ? (
              <a href={item.href} class="transition-colors hover:text-ink">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" class="font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
