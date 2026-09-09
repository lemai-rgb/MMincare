-- Add creation timestamps required for health-record summaries.
-- Existing rows receive the migration execution time because their original
-- creation time is not available in the live schema.
begin;

alter table public.vaccine_records
  add column if not exists created_at timestamptz;

alter table public.medical_records
  add column if not exists created_at timestamptz;

update public.vaccine_records
set created_at = now()
where created_at is null;

update public.medical_records
set created_at = now()
where created_at is null;

alter table public.vaccine_records
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.medical_records
  alter column created_at set default now(),
  alter column created_at set not null;

commit;
