-- Health Log POST retries can outlive the HTTP response.  Scope the
-- idempotency key to the authenticated owner and Pet; this migration does not
-- change existing rows, RLS policies, or the existing read/write grants.
begin;

alter table public.health_logs
  add column if not exists creation_key text,
  add column if not exists creation_payload_hash text;

create unique index if not exists health_logs_owner_pet_creation_key_uidx
  on public.health_logs (created_by, pet_id, creation_key)
  where creation_key is not null;

commit;
