begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists pet_photos_owner_insert on storage.objects;
create policy pet_photos_owner_insert
on storage.objects for insert to authenticated
with check (
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
