# Architecture

AnyamanRasa is a server-rendered **Remix 3** application: `remix` package, `remix/component` JSX (not React), on Node.js 24 with PostgreSQL. Pages render on the server. A few interactive "client entries" hydrate in the browser, and forms work without JavaScript.

> SKPL §2.1/§2.5 describe a Laravel + Vue/Inertia baseline. Per `AGENTS.md`, and as agreed on 2026-10-12, the implementation uses Remix 3 instead. pgvector and AI features are out of scope.

## Layers

```txt
app/
  routes.ts            URL contract shared by server and browser (typed hrefs)
  router.ts            middleware stack + controller mapping
  actions/             Presentation + application: controllers (one per route map) and their pages
    <area>/controller.tsx       loads data, authorizes, validates, returns a Response
    <area>/<form>/controller.tsx GET page + POST action for form() routes
    <area>/public/…             browser-reachable client entries (hydrated islands)
  domain/              Pure TypeScript business rules, no I/O and no framework; unit tested
  data/                Infrastructure: PostgreSQL queries (remix/data-table + parameterized SQL), uploads, passwords
  middleware/          database, session, current viewer
  ui/                  shadcn/ui-style components (button, badge, input, label, card, …), layout, icons
  styles/app.css       Tailwind v4 entry with the pen.dev design tokens
db/                    migrations + development seed
test/                  test database setup and router test client
```

Rules:

- **Server-only code** (`app/data`, `app/middleware`, `app/db.ts`, controllers) is never browser-reachable. The asset server allow-list in `app/assets.ts` exposes only `app/**/public/**`, `app/ui/**`, `app/domain/**` and `app/routes.ts`.
- **Business rules live in `app/domain`** (SKPL-NF-06.2): pantry matching (`pantry.ts`), graph neighbourhood selection (`graph.ts`), lineage diff (`lineage.ts`), recipe form validation (`recipe-form.ts`), auth validation (`validation.ts`) and formatting. Components only render.
- **Controllers authorize every mutation** (SKPL-F-09.2, NF-03.1): `requireViewer` for authentication, ownership checks for recipe edits, and `requireAdmin` for moderation. Drafts and saved recipes are visible only to their owner (NF-07.1).
- **Expected failures return responses** (400 with the re-rendered form, 403, 404); unexpected errors throw.

## Request pipeline (`app/router.ts`)

1. `staticFiles('./public')`: compiled CSS, logo, favicon.
2. `formData()`: one upload at most, 5 MB.
3. `session()`: signed cookie session that stores only the user id, the CSRF token and an in-flight OAuth verifier.
4. `csrf()`: synchronizer token (`_csrf`) plus origin checks on every unsafe request.
5. `loadDatabase()`: exposes `context.db`.
6. `loadViewer()`: exposes `context.viewer` (null for guests).
7. `render()`: `context.render(<Page/>)`.

## Data access

`app/data/*.ts` use `remix/data-table`'s PostgreSQL adapter with the `sql` template tag, so every value is a bound parameter. List queries load related data in the same statement (categories, author, lineage, counts) to avoid N+1 queries (NF-02.2). Multi-row writes run in transactions: recipe with its ingredients, categories and lineage; registration with its roles; pantry replacement.

## Feature notes

- **Pantry Search.** `domain/pantry.ts` matches only through `recipe_ingredients`. The basic staples named in the UI (garam, minyak goreng, bawang merah) can be assumed available and are then left out of the counts. Ranking is by match ratio, then matched count, then fewest missing, then title. Substitutions come only from `substitute_for` relations.
- **Recipe Graph.** `data/graph.ts` expands from the centre one edge query per depth level (at most 2), plus one extra hop for substitutes of boundary ingredients. `domain/graph.ts` then selects at most 30 nodes, keeping higher-priority relationships first (NF-02.1). The browser renders the result with Cytoscape.js (`actions/graph/public/graph-explorer.tsx`). The **Daftar** view lists the same relationships as an accessible alternative (F-03.4). State lives in the URL (`?simpul=recipe:<id>&kedalaman=1&relasi=…&tampilan=daftar`).
- **Variations.** A variation is a new recipe plus a `variation_of` row, both written in one transaction. The ingredient changes shown on pages are computed by `domain/lineage.ts` and never typed in by hand.
- **Uploads.** Files are checked by magic bytes (JPEG, PNG or WebP), stored under a generated UUID name in `UPLOAD_DIR`, and served by `/media/*` with strict name validation.

## Authentication (Supabase Auth)

Supabase Auth is the identity provider for email/password and Google. The app keeps its own PostgreSQL and its own signed session cookie, and stores no Supabase tokens.

- **Adapter.** `app/data/auth-provider.ts` is a small client for Supabase's Auth REST API (password grant, sign-up, PKCE `authorize` + `token?grant_type=pkce`). It sits behind an `AuthProvider` interface, so tests swap in `test/fake-auth.ts`. Nothing else talks to Supabase.
- **Email/password.** `POST /masuk` calls `signInWithPassword`; a username typed at login is resolved to its email first. `POST /daftar` calls `signUp` and creates the local profile immediately. When the project requires email confirmation, the user sees "Cek emailmu" and can sign in after confirming.
- **Google.**
  1. `POST /masuk/google` (CSRF-protected) generates a PKCE verifier, keeps it in the session, and redirects to Supabase's Google authorize URL.
  2. `GET /masuk/google/callback?code=` exchanges the code with that verifier. A callback without a matching verifier is refused, which prevents login CSRF.
  3. First-time users get a generated username and land on profile settings.
