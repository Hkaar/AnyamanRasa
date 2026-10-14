# AnyamanRasa

AnyamanRasa is a recipe discovery platform. It connects recipes through ingredients, substitutions, pairings and variations with explicit lineage. Its main features are Pantry Search ("Cari dari Bahan") and an interactive Recipe Graph.

It's built with Remix 3 (`remix/component`), TypeScript, Tailwind CSS v4, Motion, PostgreSQL and Cytoscape.js, and deploys with Docker.

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

## Production (Docker)

```sh
export POSTGRES_PASSWORD=… SESSION_SECRETS=$(openssl rand -hex 32) \
  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=… PUBLIC_URL=https://your.domain
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm app npx remix db migrate
```

Put the app behind an HTTPS-terminating proxy. Secrets are passed at runtime and never baked into the image.

## Documentation

- `AGENTS.md`: project rules for contributors and agents.
- `docs/features.md`: implemented scope, mapped to SKPL requirements.
- `docs/database.md`: schema, relationship types and status lifecycle.
- `docs/architecture.md`: layers, request pipeline and feature internals.
- UI source of truth: the pen.dev design `AnyamanRasa.pen` (inspect it through the Pencil MCP server).
