begin;

revoke maintain on table public.vaccine_records from authenticated;
revoke maintain on table public.medical_records from authenticated;
revoke maintain on table public.medical_attachments from authenticated;

commit;
