// pen.dev 12a–12f, 02b: the Krepling-style status message used by error, empty and not-found
// states. A soft gradient chip or mark, one headline, one sentence, one action and a text link.
import type { Handle, RemixNode } from 'remix/component'

import { Icon, type IconName } from './icon.tsx'
import { cn } from './utils.ts'

const gradient = 'bg-[linear-gradient(135deg,var(--color-peach),var(--color-pink)_60%,var(--color-lilac))]'

export interface StatusMessageProps {
  title: string
  description: string
  /** A short code shown in a pill above the headline ("404", "500"). */
  code?: string
  /** Icon in a round gradient mark (used when there is no code). */
  icon?: IconName
  /** `page`: a whole-page error with a large headline; `section`: a state inside a page. */
  size?: 'page' | 'section'
  /** Usually one dark Button or ButtonLink. */
  action?: RemixNode
  /** A plain text link next to the action. */
  link?: { href: string; label: string }
  headingLevel?: 1 | 2
  class?: string
}

export function StatusMessage(handle: Handle<StatusMessageProps>) {
  return () => {
    let { title, description, code, icon, size = 'section', action, link, headingLevel = size === 'page' ? 1 : 2 } = handle.props
    let headingClass = cn(
      'font-normal text-balance text-ink',
      size === 'page'
        ? 'text-[44px] leading-[1.05] tracking-[-0.9px] lg:text-[72px] lg:tracking-[-1.8px]'
        : 'text-[28px] leading-[1.1] tracking-[-0.4px] lg:text-[40px] lg:tracking-[-0.8px]',
    )
    return (
      <div
        data-slot="status"
        class={cn('mx-auto flex w-full max-w-[760px] flex-col items-center gap-5 text-center lg:gap-7', handle.props.class)}
      >
        {code ? (
          <span class={cn(gradient, 'rounded-full px-[18px] py-2 font-mono text-[13px] leading-none tracking-[1px] text-ink')}>
            {code}
          </span>
        ) : (
          icon && (
            <span aria-hidden="true" class={cn(gradient, 'flex size-14 items-center justify-center rounded-full text-ink lg:size-16')}>
              <Icon name={icon} size={22} />
            </span>
          )
        )}
        {headingLevel === 1 ? <h1 class={headingClass}>{title}</h1> : <h2 class={headingClass}>{title}</h2>}
        <p
          class={cn(
            'max-w-[620px] tracking-[0.2px] text-pretty text-muted',
            size === 'page' ? 'text-base leading-6 lg:text-lg lg:leading-7' : 'text-[15px] leading-6',
          )}
        >
          {description}
        </p>
        {(action || link) && (
          <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pt-1">
            {action}
            {link && (
              <a href={link.href} class="group inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline">
                {link.label}
                <Icon name="arrow-up-right" size={15} class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>
        )}
      </div>
    )
  }
}
