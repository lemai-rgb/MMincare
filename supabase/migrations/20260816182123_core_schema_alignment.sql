-- Incremental alignment for the verified live MMinCare schema.
--
-- Preconditions supplied for this checkpoint:
--   * users, pets, vaccine_records already exist with Owner policies;
--   * the remaining user-data tables exist with RLS enabled but no policies;
--   * vaccine_schedule_rules does not exist;
--   * reminder_status still contains display-only values;
--   * live migration history is empty.
--
-- This migration does not seed clinical vaccine schedules, recreate core
-- tables, add Caretaker access, delete rows, or drop users.password_hash.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Fail atomically if the verified live shape has drifted materially.
do $$
declare
  required_table text;
begin
  foreach required_table in array array[
    'users',
    'pets',
    'vaccine_records',
    'medical_records',
    'medical_attachments',
    'reminders',
    'health_logs',
    'pet_access'
  ]
  loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'Required table public.% is missing', required_table;
    end if;
  end loop;

  if to_regtype('public.pet_species') is null then
    raise exception 'Required enum public.pet_species is missing';
  end if;

  if to_regtype('public.reminder_status') is null then
    raise exception 'Required enum public.reminder_status is missing';
  end if;
end
$$;

-- The verified function is SECURITY DEFINER and must not be a public RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated;
  end if;
end
$$;

-- Add timestamps used by current application queries and the Data Dictionary.
alter table public.pets
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.pets
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now())
where created_at is null or updated_at is null;

alter table public.pets
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.vaccine_records
  add column if not exists created_at timestamptz;

update public.vaccine_records
set created_at = now()
where created_at is null;

alter table public.vaccine_records
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.medical_records
  add column if not exists created_at timestamptz;

update public.medical_records
set created_at = now()
where created_at is null;

alter table public.medical_records
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.reminders
  add column if not exists completed_at timestamptz,
  add column if not exists created_at timestamptz;

update public.reminders
set created_at = now()
where created_at is null;

alter table public.reminders
  alter column created_at set default now(),
  alter column created_at set not null;

-- uploaded_by cannot be truthfully inferred for historical attachments. Abort
-- rather than fabricate audit data; an approved backfill is required if rows
-- already exist without this column/value.
do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid = 'public.medical_attachments'::regclass
      and attname = 'uploaded_by'
      and attnum > 0
      and not attisdropped
  ) then
    if exists (select 1 from public.medical_attachments) then
      raise exception 'medical_attachments contains rows; uploaded_by requires an approved backfill';
    end if;

    alter table public.medical_attachments add column uploaded_by uuid;
  end if;

  if exists (select 1 from public.medical_attachments where uploaded_by is null) then
    raise exception 'medical_attachments.uploaded_by contains NULL; approved backfill required';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.medical_attachments'::regclass
      and conname = 'medical_attachments_uploaded_by_fkey'
  ) then
    alter table public.medical_attachments
      add constraint medical_attachments_uploaded_by_fkey
      foreign key (uploaded_by)
      references public.users (user_id)
      on delete restrict
      not valid;
  end if;
end
$$;

alter table public.medical_attachments
  validate constraint medical_attachments_uploaded_by_fkey;
alter table public.medical_attachments
  alter column uploaded_by set not null;

-- Widen file_size without losing values and align file_type with the target
-- enum. Preflight rejects unknown legacy values before any cast occurs.
do $$
begin
  if exists (
    select 1 from public.medical_attachments
    where file_type::text not in ('jpg', 'jpeg', 'png', 'pdf')
  ) then
    raise exception 'medical_attachments contains unsupported file_type values';
  end if;

  if to_regtype('public.attachment_file_type') is null then
    create type public.attachment_file_type as enum ('jpg', 'jpeg', 'png', 'pdf');
  end if;
end
$$;

