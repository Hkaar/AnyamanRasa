import { clientEntry, on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'

import { formatIngredientAmount } from '../../../../domain/format.ts'
import {
  INGREDIENT_SECTIONS,
  LIMITS,
  type IngredientRowInput,
  parseQuantity,
  type RecipeFormErrors,
  type RecipeFormValues,
  type StepRowInput,
  UNITS,
} from '../../../../domain/recipe-form.ts'
import { DIFFICULTIES, type RecipeIngredientLine } from '../../../../domain/types.ts'
import { difficultyLabel } from '../../../../domain/format.ts'
import { routes } from '../../../../routes.ts'
import { Icon } from '../../../../ui/icon.tsx'
import { enter } from '../../../public/motion.ts'
import { Button, ButtonLink } from '../../../../ui/button.tsx'
import { badgeVariants } from '../../../../ui/badge.tsx'
import { inputClass, textareaClass } from '../../../../ui/input.tsx'
import { Select } from '../../../../ui/select.tsx'
import { labelClass } from '../../../../ui/label.tsx'
import { cn, eyebrow } from '../../../../ui/utils.ts'

/** The source recipe of a variation, as shown in the reference card. */
export interface EditorSource {
  title: string
  href: string
  imageUrl: string | null
  /** "oleh … · 25 menit · Mudah · 2 porsi" */
  meta: string
  authorName: string
}

export interface RecipeEditorProps {
  mode: 'create' | 'edit' | 'variation'
  values: RecipeFormValues
  errors: RecipeFormErrors
  categories: { id: number; name: string }[]
  /** Source recipe ingredients, to mark changes while writing a variation. */
  parentIngredients: RecipeIngredientLine[] | null
  /** Source recipe step texts, to mark changed steps while writing a variation. */
  parentSteps: string[] | null
  /** Source recipe of a new variation. */
  source: EditorSource | null
  isVariation: boolean
  /** Label of the publish button in the bottom publish bar. */
  publishLabel: string
}

interface IngredientRow extends IngredientRowInput {
  key: number
}
interface StepRow extends StepRowInput {
  key: number
}

type SectionId = 'informasi' | 'bahan' | 'langkah' | 'terbitkan'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'informasi', label: 'Informasi Dasar' },
  { id: 'bahan', label: 'Bahan' },
  { id: 'langkah', label: 'Langkah Memasak' },
  { id: 'terbitkan', label: 'Terbitkan' },
]

const QUICK_CHANGES = ['Ganti bahan utama', 'Tambah bahan', 'Kurangi gula', 'Lebih pedas', 'Versi vegetarian']

/** Desktop ingredient grid: Bahan · Jumlah · Satuan · Kelompok · actions (pen.dev widths 120/140). */
const ingredientGrid =
  'grid grid-cols-[minmax(0,1fr)_88px] gap-2 sm:grid-cols-[minmax(0,1fr)_96px_120px] sm:gap-3 xl:grid-cols-[minmax(0,1fr)_120px_140px_156px_100px]'

/** pen.dev form fields use the soft $border outline (the shared input uses $border-strong). */
const fieldClass = cn(inputClass, 'border-line')
const areaClass = cn(textareaClass, 'border-line')

/**
 * The recipe editor: section rail, form body and publish bar. Every field is a
 * native form control, so the form submits without JavaScript; the browser adds
 * row management, live counters, the publish checklist, scroll-spy and
 * variation diff markers. Server validation stays authoritative.
 */
