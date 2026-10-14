// shadcn/ui Label and Field (label + control + description/error), pen.dev Form Field.
import type { Handle, Props, RemixNode } from 'remix/component'

import { Icon } from './icon.tsx'
import { cn } from './utils.ts'

export const labelClass = 'flex items-center gap-2 text-[13px] leading-[17px] font-medium text-ink select-none'

export function Label(handle: Handle<Props<'label'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <label data-slot="label" class={cn(labelClass, className as string)} {...props} />
  }
}

export interface FieldProps {
  id: string
  label: string
  error?: string
  /** FieldDescription text. */
  help?: string
  /** Positive helper shown in accent (e.g. "Tersedia"). */
  success?: string
  required?: boolean
  class?: string
  children?: RemixNode
}

export function Field(handle: Handle<FieldProps>) {
  return () => {
    let { id, label, error, help, success, required, children } = handle.props
    return (
      <div data-slot="field" data-invalid={error ? 'true' : undefined} class={cn('flex flex-col gap-1.5', handle.props.class)}>
        <Label for={id}>
          {label}
          {required && <span class="text-[11px] font-medium text-accent-strong">Wajib</span>}
        </Label>
        {children}
        <FieldMessage id={`${id}-help`} error={error} success={success}>
          {help}
        </FieldMessage>
      </div>
    )
  }
}

/** FieldDescription / FieldError in one: shows the error when present. */
export function FieldMessage(handle: Handle<{ id: string; error?: string; success?: string; children?: RemixNode }>) {
  return () => {
    let { id, error, success, children } = handle.props
    if (error) {
      return (
        <p id={id} data-slot="field-error" class="flex items-center gap-1.5 text-xs text-error">
          <Icon name="circle-alert" size={14} />
          {error}
        </p>
      )
    }
    let message = success ?? children
    if (message == null || message === '' || message === false) return null
    return (
      <p id={id} data-slot="field-description" class={cn('text-xs', success ? 'text-accent-strong' : 'text-muted')}>
        {message}
      </p>
    )
  }
}

/** Attributes that connect a control to its Field message. */
export function fieldAttrs(id: string, error?: string) {
  return {
    id,
    name: id,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': `${id}-help`,
  }
}
