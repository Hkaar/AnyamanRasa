// The design's Select, built on the DropdownMenu (<details>) instead of a native <select>.
// Options are radios inside the panel, so the value submits with the form and the
// dropdown works without JavaScript. entry.ts closes the panel and updates the trigger
// text on change; `data-autosubmit` forms submit on the same change event.
import { on } from 'remix/component'
import type { Handle } from 'remix/component'

import { dropdownContentClass, dropdownItemClass, summaryResetClass } from './dropdown-menu.tsx'
import { Icon } from './icon.tsx'
import { cn } from './utils.ts'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  name: string
  value: string
  options: SelectOption[]
  /** Visible label inside the trigger ("Urutkan", "Kesulitan"). */
  label?: string
  /** Accessible name when there is no visible label. */
  ariaLabel?: string
  /** `inline`: compact filter trigger with its label. `field`: full-width form control. */
  variant?: 'inline' | 'field'
  /** Associates the radios with a form elsewhere in the page (the `form` attribute). */
  form?: string
  /** Opens the panel aligned to the trigger's right edge. */
  align?: 'start' | 'end'
  /** Client islands: called with the chosen value. */
  onChange?: (value: string) => void
  class?: string
}

// pen.dev Select states: cream fill, lilac on hover, pink while open (no borders).
const TRIGGER = {
  inline: 'h-10 gap-2 rounded-md pr-3 pl-3.5 text-[13px]',
  field: 'h-11 w-full justify-between gap-2 rounded-md px-3.5 text-sm',
}

export function Select(handle: Handle<SelectProps>) {
  return () => {
    let { name, value, options, label, ariaLabel, variant = 'inline', form, align = 'start', onChange } = handle.props
    let selected = options.find((option) => option.value === value) ?? options[0]
    let accessibleName = ariaLabel ?? label ?? name
    return (
      <details
        data-slot="select"
        data-select
        data-pop
        class={cn('group/select relative', variant === 'field' && 'w-full', handle.props.class)}
      >
        <summary
          class={cn(
            summaryResetClass,
            'flex items-center bg-hover whitespace-nowrap text-ink outline-none transition-colors hover:bg-lilac focus-visible:ring-[3px] focus-visible:ring-focus-ring group-open/select:bg-pink',
            TRIGGER[variant],
          )}
          aria-label={label ? undefined : accessibleName}
        >
          {label && <span class="text-muted transition-colors group-hover/select:text-ink group-open/select:text-ink">{label}</span>}
          <span data-select-value class={cn('truncate', variant === 'inline' && 'font-medium')}>
            {selected?.label}
          </span>
          <Icon name="chevron-down" class="ml-auto shrink-0 text-muted transition-transform group-hover/select:text-ink group-open/select:rotate-180 group-open/select:text-accent-strong" />
        </summary>
        <fieldset
          class={cn(
            dropdownContentClass,
            'top-[calc(100%+6px)] max-h-72 min-w-full overflow-y-auto rounded-md bg-subtle',
            variant === 'inline' && 'min-w-48',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <legend class="sr-only">{accessibleName}</legend>
          {options.map((option) => (
            <label
              key={option.value}
              class={cn(
                dropdownItemClass,
                'rounded-sm text-[13px] has-focus-visible:bg-hover has-checked:bg-accent-subtle has-checked:font-medium has-checked:text-accent-strong',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={option.value === selected?.value}
                form={form}
                class="peer sr-only"
                {...(onChange ? { mix: on('change', (event) => onChange(event.currentTarget.value)) } : {})}
              />
              <span class="flex-1 whitespace-nowrap" data-select-label>
                {option.label}
              </span>
              <Icon name="check" class="invisible text-accent-strong peer-checked:visible" />
            </label>
          ))}
        </fieldset>
      </details>
    )
  }
}
