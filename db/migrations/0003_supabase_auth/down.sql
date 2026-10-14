-- Restores the column shape only; password hashes cannot be recovered.
alter table users add column password varchar(255) not null default '';
alter table users alter column password drop default;
drop index if exists users_auth_user_id_unique_idx;
alter table users drop column if exists auth_user_id;
