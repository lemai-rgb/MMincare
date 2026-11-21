begin;

create or replace function public.guard_reminder_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- The FK's ON DELETE SET NULL is a nested update. Preserve the reminder
  -- verbatim apart from its detached source, including completed reminders.
  if pg_trigger_depth() > 1
     and new.source_vaccine_record_id is null
     and new.source_medical_record_id is null
     and num_nonnulls(old.source_vaccine_record_id, old.source_medical_record_id) = 1
     and (to_jsonb(new) - array['source_vaccine_record_id', 'source_medical_record_id'])
       = (to_jsonb(old) - array['source_vaccine_record_id', 'source_medical_record_id'])
     and not exists (
       select 1 from public.vaccine_records where vaccine_record_id = old.source_vaccine_record_id
     )
     and not exists (
       select 1 from public.medical_records where record_id = old.source_medical_record_id
     ) then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.pet_id is distinct from old.pet_id
     or new.type is distinct from old.type
     or new.source_vaccine_record_id is distinct from old.source_vaccine_record_id
     or new.source_medical_record_id is distinct from old.source_medical_record_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Reminder ownership and source fields are immutable';
  end if;
  if old.status::text = 'Completed' then
    raise exception 'Completed reminders are immutable';
  end if;
  if new.status::text = 'Completed' then
    if new.completed_at is null or new.due_date is distinct from old.due_date or new.note is distinct from old.note then
      raise exception 'Completion may only change status and completed_at';
    end if;
  elsif new.status::text = 'Upcoming' then
    if new.completed_at is not null then raise exception 'Upcoming reminder cannot have completed_at'; end if;
  else
    raise exception 'Invalid reminder transition';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Owner cleanup of the managed upload path after its record is deleted.
-- Constrain SELECT to the Storage operations used for cleanup, never downloads.
create or replace function private.is_deleted_medical_attachment(object_name text, object_owner text)
returns boolean
language sql stable security invoker set search_path = '' as $$
  select coalesce(
    object_owner = (select auth.uid())::text
    and split_part(object_name, '/', 1) = object_owner
    and object_name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|jpeg|png|pdf)$'
    and not exists (
      select 1 from public.medical_records r
      where r.record_id = case
        when split_part(object_name, '/', 2) ~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
        then split_part(object_name, '/', 2)::uuid
      end
    )
    and not exists (
      select 1 from public.medical_attachments a where a.file_url = object_name
    ), false);
$$;
revoke all on function private.is_deleted_medical_attachment(text, text) from public, anon;
grant execute on function private.is_deleted_medical_attachment(text, text) to authenticated;

create policy medical_attachment_cleanup_select on storage.objects
  for select to authenticated using (
    bucket_id = 'medical-record-attachments'
    and storage.allow_any_operation(array['storage.object.list', 'storage.object.delete_many'])
    and private.is_deleted_medical_attachment(name, owner_id)
  );
create policy medical_attachment_cleanup_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'medical-record-attachments'
    and storage.allow_only_operation('storage.object.delete_many')
    and private.is_deleted_medical_attachment(name, owner_id)
  );

-- Release the existing uniqueness slot and create the replacement in one
-- transaction. The caller still needs the Owner SELECT/UPDATE/INSERT policies.
create or replace function public.invite_pet_caretaker(
  p_pet_id uuid, p_caretaker_email text, p_valid_until date
)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  pet_name text;
  recipient text := lower(btrim(p_caretaker_email));
  invitation public.pet_access%rowtype;
begin
  select name into pet_name
  from public.pets
  where pet_id = p_pet_id and owner_id = actor;
  if not found or actor is null then
    raise exception 'Pet not found' using errcode = 'P0002';
  end if;
  if recipient is null
     or recipient !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or recipient = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
     or p_valid_until is null or p_valid_until < today then
    raise exception 'Invalid invitation' using errcode = '22023';
  end if;

  update public.pet_access
     set status = 'Revoked', revoked_at = now()
   where pet_id = p_pet_id and granted_by = actor and caretaker_email = recipient
     and status in ('Pending', 'Active') and valid_until < today;

  insert into public.pet_access (pet_id, granted_by, caretaker_email, valid_until, status, pet_name_snapshot)
  values (p_pet_id, actor, recipient, p_valid_until, 'Pending', pet_name)
  returning * into invitation;

  return jsonb_build_object(
    'access_id', invitation.access_id, 'pet_id', invitation.pet_id,
    'caretaker_email', invitation.caretaker_email, 'status', invitation.status,
    'valid_until', invitation.valid_until, 'granted_at', invitation.granted_at,
    'pet_name_snapshot', invitation.pet_name_snapshot
  );
end;
$$;
revoke all on function public.invite_pet_caretaker(uuid, text, date) from public, anon;
grant execute on function public.invite_pet_caretaker(uuid, text, date) to authenticated;

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
  and num_nonnulls(
    reminders.source_vaccine_record_id,
    reminders.source_medical_record_id
  ) <= 1
  and (
    reminders.source_vaccine_record_id is null
    or (
      reminders.type = 'Vaccine'
      and exists (
        select 1
        from public.vaccine_records
        where vaccine_records.vaccine_record_id = reminders.source_vaccine_record_id
          and vaccine_records.pet_id = reminders.pet_id
      )
    )
  )
  and (
    reminders.source_medical_record_id is null
    or (
      reminders.type = 'Recheck'
      and exists (
        select 1
        from public.medical_records
        where medical_records.record_id = reminders.source_medical_record_id
          and medical_records.pet_id = reminders.pet_id
      )
    )
  )
);

commit;