- **Linking.** `linkIdentity()` in `app/data/users.ts` maps the identity to a local user: linked id first, then verified email, otherwise a new user.
- **Errors.** Errors come back to the login page only as fixed codes (`?galat=`), never as free text.
- **Configuration.** The app needs `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Without them, sign-in reports "tidak tersedia" in development and the app refuses to start in production. `SUPABASE_SERVICE_ROLE_KEY` is used only by `npm run auth:demo-users`.

## Progressive enhancement

Every navigation is a link and every mutation is a `<form>`. JavaScript adds:

- Auto-submitting filter forms (`app/actions/public/entry.ts`).
- Ingredient autocomplete.
- The ingredient checklist and servings scaler.
- The share button.
- Password visibility and strength, and the username availability check.
- Dynamic editor rows.
- The graph canvas.
- The admin confirmation dialog.

## UI components (shadcn/ui base)

`app/ui/` holds shadcn/ui's components (MIT), ported from React to Remix components. Their structure follows shadcn:

- Variants are defined with `class-variance-authority` (`buttonVariants`, `badgeVariants`, `alertVariants`).
- `cn()` (`clsx` + `tailwind-merge`) merges caller classes over the defaults.
- Every component sets a `data-slot` attribute.

Each component is themed with the pen.dev tokens rather than shadcn's defaults, so the screens still match the design:

| Module | Components | pen.dev counterpart |
| --- | --- | --- |
| `button.tsx` | `Button`, `ButtonLink`, `buttonVariants` | Button/Primary (`default`, terracotta), Secondary (`outline`), Ghost, Button/Accent (`dark`, brown), plus `accent` (soft tint), `destructive` and `link` |
| `badge.tsx` | `Badge`, `badgeVariants` | Tag (`default`), Chip/Ingredient (`chip`), Chip/Selected (`selected`), status pills |
| `input.tsx` | `Input`, `Textarea`, class recipes | Form Field controls |
| `load-more.tsx` | `LoadMore`, `LoadMoreChunk` | "Muat lebih banyak" with infinite scroll: a link to the next cumulative page without JavaScript; with it, `public/load-more.ts` appends the next page's fragment (`?bagian=kartu`) as the button nears the viewport (Jelajahi Resep, profile tabs) |
| `select.tsx` | `Select` (`inline`, `field`) | Select / Dropdown: a `<details>` dropdown of radios, so it submits with forms and works without JavaScript |
| `label.tsx` | `Label`, `Field`, `FieldMessage`, `fieldAttrs` | Form Field label and helper/error |
| `card.tsx`, `alert.tsx`, `empty.tsx`, `skeleton.tsx`, `separator.tsx`, `avatar.tsx`, `breadcrumb.tsx`, `kbd.tsx`, `toast.tsx` | Same names as shadcn | Panels, notices, Empty State, loading, avatar, breadcrumb, Toast |
| `tabs.tsx`, `table.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `toggle-group.tsx` | Class recipes or no-JS components | Tabs as links, admin table, `<dialog>` modal, `<details>` menus, segmented control |

Where shadcn relies on Radix and React state (tabs, dropdowns, dialogs, selects), the port uses native elements instead: links, `<details>`, `<dialog>`, `<select>` and radio inputs. These keep working without JavaScript. For a link that looks like a button, use `ButtonLink`, or `buttonVariants()` on any element.

`app/styles/app.css` only holds the `@theme` tokens and base element styles, like shadcn's `globals.css`. Component styling lives in Tailwind classes inside the components.

## Motion

Animation uses [Motion](https://motion.dev) (`motion`, plain DOM APIs) from `app/actions/public/motion.ts`, loaded by the browser entry. Styling stays in Tailwind (`motion-safe:` variants for hover and transitions); Motion is attached through data attributes:

| Attribute | Effect |
| --- | --- |
| `data-reveal` | The element fades and rises in when scrolled into view |
| `data-reveal-group` | Same, for each direct child, staggered |
| `data-grow` | A bar (with `origin-left`) fills from 0 when in view |
| `data-toast` | The toast enters, then dismisses after 6 s. Hover or focus pauses the timer |
| `details[data-pop]` | The menu or dropdown panel animates open |

Other motion:

- **Press feedback** on `[data-slot=button]`, badges and toggle-group items.
- **Entrances** via `enter()` for the graph detail panel and bottom sheet, autocomplete lists, the admin dialog and new editor rows.
- **Cytoscape transitions** in the graph: nodes glide on refocus or filter changes, and zoom and reset animate.

Rules:

- Content is server-rendered and visible without JavaScript. Only elements that start **below the fold** are hidden for a reveal, so nothing visible flashes.
- If an animation fails to start, the element is shown immediately.
- With `prefers-reduced-motion: reduce`, no Motion code runs and the graph changes instantly.
- `app/assets.ts` defines `process.env.NODE_ENV` for browser packages, which Motion requires.

## Testing

`npm test` runs `remix test`:

- Unit tests for the domain modules.
- Router tests that send real requests through `router.fetch` with a cookie-keeping client (`test/client.ts`) against a disposable `_test` database.

The router tests cover authentication, CSRF, ownership, admin access, graph bounds and the pantry flows.
