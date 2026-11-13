-- CI-only synthetic fixture, inserted immediately before Phase 2.1.
-- Reconstructs the production pet_access catalog observed on 2026-11-12.
alter table public.pet_access
  drop constraint if exists pet_access_email_normalized_check,
  drop constraint if exists pet_access_email_format_check,
  drop constraint if exists pet_access_not_self_check,
  drop constraint if exists pet_access_valid_until_check;
alter table public.pet_access
  drop column caretaker_email,
  drop column activated_at,
  drop column revoked_at;
alter table public.pet_access alter column caretaker_id set not null;
alter table public.pet_access
  add constraint chk_pet_access_granted_by_not_caretaker check (granted_by <> caretaker_id);
-- Match production enum labels and ordering, not just the pending label.
alter type public.pet_access_status rename to ci_old_pet_access_status;
create type public.pet_access_status as enum ('Active', 'PendingInvitation', 'Revoked');
alter table public.pet_access alter column status type public.pet_access_status
  using (case when status::text = 'Pending' then 'PendingInvitation' else status::text end)::public.pet_access_status;
drop type public.ci_old_pet_access_status;
drop index if exists public.pet_access_caretaker_status_valid_until_idx;
drop index if exists public.pet_access_pet_status_idx;
drop index if exists public.pet_access_granted_by_idx;
create index idx_pet_access_caretaker_id on public.pet_access (caretaker_id);
create index idx_pet_access_granted_by on public.pet_access (granted_by);
create index idx_pet_access_pet_id on public.pet_access (pet_id);

-- Unlike the currently empty production table, retain a legacy row to prove
-- that enum and identity backfill do not discard existing relationships.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
 ('00000000-0000-0000-0000-0000000000e1','legacy-owner@example.test','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000e2','legacy-caretaker@example.test','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000e5','legacy-active@example.test','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000e6','legacy-revoked@example.test','unused',now(),'{}','{}');
insert into public.pets (pet_id, owner_id, name, species, gender)
values ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000e1','Legacy Pet','Cat','Unknown');
insert into public.pet_access (access_id, caretaker_id, granted_by, pet_id, valid_until, status)
values ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-0000000000e2',
 '00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e3',
 current_date + 30,'PendingInvitation'),
 ('00000000-0000-0000-0000-0000000000e7','00000000-0000-0000-0000-0000000000e5',
 '00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e3',
 current_date + 30,'Active'),
 ('00000000-0000-0000-0000-0000000000e8','00000000-0000-0000-0000-0000000000e6',
 '00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e3',
 current_date + 30,'Revoked');
