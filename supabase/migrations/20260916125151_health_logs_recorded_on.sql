begin;

alter table public.health_logs
  add column if not exists recorded_on date;

update public.health_logs
set recorded_on = (logged_at at time zone 'Asia/Ho_Chi_Minh')::date
where recorded_on is null;

alter table public.health_logs
  alter column recorded_on set default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  alter column recorded_on set not null;

alter table public.health_logs
  drop constraint if exists health_logs_recorded_on_not_future_check;

alter table public.health_logs
  add constraint health_logs_recorded_on_not_future_check
  check (recorded_on <= ((now() at time zone 'Asia/Ho_Chi_Minh')::date));

drop index if exists public.health_logs_pet_logged_at_idx;

create index if not exists health_logs_pet_recorded_on_logged_at_idx
  on public.health_logs (pet_id, recorded_on desc, logged_at desc);

commit;
