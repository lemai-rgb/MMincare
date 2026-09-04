begin;

alter table public.reminders
  add column if not exists completed_at timestamptz;

alter table public.reminders enable row level security;

revoke update on table public.reminders from authenticated;
grant update (status, completed_at) on table public.reminders to authenticated;

drop policy if exists reminders_owner_update on public.reminders;
create policy reminders_owner_update
on public.reminders
for update
to authenticated
using (
  reminders.user_id = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = reminders.pet_id
      and pets.owner_id = (select auth.uid())
  )
)
with check (
  reminders.user_id = (select auth.uid())
  and reminders.status = 'Completed'
  and reminders.completed_at is not null
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
