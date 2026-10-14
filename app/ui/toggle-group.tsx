// shadcn/ui ToggleGroup (single) on native radios (pen.dev segmented "Kesulitan").
import type { Handle } from 'remix/component'

import { labelClass } from './label.tsx'
import { cn } from './utils.ts'

export function ToggleGroup(
  handle: Handle<{ name: string; value: string; options: { value: string; label: string }[]; label: string }>,
) {
  return () => {
    let { name, value, options, label } = handle.props
    return (
      <fieldset data-slot="toggle-group" class="flex min-w-0 flex-col">
        <legend class={cn(labelClass, 'mb-1.5')}>{label}</legend>
        <div class="flex h-11 gap-1 rounded-md border border-line bg-subtle p-1">
          {options.map((option) => (
            <label key={option.value} class="flex min-w-0 flex-1 cursor-pointer">
              <input type="radio" name={name} value={option.value} checked={value === option.value} class="peer sr-only" />
              <span
                data-slot="toggle-group-item"
                class="flex flex-1 items-center justify-center rounded-sm border border-transparent text-[13px] font-medium text-muted transition-colors hover:text-ink peer-checked:border-line-strong peer-checked:bg-bg peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ink"
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
}
