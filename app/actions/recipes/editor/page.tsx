import type { Handle } from 'remix/component'

import type { Category } from '../../../data/recipes.ts'
import { difficultyLabel, formatMinutes } from '../../../domain/format.ts'
import { emptyRecipeErrors, type RecipeFormErrors, type RecipeFormField, type RecipeFormValues } from '../../../domain/recipe-form.ts'
import type { RecipeDetail } from '../../../domain/types.ts'
import { routes } from '../../../routes.ts'
import { Icon } from '../../../ui/icon.tsx'
import { SiteLayout } from '../../../ui/layout.tsx'
import { CsrfField } from '../../../ui/primitives.tsx'
import type { Shell } from '../../../ui/shell.ts'
import { RecipeEditor } from './public/recipe-editor.tsx'
import { Button } from '../../../ui/button.tsx'
import { cn, pageX } from '../../../ui/utils.ts'
import { Breadcrumb } from '../../../ui/breadcrumb.tsx'

export type EditorMode = 'create' | 'edit' | 'variation'

export interface RecipeEditorPageProps {
  shell: Shell
  mode: EditorMode
  values: RecipeFormValues
  errors?: RecipeFormErrors
  categories: Category[]
  action: string
  /** The recipe being edited. */
  recipe?: RecipeDetail
  /** The source recipe of a new variation. */
  parent?: RecipeDetail
}

const COPY: Record<EditorMode, { title: string; description: string; publish: string; publishBar: string }> = {
  create: {
    title: 'Tulis Resep Baru',
    description: 'Bagikan masakanmu. Resep yang kamu terbitkan terhubung dengan bahan-bahannya di Cari dari Bahan dan Graf Resep.',
    publish: 'Terbitkan Resep',
    publishBar: 'Terbitkan resep',
  },
  edit: {
    title: 'Ubah Resep',
    description: 'Perbarui resepmu. Perubahan langsung tampil setelah disimpan.',
    publish: 'Simpan & Terbitkan',
    publishBar: 'Simpan & terbitkan',
  },
  variation: {
    title: 'Buat Variasi Resep',
    description: 'Adaptasi resep yang sudah ada. Variasimu tetap terhubung dengan resep asli, di halaman resep maupun di Graf Resep.',
    publish: 'Terbitkan Variasi',
    publishBar: 'Terbitkan variasi',
  },
}

