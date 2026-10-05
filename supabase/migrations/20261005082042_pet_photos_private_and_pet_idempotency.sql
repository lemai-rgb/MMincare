begin;

alter table public.pets
  add column if not exists creation_key text,
  add column if not exists creation_payload_hash text;

create unique index if not exists pets_owner_creation_key_uidx
  on public.pets (owner_id, creation_key)
  where creation_key is not null;

update storage.buckets
set public = false
where id = 'pet-photos';

drop policy if exists pet_photos_owner_insert on storage.objects;
create policy pet_photos_owner_insert
on storage.objects for insert to authenticated
with check (
  storage.objects.bucket_id = 'pet-photos'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
);

drop policy if exists pet_photos_owner_select on storage.objects;
create policy pet_photos_owner_select
on storage.objects for select to authenticated
using (
  storage.objects.bucket_id = 'pet-photos'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
);

drop policy if exists pet_photos_owner_delete on storage.objects;
create policy pet_photos_owner_delete
on storage.objects for delete to authenticated
using (
  storage.objects.bucket_id = 'pet-photos'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
);

commit;
