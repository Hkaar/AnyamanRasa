// shadcn/ui Empty, themed as pen.dev's Empty State.
import type { Handle, RemixNode } from 'remix/component'

import { Icon, type IconName } from './icon.tsx'
import { cn } from './utils.ts'

export interface EmptyProps {
  title: string
  description: string
  icon?: IconName
  /** EmptyContent: usually a Button. */
  action?: RemixNode
  bordered?: boolean
  class?: string
}

export function Empty(handle: Handle<EmptyProps>) {
  return () => {
    let { title, description, icon = 'search-x', action, bordered = true } = handle.props
    return (
      <div
        data-slot="empty"
        class={cn(
          'mx-auto flex max-w-[400px] flex-col items-center gap-4 rounded-lg px-8 py-12 text-center',
          bordered && 'border border-line',
          handle.props.class,
        )}
      >
        <span data-slot="empty-media" class="flex size-11 items-center justify-center rounded-md border border-line bg-subtle text-muted">
          <Icon name={icon} size={20} />
        </span>
        <div data-slot="empty-header" class="flex flex-col gap-4">
          <p data-slot="empty-title" class="text-base font-semibold text-ink">
            {title}
          </p>
          <p data-slot="empty-description" class="text-sm leading-normal text-muted">
            {description}
          </p>
        </div>
        {action && <div data-slot="empty-content">{action}</div>}
      </div>
    )
  }
}
