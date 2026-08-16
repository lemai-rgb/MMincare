-- MMinCare target schema — PostgreSQL / Supabase
-- Source of truth: Data Dictionary 2.0, Business Rules, and API Documentation.
-- This file describes the desired end state. Apply incremental migrations in
-- supabase/migrations to existing environments; do not run this baseline over
-- an existing database.

create extension if not exists pgcrypto;

create type public.pet_species as enum ('Dog', 'Cat');
create type public.pet_gender as enum ('Male', 'Female', 'Unknown');
create type public.reminder_type as enum ('Vaccine', 'Recheck', 'Medication', 'Other');
create type public.reminder_status as enum ('Upcoming', 'Completed');
create type public.attachment_file_type as enum ('jpg', 'jpeg', 'png', 'pdf');
create type public.pet_access_status as enum ('Pending', 'Active', 'Revoked');

create table public.users (
  user_id uuid primary key references auth.users (id) on delete restrict,
  email text not null unique,
  name text not null,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_normalized_check check (email = lower(btrim(email))),
  constraint users_email_format_check check (
    email <> '' and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  constraint users_name_not_empty_check check (length(btrim(name)) > 0)
);

create table public.pets (
  pet_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (user_id) on delete restrict,
  name text not null,
  species public.pet_species not null,
  gender public.pet_gender not null,
  breed text,
  date_of_birth date,
  picture_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pets_name_not_empty_check check (length(btrim(name)) > 0),
  constraint pets_date_of_birth_not_future_check check (
    date_of_birth is null or date_of_birth <= current_date
  )
);

create table public.vaccine_schedule_rules (
  schedule_rule_id uuid primary key default gen_random_uuid(),
  species public.pet_species not null,
  vaccine_name text not null,
  min_age_days integer not null,
  max_age_days integer,
  standard_interval_days integer not null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vaccine_schedule_rules_name_not_empty_check
    check (length(btrim(vaccine_name)) > 0),
  constraint vaccine_schedule_rules_min_age_check check (min_age_days >= 0),
  constraint vaccine_schedule_rules_max_age_check check (
    max_age_days is null or max_age_days >= min_age_days
  ),
  constraint vaccine_schedule_rules_interval_check check (standard_interval_days > 0)
);

create table public.vaccine_records (
  vaccine_record_id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (pet_id) on delete restrict,
  created_by uuid not null references public.users (user_id) on delete restrict,
  vaccine_name text not null,
  vaccine_date date not null,
  dose_number integer,
  clinic_name text,
  note text,
  created_at timestamptz not null default now(),
  constraint vaccine_records_name_not_empty_check check (length(btrim(vaccine_name)) > 0),
  constraint vaccine_records_dose_number_check check (dose_number is null or dose_number > 0)
);

create table public.medical_records (
  record_id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (pet_id) on delete restrict,
  created_by uuid not null references public.users (user_id) on delete restrict,
  visit_date date not null,
  diagnosis text,
  symptoms text,
  medication text,
  clinic_name text,
  note text,
  created_at timestamptz not null default now()
);

create table public.medical_attachments (
  attachment_id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.medical_records (record_id) on delete restrict,
  uploaded_by uuid not null references public.users (user_id) on delete restrict,
  file_url text not null,
  file_type public.attachment_file_type not null,
  file_size bigint not null,
  uploaded_at timestamptz not null default now(),
  constraint medical_attachments_file_url_not_empty_check check (length(btrim(file_url)) > 0),
  constraint medical_attachments_file_size_check check (
    file_size > 0 and file_size <= 5242880
  )
);

create table public.reminders (
  reminder_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (user_id) on delete restrict,
  pet_id uuid not null references public.pets (pet_id) on delete restrict,
  source_vaccine_record_id uuid references public.vaccine_records (vaccine_record_id) on delete restrict,
  due_date date not null,
  type public.reminder_type not null,
  status public.reminder_status not null default 'Upcoming',
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.health_logs (
  health_log_id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (pet_id) on delete restrict,
  created_by uuid not null references public.users (user_id) on delete restrict,
  weight numeric(6, 2),
  food_amount text,
  food_type text,
  status text,
  note text,
  logged_at timestamptz not null default now(),
  constraint health_logs_weight_positive_check check (weight is null or weight > 0),
  constraint health_logs_at_least_one_field_check check (
    weight is not null
    or nullif(btrim(food_amount), '') is not null
    or nullif(btrim(food_type), '') is not null
    or nullif(btrim(status), '') is not null
    or nullif(btrim(note), '') is not null
  )
);

create table public.pet_access (
  access_id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (pet_id) on delete restrict,
  granted_by uuid not null references public.users (user_id) on delete restrict,
  caretaker_email text not null,
  caretaker_id uuid references public.users (user_id) on delete restrict,
  valid_until date not null,
  status public.pet_access_status not null,
  granted_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  constraint pet_access_email_normalized_check
    check (caretaker_email = lower(btrim(caretaker_email))),
  constraint pet_access_email_format_check check (
    caretaker_email <> ''
    and caretaker_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  constraint pet_access_not_self_check check (
    caretaker_id is null or granted_by <> caretaker_id
  ),
  constraint pet_access_valid_until_check check (
    valid_until >= granted_at::date
  )
);

create index pets_owner_created_at_idx
  on public.pets (owner_id, created_at desc);
create index vaccine_schedule_rules_lookup_idx
  on public.vaccine_schedule_rules (species, lower(vaccine_name), is_active);
create index vaccine_records_pet_date_idx
  on public.vaccine_records (pet_id, vaccine_date desc);
create index vaccine_records_created_by_idx
  on public.vaccine_records (created_by);
create index medical_records_pet_visit_date_idx
  on public.medical_records (pet_id, visit_date desc);
create index medical_records_created_by_idx
  on public.medical_records (created_by);
create index medical_attachments_record_id_idx
  on public.medical_attachments (record_id);
create index medical_attachments_uploaded_by_idx
  on public.medical_attachments (uploaded_by);
create index reminders_user_due_status_idx
  on public.reminders (user_id, due_date, status);
create index reminders_pet_due_date_idx
  on public.reminders (pet_id, due_date);
create index reminders_source_vaccine_record_id_idx
  on public.reminders (source_vaccine_record_id);
create index health_logs_pet_logged_at_idx
  on public.health_logs (pet_id, logged_at desc);
create index health_logs_created_by_idx
  on public.health_logs (created_by);
create index pet_access_caretaker_status_valid_until_idx
  on public.pet_access (caretaker_id, status, valid_until);
create index pet_access_pet_status_idx
  on public.pet_access (pet_id, status);
create index pet_access_granted_by_idx
  on public.pet_access (granted_by);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

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

  insert into public.users (user_id, email, name, created_at, updated_at)
  values (new.id, normalized_email, profile_name, now(), now());

  return new;
end;
$$;

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

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger pets_set_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

create trigger vaccine_schedule_rules_set_updated_at
before update on public.vaccine_schedule_rules
for each row execute function public.set_updated_at();

create trigger auth_user_create_profile
after insert on auth.users
for each row execute function public.handle_auth_user_created();

create trigger auth_user_sync_email
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_auth_user_email_changed();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_created() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_email_changed() from public, anon, authenticated;

alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.vaccine_schedule_rules enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.medical_records enable row level security;
alter table public.medical_attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.health_logs enable row level security;
alter table public.pet_access enable row level security;

create policy users_owner_select on public.users
for select to authenticated
using ((select auth.uid()) = user_id);

create policy users_owner_update on public.users
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy pets_owner_select on public.pets
for select to authenticated
using ((select auth.uid()) = owner_id);

create policy pets_owner_insert on public.pets
for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy pets_owner_update on public.pets
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy vaccine_records_owner_select on public.vaccine_records
for select to authenticated
using (exists (
  select 1 from public.pets
  where pets.pet_id = vaccine_records.pet_id
    and pets.owner_id = (select auth.uid())
));

create policy vaccine_records_owner_insert on public.vaccine_records
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = vaccine_records.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

create policy medical_records_owner_select on public.medical_records
for select to authenticated
using (exists (
  select 1 from public.pets
  where pets.pet_id = medical_records.pet_id
    and pets.owner_id = (select auth.uid())
));

create policy medical_records_owner_insert on public.medical_records
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = medical_records.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

create policy medical_attachments_owner_select on public.medical_attachments
for select to authenticated
using (exists (
  select 1
  from public.medical_records
  join public.pets on pets.pet_id = medical_records.pet_id
  where medical_records.record_id = medical_attachments.record_id
    and pets.owner_id = (select auth.uid())
));

create policy medical_attachments_owner_insert on public.medical_attachments
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.medical_records
    join public.pets on pets.pet_id = medical_records.pet_id
    where medical_records.record_id = medical_attachments.record_id
      and pets.owner_id = (select auth.uid())
  )
);

create policy reminders_owner_select on public.reminders
for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

create policy reminders_owner_insert on public.reminders
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
  and (
    source_vaccine_record_id is null
    or exists (
      select 1 from public.vaccine_records
      where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
        and vaccine_records.pet_id = reminders.pet_id
    )
  )
);

create policy reminders_owner_update on public.reminders
for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
  and (
    source_vaccine_record_id is null
    or exists (
      select 1 from public.vaccine_records
      where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
        and vaccine_records.pet_id = reminders.pet_id
    )
  )
);

-- No policies are intentionally defined for vaccine_schedule_rules,
-- health_logs, or pet_access in this checkpoint. RLS therefore denies all
-- requests made through anon/authenticated roles.
revoke all on table public.vaccine_schedule_rules from public, anon, authenticated;
revoke all on table public.health_logs from public, anon, authenticated;
revoke all on table public.pet_access from public, anon, authenticated;

revoke all on table public.users from public, anon;
revoke all on table public.pets from public, anon;
revoke all on table public.vaccine_records from public, anon;
revoke all on table public.medical_records from public, anon;
revoke all on table public.medical_attachments from public, anon;
revoke all on table public.reminders from public, anon;

grant select on table public.users to authenticated;
grant update (name, phone_number) on table public.users to authenticated;
grant select, insert, update on table public.pets to authenticated;
grant select, insert on table public.vaccine_records to authenticated;
grant select, insert on table public.medical_records to authenticated;
grant select, insert on table public.medical_attachments to authenticated;
grant select, insert, update on table public.reminders to authenticated;
