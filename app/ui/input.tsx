// shadcn/ui Input, Textarea and NativeSelect, themed with pen.dev's Form Field.
import type { Handle, Props } from 'remix/component'

import { Icon } from './icon.tsx'
import { cn } from './utils.ts'

export const inputClass =
  'h-11 w-full min-w-0 rounded-md border border-line-strong bg-bg px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:bg-error-subtle file:border-0 file:bg-transparent file:text-sm file:font-medium'

export const textareaClass = cn(inputClass, 'h-auto min-h-16 py-3 leading-relaxed')

export function Input(handle: Handle<Props<'input'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <input data-slot="input" class={cn(inputClass, className as string)} {...props} />
  }
}

export function Textarea(handle: Handle<Props<'textarea'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <textarea data-slot="textarea" class={cn(textareaClass, className as string)} {...props} />
  }
}

export const nativeSelectClass = cn(inputClass, 'cursor-pointer appearance-none pr-9')

/** shadcn/ui NativeSelect: a styled <select> with a chevron. */
export function NativeSelect(handle: Handle<Props<'select'> & { wrapperClass?: string }>) {
  return () => {
    let { class: className, wrapperClass, ...props } = handle.props
    return (
      <div data-slot="native-select-wrapper" class={cn('relative', wrapperClass)}>
        <select data-slot="native-select" class={cn(nativeSelectClass, className as string)} {...props} />
        <Icon name="chevron-down" class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
      </div>
    )
  }
}

export const checkboxClass =
  'size-4 shrink-0 cursor-pointer rounded-xs accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-30'
