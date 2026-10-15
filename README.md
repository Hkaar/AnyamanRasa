# AnyamanRasa

AnyamanRasa is a recipe discovery platform. It connects recipes through ingredients, substitutions, pairings and variations with explicit lineage. Its main features are Pantry Search ("Cari dari Bahan") and an interactive Recipe Graph.

It's built with Remix 3 (`remix/component`), TypeScript, Tailwind CSS v4, Motion, PostgreSQL and Cytoscape.js, and deploys either self-hosted with Docker or to Vercel with Supabase.

## Getting started

Requirements: Node.js ≥ 24.3 and Docker (for PostgreSQL).

```sh
cp .env.example .env        # then fill in the Supabase values (below)
npm install
docker compose up -d db     # PostgreSQL on localhost:5433
npm run db:reset            # migrate + load the demo seed
npm run auth:demo-users     # create the demo accounts in Supabase Auth
npm run dev                 # http://localhost:44100 (Tailwind watch + server)
```

### Supabase Auth setup

Sign-in (email/password and Google) uses a hosted Supabase project. App data stays in the PostgreSQL above.

1. Copy the values from **Project Settings → API** into `.env`:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`, for the app.
   - `SUPABASE_SERVICE_ROLE_KEY`, only for `auth:demo-users`.
2. **Authentication → URL Configuration.** Set the Site URL to `PUBLIC_URL`, and add these to Redirect URLs:
   - `http://localhost:44100/masuk/google/callback`
   - `http://localhost:44100/masuk?terkonfirmasi=1`
   - The same two paths on your production domain.
3. **Authentication → Providers → Google.** Enable it with a Google OAuth client ID and secret, created in Google Cloud Console as a "Web application". Its authorized redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Optionally turn **Confirm email** on or off; the app handles both.

Demo accounts (password `rahasia123`, after `npm run auth:demo-users`):

| Account | Login |
| --- | --- |
| Member | `sari.wulandari@email.com` |
| Admin | `admin@anyamanrasa.id` |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reloading (server code and components) and CSS watch, on `PORT` (44100); the app itself runs on `PORT + 2` behind it |
| `npm run dev:node` | Fallback: plain `node --watch` server (restarts only when `server.ts` changes) |
| `npm run build` | Build the production stylesheet (`public/styles.css`) |
| `npm start` | Production server |
| `npm test` | Unit + router tests. The `_test` database is rebuilt automatically; override it with `TEST_DATABASE_URL` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate`, `db:status`, `db:seed`, `db:reset` | Database lifecycle (see `docs/database.md`) |
| `npx remix doctor` | Check project conventions |

## Deployment

The same code runs in two setups. Supabase Auth is used by both; the database and photo
storage can each be self-hosted or hosted.

| | Self-hosted (Docker) | Vercel + Supabase |
| --- | --- | --- |
| Server | `server.ts` (long-running Node) | `api/index.mjs` (Vercel Function, `vercel.json`) |
| Database | bundled Postgres, or `EXTERNAL_DATABASE_URL` | Supabase Postgres via the pooler |
| Photos | `MEDIA_STORAGE=local` (the `uploads` volume) or `s3` | `MEDIA_STORAGE=s3` (Supabase Storage) |

Photo URLs are always stored as `/media/<file>`, so switching storage only means copying the
files (`npm run media:copy`), never rewriting the database. Uploads are limited to 4 MB, below
Vercel's request-body cap.

### Self-hosted (Docker)

```sh
export POSTGRES_PASSWORD=… SESSION_SECRETS=$(openssl rand -hex 32) \
  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=… PUBLIC_URL=https://your.domain
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm app npx remix db migrate
```

Put the app behind an HTTPS-terminating proxy. Secrets are passed at runtime and never baked into the image.
To use a hosted database instead of the bundled one, set `EXTERNAL_DATABASE_URL` and start only the app
(`up -d --build --no-deps app`). To keep photos in a bucket, set the `MEDIA_STORAGE=s3` variables below.

### Vercel + Supabase

1. **Supabase**
   - Database: copy the *Transaction pooler* connection string (port 6543) for the app, and the
     direct one (port 5432) for migrations.
   - Storage: create a bucket (e.g. `media`). Make it public to serve photos straight from
     Supabase's CDN, or keep it private and let the app stream them. Under
     *Storage → S3 Connection*, create an access key and note the endpoint and region.
   - Auth: add `https://<your-domain>/masuk/google/callback` to the redirect URLs.
2. **Migrate** from your machine: `DATABASE_URL=<direct URL> npm run db:migrate`
   (and `npm run db:seed` for demo data).
3. **Vercel**: import the repository (framework preset: *Other*; `vercel.json` sets the build).
   Set these environment variables:

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

4. Moving existing photos from a Docker volume: run `npm run media:copy -- <uploads dir>` with the
   `MEDIA_STORAGE=s3` variables set.

`npm run build` precompiles the browser modules into `public/assets/`, so Vercel's CDN serves
them without running the function; the app's own TypeScript modules are served by the function
once and then cached by the CDN. Script and photo requests never touch the database. On Vercel
each instance keeps at most 3 database connections and releases them before it is frozen
(`attachDatabasePool`), so a busy site stays well under Supabase's pooler limit. If the database
is unreachable, visitors get a short "coba lagi" page (HTTP 503) instead of a crash.

## Documentation

- `AGENTS.md`: project rules for contributors and agents.
- `docs/features.md`: implemented scope, mapped to SKPL requirements.
- `docs/database.md`: schema, relationship types and status lifecycle.
- `docs/architecture.md`: layers, request pipeline and feature internals.
- UI source of truth: the pen.dev design `AnyamanRasa.pen` (inspect it through the Pencil MCP server).