export function RecipeEditorPage(handle: Handle<RecipeEditorPageProps>) {
  return () => {
    let { shell, mode, values, errors = emptyRecipeErrors(), categories, action, recipe, parent } = handle.props
    let copy = COPY[mode]
    let problems = errorLinks(errors)
    let isVariation = mode === 'variation' || Boolean(recipe?.parent)

    let crumbs =
      mode === 'variation' && parent
        ? [{ label: parent.title, href: routes.recipes.show.href({ id: parent.id }) }, { label: 'Buat Variasi' }]
        : mode === 'edit' && recipe
          ? [{ label: recipe.title, href: routes.recipes.show.href({ id: recipe.id }) }, { label: 'Ubah' }]
          : [{ label: 'Profil', href: routes.profile.show.href({ username: shell.viewer!.username }) }, { label: 'Tulis Resep' }]

    return (
      <SiteLayout shell={shell} title={copy.title} footer={false}>
        <form
          method="post"
          action={action}
          enctype="multipart/form-data"
          novalidate
          class={cn(pageX, 'flex flex-col gap-10 pt-8 pb-24 lg:gap-12 lg:pt-12 lg:pb-30')}
        >
          <CsrfField token={shell.csrfToken} />
          <header class="flex flex-col justify-between gap-6 border-b border-line pb-8 lg:flex-row lg:items-end">
            <div class="flex max-w-[640px] flex-col gap-3">
              <Breadcrumb items={crumbs} />
              <h1 class="text-4xl leading-[1.1] font-normal tracking-[-0.6px] lg:text-[60px]">{copy.title}</h1>
              <p class="text-base leading-normal tracking-[0.02em] text-muted lg:text-lg lg:leading-[27px]">
                {copy.description}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button type="submit" name="aksi" value="draf" variant="dark" size="lg" formNoValidate>
                <Icon name="file" />
                Simpan Draf
              </Button>
              <Button type="submit" name="aksi" value="terbitkan" variant="default" size="lg">
                {copy.publish}
              </Button>
            </div>
          </header>

          {problems.length > 0 && (
            // pen.dev 12i: what to fix, with a jump link to each field.
            <div role="alert" class="flex flex-col gap-4 rounded-lg bg-error-subtle p-5 lg:flex-row lg:items-center lg:justify-between lg:px-5">
              <div class="flex items-start gap-3.5">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg/70 text-error">
                  <Icon name="circle-alert" size={18} />
                </span>
                <div class="flex flex-col gap-0.5 tracking-[0.02em]">
                  <p class="text-[15px] font-medium text-error">Resepmu belum bisa disimpan</p>
                  <p class="text-[13px] leading-5 text-ink">
                    Perbaiki {problems.length} isian yang ditandai merah, lalu kirim lagi.
                  </p>
                </div>
              </div>
              <ul class="flex flex-wrap gap-2 pl-[50px] lg:justify-end lg:pl-0" aria-label="Isian yang perlu diperbaiki">
                {problems.map((problem) => (
                  <li key={problem.label}>
                    <a
                      href={problem.href}
                      class="flex h-8 items-center gap-1.5 rounded-sm bg-bg px-3 text-xs font-medium tracking-[0.02em] text-error transition-colors hover:bg-white/60"
                    >
                      {problem.label}
                      <Icon name="arrow-down" size={13} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RecipeEditor
            mode={mode}
            values={values}
            errors={errors}
            categories={categories}
            parentIngredients={parent ? parent.ingredients : null}
            parentSteps={parent ? parent.steps.map((step) => step.text) : null}
            source={
              parent
                ? {
                    title: parent.title,
                    href: routes.recipes.show.href({ id: parent.id }),
                    imageUrl: parent.imageUrl,
                    authorName: parent.author.name,
                    meta: `oleh ${parent.author.name} · ${formatMinutes(parent.totalMinutes)} · ${difficultyLabel(parent.difficulty)} · ${parent.servings} porsi`,
                  }
                : null
            }
            isVariation={isVariation}
            publishLabel={copy.publishBar}
          />
        </form>
      </SiteLayout>
    )
  }
}

const FIELD_LINKS: Record<RecipeFormField, { label: string; href: string }> = {
  title: { label: 'Judul resep', href: '#judul' },
  changeSummary: { label: 'Perubahan', href: '#perubahan' },
  description: { label: 'Deskripsi', href: '#deskripsi' },
  image: { label: 'Foto masakan', href: '#foto-label' },
  prepMinutes: { label: 'Waktu persiapan', href: '#persiapan' },
  cookMinutes: { label: 'Waktu memasak', href: '#memasak' },
  servings: { label: 'Porsi', href: '#porsi' },
  difficulty: { label: 'Kesulitan', href: '#informasi' },
  categoryIds: { label: 'Kategori', href: '#kategori-help' },
  ingredients: { label: 'Bahan', href: '#bahan' },
  steps: { label: 'Langkah', href: '#langkah' },
}

/** One jump link per field or row the server rejected, in form order. */
function errorLinks(errors: RecipeFormErrors): { label: string; href: string }[] {
  let fields = (Object.keys(FIELD_LINKS) as RecipeFormField[]).filter((field) => errors.fields[field])
  let links = fields.map((field) => FIELD_LINKS[field])
  let ingredientRows = Object.keys(errors.ingredientRows).map(Number).sort((a, b) => a - b)
  let stepRows = Object.keys(errors.stepRows).map(Number).sort((a, b) => a - b)
  let at = links.findIndex((link) => link.href === '#langkah')
  links.splice(at === -1 ? links.length : at, 0, ...ingredientRows.map((row) => ({ label: `Bahan ${row + 1}`, href: '#bahan' })))
  links.push(...stepRows.map((row) => ({ label: `Langkah ${row + 1}`, href: '#langkah' })))
  return links
}
