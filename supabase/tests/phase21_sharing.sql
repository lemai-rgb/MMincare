-- CI only: transaction-scoped synthetic users and data.
begin;
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
 ('00000000-0000-0000-0000-0000000000a1','owner-a@example.com','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000b1','caretaker-b@example.com','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000c1','other-c@example.com','unused',now(),'{}','{}');
insert into public.pets (pet_id,owner_id,name,species,gender,picture_url) values
 ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1','Shared','Cat','Unknown','private-test'),
 ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a1','Not shared','Dog','Unknown',null),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000b1','Own','Dog','Unknown',null);
insert into public.vaccine_records (pet_id,created_by,vaccine_name,vaccine_date)
values ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1','Test vaccine',current_date);
insert into public.pet_access (access_id,pet_id,granted_by,caretaker_email,status,valid_until)
values ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-0000000000a2',
 '00000000-0000-0000-0000-0000000000a1','caretaker-b@example.com','Pending',current_date + 10);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1","email":"caretaker-b@example.com","role":"authenticated"}',true);
do $$
begin
 if jsonb_array_length(public.read_shared_pets(null)) <> 0 then raise exception 'Pending invitation leaked'; end if;
end $$;
select public.accept_pet_access('00000000-0000-0000-0000-0000000000a4');
do $$
declare shared jsonb;
begin
 if (select count(*) from public.pets) <> 1 then raise exception 'Base pets not owner-only'; end if;
 if exists (select 1 from public.vaccine_records) then raise exception 'Base vaccine row leaked'; end if;
 shared := public.read_shared_pets(null);
 if jsonb_array_length(shared) <> 1 or shared->0->>'name' <> 'Shared'
   or jsonb_array_length(shared->0->'records') <> 1
   or shared->0 ?| array['owner_id','picture_url','created_by']
   or (shared->0->'records'->0) ?| array['created_by','attachments','storage_path']
 then raise exception 'Unexpected shared projection'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000c1","email":"other-c@example.com","role":"authenticated"}',true);
do $$ begin
 if jsonb_array_length(public.read_shared_pets(null)) <> 0 then raise exception 'Uninvited user saw shared pet'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner-a@example.com","role":"authenticated"}',true);
set local role authenticated;
update public.pet_access set status = 'Revoked', revoked_at = now()
where access_id = '00000000-0000-0000-0000-0000000000a4';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1","email":"caretaker-b@example.com","role":"authenticated"}',true);
do $$ begin
 if jsonb_array_length(public.read_shared_pets(null)) <> 0 then raise exception 'Revoked access still visible'; end if;
end $$;
rollback;
