import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui's class helper: conditional classes, later Tailwind classes win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Page gutter: 20px mobile, 40px tablet, 120px desktop (content width 1200 at 1440). */
export const pageX = 'mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-[120px]'

/** Small uppercase section label ("BAHAN UTAMA", "BAGIAN"). */
export const eyebrow = 'text-[11px] font-medium tracking-[0.8px] text-faint uppercase'
