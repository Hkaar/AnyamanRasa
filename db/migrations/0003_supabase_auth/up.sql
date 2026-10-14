-- Authentication moves to Supabase Auth (email/password + Google), approved 2026-10-13.
-- Local users keep profile and ownership data and link to their Supabase identity;
-- credentials are no longer stored in this database.

alter table users add column auth_user_id uuid;
create unique index users_auth_user_id_unique_idx on users (auth_user_id);

alter table users drop column password;
