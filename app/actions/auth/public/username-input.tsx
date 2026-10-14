import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import { routes } from '../../../routes.ts'
import { inputClass } from '../../../ui/input.tsx'
import { cn } from '../../../ui/utils.ts'

/** Username input with a debounced live availability check. */
export const UsernameInput = clientEntry(
  import.meta.url,
  function UsernameInput(handle: Handle<{ id: string; value: string; error?: string }>) {
    let status: { available: boolean; message: string } | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | null = null

    function check(value: string) {
      clearTimeout(timer)
      controller?.abort()
      if (!value) {
        status = null
        handle.update()
        return
      }
      timer = setTimeout(async () => {
        controller = new AbortController()
        try {
          let response = await fetch(`${routes.auth.usernameCheck.href()}?u=${encodeURIComponent(value)}`, {
            signal: controller.signal,
          })
          status = await response.json()
          handle.update()
        } catch {
          // Superseded or offline; the server validates on submit anyway.
        }
      }, 350)
    }

    return () => {
      let { id, value, error } = handle.props
      let message = status?.message ?? error ?? 'Huruf kecil, angka, atau garis bawah.'
      let tone = status ? (status.available ? 'text-accent-strong' : 'text-error') : error ? 'text-error' : 'text-muted'
      return (
        <div class="flex flex-col gap-1.5">
          <input
            id={id}
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck={false}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]{3,30}"
            defaultValue={value}
            aria-invalid={(status && !status.available) || (!status && error) ? 'true' : undefined}
            aria-describedby={`${id}-status`}
            class={cn(inputClass, 'h-12 text-[15px] tracking-[0.28px] lg:h-11 lg:text-sm')}
            mix={on('input', (event) => check(event.currentTarget.value.trim().toLowerCase()))}
          />
          <p id={`${id}-status`} class={cn('text-xs tracking-[0.24px]', tone)} aria-live="polite">
            {message}
          </p>
        </div>
      )
    }
  },
)