export const RecipeEditor = clientEntry(
  import.meta.url,
  function RecipeEditor(handle: Handle<RecipeEditorProps>) {
    let nextKey = 0
    let initial = handle.props.values
    let ingredients: IngredientRow[] = withBlank(
      initial.ingredients.map((row) => ({ ...row, key: nextKey++ })),
      () => ({ key: nextKey++, name: '', quantity: '', unit: '', section: '', note: '' }),
      2,
    )
    let steps: StepRow[] = withBlank(
      initial.steps.map((row) => ({ ...row, key: nextKey++ })),
      () => ({ key: nextKey++, title: '', text: '', minutes: '' }),
      1,
    )
    let title = initial.title
    let description = initial.description
    let changeSummary = initial.changeSummary
    let photoPreview: string | null = initial.imageUrl
    let meta = {
      minutes: (Number(initial.prepMinutes) || 0) + (Number(initial.cookMinutes) || 0),
      categories: initial.categoryIds.length,
    }
    let active: SectionId = 'informasi'
    let hydrated = false
    let suggestions: { id: string; name: string; recipeCount: number }[] = []
    let suggestController: AbortController | null = null

    // Browser only: live meta fields, scroll-spy and the JS-only publish gate.
    handle.queueTask(() => {
      let form = document.getElementById('informasi')?.closest('form')
      if (form) {
        let readMeta = () => {
          let number = (name: string) => Number((form.elements.namedItem(name) as HTMLInputElement | null)?.value) || 0
          let next = {
            minutes: number('persiapan') + number('memasak'),
            categories: form.querySelectorAll('input[name="kategori"]:checked').length,
          }
          if (next.minutes !== meta.minutes || next.categories !== meta.categories) {
            meta = next
            handle.update()
          }
        }
        form.addEventListener('input', readMeta, { signal: handle.signal })
        form.addEventListener('change', readMeta, { signal: handle.signal })
      }

      // Scroll-spy: the last section whose top passed 40% of the viewport (the
      // last one once the page bottom is reached, since it may never get there).
      let frame = 0
      let spy = () => {
        frame = 0
        let line = window.innerHeight * 0.4
        let atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
        let current: SectionId = 'informasi'
        for (let section of SECTIONS) {
          let element = document.getElementById(section.id)
          if (element && element.getBoundingClientRect().top <= line) current = section.id
        }
        if (atBottom) current = 'terbitkan'
        if (current !== active) {
          active = current
          handle.update()
        }
      }
      let schedule = () => {
        if (!frame) frame = requestAnimationFrame(spy)
      }
      window.addEventListener('scroll', schedule, { passive: true, signal: handle.signal })
      window.addEventListener('resize', schedule, { signal: handle.signal })
      spy()

      hydrated = true
      handle.update()
    })

    async function suggest(value: string) {
      suggestController?.abort()
      if (value.trim().length < 2) return
      suggestController = new AbortController()
      try {
        let response = await fetch(`${routes.ingredients.search.href()}?q=${encodeURIComponent(value)}`, {
          signal: suggestController.signal,
        })
        suggestions = await response.json()
        handle.update()
      } catch {
        // Superseded by a newer keystroke.
      }
    }

    function move<T>(list: T[], index: number, delta: number): T[] {
      let target = index + delta
      if (target < 0 || target >= list.length) return list
      let copy = [...list]
      ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
      return copy
    }

    function parentLine(name: string) {
      let key = name.trim().toLowerCase()
      return handle.props.parentIngredients?.find((line) => line.name.toLowerCase() === key) ?? null
    }

    function diffState(row: IngredientRow): { kind: 'new' | 'changed' | 'same'; previous?: string } | null {
      if (!handle.props.parentIngredients || !row.name.trim()) return null
      let previous = parentLine(row.name)
      if (!previous) return { kind: 'new' }
      let quantity = row.unit === 'secukupnya' ? null : parseQuantity(row.quantity)
      let same = quantity === previous.quantity && (row.unit || null) === previous.unit
      return same ? { kind: 'same' } : { kind: 'changed', previous: formatIngredientAmount(previous.quantity, previous.unit) }
    }

    function stepChanged(row: StepRow) {
      let parentSteps = handle.props.parentSteps
      let text = row.text.trim()
      return Boolean(parentSteps && text && !parentSteps.some((step) => step.trim() === text))
    }

    return () => {
      let { values, errors, categories, mode, parentIngredients, isVariation, source, publishLabel } = handle.props
      let fieldError = errors.fields
      let filledIngredients = ingredients.filter((row) => row.name.trim())
      let diffs = filledIngredients.map(diffState)
      let newCount = diffs.filter((d) => d?.kind === 'new').length
      let removed = parentIngredients
        ? parentIngredients.filter(
            (line) => !filledIngredients.some((row) => row.name.trim().toLowerCase() === line.name.toLowerCase()),
          )
        : []
      let missingQuantity = filledIngredients.filter((row) => row.unit !== 'secukupnya' && !row.quantity.trim()).length
      let stepCount = steps.filter((row) => row.text.trim()).length

      // Publish checklist (mirrors the server's publish validation).
      let basicsOk = Boolean(title.trim() && description.trim())
      let changeOk = changeSummary.trim().length > 0
      let ingredientsOk = filledIngredients.length >= 2
      let quantitiesOk = missingQuantity === 0
      let stepsOk = stepCount > 0
      let checks: { ok: boolean; label: string }[] = isVariation
        ? [
            ...(source ? [{ ok: true, label: `Resep asli: ${source.title} oleh ${source.authorName}` }] : []),
            { ok: changeOk, label: 'Perubahan dijelaskan' },
            ...(basicsOk ? [] : [{ ok: false, label: 'Judul dan deskripsi belum lengkap' }]),
            {
              ok: ingredientsOk,
              label: parentIngredients
                ? `${filledIngredients.length} bahan terhubung · ${newCount} bahan baru`
                : `${filledIngredients.length} bahan terhubung ke daftar bahan`,
            },
            ...(quantitiesOk ? [] : [{ ok: false, label: `${missingQuantity} bahan belum memiliki jumlah` }]),
            { ok: stepsOk, label: `${stepCount} langkah memasak` },
          ]
        : [
            {
              ok: basicsOk,
              label: !basicsOk
                ? 'Judul dan deskripsi belum lengkap'
                : photoPreview
                  ? 'Judul, foto, dan deskripsi lengkap'
                  : 'Judul dan deskripsi lengkap',
            },
            { ok: ingredientsOk, label: `${filledIngredients.length} bahan terhubung ke daftar bahan` },
            {
              ok: quantitiesOk,
              label: quantitiesOk ? 'Semua bahan memiliki jumlah' : `${missingQuantity} bahan belum memiliki jumlah`,
            },
            { ok: stepsOk, label: `${stepCount} langkah memasak` },
          ]
      let failing = checks.filter((check) => !check.ok).length

      let done: Record<SectionId, boolean> = {
        informasi: basicsOk && meta.minutes > 0 && meta.categories > 0 && (!isVariation || changeOk),
        bahan: ingredientsOk && quantitiesOk,
        langkah: stepsOk,
        terbitkan: false,
      }
      done.terbitkan = done.informasi && done.bahan && done.langkah && failing === 0

      return (
        <div class="grid gap-10 lg:grid-cols-[232px_minmax(0,896px)] lg:justify-between lg:gap-18">
          <aside class="hidden lg:block">
            <nav aria-label="Bagian formulir" class="sticky top-24 flex flex-col">
              <p class={cn(eyebrow, 'mb-3 font-medium tracking-[1px]')}>Bagian</p>
              <ol class="flex flex-col gap-1">
                {SECTIONS.map((section, index) => {
                  let isActive = active === section.id
                  let isDone = done[section.id]
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        aria-current={isActive ? 'location' : undefined}
                        class={cn(
                          'flex h-9 items-center gap-2.5 rounded-full px-2.5 text-sm font-medium tracking-[0.02em] transition-colors',
                          isActive ? 'bg-ink text-white' : isDone ? 'text-ink hover:bg-hover' : 'text-muted hover:bg-hover hover:text-ink',
                        )}
                      >
                        <span
                          class={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium',
                            isDone
                              ? 'bg-accent text-white'
                              : isActive
                                ? 'border border-white bg-bg text-ink'
                                : 'border border-line-strong bg-bg text-muted',
                          )}
                        >
                          {isDone ? <Icon name="check" size={12} strokeWidth={2.5} /> : index + 1}
                        </span>
                        {section.label}
                        {isDone && <span class="sr-only">(lengkap)</span>}
                      </a>
                    </li>
                  )
                })}
              </ol>
              <div class="flex flex-col gap-1.5 px-2.5 pt-7 tracking-[0.02em]">
                <p class="text-[13px] font-medium">Tips</p>
                <p class="text-[13px] leading-5 text-muted">
                  Tulis setiap langkah sebagai satu tindakan. Langkah yang singkat lebih mudah diikuti saat memasak.
                </p>
              </div>
            </nav>
          </aside>

          <div class="flex min-w-0 flex-col gap-14">
            {source && (
              <div class="flex flex-col gap-5 rounded-lg bg-hover p-6 tracking-[0.02em]">
                <div class="flex items-center gap-4">
                  <span class="size-[72px] shrink-0 overflow-hidden rounded-md bg-bg">
                    {source.imageUrl && <img src={source.imageUrl} alt="" class="size-full object-cover" />}
                  </span>
                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <p class="flex items-center gap-1.5 text-xs font-medium text-accent-strong">
                      <Icon name="git-branch" size={14} class="text-accent" />
                      Berdasarkan resep asli
                    </p>
                    <p class="text-lg font-medium">{source.title}</p>
                    <p class="text-[13px] text-muted">{source.meta}</p>
                  </div>
                  <ButtonLink href={source.href} variant="ghost" size="lg" class="hidden hover:bg-bg sm:inline-flex" target="_blank">
                    Lihat resep asli
                    <Icon name="arrow-up-right" />
                  </ButtonLink>
                </div>
                <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <span class="rounded-full border border-outline bg-bg px-3 py-1.5 text-[13px] font-medium">{source.title}</span>
                  <span class="flex items-center gap-2 text-xs text-accent-strong">
                    <span class="h-px w-10 bg-accent" aria-hidden="true" />
                    variasi
                    <Icon name="arrow-right" size={14} class="text-accent" />
                  </span>
                  <span class="rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-white">{title.trim() || 'Variasimu'}</span>
                  <p class="min-w-0 flex-1 basis-[240px] text-xs leading-[1.35] text-muted lg:text-right">
                    Hubungan ini akan tampil di halaman resep dan Graf Resep setelah diterbitkan.
                  </p>
                </div>
              </div>
            )}

            {/* 1. Informasi Dasar */}
            <section
              id="informasi"
              aria-labelledby="informasi-title"
              class={cn('flex scroll-mt-24 flex-col gap-6', source && 'border-t border-line pt-12')}
            >
              <SectionHead
                id="informasi-title"
                title="Informasi Dasar"
                description="Judul, foto, dan detail singkat yang membantu orang menemukan resepmu."
              />
              <div class="flex flex-col gap-1.5">
                <label for="judul" class={labelClass}>
                  Judul resep
                </label>
                <input
                  id="judul"
                  name="judul"
                  type="text"
                  required
                  maxLength={LIMITS.title}
                  value={title}
                  aria-invalid={fieldError.title ? 'true' : undefined}
                  aria-describedby={fieldError.title || mode === 'variation' ? 'judul-help' : undefined}
                  class={fieldClass}
                  mix={on('input', (event) => {
                    title = event.currentTarget.value
                    handle.update()
                  })}
                />
                <Help id="judul-help" error={fieldError.title}>
                  {mode === 'variation' ? 'Diisi otomatis dari resep asli — ubah sesuai variasimu.' : null}
                </Help>
              </div>

              {isVariation && (
                <div class="flex flex-col gap-2">
                  <label for="perubahan" class={cn(labelClass, 'gap-1.5')}>
                    Apa yang kamu ubah dari resep asli?
                    <span class="text-[11px] font-medium text-accent-strong">Wajib</span>
                  </label>
                  <div class="flex flex-wrap gap-2" role="group" aria-label="Sisipkan perubahan cepat">
                    {QUICK_CHANGES.map((label) => {
                      let used = changeSummary.toLowerCase().includes(label.toLowerCase())
                      return (
                        <button
                          key={label}
                          type="button"
                          class={badgeVariants({ variant: used ? 'selected' : 'chip' })}
                          aria-pressed={used ? 'true' : 'false'}
                          mix={on('click', () => {
                            if (used) return
                            changeSummary = changeSummary ? `${changeSummary.replace(/[.\s]*$/, '')}. ${label}.` : `${label}.`
                            handle.update()
                          })}
                        >
                          {used && <Icon name="check" size={14} />}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    id="perubahan"
                    name="perubahan"
                    rows={2}
                    required
                    maxLength={LIMITS.changeSummary}
                    value={changeSummary}
                    aria-invalid={fieldError.changeSummary ? 'true' : undefined}
                    aria-describedby="perubahan-help"
                    placeholder="Misal: menambahkan udang dan cumi, mengurangi kecap manis menjadi 1 sdm."
                    class={cn(areaClass, 'min-h-[68px] leading-[1.55]')}
                    mix={on('input', (event) => {
                      changeSummary = event.currentTarget.value
                      handle.update()
                    })}
                  />
                  <Help id="perubahan-help" error={fieldError.changeSummary}>
                    Penjelasan ini tampil di halaman variasi agar orang memahami perbedaannya.
                  </Help>
                </div>
              )}

              <div class="flex flex-col gap-1.5">
                <label for="deskripsi" class={labelClass}>
                  Deskripsi
                </label>
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  rows={3}
                  maxLength={LIMITS.description}
                  value={description}
                  aria-invalid={fieldError.description ? 'true' : undefined}
                  aria-describedby="deskripsi-help"
                  class={cn(areaClass, 'min-h-[104px] leading-[1.55]')}
                  mix={on('input', (event) => {
                    description = event.currentTarget.value
                    handle.update()
                  })}
                />
                <Help id="deskripsi-help" error={fieldError.description}>
                  {description.length} / {LIMITS.description} karakter
                </Help>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class={labelClass} id="foto-label">
                  Foto masakan
                </span>
                <div class="grid gap-4 sm:grid-cols-[240px_minmax(0,1fr)]">
                  {photoPreview && (
                    <div class="relative aspect-[240/168] overflow-hidden rounded-md bg-hover">
                      <img src={photoPreview} alt="Pratinjau foto masakan" class="size-full object-cover" />
                    </div>
                  )}
                  <label
                    for="foto"
                    class={cn(
                      'flex min-h-[168px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-md border border-line bg-hover p-6 text-center tracking-[0.02em] transition-colors hover:border-line-strong focus-within:border-ink',
                      !photoPreview && 'sm:col-span-2',
                    )}
                  >
                    <span class="flex size-10 items-center justify-center rounded-md border border-line bg-bg text-ink">
                      <Icon name="image-plus" size={18} />
                    </span>
                    <span class="text-sm text-muted">
                      {photoPreview ? 'Ganti foto: ' : 'Tarik foto ke sini atau '}
                      <span class="font-medium text-ink">pilih file</span>
                    </span>
                    <span class="text-xs text-faint">JPG, PNG, atau WebP, maks. 5 MB · Rasio 4:3 disarankan</span>
                    <input
                      id="foto"
                      name="foto"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-describedby={fieldError.image ? 'foto-help' : undefined}
                      class="sr-only"
                      mix={on('change', (event) => {
                        let file = event.currentTarget.files?.[0]
                        if (file) {
                          photoPreview = URL.createObjectURL(file)
                          handle.update()
                        }
                      })}
                    />
                  </label>
                </div>
                {values.imageUrl && <input type="hidden" name="foto_lama" value={values.imageUrl} />}
                <Help id="foto-help" error={fieldError.image} />
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <NumberField id="persiapan" label="Persiapan (menit)" value={values.prepMinutes} error={fieldError.prepMinutes} />
                <NumberField id="memasak" label="Memasak (menit)" value={values.cookMinutes} error={fieldError.cookMinutes} />
                <NumberField id="porsi" label="Porsi" value={values.servings} error={fieldError.servings} min={1} max={50} />
                <Segmented
                  name="kesulitan"
                  label="Kesulitan"
                  value={values.difficulty}
                  options={DIFFICULTIES.map((difficulty) => ({ value: difficulty, label: difficultyLabel(difficulty) }))}
                />
              </div>

              <fieldset class="flex flex-col gap-2.5" aria-describedby="kategori-help">
                <legend class={cn(labelClass, 'mb-2.5')}>Kategori</legend>
                <div class="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} class="cursor-pointer">
                      <input
                        type="checkbox"
                        name="kategori"
                        value={String(category.id)}
                        checked={values.categoryIds.includes(category.id)}
                        class="peer sr-only"
                      />
                      <span class={cn(badgeVariants({ variant: 'chip' }), 'pr-4 hover:bg-hover peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink')}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
                <Help id="kategori-help" error={fieldError.categoryIds}>
                  Pilih kategori utama dan jenis hidangan, maksimal {LIMITS.maxCategories}.
                </Help>
              </fieldset>
            </section>

            {/* 2. Bahan */}
            <section id="bahan" aria-labelledby="bahan-title" class="flex scroll-mt-24 flex-col gap-6 border-t border-line pt-12">
              <SectionHead
                id="bahan-title"
                title="Bahan"
                description="Pilih bahan dari daftar agar resepmu terhubung dengan halaman bahan dan Cari dari Bahan."
              />
              <datalist id="daftar-bahan">
                {suggestions.map((suggestion) => (
                  <option key={suggestion.id} value={suggestion.name}>
                    Dipakai di {suggestion.recipeCount} resep
                  </option>
                ))}
              </datalist>
              <div class="flex flex-col gap-2">
                {parentIngredients && (
                  <p class="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-xs tracking-[0.02em] text-muted" aria-live="polite">
                    <span class="inline-flex items-center gap-1.5">
                      <Icon name="plus" size={13} /> {newCount} bahan baru
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <Icon name="pencil" size={13} /> {diffs.filter((d) => d?.kind === 'changed').length} jumlah diubah
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <Icon name="equal" size={13} /> {diffs.filter((d) => d?.kind === 'same').length} sama dengan resep asli
                    </span>
                    {removed.length > 0 && (
                      <span class="inline-flex items-center gap-1.5">
                        <Icon name="minus" size={13} /> {removed.length} dihapus: {removed.map((line) => line.name).join(', ')}
                      </span>
                    )}
                  </p>
                )}
                <div class={cn(ingredientGrid, 'hidden text-xs font-medium tracking-[0.02em] text-muted xl:grid')} aria-hidden="true">
                  <span>Bahan</span>
                  <span>Jumlah</span>
                  <span>Satuan</span>
                  <span>Kelompok</span>
                  <span />
                </div>
                <ol class="flex flex-col gap-2">
                  {ingredients.map((row, index) => {
                    let rowError = errors.ingredientRows[index]
                    let diff = diffState(row)
                    let highlighted = diff && diff.kind !== 'same'
                    return (
                      <li key={row.key} class="flex flex-col gap-1.5">
                        <div class={cn(ingredientGrid, 'items-center')}>
                          <label class="sr-only" for={`bahan-${row.key}`}>
                            Bahan {index + 1}
                          </label>
                          <div
                            class={cn(
                              'flex h-11 min-w-0 items-center gap-2 rounded-md border px-3 focus-within:border-ink',
                              highlighted ? 'border-accent bg-accent-subtle' : 'border-line bg-bg',
                              rowError && 'border-error bg-error-subtle',
                            )}
                          >
                            <Icon name="leaf" size={14} class="text-accent" />
                            <input
                              id={`bahan-${row.key}`}
                              name="bahan_nama"
                              list="daftar-bahan"
                              autocomplete="off"
                              value={row.name}
                              placeholder="Nama bahan, misal: Kemiri"
                              maxLength={LIMITS.ingredientName}
                              aria-invalid={rowError ? 'true' : undefined}
                              aria-describedby={diff?.kind === 'changed' ? `bahan-${row.key}-sebelumnya` : undefined}
                              class="h-full min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                              mix={on('input', (event) => {
                                row.name = event.currentTarget.value
                                suggest(row.name)
                                handle.update()
                              })}
                            />
                            {diff?.kind === 'changed' && (
                              <span id={`bahan-${row.key}-sebelumnya`} class="hidden shrink-0 text-xs text-muted sm:inline">
                                sebelumnya {diff.previous}
                              </span>
                            )}
                            {diff?.kind === 'new' && <DiffBadge>Baru</DiffBadge>}
                            {diff?.kind === 'changed' && <DiffBadge>Diubah</DiffBadge>}
                          </div>
                          <input
                            name="bahan_jumlah"
                            inputMode="decimal"
                            value={row.quantity}
                            placeholder="Jumlah"
                            aria-label={`Jumlah ${row.name || `bahan ${index + 1}`}`}
                            class={cn(fieldClass, diff?.kind === 'changed' && 'border-accent bg-accent-subtle')}
                            mix={on('input', (event) => {
                              row.quantity = event.currentTarget.value
                              handle.update()
                            })}
                          />
                          {/* Radios are named per row so each row is its own group; the hidden
                              inputs submit the values under the shared field names. */}
                          <div>
                            <input type="hidden" name="bahan_satuan" value={row.unit} />
                            <Select
                              variant="field"
                              class="[&>summary]:border-line"
                              name={`bahan_satuan_${row.key}`}
                              ariaLabel={`Satuan ${row.name || `bahan ${index + 1}`}`}
                              value={row.unit}
                              options={[{ value: '', label: 'pilih satuan' }, ...UNITS.map((unit) => ({ value: unit, label: unit }))]}
                              onChange={(unit) => {
                                row.unit = unit
                                handle.update()
                              }}
                            />
                          </div>
                          <div>
                            <input type="hidden" name="bahan_kelompok" value={row.section} />
                            <Select
                              variant="field"
                              class="[&>summary]:border-line"
                              name={`bahan_kelompok_${row.key}`}
                              ariaLabel={`Kelompok ${row.name || `bahan ${index + 1}`}`}
                              value={row.section}
                              options={[
                                { value: '', label: 'Tanpa kelompok' },
                                ...INGREDIENT_SECTIONS.map((section) => ({ value: section, label: section })),
                              ]}
                              onChange={(section) => {
                                row.section = section
                                handle.update()
                              }}
                            />
                          </div>
                          <div class="flex justify-end gap-0.5 sm:col-span-2 xl:col-span-1">
                            <input type="hidden" name="bahan_catatan" value={row.note} />
                            <RowButton label="Naikkan" icon="arrow-up" disabled={index === 0} onPress={() => { ingredients = move(ingredients, index, -1); handle.update() }} />
                            <RowButton label="Turunkan" icon="arrow-down" disabled={index === ingredients.length - 1} onPress={() => { ingredients = move(ingredients, index, 1); handle.update() }} />
                            <RowButton label={`Hapus ${row.name || 'bahan'}`} icon="trash-2" onPress={() => { ingredients = ingredients.filter((r) => r.key !== row.key); handle.update() }} />
                          </div>
                        </div>
                        {diff?.kind === 'changed' && <p class="text-xs text-muted sm:hidden">sebelumnya {diff.previous}</p>}
                        {rowError && (
                          <p class="flex items-center gap-1.5 text-xs text-error" role="alert">
                            <Icon name="circle-alert" size={14} />
                            {rowError}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
              {fieldError.ingredients && <p class="text-xs text-error">{fieldError.ingredients}</p>}
              <Button
                type="button" variant="outline" size="lg" class="self-start"
                mix={on('click', () => {
                  ingredients = [...ingredients, { key: nextKey++, name: '', quantity: '', unit: '', section: '', note: '' }]
                  handle.update().then(() => revealLast('bahan'))
                })}
              >
                <Icon name="plus" />
                Tambah bahan
              </Button>
            </section>

            {/* 3. Langkah */}
            <section id="langkah" aria-labelledby="langkah-title" class="flex scroll-mt-24 flex-col gap-6 border-t border-line pt-12">
              <SectionHead
                id="langkah-title"
                title="Langkah Memasak"
                description={
                  handle.props.parentSteps
                    ? 'Langkah yang diubah dari resep asli ditandai. Urutkan dengan tombol naik/turun.'
                    : 'Urutkan langkah dengan tombol naik/turun. Satu langkah, satu tindakan.'
                }
              />
              <ol class="flex flex-col gap-3">
                {steps.map((row, index) => {
                  let rowError = errors.stepRows[index]
                  let filled = row.text.trim().length > 0
                  let changed = stepChanged(row)
                  let stepInput = cn(fieldClass, changed && 'border-accent bg-accent-subtle')
                  return (
                    <li key={row.key} class="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 gap-y-2 sm:grid-cols-[32px_minmax(0,1fr)_100px] sm:gap-x-4">
                      <span
                        class={cn(
                          'mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-medium',
                          filled ? 'bg-ink text-white' : 'border border-line-strong text-muted',
                        )}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div class="flex min-w-0 flex-col gap-2">
                        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
                          <input
                            name="langkah_judul"
                            value={row.title}
                            maxLength={LIMITS.stepTitle}
                            placeholder="Judul langkah (opsional), misal: Tumis bumbu"
                            aria-label={`Judul langkah ${index + 1}`}
                            class={stepInput}
                            mix={on('input', (event) => { row.title = event.currentTarget.value })}
                          />
                          <input
                            name="langkah_menit"
                            type="number"
                            min={0}
                            max={LIMITS.maxMinutes}
                            value={row.minutes}
                            placeholder="Menit"
                            aria-label={`Waktu langkah ${index + 1} dalam menit`}
                            class={stepInput}
                            mix={on('input', (event) => { row.minutes = event.currentTarget.value })}
                          />
                        </div>
                        <textarea
                          name="langkah_teks"
                          rows={2}
                          value={row.text}
                          maxLength={LIMITS.stepText}
                          placeholder="Tulis langkah berikutnya… misal: Masukkan nasi, aduk rata dengan bumbu dan telur."
                          aria-label={`Isi langkah ${index + 1}${changed ? ' (diubah dari resep asli)' : ''}`}
                          aria-invalid={rowError ? 'true' : undefined}
                          class={cn(areaClass, 'leading-[1.55]', changed && 'border-accent bg-accent-subtle')}
                          mix={on('input', (event) => {
                            row.text = event.currentTarget.value
                            handle.update()
                          })}
                        />
                        {rowError && <p class="text-xs text-error">{rowError}</p>}
                      </div>
                      <div class="col-start-2 flex gap-0.5 sm:col-start-auto sm:pt-1">
                        <RowButton label="Naikkan langkah" icon="arrow-up" disabled={index === 0} onPress={() => { steps = move(steps, index, -1); handle.update() }} />
                        <RowButton label="Turunkan langkah" icon="arrow-down" disabled={index === steps.length - 1} onPress={() => { steps = move(steps, index, 1); handle.update() }} />
                        <RowButton label={`Hapus langkah ${index + 1}`} icon="trash-2" onPress={() => { steps = steps.filter((r) => r.key !== row.key); handle.update() }} />
                      </div>
                    </li>
                  )
                })}
              </ol>
              {fieldError.steps && <p class="text-xs text-error">{fieldError.steps}</p>}
              <Button
                type="button" variant="outline" size="lg" class="self-start"
                mix={on('click', () => {
                  steps = [...steps, { key: nextKey++, title: '', text: '', minutes: '' }]
                  handle.update().then(() => revealLast('langkah'))
                })}
              >
                <Icon name="plus" />
                Tambah langkah
              </Button>
            </section>

            {/* 4. Terbitkan */}
            <section id="terbitkan" aria-labelledby="terbitkan-title" class="flex scroll-mt-24 flex-col gap-6 border-t border-line pt-12">
              <SectionHead
                id="terbitkan-title"
                title="Terbitkan"
                description="Periksa kembali resepmu sebelum diterbitkan untuk semua orang."
              />
              <ul class="flex flex-col gap-3 text-sm tracking-[0.02em]" aria-live="polite">
                {checks.map((check) => (
                  <Check key={check.label} ok={check.ok} label={check.label} />
                ))}
              </ul>
              <div class="flex flex-col justify-between gap-4 rounded-lg bg-hover px-6 py-5 tracking-[0.02em] sm:flex-row sm:items-center">
                <div class="flex flex-col gap-1">
                  <p class="text-[15px] font-medium">Siap diterbitkan?</p>
                  <p id="terbitkan-status" class="text-[13px] leading-5 text-muted">
                    {failing > 0
                      ? `Lengkapi ${failing} isian yang ditandai untuk menerbitkan resep.`
                      : mode === 'variation'
                        ? 'Variasi akan diterbitkan sebagai resep baru yang terhubung ke resep asli.'
                        : 'Simpan sebagai draf jika belum selesai. Draf hanya terlihat olehmu.'}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button type="submit" name="aksi" value="draf" variant="dark" size="lg" formNoValidate>
                    <Icon name="file" />
                    Simpan Draf
                  </Button>
                  <Button
                    type="submit"
                    name="aksi"
                    value="terbitkan"
                    variant="default"
                    size="lg"
                    disabled={hydrated && failing > 0}
                    aria-describedby="terbitkan-status"
                  >
                    {publishLabel}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )
    }
  },
)

/** Animates the row just added to a section's list and focuses its first field. */
function revealLast(sectionId: string) {
  let row = document.querySelector<HTMLElement>(`#${sectionId} ol > li:last-child`)
  if (!row) return
  enter(row, { y: -6 })
  row.querySelector<HTMLElement>('input, textarea')?.focus()
}

function withBlank<T>(rows: T[], make: () => T, minimum: number): T[] {
  let result = [...rows]
  result.push(make())
  while (result.length < minimum) result.push(make())
  return result
}

function SectionHead(handle: Handle<{ id: string; title: string; description: string }>) {
  return () => (
    <div class="flex flex-col gap-1.5">
      <h2 id={handle.props.id} class="text-[26px] leading-[1.1] font-normal tracking-[-0.3px] lg:text-[30px]">
        {handle.props.title}
      </h2>
      <p class="text-[15px] leading-[23px] tracking-[0.02em] text-muted">{handle.props.description}</p>
    </div>
  )
}

/** Field helper/error line; renders nothing when there is no message. */
function Help(handle: Handle<{ id: string; error?: string; children?: RemixNode }>) {
  return () => {
    let { id, error, children } = handle.props
    if (error) {
      return (
        <p id={id} class="flex items-center gap-1.5 text-xs text-error">
          <Icon name="circle-alert" size={14} />
          {error}
        </p>
      )
    }
    if (children === null || children === undefined || children === '') return null
    return (
      <p id={id} class="text-xs text-muted">
        {children}
      </p>
    )
  }
}

function DiffBadge(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <span class="shrink-0 rounded-full border border-accent bg-bg px-2 py-0.5 text-[11px] leading-[14px] font-medium tracking-[0.02em] text-accent-strong">
      {handle.props.children}
    </span>
  )
}

function NumberField(
  handle: Handle<{ id: string; label: string; value: string; error?: string; min?: number; max?: number }>,
) {
  return () => {
    let { id, label, value, error, min = 0, max = LIMITS.maxMinutes } = handle.props
    return (
      <div class="flex flex-col gap-1.5">
        <label for={id} class={labelClass}>
          {label}
        </label>
        <input
          id={id}
          name={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          defaultValue={value}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-help` : undefined}
          class={fieldClass}
        />
        <Help id={`${id}-help`} error={error} />
      </div>
    )
  }
}

/** pen.dev "Kesulitan": separate pill options on native radios, the chosen one in ink. */
function Segmented(
  handle: Handle<{ name: string; value: string; options: { value: string; label: string }[]; label: string }>,
) {
  return () => {
    let { name, value, options, label } = handle.props
    return (
      <fieldset class="flex min-w-0 flex-col">
        <legend class={cn(labelClass, 'mb-1.5')}>{label}</legend>
        <div class="flex h-11 gap-2">
          {options.map((option) => (
            <label key={option.value} class="flex min-w-0 flex-1 cursor-pointer">
              <input type="radio" name={name} value={option.value} checked={value === option.value} class="peer sr-only" />
              <span data-slot="toggle-group-item" class="flex flex-1 items-center justify-center rounded-full border border-outline bg-bg text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:bg-hover peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
}

function RowButton(
  handle: Handle<{ label: string; icon: 'arrow-up' | 'arrow-down' | 'trash-2'; disabled?: boolean; onPress: () => void }>,
) {
  return () => (
    <button
      type="button"
      aria-label={handle.props.label}
      disabled={handle.props.disabled}
      class="flex size-11 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-ink disabled:text-line-strong sm:size-8"
      mix={on('click', () => handle.props.onPress())}
    >
      <Icon name={handle.props.icon} size={15} />
    </button>
  )
}

function Check(handle: Handle<{ ok: boolean; label: string }>) {
  return () => (
    <li class={cn('flex items-center gap-2.5', !handle.props.ok && 'text-error')}>
      <Icon name={handle.props.ok ? 'circle-check' : 'circle-alert'} class={handle.props.ok ? 'text-accent' : 'text-error'} />
      {handle.props.ok ? null : <span class="sr-only">Belum lengkap:</span>}
      {handle.props.label}
    </li>
  )
}
