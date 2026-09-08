begin;

alter table public.reminders
  add column if not exists source_medical_record_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.reminders'::regclass
      and conname = 'reminders_source_medical_record_id_fkey'
  ) then
    alter table public.reminders
      add constraint reminders_source_medical_record_id_fkey
      foreign key (source_medical_record_id)
      references public.medical_records (record_id)
      on delete restrict
      not valid;
  end if;
end
$$;

alter table public.reminders
  validate constraint reminders_source_medical_record_id_fkey;

do $$
begin
  if exists (
    select 1
    from public.reminders
    where num_nonnulls(source_vaccine_record_id, source_medical_record_id) > 1
  ) then
    raise exception 'reminders contains rows linked to more than one source record';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.reminders'::regclass
      and conname = 'reminders_single_source_check'
  ) then
    alter table public.reminders
      add constraint reminders_single_source_check
      check (num_nonnulls(source_vaccine_record_id, source_medical_record_id) <= 1)
      not valid;
  end if;
end
$$;

alter table public.reminders
  validate constraint reminders_single_source_check;

create index if not exists reminders_source_medical_record_id_idx
  on public.reminders (source_medical_record_id);

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
          and medical_records.created_by = (select auth.uid())
      )
    )
  )
);

commit;
