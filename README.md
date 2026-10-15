# AnyamanRasa

A recipe discovery platform that connects recipes through their ingredients, substitutions, pairings and variations (with explicit lineage). The highlights are **Cari dari Bahan** (pantry search) and the interactive **Graf Resep**.

**Stack:** Remix 3 (`remix/component`), TypeScript, Tailwind CSS v4, Motion, PostgreSQL, Cytoscape.js. Sign-in uses Supabase Auth. It deploys self-hosted with Docker, or to Vercel with Supabase.

## Getting started

You need Node.js ≥ 24.3 and Docker.

```sh
cp .env.example .env        # fill in the Supabase values (see below)
npm install
docker compose up -d db     # PostgreSQL on localhost:5433
npm run db:reset            # migrate and load the demo seed
npm run auth:demo-users     # create the demo accounts in Supabase Auth
npm run dev                 # http://localhost:44100
```

`npm run dev` runs Tailwind in watch mode and a hot-reloading server, so server code and components reload on save. Check that nothing else is listening on port 44100 first.

Pages load fastest against the local database. If `.env` points at a remote one, override it for development:

```sh
DATABASE_URL=postgres://anyaman:anyaman@localhost:5433/anyaman_rasa npm run dev
```

### Demo accounts

After `npm run auth:demo-users`, both accounts use the password `rahasia123`.

| Role | Email |
| --- | --- |
| Member | `sari.wulandari@email.com` |
| Admin | `admin@anyamanrasa.id` |

### Supabase Auth

Email/password and Google sign-in go through a hosted Supabase project. App data stays in PostgreSQL.

1. **Project Settings → API:** copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env`. `SUPABASE_SERVICE_ROLE_KEY` is needed only by `auth:demo-users`.
2. **Authentication → URL Configuration:** set the Site URL to `PUBLIC_URL`, then add these redirect URLs, plus the same two paths on your production domain:
   - `http://localhost:44100/masuk/google/callback`
   - `http://localhost:44100/masuk?terkonfirmasi=1`
3. **Authentication → Providers → Google:** enable it with a Google Cloud OAuth client of type "Web application". Its authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.
4. **Confirm email** can be on or off; the app handles both.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Hot-reloading dev server and CSS watch on `PORT` (44100); the app itself runs on `PORT + 2` behind it |
| `npm run dev:node` | Fallback `node --watch` server; restarts only when `server.ts` changes |
| `npm run build` | Production stylesheet plus precompiled browser modules in `public/assets/` |
| `npm start` | Production server |
| `npm test` | Unit and router tests on a rebuilt `_test` database (override with `TEST_DATABASE_URL`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` · `db:status` · `db:seed` · `db:reset` | Database lifecycle (see `docs/database.md`) |
| `npm run media:copy -- <dir>` | Copy uploaded photos into the configured storage |
| `npx remix doctor` | Check Remix project conventions |

## Deployment

Both setups run the same code and use Supabase Auth. The database and photo storage can each be self-hosted or hosted.

| | Self-hosted (Docker) | Vercel + Supabase |
| --- | --- | --- |
| Server | `server.ts`, a long-running Node process | `api/index.mjs`, a Vercel Function (`vercel.json`) |
| Database | Bundled Postgres, or `EXTERNAL_DATABASE_URL` | Supabase Postgres through the pooler |
| Photos | `MEDIA_STORAGE=local` (the `uploads` volume) or `s3` | `MEDIA_STORAGE=s3` (Supabase Storage) |

Photo URLs are stored as `/media/<file>`, so switching storage only means copying the files with `npm run media:copy`; the database never changes. Uploads are capped at 4 MB, which stays under Vercel's request-body limit.

### Self-hosted (Docker)

```sh
export POSTGRES_PASSWORD=… SESSION_SECRETS=$(openssl rand -hex 32) \
  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=… PUBLIC_URL=https://your.domain
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm app npx remix db migrate
```

- Put the app behind an HTTPS-terminating proxy. Secrets are passed at runtime and never baked into the image.
- To use a hosted database, set `EXTERNAL_DATABASE_URL` and start only the app with `up -d --build --no-deps app`.
- To keep photos in a bucket, set the `MEDIA_STORAGE=s3` variables listed under Vercel below.

### Vercel + Supabase

1. **Supabase**
   - **Database:** note the *Transaction pooler* connection string (port 6543) for the app, and the direct one (port 5432) for migrations.
   - **Storage:** create a bucket, such as `media`. Make it public to serve photos from Supabase's CDN, or keep it private and let the app stream them. Under *Storage → S3 Connection*, create an access key and note the endpoint and region.
   - **Auth:** add `https://<your-domain>/masuk/google/callback` to the redirect URLs.
2. **Migrate** from your machine with `DATABASE_URL=<direct URL> npm run db:migrate`. Add `npm run db:seed` for demo data.
3. **Vercel:** import the repository with the framework preset *Other*; `vercel.json` sets the build. Then set these environment variables:

   ```
   DATABASE_URL=<pooler URL, port 6543>
   SESSION_SECRETS=<openssl rand -hex 32>
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_ANON_KEY=…
   PUBLIC_URL=https://<your-domain>
   MEDIA_STORAGE=s3
   S3_ENDPOINT=https://<ref>.storage.supabase.co/storage/v1/s3
   S3_REGION=<project region>
   S3_BUCKET=media
   S3_ACCESS_KEY_ID=…
   S3_SECRET_ACCESS_KEY=…
   MEDIA_PUBLIC_URL=https://<ref>.supabase.co/storage/v1/object/public/media   # public bucket only
   ```

4. **Existing photos:** to move them from a Docker volume, run `npm run media:copy -- <uploads dir>` with the `MEDIA_STORAGE=s3` variables set.

How it behaves on Vercel:

- Vercel's CDN serves the precompiled browser modules directly. The function serves the app's own modules once, then the CDN caches them. Script and photo requests never query the database.
- Each instance keeps at most 3 database connections and releases them before it is frozen (`attachDatabasePool`), which keeps a busy site within Supabase's pooler limit.
- If the database can't be reached, visitors see a short "coba lagi" page (HTTP 503) instead of a crash.

## Documentation

- `AGENTS.md`: project rules for contributors and agents.
- `docs/features.md`: implemented scope mapped to the SKPL requirements, and what was deliberately left out.
- `docs/database.md`: schema, relationship types and status lifecycle.
- `docs/architecture.md`: layers, request pipeline and feature internals.
- `AnyamanRasa.pen`: the pen.dev design and visual source of truth, inspected through the Pencil MCP server.
