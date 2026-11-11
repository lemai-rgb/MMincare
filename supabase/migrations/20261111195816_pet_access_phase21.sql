begin;

-- Phase 2.1: per-pet, read-only Caretaker access. Existing migrations remain
-- unchanged; this migration only adds forward policies and least-privilege
-- grants for the invitation flow.
alter table public.pet_access
  add column if not exists pet_name_snapshot text;

alter table public.pet_access
  drop constraint if exists pet_access_pet_name_snapshot_check;
alter table public.pet_access
  add constraint pet_access_pet_name_snapshot_check
  check (pet_name_snapshot is null or length(btrim(pet_name_snapshot)) > 0);

create unique index if not exists pet_access_pending_active_uidx
  on public.pet_access (pet_id, caretaker_email)
  where status in ('Pending', 'Active');

create or replace function public.guard_pet_access_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text := lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')));
  today_vietnam date := ((now() at time zone 'Asia/Ho_Chi_Minh')::date);
begin
  if old.pet_id is distinct from new.pet_id
    or old.granted_by is distinct from new.granted_by
    or old.caretaker_email is distinct from new.caretaker_email
    or old.valid_until is distinct from new.valid_until
    or old.granted_at is distinct from new.granted_at then
    raise exception 'Pet access identity fields are immutable';
  end if;

  if old.status = 'Pending' and new.status = 'Active' then
    if actor_id is null
      or actor_id is distinct from new.caretaker_id
      or actor_email <> old.caretaker_email
      or old.valid_until < today_vietnam
      or new.activated_at is null then
      raise exception 'Pet access invitation cannot be accepted by this session';
    end if;
  elsif old.status in ('Pending', 'Active') and new.status = 'Revoked' then
    if actor_id is null or actor_id is distinct from old.granted_by
      or new.caretaker_id is distinct from old.caretaker_id
      or new.revoked_at is null then
      raise exception 'Only the granting owner can revoke pet access';
    end if;
  elsif old.status is distinct from new.status
    or old.caretaker_id is distinct from new.caretaker_id
    or old.activated_at is distinct from new.activated_at
    or old.revoked_at is distinct from new.revoked_at then
    raise exception 'Unsupported pet access state transition';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_pet_access_update() from public, anon, authenticated;

drop trigger if exists pet_access_guard_update on public.pet_access;
create trigger pet_access_guard_update
before update on public.pet_access
for each row execute function public.guard_pet_access_update();

alter table public.pets enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.medical_records enable row level security;
alter table public.pet_access enable row level security;

drop policy if exists pet_access_owner_select on public.pet_access;
create policy pet_access_owner_select
on public.pet_access
for select to authenticated
using (granted_by = (select auth.uid()));

drop policy if exists pet_access_caretaker_select on public.pet_access;
create policy pet_access_caretaker_select
on public.pet_access
for select to authenticated
using (
  caretaker_email = lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')))
  and status in ('Pending', 'Active')
  and valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
);

drop policy if exists pet_access_owner_insert on public.pet_access;
create policy pet_access_owner_insert
on public.pet_access
for insert to authenticated
with check (
  granted_by = (select auth.uid())
  and caretaker_id is null
  and status = 'Pending'
  and valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
  and caretaker_email <> lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')))
  and exists (
    select 1 from public.pets
    where pets.pet_id = pet_access.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists pet_access_owner_update on public.pet_access;
create policy pet_access_owner_update
on public.pet_access
for update to authenticated
using (
  granted_by = (select auth.uid())
  and status in ('Pending', 'Active')
)
with check (
  granted_by = (select auth.uid())
  and status = 'Revoked'
  and revoked_at is not null
);

drop policy if exists pet_access_caretaker_update on public.pet_access;
create policy pet_access_caretaker_update
on public.pet_access
for update to authenticated
using (
  caretaker_email = lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')))
  and status = 'Pending'
  and valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
)
with check (
  caretaker_id = (select auth.uid())
  and status = 'Active'
  and activated_at is not null
);

drop policy if exists pets_caretaker_select on public.pets;
create policy pets_caretaker_select
on public.pets
for select to authenticated
using (exists (
  select 1 from public.pet_access
  where pet_access.pet_id = pets.pet_id
    and pet_access.caretaker_id = (select auth.uid())
    and pet_access.status = 'Active'
    and pet_access.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
));

drop policy if exists vaccine_records_caretaker_select on public.vaccine_records;
create policy vaccine_records_caretaker_select
on public.vaccine_records
for select to authenticated
using (exists (
  select 1 from public.pet_access
  where pet_access.pet_id = vaccine_records.pet_id
    and pet_access.caretaker_id = (select auth.uid())
    and pet_access.status = 'Active'
    and pet_access.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
));

drop policy if exists medical_records_caretaker_select on public.medical_records;
create policy medical_records_caretaker_select
on public.medical_records
for select to authenticated
using (exists (
  select 1 from public.pet_access
  where pet_access.pet_id = medical_records.pet_id
    and pet_access.caretaker_id = (select auth.uid())
    and pet_access.status = 'Active'
    and pet_access.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
));

revoke all on table public.pet_access from public, anon;
revoke insert, update, delete, truncate, references, trigger on table public.pet_access from anon;
grant select, insert on table public.pet_access to authenticated;
revoke update, delete, truncate, references, trigger on table public.pet_access from authenticated;
grant update (status, caretaker_id, activated_at, revoked_at) on table public.pet_access to authenticated;

commit;

