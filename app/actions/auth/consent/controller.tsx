import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import { linkIdentity } from '../../../data/users.ts'
import { validateConsent } from '../../../domain/validation.ts'
import { routes } from '../../../routes.ts'
import { getShell, setFlash } from '../../shell.tsx'
import { ConsentPage } from '../pages.tsx'
import { PENDING_SIGNUP_KEY, pendingSignup, signIn } from '../sign-in.ts'

const loginWithError = (code: string) => `${routes.auth.login.index.href()}?galat=${code}`

/**
 * Consent step for first-time Google sign-ups (pen.dev 10d). The email sign-up shows the same
 * step from its own controller, since its form values travel with it.
 */
export default createController(routes.auth.consent, {
  actions: {
    index(context) {
      let identity = pendingSignup(context)
      if (!identity) return redirect(routes.auth.register.index.href(), 303)
      return context.render(<ConsentPage shell={getShell(context)} google={{ email: identity.email }} />)
    },

    async action(context) {
      let identity = pendingSignup(context)
      if (!identity) return redirect(routes.auth.register.index.href(), 303)
      let error = validateConsent(context.formData)
      if (error) {
        return context.render(<ConsentPage shell={getShell(context)} google={{ email: identity.email }} error={error} />, {
          status: 400,
        })
      }

      context.get(Session)!.unset(PENDING_SIGNUP_KEY)
      let link = await linkIdentity(context.db, identity, { create: true })
      if (!link.ok) return redirect(loginWithError(link.error === 'needs-consent' ? 'oauth-failed' : link.error), 303)

      signIn(context, link.viewer.id)
      setFlash(context, { message: `Selamat datang, ${link.viewer.name}! Atur nama pengguna dan profilmu di sini.` })
      return redirect(routes.onboarding.index.href(), 303)
    },
  },
})