alter table public.medical_attachments
  alter column file_size type bigint using file_size::bigint,
  alter column file_type type public.attachment_file_type
    using file_type::text::public.attachment_file_type;

alter table public.medical_attachments
  drop constraint if exists chk_medical_attachments_file_type,
  drop constraint if exists chk_medical_attachments_file_size,
  drop constraint if exists medical_attachments_file_type_check,
  drop constraint if exists medical_attachments_file_size_check;

do $$
begin
  alter table public.medical_attachments
    add constraint medical_attachments_file_type_check
    check (file_type in ('jpg', 'jpeg', 'png', 'pdf'))
    not valid;

  alter table public.medical_attachments
    add constraint medical_attachments_file_size_check
    check (file_size > 0 and file_size <= 5242880)
    not valid;
end
$$;

alter table public.medical_attachments
  validate constraint medical_attachments_file_type_check;
alter table public.medical_attachments
  validate constraint medical_attachments_file_size_check;

-- Create the schedule table without clinical seed data. With RLS enabled and
-- no authenticated policy, current user-scoped lookups safely fall back to
-- suggested_next_due_date = null until an access path and seed are approved.
create table if not exists public.vaccine_schedule_rules (
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

alter table public.vaccine_schedule_rules enable row level security;
revoke all on table public.vaccine_schedule_rules from public, anon, authenticated;

-- Normalize stored Reminder status. Due Soon and Overdue are presentation
-- states derived from due_date; mapping them to Upcoming preserves all source
-- dates and therefore preserves the current business meaning.
do $$
declare
  current_labels text[];
  dependent_status_columns integer;
begin
  select array_agg(enumlabel order by enumsortorder)
  into current_labels
  from pg_catalog.pg_enum
  where enumtypid = 'public.reminder_status'::regtype;

  if current_labels is distinct from array['Upcoming', 'Completed']::text[] then
    select count(*)
    into dependent_status_columns
    from pg_catalog.pg_attribute
    where atttypid = 'public.reminder_status'::regtype
      and attnum > 0
      and not attisdropped
      and not (attrelid = 'public.reminders'::regclass and attname = 'status');

    if dependent_status_columns <> 0 then
      raise exception 'reminder_status has unexpected dependent table columns';
    end if;

    if to_regtype('public.reminder_status_core') is not null then
      raise exception 'Temporary enum public.reminder_status_core already exists';
    end if;

    -- Policies are catalog dependencies of the referenced column. The
    -- current audited policy is recreated below after the enum replacement;
    -- drop it before ALTER COLUMN TYPE so a schema dump containing the policy
    -- can be replayed safely as well as an older live schema without it.
    drop policy if exists reminders_owner_update on public.reminders;

    alter table public.reminders alter column status drop default;
    create type public.reminder_status_core as enum ('Upcoming', 'Completed');

    alter table public.reminders
      alter column status type public.reminder_status_core
      using (
        case
          when status::text = 'Completed' then 'Completed'
          else 'Upcoming'
        end
      )::public.reminder_status_core;

    drop type public.reminder_status;
    alter type public.reminder_status_core rename to reminder_status;
  end if;
end
$$;

alter table public.reminders
  alter column status set default 'Upcoming'::public.reminder_status;

-- Target indexes, including foreign-key and RLS lookup paths.
create index if not exists pets_owner_created_at_idx
  on public.pets (owner_id, created_at desc);
create index if not exists vaccine_schedule_rules_lookup_idx
  on public.vaccine_schedule_rules (species, lower(vaccine_name), is_active);
create index if not exists vaccine_records_pet_date_idx
  on public.vaccine_records (pet_id, vaccine_date desc);
create index if not exists vaccine_records_created_by_idx
  on public.vaccine_records (created_by);
create index if not exists medical_records_pet_visit_date_idx
  on public.medical_records (pet_id, visit_date desc);
create index if not exists medical_records_created_by_idx
  on public.medical_records (created_by);
create index if not exists medical_attachments_record_id_idx
  on public.medical_attachments (record_id);
create index if not exists medical_attachments_uploaded_by_idx
  on public.medical_attachments (uploaded_by);
create index if not exists reminders_user_due_status_idx
  on public.reminders (user_id, due_date, status);
create index if not exists reminders_pet_due_date_idx
  on public.reminders (pet_id, due_date);
create index if not exists reminders_source_vaccine_record_id_idx
  on public.reminders (source_vaccine_record_id);

-- Updated-at handling for the two target tables updated in this checkpoint.
create or replace function public.set_core_updated_at()
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

revoke execute on function public.set_core_updated_at() from public, anon, authenticated;

drop trigger if exists pets_set_core_updated_at on public.pets;
create trigger pets_set_core_updated_at
before update on public.pets
for each row execute function public.set_core_updated_at();

drop trigger if exists vaccine_schedule_rules_set_core_updated_at
  on public.vaccine_schedule_rules;
create trigger vaccine_schedule_rules_set_core_updated_at
before update on public.vaccine_schedule_rules
for each row execute function public.set_core_updated_at();

-- RLS is reasserted even though the verified live tables already have it.
alter table public.medical_records enable row level security;
alter table public.medical_attachments enable row level security;
alter table public.reminders enable row level security;
alter table public.health_logs enable row level security;
alter table public.pet_access enable row level security;

drop policy if exists medical_records_owner_select on public.medical_records;
create policy medical_records_owner_select
on public.medical_records
for select
to authenticated
using (exists (
  select 1
  from public.pets
  where pets.pet_id = medical_records.pet_id
    and pets.owner_id = (select auth.uid())
));

drop policy if exists medical_records_owner_insert on public.medical_records;
create policy medical_records_owner_insert
on public.medical_records
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = medical_records.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists medical_attachments_owner_select on public.medical_attachments;
create policy medical_attachments_owner_select
on public.medical_attachments
for select
to authenticated
using (exists (
  select 1
  from public.medical_records
  join public.pets on pets.pet_id = medical_records.pet_id
  where medical_records.record_id = medical_attachments.record_id
    and pets.owner_id = (select auth.uid())
));

drop policy if exists medical_attachments_owner_insert on public.medical_attachments;
create policy medical_attachments_owner_insert
on public.medical_attachments
for insert
to authenticated
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

drop policy if exists reminders_owner_select on public.reminders;
create policy reminders_owner_select
on public.reminders
for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists reminders_owner_insert on public.reminders;
create policy reminders_owner_insert
on public.reminders
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
  and (
    source_vaccine_record_id is null
    or exists (
      select 1
      from public.vaccine_records
      where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
        and vaccine_records.pet_id = reminders.pet_id
    )
  )
);

drop policy if exists reminders_owner_update on public.reminders;
create policy reminders_owner_update
on public.reminders
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
  and (
    source_vaccine_record_id is null
    or exists (
      select 1
      from public.vaccine_records
      where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
        and vaccine_records.pet_id = reminders.pet_id
    )
  )
);

-- Explicit least-privilege grants. No DELETE is granted in this checkpoint.
revoke all on table public.medical_records from public, anon;
revoke update, delete, truncate, references, trigger
  on table public.medical_records from authenticated;
grant select, insert on table public.medical_records to authenticated;

revoke all on table public.medical_attachments from public, anon;
revoke update, delete, truncate, references, trigger
  on table public.medical_attachments from authenticated;
grant select, insert on table public.medical_attachments to authenticated;

revoke all on table public.reminders from public, anon;
revoke delete, truncate, references, trigger
  on table public.reminders from authenticated;
grant select, insert, update on table public.reminders to authenticated;

-- Phase 2 remains deny-all. No Caretaker policies are added.
revoke all on table public.health_logs from public, anon, authenticated;
revoke all on table public.pet_access from public, anon, authenticated;

commit;
