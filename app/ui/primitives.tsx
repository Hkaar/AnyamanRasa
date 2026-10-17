// App-specific building blocks. Generic UI lives in shadcn-style modules
// (button.tsx, badge.tsx, input.tsx, label.tsx, card.tsx, empty.tsx, …).
import type { Handle, RemixNode } from 'remix/component'

import { Icon, type IconName } from './icon.tsx'
import { cn } from './utils.ts'

/** `large` is the onboarding welcome mark (pen.dev 15a). */
export function Logo(handle: Handle<{ href?: string; class?: string; inverted?: boolean; large?: boolean }>) {
  return () => (
    <a
      href={handle.props.href ?? '/'}
      class={cn('inline-flex shrink-0 items-center gap-2 rounded-md', handle.props.large && 'gap-3', handle.props.class)}
      aria-label="AnyamanRasa, ke beranda"
    >
      <img
        src={handle.props.inverted ? '/logo-light.png' : '/logo.png'}
        alt=""
        width={34}
        height={28}
        class={cn('h-7 w-[34px] object-contain', handle.props.large && 'h-[38px] w-[46px] lg:h-12 lg:w-[58px]')}
      />
      <span
        class={cn(
          'text-[17px] font-medium tracking-[-0.4px]',
          handle.props.large && 'text-[22px] lg:text-[27px]',
          handle.props.inverted ? 'text-white' : 'text-ink',
        )}
      >
        AnyamanRasa
      </span>
    </a>
  )
}

/** Icon + text meta row item (duration, difficulty, author). */
export function MetaItem(handle: Handle<{ icon: IconName; children?: RemixNode; class?: string }>) {
  return () => (
    <span class={cn('inline-flex items-center gap-[5px] text-[13px] text-muted', handle.props.class)}>
      <Icon name={handle.props.icon} size={14} />
      {handle.props.children}
    </span>
  )
}

/** Hidden CSRF token for every mutating form. */
export function CsrfField(handle: Handle<{ token: string }>) {
  return () => <input type="hidden" name="_csrf" value={handle.props.token} />
}
