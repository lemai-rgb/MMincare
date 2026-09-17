begin;

-- Align the live numeric precision with the target Data Dictionary. The
-- current live numeric(5,2) is widened to numeric(6,2); existing values are
-- preserved and no business-date columns are touched.
alter table public.health_logs
  alter column weight type numeric(6, 2)
  using weight::numeric(6, 2);

-- These explicit constraint names were audited in both the local target and
-- the live database. Recreate only the Health Log checks so the migration is
-- idempotent across the known states without touching other constraints.
alter table public.health_logs
  drop constraint if exists health_logs_weight_positive_check,
  drop constraint if exists health_logs_at_least_one_field_check,
  drop constraint if exists chk_health_logs_at_least_one_field;

alter table public.health_logs
  add constraint health_logs_weight_positive_check
    check (weight is null or weight > 0),
  add constraint health_logs_at_least_one_field_check
    check (
      weight is not null
      or nullif(btrim(food_amount), '') is not null
      or nullif(btrim(food_type), '') is not null
      or nullif(btrim(status), '') is not null
      or nullif(btrim(note), '') is not null
    );

create index if not exists health_logs_pet_logged_at_idx
  on public.health_logs (pet_id, logged_at desc);

alter table public.health_logs enable row level security;

-- The live audit found no legacy Health Log policies. These drops make only
-- the canonical policy names idempotent; no unknown policy is removed.
drop policy if exists health_logs_owner_select on public.health_logs;
create policy health_logs_owner_select
on public.health_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.pets
    where pets.pet_id = health_logs.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists health_logs_owner_insert on public.health_logs;
create policy health_logs_owner_insert
on public.health_logs
for insert
to authenticated
with check (
  health_logs.created_by = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = health_logs.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

-- Least privilege for the exposed table. No PUBLIC, anon, service_role,
-- UPDATE, DELETE, TRUNCATE, REFERENCES or TRIGGER grant is added here.
revoke all on table public.health_logs from public;
revoke all on table public.health_logs from anon;
revoke all on table public.health_logs from authenticated;
grant select, insert on table public.health_logs to authenticated;

commit;
