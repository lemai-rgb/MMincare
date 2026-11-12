begin;

-- Phase 2.1: per-pet, read-only Caretaker access. Existing migrations remain
-- unchanged; this migration only adds forward policies and least-privilege
-- grants for the invitation flow.
-- Production's legacy enum used PendingInvitation, while the clean baseline
-- already uses Pending. Rename in place to preserve existing row values.
do $$
declare
  has_pending boolean;
  has_legacy_pending boolean;
begin
  select exists (select 1 from pg_enum where enumtypid = 'public.pet_access_status'::regtype and enumlabel = 'Pending'),
         exists (select 1 from pg_enum where enumtypid = 'public.pet_access_status'::regtype and enumlabel = 'PendingInvitation')
  into has_pending, has_legacy_pending;
  if has_pending and has_legacy_pending then
    raise exception 'Ambiguous pet_access_status: both pending labels exist';
  elsif has_legacy_pending then
    alter type public.pet_access_status rename value 'PendingInvitation' to 'Pending';
  elsif not has_pending then
    raise exception 'Unexpected pet_access_status: no pending label';
  end if;
end $$;

-- Legacy production linked an invitation to an existing user instead of an
-- email. Preserve that identity, deriving the email only for existing rows.
alter table public.pet_access
  add column if not exists caretaker_email text,
  add column if not exists activated_at timestamptz,
  add column if not exists revoked_at timestamptz;
alter table public.pet_access alter column caretaker_id drop not null;
update public.pet_access a
set caretaker_email = lower(btrim(u.email))
from public.users u
where a.caretaker_email is null and a.caretaker_id = u.user_id;

do $$ begin
  if exists (
    select 1 from public.pet_access
    where caretaker_email is null or caretaker_email <> lower(btrim(caretaker_email))
      or caretaker_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ) then
    raise exception 'Cannot safely align legacy pet_access: invalid or missing caretaker email';
  end if;
end $$;
alter table public.pet_access alter column caretaker_email set not null;

alter table public.pet_access
  add column if not exists pet_name_snapshot text;

update public.pet_access a
set pet_name_snapshot = p.name
from public.pets p
where a.pet_id = p.pet_id and a.pet_name_snapshot is null;

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
begin
  if old.pet_id is distinct from new.pet_id
    or old.granted_by is distinct from new.granted_by
    or old.caretaker_email is distinct from new.caretaker_email
    or old.valid_until is distinct from new.valid_until
    or old.granted_at is distinct from new.granted_at then
    raise exception 'Pet access identity fields are immutable';
  end if;

  if old.status = 'Pending' and new.status = 'Active' then
    if current_setting('app.pet_access_accepting', true) is distinct from old.access_id::text then
      raise exception 'Pet access invitation must be accepted through the verified flow';
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

create or replace function public.accept_pet_access(p_access_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
  confirmed_at timestamptz;
  accepted_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select lower(btrim(email)), email_confirmed_at
    into actor_email, confirmed_at
  from auth.users
  where id = actor_id;

  if actor_email is null or confirmed_at is null then
    raise exception 'Confirmed email required';
  end if;

  perform set_config('app.pet_access_accepting', p_access_id::text, true);
  update public.pet_access
  set caretaker_id = actor_id,
      status = 'Active',
      activated_at = now()
  where access_id = p_access_id
    and caretaker_email = actor_email
    and status = 'Pending'
    and valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
  returning access_id into accepted_id;

  if accepted_id is null then
    raise exception 'Invitation is unavailable';
  end if;
  return jsonb_build_object('access_id', accepted_id, 'status', 'Active');
end;
$$;

revoke execute on function public.accept_pet_access(uuid) from public, anon;
grant execute on function public.accept_pet_access(uuid) to authenticated;

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

-- Return only the invitation fields a confirmed recipient needs.
create or replace function public.list_pet_invitations()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'access_id', a.access_id,
    'inviter_name', coalesce(nullif(btrim(u.name), ''), 'Chủ thú cưng'),
    'pet_name_snapshot', a.pet_name_snapshot,
    'valid_until', a.valid_until
  ) order by a.valid_until, a.access_id), '[]'::jsonb)
  from auth.users recipient
  join public.pet_access a on a.caretaker_email = lower(btrim(recipient.email))
  left join public.users u on u.user_id = a.granted_by
  where recipient.id = (select auth.uid())
    and recipient.email_confirmed_at is not null
    and a.status = 'Pending'
    and a.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date);
$$;
revoke execute on function public.list_pet_invitations() from public, anon;
grant execute on function public.list_pet_invitations() to authenticated;

create or replace function public.has_active_caretaker_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_access a
    where a.caretaker_id = (select auth.uid())
      and a.status = 'Active'
      and a.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
  );
$$;
revoke execute on function public.has_active_caretaker_access() from public, anon;
grant execute on function public.has_active_caretaker_access() to authenticated;

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

drop policy if exists pets_caretaker_select on public.pets;
drop policy if exists vaccine_records_caretaker_select on public.vaccine_records;
drop policy if exists medical_records_caretaker_select on public.medical_records;

-- This bounded projection is the only Caretaker read path into Owner rows.
-- It checks auth.uid() and active access on every invocation, including RPC
-- calls made directly through the Data API.
create or replace function public.read_shared_pets(p_pet_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'pet_id', p.pet_id, 'name', p.name, 'species', p.species,
    'gender', p.gender, 'breed', p.breed, 'date_of_birth', p.date_of_birth,
    'valid_until', a.valid_until,
    'records', (
      select coalesce(jsonb_agg(r.entry order by r.event_date desc, r.id desc), '[]'::jsonb)
      from (
        select v.vaccine_date as event_date, v.vaccine_record_id as id,
          jsonb_build_object('id', v.vaccine_record_id, 'type', 'vaccine',
            'eventDate', v.vaccine_date, 'title', v.vaccine_name,
            'description', concat_ws(' • ', case when v.dose_number is not null then 'Mũi số ' || v.dose_number end, v.note),
            'clinicName', v.clinic_name, 'doseNumber', v.dose_number) as entry
        from public.vaccine_records v where v.pet_id = p.pet_id
        union all
        select m.visit_date, m.record_id,
          jsonb_build_object('id', m.record_id, 'type', 'medical',
            'eventDate', m.visit_date, 'title', coalesce(nullif(m.diagnosis, ''), 'Lần khám bệnh'),
            'description', concat_ws(' • ', m.symptoms, m.medication, m.note),
            'clinicName', m.clinic_name, 'doseNumber', null)
        from public.medical_records m where m.pet_id = p.pet_id
      ) r
    )
  ) order by p.created_at desc), '[]'::jsonb)
  from public.pet_access a
  join public.pets p on p.pet_id = a.pet_id
  where (select auth.uid()) is not null
    and a.caretaker_id = (select auth.uid())
    and a.status = 'Active'
    and a.valid_until >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date)
    and (p_pet_id is null or p.pet_id = p_pet_id);
$$;
revoke execute on function public.read_shared_pets(uuid) from public, anon;
grant execute on function public.read_shared_pets(uuid) to authenticated;

revoke all on table public.pet_access from public, anon;
revoke insert, update, delete, truncate, references, trigger on table public.pet_access from anon;
grant select, insert on table public.pet_access to authenticated;
revoke update, delete, truncate, references, trigger on table public.pet_access from authenticated;
grant update (status, revoked_at) on table public.pet_access to authenticated;

commit;



