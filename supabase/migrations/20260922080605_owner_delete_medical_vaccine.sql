begin;

-- Owner-only delete support for vaccine and medical records. The constraint
-- names below were read from the live catalog before this migration was made.
alter table public.medical_attachments
  drop constraint medical_attachments_record_id_fkey;
alter table public.medical_attachments
  add constraint medical_attachments_record_id_fkey
  foreign key (record_id)
  references public.medical_records (record_id)
  on delete cascade;

alter table public.reminders
  drop constraint reminders_source_vaccine_record_id_fkey;
alter table public.reminders
  add constraint reminders_source_vaccine_record_id_fkey
  foreign key (source_vaccine_record_id)
  references public.vaccine_records (vaccine_record_id)
  on delete set null;

alter table public.reminders
  drop constraint reminders_source_medical_record_id_fkey;
alter table public.reminders
  add constraint reminders_source_medical_record_id_fkey
  foreign key (source_medical_record_id)
  references public.medical_records (record_id)
  on delete set null;

revoke all on table public.vaccine_records from public, anon;
revoke all on table public.medical_records from public, anon;
revoke all on table public.medical_attachments from public, anon;

grant select, insert, delete on table public.vaccine_records to authenticated;
grant select, insert, delete on table public.medical_records to authenticated;
grant select, insert on table public.medical_attachments to authenticated;

revoke update, truncate, references, trigger on table public.vaccine_records from authenticated;
revoke update, truncate, references, trigger on table public.medical_records from authenticated;
revoke update, delete, truncate, references, trigger on table public.medical_attachments from authenticated;

drop policy if exists vaccine_records_owner_delete on public.vaccine_records;
create policy vaccine_records_owner_delete
  on public.vaccine_records
  for delete to authenticated
  using (exists (
    select 1
    from public.pets p
    where p.pet_id = vaccine_records.pet_id
      and p.owner_id = (select auth.uid())
  ));

drop policy if exists medical_records_owner_delete on public.medical_records;
create policy medical_records_owner_delete
  on public.medical_records
  for delete to authenticated
  using (
    medical_records.created_by = (select auth.uid())
    and exists (
      select 1
      from public.pets p
      where p.pet_id = medical_records.pet_id
        and p.owner_id = (select auth.uid())
    )
  );

-- Database deletion removes attachment metadata first. The orphan guard keeps
-- linked objects protected while allowing the authenticated Owner to clean up
-- paths already collected for their own user folder after the DB delete.
drop policy if exists medical_record_attachments_owner_delete on storage.objects;
create policy medical_record_attachments_owner_delete
  on storage.objects
  for delete to authenticated
  using (
    storage.objects.bucket_id = 'medical-record-attachments'
    and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
    and not exists (
      select 1
      from public.medical_attachments
      where medical_attachments.file_url = storage.objects.name
    )
  );

commit;
