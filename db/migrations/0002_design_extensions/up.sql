-- Additive extensions for data the pen.dev designs display that SKPL §4.2.6
-- does not cover. Approved 2026-10-12; rationale in docs/database.md.

-- Public profile: @username handle (sign-up availability check), bio, city.
alter table users
  add column username varchar(30),
  add column bio varchar(280) not null default '',
  add column location varchar(100) not null default '';

update users set username = 'user' || substr(replace(id::text, '-', ''), 1, 12) where username is null;

alter table users
  alter column username set not null,
  add constraint users_username_format check (username ~ '^[a-z0-9_]{3,30}$');

create unique index users_username_unique_idx on users (username);

-- Servings scaler ("Porsi").
alter table recipes
  add column servings integer not null default 2 check (servings between 1 and 50);

-- Ingredient order (drag reorder) and optional section header such as "Bumbu dasar".
alter table recipe_ingredients
  add column position integer not null default 0,
  add column section varchar(50);

create index recipe_ingredients_recipe_position_idx on recipe_ingredients (recipe_id, position);

-- Ingredient detail hero photo.
alter table ingredients
  add column image_url text;

-- Bookmarks ("Simpan").
create table saved_recipes (
  user_id uuid not null references users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index saved_recipes_recipe_id_idx on saved_recipes (recipe_id);

-- Saved pantry ("Dapurku").
create table pantry_items (
  user_id uuid not null references users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);
