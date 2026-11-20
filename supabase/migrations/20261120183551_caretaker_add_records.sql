begin;
create schema if not exists private;
grant usage on schema private to authenticated;

-- Keep privileged implementation outside the Data API schema. Only the narrow
-- invoker wrapper is exposed; no caretaker policies are added to base tables.
create or replace function private.add_shared_pet_record(p_pet_id uuid, p_kind text, p_body jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  access_row public.pet_access%rowtype;
  event_date date;
  field_name text;
  max_len integer;
  vaccine public.vaccine_records%rowtype;
  medical public.medical_records%rowtype;
  dose integer;
begin
  if actor is null or not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  -- Serialize with revoke on the same row. A revoke that wins the lock denies
  -- this insert; one that follows waits until the in-flight insert commits.
  select * into access_row from public.pet_access
    where pet_id = p_pet_id and caretaker_id = actor and status = 'Active'
    order by access_id limit 1 for update;
  if not found or access_row.valid_until < (clock_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_kind not in ('vaccines', 'medical-records') or p_kind is null or jsonb_typeof(p_body) is distinct from 'object' then
    raise exception 'Invalid record' using errcode = '22023';
  end if;
  -- Reject identity/attachment/reminder injection, including direct RPC calls.
  if exists (select 1 from jsonb_object_keys(p_body) k where k <> all (
      case when p_kind = 'vaccines' then array['vaccine_name','vaccine_date','dose_number','clinic_name','note']
      else array['visit_date','symptoms','diagnosis','clinic_name','medication','note'] end)) then
    raise exception 'Unexpected field' using errcode = '22023';
  end if;
  foreach field_name in array array['vaccine_name','vaccine_date','visit_date','symptoms','diagnosis','clinic_name','medication','note'] loop
    if p_body ? field_name and jsonb_typeof(p_body->field_name) not in ('string','null') then
      raise exception 'Invalid field type' using errcode = '22023';
    end if;
    max_len := case field_name when 'vaccine_name' then 100 when 'clinic_name' then 200 when 'note' then 500 when 'vaccine_date' then 10 when 'visit_date' then 10 else 2000 end;
    if length(p_body->>field_name) > max_len then raise exception 'Field too long' using errcode = '22023'; end if;
  end loop;
  field_name := case when p_kind = 'vaccines' then 'vaccine_date' else 'visit_date' end;
  if coalesce(p_body->>field_name, '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Invalid date' using errcode = '22023';
  end if;
  event_date := (p_body->>field_name)::date;
  if event_date > (clock_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Future date' using errcode = '22023';
  end if;
  if p_kind = 'vaccines' then
    if coalesce(btrim(p_body->>'vaccine_name'), '') = '' then raise exception 'Vaccine required' using errcode = '22023'; end if;
    dose := nullif(p_body->>'dose_number', '')::integer;
    if dose < 1 then raise exception 'Invalid dose' using errcode = '22023'; end if;
    insert into public.vaccine_records(pet_id, created_by, vaccine_name, vaccine_date, dose_number, clinic_name, note)
      values (p_pet_id, actor, btrim(p_body->>'vaccine_name'), event_date, dose, nullif(btrim(p_body->>'clinic_name'), ''), nullif(btrim(p_body->>'note'), '')) returning * into vaccine;
    return jsonb_build_object('vaccine_record', jsonb_build_object('vaccine_record_id', vaccine.vaccine_record_id,
      'vaccine_name', vaccine.vaccine_name, 'vaccine_date', vaccine.vaccine_date, 'dose_number', vaccine.dose_number,
      'clinic_name', vaccine.clinic_name, 'note', vaccine.note));
  end if;
  insert into public.medical_records(pet_id, created_by, visit_date, symptoms, diagnosis, clinic_name, medication, note)
    values (p_pet_id, actor, event_date, nullif(btrim(p_body->>'symptoms'), ''), nullif(btrim(p_body->>'diagnosis'), ''),
      nullif(btrim(p_body->>'clinic_name'), ''), nullif(btrim(p_body->>'medication'), ''), nullif(btrim(p_body->>'note'), '')) returning * into medical;
  return jsonb_build_object('medical_record', jsonb_build_object('record_id', medical.record_id, 'visit_date', medical.visit_date,
    'symptoms', medical.symptoms, 'diagnosis', medical.diagnosis, 'clinic_name', medical.clinic_name, 'medication', medical.medication, 'note', medical.note));
end;
$$;
revoke all on function private.add_shared_pet_record(uuid,text,jsonb) from public, anon;
grant execute on function private.add_shared_pet_record(uuid,text,jsonb) to authenticated;
create or replace function public.add_shared_pet_record(p_pet_id uuid, p_kind text, p_body jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.add_shared_pet_record(p_pet_id, p_kind, p_body);
$$;
revoke all on function public.add_shared_pet_record(uuid,text,jsonb) from public, anon;
grant execute on function public.add_shared_pet_record(uuid,text,jsonb) to authenticated;

-- Owner must see records added by a caretaker, while created_by stays truthful.
drop policy if exists medical_records_owner_select on public.medical_records;
create policy medical_records_owner_select on public.medical_records for select to authenticated
  using (exists (select 1 from public.pets p where p.pet_id = medical_records.pet_id and p.owner_id = (select auth.uid())));
commit;
