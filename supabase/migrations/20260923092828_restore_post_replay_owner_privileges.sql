begin;

revoke delete on table public.medical_records from public, anon;
grant delete on table public.medical_records to authenticated;

revoke all on table public.health_logs from public, anon;
revoke update, delete, truncate, references, trigger, maintain
  on table public.health_logs from authenticated;
grant select, insert on table public.health_logs to authenticated;

commit;
