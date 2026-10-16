-- Onboarding preferences (pen.dev 15a–15c). Approved 2026-10-16; rationale in docs/database.md.
-- Both tables only reference existing rows: favourite cuisines are existing categories and
-- "Hindari bahan ini" is a list of existing ingredients. The pantry step reuses pantry_items.

create table user_favorite_categories (
  user_id uuid not null references users(id) on delete cascade,
  category_id integer not null references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table user_avoided_ingredients (
  user_id uuid not null references users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);
