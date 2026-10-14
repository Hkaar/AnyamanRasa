import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import { Icon } from '../../../ui/icon.tsx'
import { enter } from '../../public/motion.ts'
import { Button } from '../../../ui/button.tsx'
import { labelClass } from '../../../ui/label.tsx'
import { cn } from '../../../ui/utils.ts'

export const CHOSEN_ID = '__bahan__'

export interface Suggestion {
  id: string
  name: string
  recipeCount: number
}

export interface IngredientComboboxProps {
  /** Form field name for the typed text (submitted when no suggestion is chosen). */
  name: string
  label: string
  placeholder: string
  submitLabel: string
  searchUrl: string
  /** Ingredient ids already chosen; shown as "Sudah dipilih". */
  selectedIds: string[]
  /** URL for choosing a suggestion; `CHOSEN_ID` in it is replaced with the ingredient id. */
  chooseHref: string
  hint?: string
}

/**
 * Accessible ingredient combobox (WAI-ARIA combobox + listbox). Without
 * JavaScript it is a plain text field whose value the server resolves.
 */
export const IngredientCombobox = clientEntry(
  import.meta.url,
  function IngredientCombobox(handle: Handle<IngredientComboboxProps>) {
    let query = ''
    let suggestions: Suggestion[] = []
    let open = false
    let active = -1
    let controller: AbortController | null = null
    let listId = `${handle.id}-list`

    async function search(value: string) {
      controller?.abort()
      query = value
      if (value.trim().length === 0) {
        suggestions = []
        open = false
        handle.update()
        return
      }
      controller = new AbortController()
      try {
        let response = await fetch(`${handle.props.searchUrl}?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        let found = (await response.json()) as Suggestion[]
        // Already-chosen ingredients go last, as in the design.
        let picked = (s: Suggestion) => (handle.props.selectedIds.includes(s.id) ? 1 : 0)
        suggestions = found.sort((a, b) => picked(a) - picked(b))
        let opening = !open
        open = true
        active = suggestions.findIndex((s) => !handle.props.selectedIds.includes(s.id))
        await handle.update()
        let list = document.getElementById(`${listId}-popup`)
        if (opening && list) enter(list, { y: -4 })
      } catch {
        // Aborted by a newer keystroke.
      }
    }

    function choose(suggestion: Suggestion) {
      if (handle.props.selectedIds.includes(suggestion.id)) return
      window.location.assign(handle.props.chooseHref.replace(CHOSEN_ID, suggestion.id))
    }

    return () => {
      let { name, label, placeholder, submitLabel, selectedIds, hint } = handle.props
      let inputId = `${handle.id}-input`
      let headId = `${listId}-head`
      return (
        <div class="flex flex-col gap-1.5 lg:gap-2.5">
          {/* The mobile design has no visible label; keep it for assistive tech. */}
          <label for={inputId} class={cn(labelClass, 'sr-only lg:not-sr-only')}>
            {label}
          </label>
          <div class="relative">
            <div class="flex h-[52px] items-center gap-2.5 rounded-md border border-outline bg-bg pr-2 pl-4 focus-within:border-ink focus-within:ring-[0.5px] focus-within:ring-ink lg:h-14">
              <Icon name="plus" size={18} class="text-ink" />
              <input
                id={inputId}
                name={name}
                type="text"
                role="combobox"
                autocomplete="off"
                aria-autocomplete="list"
                aria-expanded={open ? 'true' : 'false'}
                aria-controls={listId}
                aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
                placeholder={placeholder}
                value={query}
                class="h-full min-w-0 flex-1 bg-transparent text-base tracking-[0.3px] placeholder:text-faint focus:outline-none"
                mix={[
                  on('input', (event) => search(event.currentTarget.value)),
                  on('keydown', (event) => {
                    if (!open || suggestions.length === 0) return
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      let step = event.key === 'ArrowDown' ? 1 : -1
                      active = (active + step + suggestions.length) % suggestions.length
                      handle.update()
                    } else if (event.key === 'Enter' && active >= 0) {
                      let suggestion = suggestions[active]
                      if (suggestion && !selectedIds.includes(suggestion.id) && !query.includes(',')) {
                        event.preventDefault()
                        choose(suggestion)
                      }
                    } else if (event.key === 'Escape') {
                      open = false
                      handle.update()
                    }
                  }),
                  on('blur', () => {
                    setTimeout(() => {
                      open = false
                      handle.update()
                    }, 150)
                  }),
                ]}
              />
              <Button type="submit" variant="default" size="sm" class="h-[35px] px-3.5 text-sm lg:h-[37px] lg:px-[18px]">
                {submitLabel}
              </Button>
            </div>
            {open && (
              <div
                id={`${listId}-popup`}
                class="absolute top-[calc(100%+6px)] right-0 left-0 z-30 rounded-md border border-line bg-bg p-1 shadow-modal lg:top-[calc(100%+7px)] lg:p-1.5"
              >
                <p id={headId} class="hidden px-2.5 pt-2 pb-1.5 text-xs text-muted lg:block">
                  Saran untuk “{query}”
                </p>
                <ul
                  id={listId}
                  role="listbox"
                  aria-labelledby={headId}
                  class="flex flex-col lg:mt-0.5 lg:gap-0.5"
                >
                  {suggestions.length === 0 ? (
                    <li class="px-2.5 py-2.5 text-[13px] text-muted">Tidak ada bahan bernama “{query}”.</li>
                  ) : (
                    suggestions.map((suggestion, index) => {
                      let picked = selectedIds.includes(suggestion.id)
                      return (
                        <li
                          key={suggestion.id}
                          id={`${listId}-${index}`}
                          role="option"
                          aria-selected={index === active ? 'true' : 'false'}
                          aria-disabled={picked ? 'true' : undefined}
                          class={cn(
                            'flex h-11 cursor-pointer items-center gap-2.5 rounded-sm px-3 text-[15px] tracking-[0.02em] lg:h-[43px] lg:px-2.5',
                            index === active && 'bg-hover font-medium tracking-normal lg:text-sm',
                            picked && 'cursor-default text-muted',
                          )}
                          mix={[
                            on('mousedown', (event) => event.preventDefault()),
                            on('click', () => choose(suggestion)),
                          ]}
                        >
                          <Icon name={picked ? 'check' : 'leaf'} class={picked ? 'text-accent' : 'text-muted'} />
                          <span class="min-w-0 flex-1 truncate">{suggestion.name}</span>
                          <span class="text-xs font-normal text-muted">
                            {picked ? 'Sudah dipilih' : `Dipakai di ${suggestion.recipeCount} resep`}
                          </span>
                          {index === active && !picked && (
                            <kbd class="hidden rounded-full border border-line-strong px-1.5 py-px text-[11px] font-normal text-muted lg:inline">
                              Enter
                            </kbd>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
          {hint && <p class="hidden text-xs text-ink lg:block">{hint}</p>}
        </div>
      )
    }
  },
)
