import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import { formatIngredientAmount, scaleQuantity } from '../../../domain/format.ts'
import type { RecipeIngredientLine } from '../../../domain/types.ts'
import { Icon } from '../../../ui/icon.tsx'
import { Button, ButtonLink } from '../../../ui/button.tsx'
import { cn, eyebrow } from '../../../ui/utils.ts'

export interface IngredientPanelProps {
  ingredients: RecipeIngredientLine[]
  servings: number
  pantryHref: string
  /** Links to each ingredient page by id. */
  ingredientHrefBase: string
}

const MAX_SERVINGS = 50

/**
 * Ingredient list with a "siap" checklist, servings scaler and shopping-list copy.
 * Server-rendered with the recipe's own servings; the browser adds the interactivity.
 */
export const IngredientPanel = clientEntry(
  import.meta.url,
  function IngredientPanel(handle: Handle<IngredientPanelProps>) {
    let ready = new Set<string>()
    let servings = handle.props.servings
    let copyState: 'idle' | 'copied' | 'failed' = 'idle'

    function amount(line: RecipeIngredientLine) {
      let quantity =
        line.quantity === null ? null : scaleQuantity(line.quantity, handle.props.servings, servings)
      return formatIngredientAmount(quantity, line.unit)
    }

    async function copyShoppingList() {
      let missing = handle.props.ingredients.filter((line) => !ready.has(line.ingredientId))
      let text = missing.map((line) => `- ${line.name} ${amount(line)}`.trim()).join('\n')
      try {
        await navigator.clipboard.writeText(text)
        copyState = 'copied'
      } catch {
        copyState = 'failed'
      }
      await handle.update()
      setTimeout(() => {
        copyState = 'idle'
        handle.update()
      }, 2400)
    }

    return () => {
      let { ingredients, pantryHref, ingredientHrefBase } = handle.props
      let groups = groupBySection(ingredients)

      return (
        <section aria-labelledby="bahan-title" class="lg:overflow-hidden lg:rounded-lg lg:bg-hover">
          <div class="flex items-center justify-between gap-4 border-line pb-3 lg:flex-col lg:items-stretch lg:gap-4 lg:border-b lg:p-6">
            <div class="flex flex-col gap-0.5 lg:flex-row lg:items-center lg:justify-between">
              <h2 id="bahan-title" class="text-[26px] leading-[30px] font-normal tracking-[-0.01em] lg:text-[28px] lg:leading-[31px]">
                Bahan
              </h2>
              <p class="text-xs tracking-[0.02em] text-muted lg:text-[13px] lg:tracking-normal" aria-live="polite">
                {ready.size} dari {ingredients.length} siap
              </p>
            </div>
            <div class="flex items-center justify-between">
              <span id="porsi-label" class="text-sm text-muted max-lg:sr-only">
                Jumlah porsi
              </span>
              <div role="group" aria-labelledby="porsi-label" class="flex h-9 w-[136px] items-stretch overflow-hidden rounded-md border border-line-strong lg:rounded-sm lg:border-outline">
                <button
                  type="button"
                  class="flex w-9 shrink-0 items-center justify-center text-ink hover:bg-hover disabled:text-faint"
                  aria-label="Kurangi porsi"
                  disabled={servings <= 1}
                  mix={on('click', () => {
                    servings = Math.max(1, servings - 1)
                    handle.update()
                  })}
                >
                  <Icon name="minus" size={14} />
                </button>
                <output class="flex flex-1 items-center justify-center border-x border-line text-[13px] font-medium" aria-live="polite">
                  {servings} porsi
                </output>
                <button
                  type="button"
                  class="flex w-9 shrink-0 items-center justify-center text-ink hover:bg-hover disabled:text-faint"
                  aria-label="Tambah porsi"
                  disabled={servings >= MAX_SERVINGS}
                  mix={on('click', () => {
                    servings = Math.min(MAX_SERVINGS, servings + 1)
                    handle.update()
                  })}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col pt-1 lg:px-6 lg:pt-0">
            {groups.map((group) => (
              <div key={group.section ?? 'utama'} class="pt-4 pb-2 lg:pt-5 lg:pb-3">
                {groups.length > 1 && <h3 class={cn(eyebrow, 'font-medium')}>{group.section ?? 'Bahan'}</h3>}
                <ul>
                  {group.lines.map((line) => {
                    let checked = ready.has(line.ingredientId)
                    return (
                      <li key={line.ingredientId} class="flex min-h-11 items-center gap-3 border-b border-line py-3 lg:min-h-10 lg:py-[11px]">
                        <span class="relative flex shrink-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`${line.name} siap`}
                            class="peer size-5 cursor-pointer appearance-none rounded-xs border border-line-strong checked:border-accent checked:bg-accent lg:size-[18px] lg:rounded-[4px]"
                            mix={on('change', (event) => {
                              if (event.currentTarget.checked) ready.add(line.ingredientId)
                              else ready.delete(line.ingredientId)
                              handle.update()
                            })}
                          />
                          <Icon
                            name="check"
                            size={12}
                            class="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block max-lg:size-[13px]"
                          />
                        </span>
                        <span class="min-w-0 flex-1 text-[15px] tracking-[0.02em] lg:leading-[23px]">
                          <a
                            href={`${ingredientHrefBase}/${line.ingredientId}`}
                            class={cn('hover:underline motion-safe:transition-colors motion-safe:duration-200', checked ? 'text-faint' : 'text-ink')}
                          >
                            {line.name}
                          </a>
                          {line.note && <span class="text-muted"> · {line.note}</span>}
                        </span>
                        <span class="text-sm tracking-[0.02em] whitespace-nowrap text-muted lg:tracking-normal">{amount(line)}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div class="flex flex-col gap-2 pt-1 lg:px-6 lg:pt-3 lg:pb-6">
            <ButtonLink href={pantryHref} variant="dark" class="h-[43px] w-full text-[15px]">
              <Icon name="carrot" />
              Cari resep dengan bahan ini
            </ButtonLink>
            <Button
              type="button" variant="ghost" size="sm" class="hidden h-[37px] w-full hover:bg-bg/60 lg:inline-flex"
              mix={on('click', copyShoppingList)}
            >
              <Icon name={copyState === 'copied' ? 'check' : 'clipboard-list'} />
              {copyState === 'copied'
                ? 'Daftar belanja tersalin'
                : copyState === 'failed'
                  ? 'Gagal menyalin, coba lagi'
                  : 'Salin daftar belanja'}
            </Button>
          </div>
        </section>
      )
    }
  },
)

function groupBySection(lines: RecipeIngredientLine[]) {
  let groups: { section: string | null; lines: RecipeIngredientLine[] }[] = []
  for (let line of lines) {
    let group = groups.find((g) => g.section === line.section)
    if (group) group.lines.push(line)
    else groups.push({ section: line.section, lines: [line] })
  }
  return groups
}
