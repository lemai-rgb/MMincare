begin;

alter table public.reminders enable row level security;

grant select, insert on table public.reminders to authenticated;

drop policy if exists reminders_owner_select on public.reminders;
create policy reminders_owner_select
on public.reminders
for select
to authenticated
using (
  reminders.user_id = (select auth.uid())
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
  reminders.user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
  and (
    reminders.source_vaccine_record_id is null
    or exists (
      select 1
      from public.vaccine_records
      where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
        and vaccine_records.pet_id = reminders.pet_id
    )
  )
);

commit;
