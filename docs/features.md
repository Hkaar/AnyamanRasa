# Features

Scope comes from SKPL-IFPAGI01, plus the extra designed features approved on 2026-10-12: admin moderation, bookmarks, servings scaler and share, and shopping list / saved pantry. UI copy is Bahasa Indonesia, and the screens follow the pen.dev file `AnyamanRasa.pen`.

| Requirement | Feature | Where |
| --- | --- | --- |
| F-01.1, F-01.2 | Browse and search by title/keyword, ingredient or category; filter by category, duration and difficulty; sort by relevance, popularity, newest or fastest; "Muat lebih banyak" paging; empty state | `/resep` |
| F-02.1 | Recipe detail: photo, description, ingredients with quantities, steps, time, difficulty, servings, author | `/resep/:id` |
| F-02.2 | Variations, explicit relations and related recipes on the recipe page | `/resep/:id` |
| F-03.1–03.4 | Recipe Graph: recipe and ingredient nodes, stored relationship types, zoom/pan, select and refocus, filters, depth 1–2, limited to 30 nodes, list view | `/graf` |
| F-04.1, F-04.2 | Ingredient page: recipes using it (tabs: Semua + its two most common categories), frequent pairings (computed share), explicit pairings and substitutes | `/bahan/:id` |
| F-05.1–05.3 | Pantry Search: add or remove ingredients (autocomplete or typed names), match %, missing ingredients, explicit substitutions, staples toggle, filters | `/cari-bahan` |
| F-06.1, F-06.2 | Write and edit recipes, with photo upload, ingredients, steps, validation and drafts | `/resep/baru`, `/resep/:id/ubah` |
| F-07.1–07.3 | Variations with stored `variation_of` lineage, required change summary and live ingredient diff | `/resep/:id/variasi` |
| F-08.1, F-08.2 | Profile with recipes (sort: Terbaru/Terpopuler, "Muat lebih banyak"), "Variasi yang dibuat", variations and (own) saved recipes; settings (public profile, account) | `/u/:username`, `/profil/ubah` |
| — | Error, empty and loading states (pen.dev 12a–12i, 02b/02c): 404 (any unknown URL), 500, missing recipe, empty search, no pantry match, graph load failure, login/sign-up and editor validation, offline banner, placeholder cards while filters load | everywhere |
| F-09.1, F-09.2 | Sign-up, login and logout through Supabase Auth: email/password and **Masuk dengan Google**. Ownership-based edit permissions; CSRF protection | `/daftar`, `/masuk`, `/masuk/google` |
| F-10.1, F-10.2 | All six relationship types supported; labels shown in lists, graph and panels | everywhere |
| Admin (TAB-2) | Archive / restore published recipes, filters, stats, CSV export | `/admin/resep` |
| Extras | Bookmarks, saved pantry ("Dapurku"), servings scaler, "Salin daftar belanja", share | detail, pantry, ingredient pages |

## Deliberately not implemented

These appear in the designs or the SKPL but have no supporting data, scope or design:

- **Reports.** The admin report count, the "Dilaporkan" status and the review queue need a reports table and a reporting UI that were never designed. Recipes publish immediately and admins archive them (decision of 2026-10-12).
- **"Ingat saya" and "Lupa kata sandi?"** There is no designed password-reset flow. Supabase can send reset emails, but no UI or redirect page exists for it yet. Sessions last 30 days.
- **Ingredient storage and availability facts**, and ingredient type tags. They aren't in the data model.
- **Tips box on recipes.** There's no column for it and no editor input.
- **Settings beyond the profile (09b).** Diet and allergy preferences, spice level, units, default servings, notifications, privacy switches, two-step verification, a website field, password change and account deletion have no data or flows behind them. The settings page keeps the public profile, the sign-in email and signing out.
- **Offline cache (12c).** There is no service worker, so the offline banner only says what still works; it doesn't promise saved recipes or a retry countdown.
- **Draft autosave and preview.** Replaced by an explicit "Simpan Draf". The owner can open the draft page to preview it.
- **Admin sections other than Recipes** (Ingredients, Users, Moderation). They aren't designed.
- **SKPL items outside the brief:** AI, recipe import, meal plans, community/messages, semantic search (pgvector).
