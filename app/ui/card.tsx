// shadcn/ui Card, themed as pen.dev panels: 1px border, radius-lg, no shadow.
import type { Handle, Props } from 'remix/component'

import { cn } from './utils.ts'

export const cardClass = 'flex flex-col rounded-lg border border-line bg-bg text-ink'

export function Card(handle: Handle<Props<'div'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <div data-slot="card" class={cn(cardClass, className as string)} {...props} />
  }
}

export function CardHeader(handle: Handle<Props<'div'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <div data-slot="card-header" class={cn('flex flex-col gap-1.5 p-6', className as string)} {...props} />
  }
}

export function CardContent(handle: Handle<Props<'div'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <div data-slot="card-content" class={cn('p-6', className as string)} {...props} />
  }
}

export function CardFooter(handle: Handle<Props<'div'>>) {
  return () => {
    let { class: className, ...props } = handle.props
    return <div data-slot="card-footer" class={cn('flex items-center p-6', className as string)} {...props} />
  }
}
