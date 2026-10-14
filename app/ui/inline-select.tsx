import type { Handle, RemixNode } from 'remix/component'

import { Icon } from './icon.tsx'
import { cn } from './utils.ts'

/** The design's Select: inline label + value with a chevron, backed by a native <select>. */
export function InlineSelect(
  handle: Handle<{ label: string; name: string; value: string; class?: string; children?: RemixNode }>,
) {
  return () => {
    let id = `select-${handle.props.name}`
    return (
      <div
        class={cn(
          'relative flex h-10 items-center rounded-md border border-outline bg-bg pl-3.5 text-[13px] focus-within:border-accent hover:bg-subtle',
          handle.props.class,
        )}
      >
        <label for={id} class="whitespace-nowrap text-muted">
          {handle.props.label}
        </label>
        <select
          id={id}
          name={handle.props.name}
          value={handle.props.value}
          class="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-8 pl-2 font-medium focus:outline-none"
        >
          {handle.props.children}
        </select>
        <Icon name="chevron-down" class="pointer-events-none absolute right-3 text-muted" />
      </div>
    )
  }
}
