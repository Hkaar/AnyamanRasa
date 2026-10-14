// shadcn/ui Input and Textarea, themed with pen.dev's Form Field states: cream fill, lilac on hover,
// pink while focused, red tint when invalid (no borders). Selects live in select.tsx.
import type { Handle, Props } from 'remix/component'

import { cn } from './utils.ts'

export const inputClass =
  'h-11 w-full min-w-0 rounded-md bg-hover px-3.5 text-sm text-ink caret-accent outline-none transition-colors placeholder:text-faint hover:bg-lilac focus-visible:bg-pink disabled:cursor-not-allowed disabled:bg-subtle disabled:text-faint aria-invalid:bg-error-subtle file:border-0 file:bg-transparent file:text-sm file:font-medium'

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

export const checkboxClass =
  'size-4 shrink-0 cursor-pointer rounded-xs accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-30'
