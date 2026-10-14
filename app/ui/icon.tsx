import type { Handle } from 'remix/component'

import { type IconName, iconData } from './icon-data.ts'

export type { IconName }

export interface IconProps {
  name: IconName
  size?: number
  class?: string
  strokeWidth?: number
  /** Accessible name; icons are decorative (aria-hidden) when omitted. */
  label?: string
}

/** Lucide icon rendered as inline SVG (the design's icon library). */
export function Icon(handle: Handle<IconProps>) {
  return () => {
    let { name, size = 16, label, strokeWidth = 2 } = handle.props
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        class={['shrink-0', handle.props.class].filter(Boolean).join(' ')}
        aria-hidden={label ? undefined : 'true'}
        aria-label={label}
        role={label ? 'img' : undefined}
        focusable="false"
      >
        {iconData[name].map(([tag, attrs], index) => {
          let Tag = tag as 'path'
          return <Tag key={index} {...attrs} />
        })}
      </svg>
    )
  }
}
