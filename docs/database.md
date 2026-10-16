# Database

PostgreSQL is the source of truth for recipes, ingredients, explicit relationships, lineage, ownership and user collections (SKPL-NF-04.1). The schema is defined only by the SQL migrations in `db/migrations/`. Run them as an explicit step (`npm run db:migrate`); the app does not migrate on boot (SKPL-NF-05.2).

| Migration | Contents |
| --- | --- |
| `0001_skpl_core` | Tables and relationships from SKPL-IFPAGI01 §4.2.5–4.2.6 (TAB-5, TAB-6) |
| `0002_design_extensions` | Additive columns and tables the pen.dev designs need, approved 2026-10-12 |
| `0003_supabase_auth` | Credentials move to Supabase Auth: adds `users.auth_user_id`, drops `users.password` (approved 2026-10-13) |

## Core tables (SKPL)

| Table | Purpose | Notes |
| --- | --- | --- |
| `users` | Registered users: profile and ownership | `email` unique; `auth_user_id` links to the Supabase Auth user. The SKPL `password` column was removed in `0003`, because Supabase holds the credentials |
| `roles`, `user_roles` | Roles, M:N with users | Seeded roles: `member`, `admin` |
| `recipes` | Recipes and variations | `steps` is a JSONB array of `{ text, title?, minutes? }`; `change_summary` is required for variations (SKPL-F-07.3); `status` is `draft`, `published` or `archived` |
| `ingredients` | Ingredient master list | Name unique case-insensitively |
| `recipe_ingredients` | Recipe ↔ ingredient with `quantity`, `unit`, `note` | This is the stored **uses** relationship |
| `categories`, `recipe_categories` | Categories, M:N with recipes | A recipe usually has a main category and a dish type, shown joined: "Nasi · Hidangan Utama" |
| `node_relations` | Explicit typed relationships between graph nodes | See below |

### `node_relations`

The endpoints are polymorphic (`recipe` or `ingredient`), so integrity is enforced in the database rather than by foreign keys:

- A check constraint fixes which endpoint types each relation type allows:

  | Relation type | Allowed endpoints |
  | --- | --- |
  | `variation_of`, `similar_to`, `inspired_by` | recipe → recipe |
  | `substitute_for` | ingredient → ingredient |
  | `uses` | recipe → ingredient |
  | `pairs_with` | same type on both ends |

- A trigger rejects endpoints that don't exist.
- Cleanup triggers delete a node's relations when the recipe or ingredient is deleted.
- A partial unique index gives each variation exactly one `variation_of` source (SKPL-F-07.2).
- Self-relations and duplicate relations are rejected.

| Type | Direction | Meaning |
| --- | --- | --- |
| `variation_of` | variation → source | Lineage, written when a variation is published |
| `similar_to` | recipe → recipe | Curated similarity; `label` holds the reason |
| `inspired_by` | recipe → source | Inspiration |
| `pairs_with` | recipe ↔ recipe, ingredient ↔ ingredient | Serving or flavour pairing |
| `substitute_for` | original → substitute | `label` holds function and amount, e.g. "Orak-arik, isian · 60 g tahu" |
| `uses` | recipe → ingredient | Reserved by SKPL-F-10.1. Not written to this table; `recipe_ingredients` already stores it |

No relationship is ever created from similarity scores or embeddings (SKPL §2.4.4). The only derived links are "Kategori sama" in the graph and "Sering dipadukan" on ingredient pages. Both are computed from stored rows at read time and labelled as such.

## Design extensions (`0002`)

| Change | Why |
| --- | --- |
| `users.username` (unique, `^[a-z0-9_]{3,30}$`), `bio`, `location` | Profile handle with an availability check at sign-up, bio and city shown in the designs (SKPL-F-08.2) |
| `recipes.servings` | "Porsi" field and the servings scaler |
| `recipe_ingredients.position`, `section` | Ingredient order, and groups such as "Bahan utama" / "Bumbu dasar" |
| `ingredients.image_url` | Ingredient page hero photo |
| `saved_recipes(user_id, recipe_id)` | Bookmarks ("Simpan") |
| `pantry_items(user_id, ingredient_id)` | Saved pantry ("Dapurku") |

## Authentication link (`0003`)

`users.auth_user_id` (unique, nullable) stores the Supabase `auth.users.id`. A Supabase identity maps to a local user in this order:

1. By `auth_user_id`.
2. By a **verified** email on an unlinked row, which is then linked. This covers seeded users and accounts created before the link.
3. Otherwise a new local user is created with a generated username, as happens for a first Google sign-in.

An email already linked to a different identity is refused.

## Onboarding preferences (`0004`)

| Table | Why |
| --- | --- |
| `user_favorite_categories(user_id, category_id)` | Onboarding step 1 (pen.dev 15a): favourite kinds of dishes. The design shows regional cuisines, but recipes have no region data, so the step offers existing categories |
| `user_avoided_ingredients(user_id, ingredient_id)` | Onboarding step 3 (15c): ingredients to avoid. The design's diet options (halal, vegetarian) are left out because no recipe data supports them |

Step 2 (15b) saves to `pantry_items`. The home page's "Untukmu" tab ranks published recipes by how many favourite categories they belong to and leaves out every recipe whose `recipe_ingredients` include an avoided ingredient. Nothing is inferred beyond those stored rows.

## Status lifecycle

- `draft` → `published`: the author publishes. Drafts are visible only to their author.
- `published` ↔ `archived`: an admin moderates. Archived recipes leave search, the graph and public pages.
- Admin moderation never changes drafts.

## Commands

```sh
npm run db:migrate   # apply pending migrations
npm run db:status    # show applied/pending migrations
npm run db:seed      # load db/seed.sql (truncates first; development only)
npm run db:reset     # wipe, migrate and seed the development database
```

Tests use a separate database whose name must end in `_test`. `test/setup.ts` rebuilds it from the migrations and seed before every run.
