import { clientEntry, on, ref } from 'remix/component'
import type { Handle } from 'remix/component'

import { Icon } from '../../../ui/icon.tsx'
import { enter } from '../../public/motion.ts'
import { Button } from '../../../ui/button.tsx'
import { dialogContentClass, dialogDescriptionClass, dialogFooterClass, dialogTitleClass } from '../../../ui/dialog.tsx'

/**
 * Bulk action bar for the admin table: live selection count, select-all, and a
 * confirmation dialog before archiving. The underlying form posts natively.
 */
export const BulkActions = clientEntry(
  import.meta.url,
  function BulkActions(handle: Handle<{ formId: string }>) {
    let count = 0
    // Buttons stay enabled in the server render so the form works without JavaScript.
    let hydrated = false
    let dialog: HTMLDialogElement | null = null
    let confirmed = false

    function form() {
      return document.getElementById(handle.props.formId) as HTMLFormElement | null
    }
    function boxes() {
      return [...(form()?.querySelectorAll<HTMLInputElement>('input[name="resep"]') ?? [])]
    }
    function refresh() {
      count = boxes().filter((box) => box.checked).length
      let all = form()?.querySelector<HTMLInputElement>('input[data-select-all]')
      if (all) {
        all.checked = count > 0 && count === boxes().length
        all.indeterminate = count > 0 && count < boxes().length
      }
      handle.update()
    }

    handle.queueTask(() => {
      let element = form()
      if (!element) return
      element.addEventListener(
        'change',
        (event) => {
          let target = event.target as HTMLInputElement
          if (target.hasAttribute('data-select-all')) {
            for (let box of boxes()) box.checked = target.checked
          }
          refresh()
        },
        { signal: handle.signal },
      )
      element.addEventListener(
        'submit',
        (event) => {
          let submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null
          if (submitter?.value === 'archive' && !confirmed) {
            event.preventDefault()
            dialog?.showModal()
            if (dialog) enter(dialog, { scale: 0.96 })
          }
        },
        { signal: handle.signal },
      )
      hydrated = true
      refresh()
    })

    return () => (
      <>
        <div class="flex items-center gap-2 rounded-sm bg-hover py-1.5 pr-1.5 pl-3">
          <span class="text-[13px] font-medium tracking-[0.26px] text-ink" aria-live="polite">
            {count} dipilih
          </span>
          <Button type="submit" name="aksi" value="restore" form={handle.props.formId} variant="outline" size="sm" disabled={hydrated && count === 0}>
            Terbitkan ulang
          </Button>
          <Button type="submit" name="aksi" value="archive" form={handle.props.formId} variant="outline" size="sm" class="text-error" disabled={hydrated && count === 0}>
            Arsipkan
          </Button>
        </div>
        <dialog
          mix={ref((node) => (dialog = node as HTMLDialogElement))}
          aria-labelledby="arsip-title"
          class={dialogContentClass}
        >
          <div class="flex flex-col gap-5">
            <div class="flex gap-3.5">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-error-subtle text-error">
                <Icon name="archive" size={18} />
              </span>
              <div class="flex flex-col gap-1.5">
                <h2 id="arsip-title" class={dialogTitleClass}>
                  Arsipkan {count} resep?
                </h2>
                <p class={dialogDescriptionClass}>
                  Resep yang diarsipkan tidak tampil di pencarian maupun Graf Resep. Kamu bisa menerbitkannya ulang kapan saja.
                </p>
              </div>
            </div>
            <div class={dialogFooterClass}>
              <Button type="button" variant="outline" mix={on('click', () => dialog?.close())}>
                Batal
              </Button>
              <Button
                type="button" variant="destructive"
                mix={on('click', () => {
                  confirmed = true
                  dialog?.close()
                  let archive = document.querySelector<HTMLButtonElement>(
                    `button[form="${handle.props.formId}"][value="archive"]`,
                  )
                  form()?.requestSubmit(archive ?? undefined)
                })}
              >
                Arsipkan
              </Button>
            </div>
          </div>
        </dialog>
      </>
    )
  },
)
