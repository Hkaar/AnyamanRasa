// shadcn/ui Avatar: photo with initials fallback (pen.dev nav/profile avatar).
import type { Handle } from 'remix/component'

import { initials } from '../domain/format.ts'
import { cn } from './utils.ts'

export function Avatar(handle: Handle<{ name: string; src: string | null; size?: number; class?: string }>) {
  return () => {
    let { name, src, size = 36 } = handle.props
    let style = { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.36)}px` }
    let base = 'inline-flex shrink-0 overflow-hidden rounded-full border border-line'
    return src ? (
      <img data-slot="avatar" src={src} alt="" style={style} class={cn(base, 'object-cover', handle.props.class)} />
    ) : (
      <span
        data-slot="avatar"
        aria-hidden="true"
        style={style}
        class={cn(base, 'items-center justify-center bg-accent-subtle font-medium text-accent-strong', handle.props.class)}
      >
        {initials(name)}
      </span>
    )
  }
}
