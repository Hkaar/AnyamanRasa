import { sql } from 'remix/data-table'

import { type Database, queryRow } from '../db.ts'
import type { Viewer } from '../domain/types.ts'
import type { AuthIdentity } from './auth-provider.ts'

const ADMIN_ROLE = 'admin'
const MEMBER_ROLE = 'member'

interface ViewerRow {
  id: string
  name: string
  username: string
  avatar_url: string | null
  is_admin: boolean
}

function toViewer(row: ViewerRow): Viewer {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatar_url,
    isAdmin: row.is_admin,
  }
}

const viewerColumns = sql`
  u.id, u.name, u.username, u.avatar_url,
  exists (
    select 1 from user_roles ur join roles ro on ro.id = ur.role_id
    where ur.user_id = u.id and ro.name = ${ADMIN_ROLE}
  ) as is_admin
`

export async function findViewer(db: Database, userId: string): Promise<Viewer | null> {
  let row = await queryRow<ViewerRow>(
    db,
    sql`select ${viewerColumns} from users u where u.id = ${userId}`,
  )
  return row ? toViewer(row) : null
}

/** Resolves the email for a login typed as a username (Supabase signs in by email). */
export async function findEmailForLogin(db: Database, login: string): Promise<string> {
  let normalized = login.trim().toLowerCase()
  if (normalized.includes('@')) return normalized
  let row = await queryRow<{ email: string }>(db, sql`select email from users where username = ${normalized}`)
  return row?.email ?? normalized
}

export async function isUsernameTaken(db: Database, username: string): Promise<boolean> {
  let row = await queryRow(db, sql`select 1 from users where username = ${username}`)
  return row !== null
}

export async function isEmailTaken(db: Database, email: string): Promise<boolean> {
  let row = await queryRow(db, sql`select 1 from users where lower(email) = ${email.toLowerCase()}`)
  return row !== null
}

export interface NewUser {
  authUserId: string
  name: string
  username: string
  email: string
  avatarUrl?: string | null
}

export async function createUser(db: Database, input: NewUser): Promise<Viewer> {
  return db.transaction(async (tx) => {
    let row = await queryRow<{ id: string }>(
      tx,
      sql`insert into users (auth_user_id, name, username, email, avatar_url)
          values (${input.authUserId}, ${input.name}, ${input.username}, ${input.email.toLowerCase()}, ${input.avatarUrl ?? null})
          returning id`,
    )
    if (!row) throw new Error('Failed to create user')
    await tx.exec(sql`
      insert into user_roles (user_id, role_id)
      select ${row.id}, id from roles where name = ${MEMBER_ROLE}
    `)
    return {
      id: row.id,
      name: input.name,
      username: input.username,
      avatarUrl: input.avatarUrl ?? null,
      isAdmin: false,
    }
  })
}

/** A username derived from an email or name: `[a-z0-9_]{3,30}`, made unique with a suffix. */
export async function availableUsername(db: Database, seed: string): Promise<string> {
  let base = seed
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
  if (base.length < 3) base = `koki_${base}`.slice(0, 24)
  let candidate = base
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!(await isUsernameTaken(db, candidate))) return candidate
    candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`
  }
  throw new Error('Could not find an available username')
}

export type IdentityLink =
  | { ok: true; viewer: Viewer; created: boolean }
  | { ok: false; error: 'email-linked-elsewhere' | 'email-unverified' }

/**
 * Maps a verified Supabase identity to a local user: by linked id, then by
 * verified email (accounts that predate the link), else a new profile.
 */
export async function linkIdentity(db: Database, identity: AuthIdentity): Promise<IdentityLink> {
  let linked = await queryRow<ViewerRow>(
    db,
    sql`select ${viewerColumns} from users u where u.auth_user_id = ${identity.id}`,
  )
  if (linked) return { ok: true, viewer: toViewer(linked), created: false }

  let byEmail = await queryRow<ViewerRow & { auth_user_id: string | null }>(
    db,
    sql`select ${viewerColumns}, u.auth_user_id from users u where lower(u.email) = ${identity.email}`,
  )
  if (byEmail) {
    if (byEmail.auth_user_id) return { ok: false, error: 'email-linked-elsewhere' }
    // Only an address the provider has verified may claim an existing account.
    if (!identity.emailConfirmed) return { ok: false, error: 'email-unverified' }
    await db.exec(sql`update users set auth_user_id = ${identity.id}, updated_at = now() where id = ${byEmail.id}`)
    return { ok: true, viewer: toViewer(byEmail), created: false }
  }

  let username = await availableUsername(db, identity.email.split('@')[0] ?? identity.name ?? 'koki')
  let viewer = await createUser(db, {
    authUserId: identity.id,
    name: identity.name?.slice(0, 100) || username,
    username,
    email: identity.email,
    avatarUrl: identity.avatarUrl,
  })
  return { ok: true, viewer, created: true }
}

export interface Profile {
  id: string
  name: string
  username: string
  email: string
  bio: string
  location: string
  avatarUrl: string | null
  createdAt: string
  recipeCount: number
  variationCount: number
}

export async function findProfileByUsername(db: Database, username: string): Promise<Profile | null> {
  return findProfile(db, sql`u.username = ${username}`)
}

export async function findProfileById(db: Database, id: string): Promise<Profile | null> {
  return findProfile(db, sql`u.id = ${id}`)
}

async function findProfile(db: Database, where: ReturnType<typeof sql>): Promise<Profile | null> {
  let row = await queryRow<{
    id: string
    name: string
    username: string
    email: string
    bio: string
    location: string
    avatar_url: string | null
    created_at: Date
    recipe_count: number
    variation_count: number
  }>(
    db,
    sql`select u.id, u.name, u.username, u.email, u.bio, u.location, u.avatar_url, u.created_at,
          count(r.id) filter (where vr.id is null)::int as recipe_count,
          count(r.id) filter (where vr.id is not null)::int as variation_count
        from users u
        left join recipes r on r.user_id = u.id and r.status = 'published'
        left join node_relations vr on vr.relation_type = 'variation_of' and vr.source_id = r.id
        where ${where}
        group by u.id`,
  )
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    bio: row.bio,
    location: row.location,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at.toISOString(),
    recipeCount: row.recipe_count,
    variationCount: row.variation_count,
  }
}

export interface ProfileUpdate {
  name: string
  username: string
  bio: string
  location: string
  avatarUrl?: string | null
}

export async function updateProfile(db: Database, userId: string, input: ProfileUpdate) {
  await db.exec(sql`
    update users set
      name = ${input.name},
      username = ${input.username},
      bio = ${input.bio},
      location = ${input.location},
      avatar_url = ${input.avatarUrl === undefined ? sql`avatar_url` : input.avatarUrl},
      updated_at = now()
    where id = ${userId}
  `)
}
