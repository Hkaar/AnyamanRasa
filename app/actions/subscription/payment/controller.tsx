import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { checkoutQuery, parseCheckout, validatePayment } from '../../../domain/subscription.ts'
import { text } from '../../../domain/validation.ts'
import { routes } from '../../../routes.ts'
import { getShell, requireViewer } from '../../shell.tsx'
import { PaymentPage } from '../page.tsx'

/** pen.dev 14b. Nothing is charged or stored; a valid form moves on to the waiting screen. */
export default createController(routes.subscription.payment, {
  actions: {
    index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      return context.render(
        <PaymentPage shell={getShell(context)} checkout={parseCheckout(context.url.searchParams)} phone="" acceptedTerms={false} />,
      )
    },

    action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let form = context.formData
      let checkout = parseCheckout(form)
      let phone = text(form.get('hp'))
      let acceptedTerms = form.get('setuju') === '1'
      let intent = form.get('intent')
      let render = (errors = {}, status = 200) =>
        context.render(
          <PaymentPage shell={getShell(context)} checkout={checkout} phone={phone} acceptedTerms={acceptedTerms} errors={errors} />,
          { status },
        )

      // Changing a choice (auto-submitted) only refreshes the summary.
      if (intent === 'promo') {
        return checkout.promoPercent > 0 || !checkout.promoCode
          ? render()
          : render({ promo: 'Kode promo tidak dikenal.' }, 400)
      }
      if (intent !== 'bayar') return render()

      let result = validatePayment(checkout, { phone, acceptedTerms })
      if (!result.ok) return render(result.errors, 400)
      let query = checkoutQuery(checkout, result.phone ? { hp: result.phone } : {})
      return redirect(`${routes.subscription.pending.href()}?${query}`, 303)
    },
  },
})
