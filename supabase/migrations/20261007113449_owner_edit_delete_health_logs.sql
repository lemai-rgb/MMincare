-- Health Log edit/delete is an Owner-only capability.  This forward migration
-- deliberately leaves the immutable identity and creation fields read-only.
begin;

alter table public.health_logs enable row level security;

drop policy if exists health_logs_owner_update on public.health_logs;
create policy health_logs_owner_update
on public.health_logs
for update to authenticated
using (
  exists (
    select 1
    from public.pets
    where pets.pet_id = health_logs.pet_id
      and pets.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.pets
    where pets.pet_id = health_logs.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists health_logs_owner_delete on public.health_logs;
create policy health_logs_owner_delete
on public.health_logs
for delete to authenticated
using (
  exists (
    select 1
    from public.pets
    where pets.pet_id = health_logs.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

revoke update, delete, truncate, references, trigger, maintain
  on table public.health_logs
  from public, anon, authenticated;

grant update (recorded_on, weight, food_amount, food_type, status, note)
  on table public.health_logs to authenticated;
grant delete on table public.health_logs to authenticated;

commit;
