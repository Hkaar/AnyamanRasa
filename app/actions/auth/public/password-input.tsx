import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import { passwordStrength } from '../../../domain/validation.ts'
import { Icon } from '../../../ui/icon.tsx'
import { inputClass } from '../../../ui/input.tsx'
import { FieldMessage } from '../../../ui/label.tsx'
import { cn } from '../../../ui/utils.ts'

export interface PasswordInputProps {
  id: string
  name: string
  autocomplete: 'current-password' | 'new-password'
  invalid?: boolean
  placeholder?: string
  /** Show the strength meter (sign-up). */
  meter?: boolean
  /**
   * Render the field's description/error here (instead of in a wrapping Field) so the
   * strength meter sits below it, as in the design.
   */
  help?: string
  error?: string
  /** Extra classes for the input (e.g. height per breakpoint). */
  inputClass?: string
}

/** Password input with a show/hide toggle and optional strength meter. */
export const PasswordInput = clientEntry(
  import.meta.url,
  function PasswordInput(handle: Handle<PasswordInputProps>) {
    let visible = false
    let value = ''

    return () => {
      let { id, name, autocomplete, invalid, placeholder, meter, help, error, inputClass: extraClass } = handle.props
      let strength = passwordStrength(value)
      return (
        <div class="flex flex-col gap-[18px]">
          <div class="flex flex-col gap-1.5">
            <div class="relative">
              <input
                id={id}
                name={name}
                // The JSX types narrow `type` per role; both values are valid for this input.
                type={(visible ? 'text' : 'password') as 'password'}
                autocomplete={autocomplete}
                required
                placeholder={placeholder}
                aria-invalid={invalid ? 'true' : undefined}
                aria-describedby={`${id}-help`}
                class={cn(inputClass, 'h-11 pr-11 text-[15px] tracking-[0.28px] lg:border-line lg:text-sm', extraClass)}
                mix={on('input', (event) => {
                  value = event.currentTarget.value
                  if (meter) handle.update()
                })}
              />
              <button
                type="button"
                class="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink"
                aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-pressed={visible ? 'true' : 'false'}
                mix={on('click', () => {
                  visible = !visible
                  handle.update()
                })}
              >
                <Icon name={visible ? 'eye' : 'eye-off'} />
              </button>
            </div>
            {(help || error) && (
              <FieldMessage id={`${id}-help`} error={error}>
                {help}
              </FieldMessage>
            )}
          </div>
          {meter && value.length > 0 && (
            <div class="flex flex-col gap-1.5" aria-live="polite">
              <div class="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((bar) => (
                  <span key={bar} class={cn('h-[3px] flex-1 rounded-full', bar <= strength.score ? 'bg-accent' : 'bg-line')} />
                ))}
              </div>
              <span class="text-xs tracking-[0.24px] text-muted">Kekuatan kata sandi: {strength.label}</span>
            </div>
          )}
        </div>
      )
    }
  },
)
