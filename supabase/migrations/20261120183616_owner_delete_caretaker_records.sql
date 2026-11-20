begin;
-- Ownership of the Pet, rather than record authorship, grants deletion.
-- SELECT is already owner-scoped in the Phase 2.2 migration. No Caretaker
-- SELECT/DELETE policy or UPDATE grant is added.
drop policy if exists medical_records_owner_delete on public.medical_records;
create policy medical_records_owner_delete
  on public.medical_records for delete to authenticated
  using (exists (
    select 1 from public.pets p
    where p.pet_id = medical_records.pet_id
      and p.owner_id = (select auth.uid())
  ));
commit;
