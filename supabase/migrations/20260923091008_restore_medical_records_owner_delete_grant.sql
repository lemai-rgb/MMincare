begin;

revoke delete on table public.medical_records from public, anon;
grant delete on table public.medical_records to authenticated;

commit;
