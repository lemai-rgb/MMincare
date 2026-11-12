-- CI only: transaction-scoped synthetic users and data.
begin;
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
 ('00000000-0000-0000-0000-0000000000a1','owner-a@example.com','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000b1','caretaker-b@example.com','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000c1','other-c@example.com','unused',now(),'{}','{}'),
 ('00000000-0000-0000-0000-0000000000d1','unconfirmed-d@example.com','unused',null,'{}','{}');
update public.users set name = 'Mai' where user_id = '00000000-0000-0000-0000-0000000000a1';
insert into public.pets (pet_id,owner_id,name,species,gender,picture_url) values
 ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1','Shared','Cat','Unknown','private-test'),
 ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a1','Not shared','Dog','Unknown',null),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000b1','Own','Dog','Unknown',null);
insert into public.vaccine_records (pet_id,created_by,vaccine_name,vaccine_date)
values ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a1','Test vaccine',current_date);
insert into public.pet_access (access_id,pet_id,granted_by,caretaker_email,status,valid_until)
values ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-0000000000a2',
 '00000000-0000-0000-0000-0000000000a1','caretaker-b@example.com','Pending',current_date + 10),
 ('00000000-0000-0000-0000-0000000000a5','00000000-0000-0000-0000-0000000000a2',
 '00000000-0000-0000-0000-0000000000a1','unconfirmed-d@example.com','Pending',current_date + 10);
update public.pet_access set pet_name_snapshot = 'Meo' where access_id = '00000000-0000-0000-0000-0000000000a4';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1","email":"caretaker-b@example.com","role":"authenticated"}',true);
do $$
declare invitations jsonb;
begin
 if jsonb_array_length(public.read_shared_pets(null)) <> 0 then raise exception 'Pending invitation leaked'; end if;
 if exists (select 1 from public.pet_access) then raise exception 'Recipient can select base invitation'; end if;
 invitations := public.list_pet_invitations();
 if jsonb_array_length(invitations) <> 1 or invitations->0->>'inviter_name' <> 'Mai'
   or invitations->0->>'pet_name_snapshot' <> 'Meo'
   or invitations->0 ?| array['granted_by','caretaker_email','pet_id','caretaker_id']
 then raise exception 'Invitation projection incorrect'; end if;
 if public.has_active_caretaker_access() then raise exception 'Pending counted as active'; end if;
 if public.accept_pet_access('00000000-0000-0000-0000-0000000000a4')
   <> '{"access_id":"00000000-0000-0000-0000-0000000000a4","status":"Active"}'::jsonb
 then raise exception 'Accept response leaked fields'; end if;
end $$;
do $$
declare shared jsonb;
begin
 if (select count(*) from public.pets) <> 1 then raise exception 'Base pets not owner-only'; end if;
 if exists (select 1 from public.vaccine_records) then raise exception 'Base vaccine row leaked'; end if;
 if not public.has_active_caretaker_access() then raise exception 'Active role missing'; end if;
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
 if jsonb_array_length(public.list_pet_invitations()) <> 0 then raise exception 'Uninvited user saw invitation'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000d1","email":"unconfirmed-d@example.com","role":"authenticated"}',true);
do $$ begin
 if jsonb_array_length(public.list_pet_invitations()) <> 0 then raise exception 'Unconfirmed user saw invitation'; end if;
 begin
   perform public.accept_pet_access('00000000-0000-0000-0000-0000000000a5');
   raise exception 'Unconfirmed user accepted invitation';
 exception when others then
   if sqlerrm not like '%Confirmed email required%' then raise; end if;
 end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner-a@example.com","role":"authenticated"}',true);
set local role authenticated;
update public.pet_access set status = 'Revoked', revoked_at = now()
where access_id = '00000000-0000-0000-0000-0000000000a4';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1","email":"caretaker-b@example.com","role":"authenticated"}',true);
do $$ begin
 if jsonb_array_length(public.read_shared_pets(null)) <> 0 then raise exception 'Revoked access still visible'; end if;
 if public.has_active_caretaker_access() then raise exception 'Revoked access counted as active'; end if;
end $$;
rollback;
