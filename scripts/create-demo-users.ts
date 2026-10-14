// Creates the seeded demo accounts in Supabase Auth (password "rahasia123",
// email pre-confirmed). They link to the local `users` rows by email on first
// sign-in. Development only; needs the service-role key, which the app never uses.
//
// Usage: npm run auth:demo-users
import { sql } from 'remix/data-table'

import { db, queryRows } from '../app/db.ts'

const url = process.env.SUPABASE_URL?.replace(/\/+$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env) first.')
  process.exit(1)
}

const users = await queryRows<{ email: string; name: string }>(db, sql`select email, name from users order by email`)
for (let user of users) {
  let response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: 'rahasia123',
      email_confirm: true,
      user_metadata: { full_name: user.name },
    }),
  })
  let body = (await response.json().catch(() => ({}))) as { msg?: string; message?: string; error_code?: string }
  if (response.ok) console.log(`created  ${user.email}`)
  else if (response.status === 422 || body.error_code === 'email_exists') console.log(`exists   ${user.email}`)
  else console.error(`failed   ${user.email}: ${response.status} ${body.msg ?? body.message ?? ''}`)
}
await db.close()
