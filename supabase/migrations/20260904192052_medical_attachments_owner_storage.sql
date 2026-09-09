begin;

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
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
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

create index if not exists medical_attachments_uploaded_by_idx
  on public.medical_attachments (uploaded_by);

alter table public.medical_attachments enable row level security;
grant select, insert on table public.medical_attachments to authenticated;

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
  medical_attachments.uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.medical_records
    join public.pets on pets.pet_id = medical_records.pet_id
    where medical_records.record_id = medical_attachments.record_id
      and pets.owner_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-record-attachments',
  'medical-record-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists medical_record_attachments_owner_select on storage.objects;
create policy medical_record_attachments_owner_select
on storage.objects
for select
to authenticated
using (
  storage.objects.bucket_id = 'medical-record-attachments'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.medical_records
    join public.pets on pets.pet_id = medical_records.pet_id
    where medical_records.record_id::text = (storage.foldername(storage.objects.name))[2]
      and medical_records.created_by = (select auth.uid())
      and pets.owner_id = (select auth.uid())
  )
);

drop policy if exists medical_record_attachments_owner_insert on storage.objects;
create policy medical_record_attachments_owner_insert
on storage.objects
for insert
to authenticated
with check (
  storage.objects.bucket_id = 'medical-record-attachments'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.medical_records
    join public.pets on pets.pet_id = medical_records.pet_id
    where medical_records.record_id::text = (storage.foldername(storage.objects.name))[2]
      and medical_records.created_by = (select auth.uid())
      and pets.owner_id = (select auth.uid())
  )
);

-- Required only for best-effort cleanup when metadata insertion fails.
drop policy if exists medical_record_attachments_owner_delete on storage.objects;
create policy medical_record_attachments_owner_delete
on storage.objects
for delete
to authenticated
using (
  storage.objects.bucket_id = 'medical-record-attachments'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.medical_records
    join public.pets on pets.pet_id = medical_records.pet_id
    where medical_records.record_id::text = (storage.foldername(storage.objects.name))[2]
      and medical_records.created_by = (select auth.uid())
      and pets.owner_id = (select auth.uid())
  )
  and not exists (
    select 1
    from public.medical_attachments
    where medical_attachments.file_url = storage.objects.name
  )
);

commit;
