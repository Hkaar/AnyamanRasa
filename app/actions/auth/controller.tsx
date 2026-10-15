import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import { codeChallengeFor, createCodeVerifier, getAuthProvider } from '../../data/auth-provider.ts'
import { isUsernameTaken, linkIdentity } from '../../data/users.ts'
import { text, validateUsername } from '../../domain/validation.ts'
import { routes } from '../../routes.ts'
import { safeRedirectTarget, setFlash } from '../shell.tsx'
import { type LoginErrorCode, OAUTH_RETURN_KEY, OAUTH_VERIFIER_KEY, publicUrl, signIn } from './sign-in.ts'

const loginWithError = (code: LoginErrorCode) => `${routes.auth.login.index.href()}?galat=${code}`

export default createController(routes.auth, {
  actions: {
    logout(context) {
      context.get(Session)!.destroy()
      return redirect(routes.home.href(), 303)
    },

    /** Starts Google sign-in through Supabase Auth (PKCE; the verifier stays in our session). */
    google(context) {
      let verifier = createCodeVerifier()
      let url = getAuthProvider().googleAuthorizeUrl(
        publicUrl(context, routes.auth.googleCallback.href()),
        codeChallengeFor(verifier),
      )
      if (!url) return redirect(loginWithError('unavailable'), 303)

      let session = context.get(Session)!
      session.set(OAUTH_VERIFIER_KEY, verifier)
      session.set(OAUTH_RETURN_KEY, safeRedirectTarget(context.formData.get('ke'), routes.home.href()))
      return redirect(url, 303)
    },

    /** Supabase redirects back here with `?code=` (or `?error=` when cancelled). */
    async googleCallback(context) {
      let session = context.get(Session)!
      let verifier = session.get(OAUTH_VERIFIER_KEY)
      let returnTo = safeRedirectTarget(session.get(OAUTH_RETURN_KEY), routes.home.href())
      session.unset(OAUTH_VERIFIER_KEY)
      session.unset(OAUTH_RETURN_KEY)

      let code = context.url.searchParams.get('code')
      // No verifier means this browser did not start the flow: refuse (login CSRF).
      if (!code || typeof verifier !== 'string') {
        // Supabase reports provider/config problems as ?error=&error_description= (also in the hash,
        // which never reaches the server). Log them so deployments can be diagnosed.
        let params = context.url.searchParams
        console.warn('Google sign-in callback rejected', {
          hasCode: Boolean(code),
          hasVerifier: typeof verifier === 'string',
          error: params.get('error'),
          errorCode: params.get('error_code'),
          errorDescription: params.get('error_description'),
        })
        return redirect(loginWithError('oauth-failed'), 303)
      }
      let result = await getAuthProvider().exchangeCode(code, verifier)
      if (!result.ok) return redirect(loginWithError(result.error === 'unavailable' ? 'unavailable' : 'oauth-failed'), 303)

      let link = await linkIdentity(context.db, result.value)
      if (!link.ok) {
        return redirect(loginWithError(link.error), 303)
      }

      signIn(context, link.viewer.id)
      if (link.created) {
        setFlash(context, { message: `Selamat datang, ${link.viewer.name}! Atur nama pengguna dan profilmu di sini.` })
        return redirect(routes.profile.edit.index.href(), 303)
      }
      setFlash(context, { message: `Selamat datang kembali, ${link.viewer.name}.` })
      return redirect(returnTo, 303)
    },

    /** Live availability check for the sign-up form. */
    async usernameCheck(context) {
      let username = text(context.url.searchParams.get('u')).toLowerCase()
      let error = validateUsername(username)
      if (error) return Response.json({ available: false, message: error })
      let taken = await isUsernameTaken(context.db, username)
      return Response.json(
        { available: !taken, message: taken ? 'Nama pengguna sudah dipakai.' : 'Tersedia' },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    },
  },
})
