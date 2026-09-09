-- Upgrade public.users to a Supabase Auth-backed profile table.
-- This migration intentionally does not delete data or use ON DELETE CASCADE.

begin;

-- Fail before changing anything when the confirmed production assumptions no
-- longer hold. Existing rows must already satisfy the target normalization;
-- this migration never rewrites identity data silently.
do $$
declare
  user_id_type text;
  email_unique_count integer;
begin
  if to_regclass('public.users') is null then
    raise exception 'Required table public.users does not exist';
  end if;

  select format_type(a.atttypid, a.atttypmod)
    into user_id_type
  from pg_catalog.pg_attribute a
  where a.attrelid = 'public.users'::regclass
    and a.attname = 'user_id'
    and a.attnum > 0
    and not a.attisdropped;

  if user_id_type is distinct from 'uuid' then
    raise exception 'public.users.user_id must be uuid before adding the Auth foreign key; found %',
      coalesce(user_id_type, '<missing>');
  end if;

  if exists (
    select 1
    from public.users u
    left join auth.users au on au.id = u.user_id
    where au.id is null
  ) then
    raise exception 'public.users contains user_id values that do not exist in auth.users';
  end if;

  if exists (
    select 1
    from auth.users au
    left join public.users u on u.user_id = au.id
    where u.user_id is null
  ) then
    raise exception 'auth.users contains identities without matching public.users profiles';
  end if;

  if exists (
    select 1
    from public.users
    where email is null
       or email <> lower(btrim(email))
       or email = ''
       or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ) then
    raise exception 'public.users contains email values that violate the target normalization';
  end if;

  if exists (
    select 1
    from public.users
    where name is null
       or name <> btrim(name)
       or name = ''
  ) then
    raise exception 'public.users contains name values that violate the target normalization';
  end if;

  select count(*)
    into email_unique_count
  from pg_catalog.pg_constraint c
  join pg_catalog.pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any (c.conkey)
  where c.conrelid = 'public.users'::regclass
    and c.contype = 'u'
    and cardinality(c.conkey) = 1
    and a.attname = 'email';

  if email_unique_count <> 1 then
    raise exception 'Expected exactly one existing UNIQUE constraint on public.users.email; found %',
      email_unique_count;
  end if;
end
$$;

-- Add the 1:1 Auth relationship. If a FK already exists on user_id, accept it
-- only when it targets auth.users(id) with NO ACTION/RESTRICT semantics.
do $$
declare
  existing_fk record;
begin
  select c.conname, c.confrelid, c.confdeltype, c.confkey
    into existing_fk
  from pg_catalog.pg_constraint c
  join pg_catalog.pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any (c.conkey)
  where c.conrelid = 'public.users'::regclass
    and c.contype = 'f'
    and cardinality(c.conkey) = 1
    and a.attname = 'user_id'
  limit 1;

  if found then
    if existing_fk.confrelid <> 'auth.users'::regclass
       or existing_fk.confdeltype not in ('a', 'r')
       or existing_fk.confkey <> array[
         (select attnum::smallint
          from pg_catalog.pg_attribute
          where attrelid = 'auth.users'::regclass
            and attname = 'id')
       ]::smallint[] then
      raise exception 'Existing foreign key % on public.users.user_id is incompatible',
        existing_fk.conname;
    end if;
  else
    alter table public.users
      add constraint users_user_id_auth_users_fkey
      foreign key (user_id)
      references auth.users (id)
      on delete restrict;
  end if;
end
$$;

-- The legacy timestamp had no zone. Per project convention, any legacy value
-- is interpreted as UTC during conversion. The confirmed table is empty.
alter table public.users
  alter column created_at type timestamptz
    using created_at at time zone 'UTC';

update public.users
set created_at = current_timestamp
where created_at is null;

alter table public.users
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column email set not null,
  alter column name set not null,
  add column updated_at timestamptz not null default now();

alter table public.users
  add constraint users_email_normalized_check
    check (email = lower(btrim(email))),
  add constraint users_email_format_check
    check (
      email <> ''
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    ),
  add constraint users_name_trimmed_check
    check (name = btrim(name)),
  add constraint users_name_not_empty_check
    check (name <> '');

create function public.set_users_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_users_updated_at();

-- Email/password users use the email local-part. OAuth metadata is considered
-- only when the Auth provider is not email, with the same local-part fallback.
create function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text;
  profile_name text;
  auth_provider text;
begin
  normalized_email := lower(btrim(new.email));

  if normalized_email is null
     or normalized_email = ''
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Cannot create public profile without a valid Auth email';
  end if;

  auth_provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');

  if auth_provider <> 'email' then
    profile_name := coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), '')
    );
  end if;

  profile_name := coalesce(
    profile_name,
    nullif(btrim(split_part(normalized_email, '@', 1)), ''),
    'user-' || left(new.id::text, 8)
  );

  insert into public.users (
    user_id,
    phone_number,
    email,
    name,
    created_at,
    updated_at
  ) values (
    new.id,
    null,
    normalized_email,
    profile_name,
    now(),
    now()
  );

  return new;
end;
$$;

create trigger auth_user_create_profile
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

-- Synchronize email without overwriting a user-edited display name.
create function public.handle_auth_user_email_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(btrim(new.email));

  if normalized_email is null
     or normalized_email = ''
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Cannot synchronize an invalid Auth email';
  end if;

  update public.users
  set email = normalized_email
  where user_id = new.id;

  if not found then
    raise exception 'Missing public.users profile for auth.users id %', new.id;
  end if;

  return new;
end;
$$;

create trigger auth_user_sync_email
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_auth_user_email_changed();

-- Trigger functions are invoked by PostgreSQL; clients do not need EXECUTE.
revoke all on function public.set_users_updated_at() from public, anon, authenticated;
revoke all on function public.handle_auth_user_created() from public, anon, authenticated;
revoke all on function public.handle_auth_user_email_changed() from public, anon, authenticated;

alter table public.users enable row level security;

create policy users_select_own_profile
on public.users
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy users_update_own_profile
on public.users
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- RLS limits rows; privileges separately limit writable columns.
revoke all on table public.users from public;
revoke all on table public.users from anon;
revoke insert, delete, truncate, references, trigger on table public.users from authenticated;
revoke update on table public.users from authenticated;
revoke update (user_id, phone_number, email, name, created_at, updated_at)
  on public.users from authenticated;
grant select on table public.users to authenticated;
grant update (name, phone_number) on table public.users to authenticated;

commit;
