begin;

alter table public.medical_records enable row level security;

grant select, insert on table public.medical_records to authenticated;

drop policy if exists medical_records_owner_select on public.medical_records;
create policy medical_records_owner_select
on public.medical_records
for select
to authenticated
using (
  medical_records.created_by = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = medical_records.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists medical_records_owner_insert on public.medical_records;
create policy medical_records_owner_insert
on public.medical_records
for insert
to authenticated
with check (
  medical_records.created_by = (select auth.uid())
  and exists (
    select 1
    from public.pets
    where pets.pet_id = medical_records.pet_id
      and pets.owner_id = (select auth.uid())
  )
);

commit;
