drop table if exists pantry_items;
drop table if exists saved_recipes;
alter table ingredients drop column if exists image_url;
drop index if exists recipe_ingredients_recipe_position_idx;
alter table recipe_ingredients drop column if exists section, drop column if exists position;
alter table recipes drop column if exists servings;
drop index if exists users_username_unique_idx;
alter table users
  drop constraint if exists users_username_format,
  drop column if exists location,
  drop column if exists bio,
  drop column if exists username;
