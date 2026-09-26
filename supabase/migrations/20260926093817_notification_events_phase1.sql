begin;

alter table public.reminders
  add column if not exists updated_at timestamptz not null default now();

create table public.notification_events (
  notification_event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (user_id) on delete restrict,
  reminder_id uuid not null references public.reminders (reminder_id) on delete cascade,
  event_type text not null,
  due_date_snapshot date not null,
  scheduled_for timestamptz not null,
  read_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_type_check check (event_type in ('due_soon', 'overdue')),
  constraint notification_events_owner_check check (user_id is not null)
);

create unique index notification_events_active_schedule_uidx
  on public.notification_events (reminder_id, event_type, due_date_snapshot)
  where cancelled_at is null;
create index notification_events_owner_schedule_idx
  on public.notification_events (user_id, scheduled_for, notification_event_id)
  where cancelled_at is null;
create index notification_events_owner_unread_idx
  on public.notification_events (user_id, scheduled_for)
  where read_at is null and cancelled_at is null;

create or replace function public.sync_reminder_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'Completed' then
    update public.notification_events
       set cancelled_at = coalesce(cancelled_at, now()), updated_at = now()
     where reminder_id = new.reminder_id and cancelled_at is null;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.due_date is not distinct from old.due_date then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    update public.notification_events
       set cancelled_at = now(), updated_at = now()
     where reminder_id = new.reminder_id and cancelled_at is null;
  end if;

  insert into public.notification_events
    (user_id, reminder_id, event_type, due_date_snapshot, scheduled_for)
  values
    (new.user_id, new.reminder_id, 'due_soon', new.due_date,
      ((new.due_date - 2) + time '08:00') at time zone 'Asia/Ho_Chi_Minh'),
    (new.user_id, new.reminder_id, 'overdue', new.due_date,
      ((new.due_date + 2) + time '08:00') at time zone 'Asia/Ho_Chi_Minh')
  on conflict (reminder_id, event_type, due_date_snapshot)
    where cancelled_at is null do nothing;

  return new;
end;
$$;

drop trigger if exists reminders_sync_notification_events on public.reminders;
create trigger reminders_sync_notification_events
after insert or update of due_date, status on public.reminders
for each row execute function public.sync_reminder_notification_events();

insert into public.notification_events
  (user_id, reminder_id, event_type, due_date_snapshot, scheduled_for)
select r.user_id, r.reminder_id, event.event_type, r.due_date,
  case event.event_type
    when 'due_soon' then ((r.due_date - 2) + time '08:00') at time zone 'Asia/Ho_Chi_Minh'
    else ((r.due_date + 2) + time '08:00') at time zone 'Asia/Ho_Chi_Minh'
  end
from public.reminders r
cross join (values ('due_soon'), ('overdue')) event(event_type)
where r.status = 'Upcoming'
on conflict (reminder_id, event_type, due_date_snapshot)
  where cancelled_at is null do nothing;

alter table public.notification_events enable row level security;

create policy notification_events_owner_select on public.notification_events
for select to authenticated
using (user_id = (select auth.uid()));

create policy notification_events_owner_read_update on public.notification_events
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists reminders_owner_edit on public.reminders;
create policy reminders_owner_edit on public.reminders
for update to authenticated
using (
  user_id = (select auth.uid()) and status = 'Upcoming'
  and exists (select 1 from public.pets p where p.pet_id = reminders.pet_id and p.owner_id = (select auth.uid()))
)
with check (
  user_id = (select auth.uid()) and status = 'Upcoming' and completed_at is null
  and exists (select 1 from public.pets p where p.pet_id = reminders.pet_id and p.owner_id = (select auth.uid()))
);

revoke all on table public.notification_events from public, anon, authenticated;
grant select on table public.notification_events to authenticated;
grant update (read_at) on table public.notification_events to authenticated;
revoke update on table public.reminders from authenticated;
grant update (status, completed_at, due_date, note, updated_at) on table public.reminders to authenticated;
revoke all on function public.sync_reminder_notification_events() from public, anon, authenticated;

commit;
