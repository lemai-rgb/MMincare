# MMinCare â€” Data Dictionary

**PhiÃªn báº£n:** 3.0 Â· **Cáº­p nháº­t:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline á»©ng dá»¥ng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` â€” PR #26 Ä‘Ã£ merge, Vercel Production thÃ nh cÃ´ng.  
**á»¨ng dá»¥ng:** https://m-mincare.vercel.app/ Â· **Tráº£i nghiá»‡m thá»­:** https://m-mincare.vercel.app/demo

> Current = code Ä‘Ã£ triá»ƒn khai táº¡i baseline trÃªn. Tráº¡ng thÃ¡i nÃ y khÃ´ng cÃ³ nghÄ©a má»i ká»‹ch báº£n Ä‘Ã£ kiá»ƒm thá»­ thá»±c táº¿. Demo dÃ¹ng dá»¯ liá»‡u giáº£ láº­p á»Ÿ trÃ¬nh duyá»‡t; khÃ´ng chá»©ng minh Auth, Owner A/B, Storage hoáº·c hiá»‡u nÄƒng backend.

## 1. Nguá»“n vÃ  pháº¡m vi

Cá»™t/khÃ³a dÆ°á»›i Ä‘Ã¢y Ä‘á»‘i chiáº¿u `database/schema.sql` cÃ¹ng migration má»›i hÆ¡n `20261009180809_health_logs_post_idempotency.sql` (thÃªm hai cá»™t Health Log vÃ  index). Schema snapshot chÆ°a chá»©a hai cá»™t Ä‘Ã³; snapshot khÃ´ng thay migration source of truth. ÄÃ¢y lÃ  tÃ i liá»‡u Ä‘á»“ng bá»™, khÃ´ng apply/replay SQL hoáº·c thay dá»¯ liá»‡u.

`auth.users` do Supabase Auth quáº£n lÃ½: `id` lÃ  PK; email vÃ  metadata phá»¥c vá»¥ Auth, khÃ´ng Ä‘á»c/ghi trá»±c tiáº¿p tá»« client. `public.users` lÃ  há»“ sÆ¡ á»©ng dá»¥ng. Nullability/default/constraint trong báº£ng lÃ  Ä‘á»‹nh nghÄ©a DDL; validation bá»• sung á»Ÿ API Ä‘Æ°á»£c nÃªu sau.

## 2. Enum

| Kiá»ƒu | GiÃ¡ trá»‹ lÆ°u |
|---|---|
| pet_species | Dog, Cat |
| pet_gender | Male, Female, Unknown |
| reminder_type | Vaccine, Recheck, Medication, Other |
| reminder_status | Upcoming, Completed â€” Overdue lÃ  tráº¡ng thÃ¡i hiá»ƒn thá»‹ suy ra |
| attachment_file_type | jpg, jpeg, png, pdf |
| pet_access_status | Pending, Active, Revoked â€” reserved Phase 2 |

## 3. Báº£ng vÃ  cá»™t

### public.users

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `user_id` | `uuid primary key references auth.users (id) on delete restrict`; NOT NULL (PK) | ID há»“ sÆ¡, liÃªn káº¿t Auth; ID ngÆ°á»i nháº­n/Owner tÃ¹y báº£ng. |
| `email` | `text not null unique`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `name` | `text not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `phone_number` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Sá»‘ Ä‘iá»‡n thoáº¡i há»“ sÆ¡ tÃ¹y chá»n, khÃ´ng pháº£i Auth identifier. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.pets

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `pet_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `owner_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Owner cá»§a Pet, khÃ´ng nháº­n tá»« client. |
| `name` | `text not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `species` | `public.pet_species not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `gender` | `public.pet_gender not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `breed` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `date_of_birth` | `date`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `picture_url` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Legacy URL hoáº·c path private pet-photos; khÃ´ng Ä‘á»“ng nghÄ©a bucket public. |
| `creation_key` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Key ná»™i bá»™ chá»‘ng láº·p POST; null cho dá»¯ liá»‡u trÆ°á»›c migration. |
| `creation_payload_hash` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Hash payload chuáº©n hÃ³a ná»™i bá»™; khÃ´ng sá»­a tá»« client. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.vaccine_schedule_rules

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `schedule_rule_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `species` | `public.pet_species not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `vaccine_name` | `text not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `min_age_days` | `integer not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `max_age_days` | `integer`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `standard_interval_days` | `integer not null`; NOT NULL | Quy táº¯c Ä‘Æ°á»£c duyá»‡t má»›i dÃ¹ng gá»£i Ã½; khÃ´ng láº¥y fixture Ä‘á»ƒ Ä‘á»‹nh interval. |
| `is_active` | `boolean not null default true`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `note` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.vaccine_records

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `vaccine_record_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | NgÆ°á»i táº¡o; khÃ´ng sá»­a Health Log. |
| `vaccine_name` | `text not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `vaccine_date` | `date not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `dose_number` | `integer`; NULL Ä‘Æ°á»£c phÃ©p | Sá»‘ mÅ©i, integer dÆ°Æ¡ng tÃ¹y chá»n. |
| `clinic_name` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `note` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.medical_records

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `record_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | NgÆ°á»i táº¡o; khÃ´ng sá»­a Health Log. |
| `visit_date` | `date not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `diagnosis` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `symptoms` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `medication` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `clinic_name` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `note` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.medical_attachments

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `attachment_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `record_id` | `uuid not null references public.medical_records (record_id) on delete cascade`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `uploaded_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `file_url` | `text not null`; NOT NULL | Path object trong bucket private medical-record-attachments. |
| `file_type` | `public.attachment_file_type not null`; NOT NULL | Extension enum jpg/jpeg/png/pdf, khÃ´ng pháº£i MIME string. |
| `file_size` | `bigint not null`; NOT NULL | Bytes; >0 vÃ  â‰¤5,242,880. |
| `uploaded_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.reminders

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `reminder_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `user_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | ID há»“ sÆ¡, liÃªn káº¿t Auth; ID ngÆ°á»i nháº­n/Owner tÃ¹y báº£ng. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `source_vaccine_record_id` | `uuid references public.vaccine_records (vaccine_record_id) on delete set null`; NULL Ä‘Æ°á»£c phÃ©p | Nguá»“n tÃ¹y chá»n; SET NULL khi Vaccine bá»‹ xÃ³a. |
| `source_medical_record_id` | `uuid references public.medical_records (record_id) on delete set null`; NULL Ä‘Æ°á»£c phÃ©p | Nguá»“n tÃ¹y chá»n; SET NULL khi Medical bá»‹ xÃ³a. |
| `due_date` | `date not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `type` | `public.reminder_type not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `status` | `public.reminder_status not null default 'Upcoming'`; NOT NULL | Enum theo báº£ng, hoáº·c text quan sÃ¡t á»Ÿ Health Log. |
| `note` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `completed_at` | `timestamptz`; NULL Ä‘Æ°á»£c phÃ©p | Timestamp hoÃ n táº¥t Reminder; tráº¡ng thÃ¡i Upcoming khÃ´ng cÃ³ completion há»£p lá»‡. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.notification_events

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `notification_event_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `user_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | ID há»“ sÆ¡, liÃªn káº¿t Auth; ID ngÆ°á»i nháº­n/Owner tÃ¹y báº£ng. |
| `reminder_id` | `uuid not null references public.reminders (reminder_id) on delete cascade`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `event_type` | `text not null check (event_type in ('due_soon', 'overdue'))`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `due_date_snapshot` | `date not null`; NOT NULL | NgÃ y Reminder táº¡i láº§n lÃªn lá»‹ch event, dÃ¹ng loáº¡i bá» event cÅ©. |
| `scheduled_for` | `timestamptz not null`; NOT NULL | Thá»i Ä‘iá»ƒm event Ä‘Æ°á»£c lÃªn lá»‹ch. |
| `read_at` | `timestamptz`; NULL Ä‘Æ°á»£c phÃ©p | Null = chÆ°a Ä‘á»c; timestamp canonical khi Ä‘Ã£ Ä‘á»c. |
| `cancelled_at` | `timestamptz`; NULL Ä‘Æ°á»£c phÃ©p | Event khÃ´ng cÃ²n hiá»‡u lá»±c. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

### public.health_logs

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `health_log_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | NgÆ°á»i táº¡o; khÃ´ng sá»­a Health Log. |
| `weight` | `numeric(6, 2)`; NULL Ä‘Æ°á»£c phÃ©p | numeric(6,2), kg, null hoáº·c >0; API giá»›i háº¡n9999.99. |
| `food_amount` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Text mÃ´ táº£ lÆ°á»£ng Äƒn, khÃ´ng pháº£i sá»‘ chuáº©n hÃ³a dÃ¹ng tÃ­nh dinh dÆ°á»¡ng. |
| `food_type` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Text loáº¡i/tÃªn thá»©c Äƒn. |
| `status` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Enum theo báº£ng, hoáº·c text quan sÃ¡t á»Ÿ Health Log. |
| `note` | `text`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `recorded_on` | `date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date)`; NOT NULL | NgÃ y ghi nháº­n nghiá»‡p vá»¥; khÃ´ng tÆ°Æ¡ng lai theo Viá»‡t Nam. |
| `logged_at` | `timestamptz not null default now()`; NOT NULL | Timestamp nháº­p ban Ä‘áº§u báº¥t biáº¿n khi sá»­a Health Log. |
| `creation_key` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Key ná»™i bá»™ chá»‘ng láº·p POST; null cho dá»¯ liá»‡u trÆ°á»›c migration. |
| `creation_payload_hash` | `text`; NULL Ä‘Æ°á»£c phÃ©p | Hash payload chuáº©n hÃ³a ná»™i bá»™; khÃ´ng sá»­a tá»« client. |

### public.pet_access â€” schema reserved, chÆ°a runtime

| Cá»™t | Kiá»ƒu / nullability / default / khÃ³a | Ã nghÄ©a |
|---|---|---|
| `access_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `granted_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `caretaker_email` | `text not null`; NOT NULL | Email normalized dÃ¹ng thiáº¿t káº¿ má»i Phase 2; chÆ°a luá»“ng production. |
| `caretaker_id` | `uuid references public.users (user_id) on delete restrict`; NULL Ä‘Æ°á»£c phÃ©p | ID ngÆ°á»i Ä‘Æ°á»£c má»i sau activation; schema reserved, chÆ°a runtime. |
| `valid_until` | `date not null`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `status` | `public.pet_access_status not null`; NOT NULL | Enum theo báº£ng, hoáº·c text quan sÃ¡t á»Ÿ Health Log. |
| `granted_at` | `timestamptz not null default now()`; NOT NULL | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `activated_at` | `timestamptz`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |
| `revoked_at` | `timestamptz`; NULL Ä‘Æ°á»£c phÃ©p | TrÆ°á»ng nghiá»‡p vá»¥/metadata theo tÃªn; xem API vÃ  Business Rules. |

## 4. Quan há»‡ vÃ  xá»­ lÃ½ xÃ³a

| Parent â†’ child | Cardinality / FK action |
|---|---|
| auth.users â†’ public.users | 1 â†’ 0..1 há»“ sÆ¡; users.user_id FK RESTRICT |
| users â†’ pets | 1 â†’ 0..N; pets.owner_id NOT NULL, RESTRICT |
| pets â†’ vaccine_records/medical_records/health_logs/reminders | 1 â†’ 0..N; Pet FK NOT NULL, RESTRICT |
| users â†’ báº£n ghi táº¡o/nháº¯c/Ä‘Ã­nh kÃ¨m | 1 â†’ 0..N qua created_by/user_id/uploaded_by, RESTRICT |
| medical_records â†’ medical_attachments | 1 â†’ 0..N; record_id NOT NULL, CASCADE metadata |
| vaccine_records/medical_records â†’ reminders | N Reminders cÃ³ 0..1 nguá»“n má»—i loáº¡i; nullable FK SET NULL, tá»•ng sá»‘ nguá»“n â‰¤1 |
| reminders â†’ notification_events | 1 â†’ 0..N; FK NOT NULL, CASCADE |
| vaccine_schedule_rules | Tra cá»©u species/vaccine/age; khÃ´ng FK sang tá»«ng Vaccine Record, khÃ´ng interval Ä‘Æ°á»£c tá»± bá»‹a |
| pet_access | Pet/User FK vÃ  lifecycle má»i reserved; khÃ´ng má»Ÿ quyá»n Caretaker tá»« viá»‡c báº£ng tá»“n táº¡i |

Viá»‡c xÃ³a Medical metadata khÃ´ng tá»± xÃ³a object Storage: API thá»±c hiá»‡n cleanup riÃªng vÃ  tráº£ warning/pending náº¿u lá»—i. Reminder máº¥t nguá»“n váº«n Ä‘Æ°á»£c giá»¯, khÃ´ng cascade xÃ³a. KhÃ´ng cÃ³ xÃ³a Pet/tÃ i khoáº£n trong API hiá»‡n táº¡i.

## 5. Constraints, indexes vÃ  quyá»n

- users: email normalized/format/unique, name khÃ´ng rá»—ng; profile sync tá»« Auth.
- pets: name khÃ´ng rá»—ng, date_of_birth khÃ´ng tÆ°Æ¡ng lai; `pets_owner_creation_key_uidx` unique partial `(owner_id,creation_key)` khi key khÃ¡c null.
- health_logs: weight null hoáº·c dÆ°Æ¡ng, recorded_on khÃ´ng tÆ°Æ¡ng lai á»Ÿ Viá»‡t Nam; Ã­t nháº¥t má»™t weight/text nghiá»‡p vá»¥. `health_logs_owner_pet_creation_key_uidx` unique partial `(created_by,pet_id,creation_key)` khi key khÃ¡c null. Latest order recorded_on DESC â†’logged_at DESC â†’health_log_id DESC; index phá»¥c vá»¥ Pet/date/time, khÃ´ng Ä‘á»“ng nghÄ©a tie-breaker Ä‘Ã£ lÃ  má»i index column.
- reminders: tá»‘i Ä‘a má»™t FK nguá»“n, nguá»“n cÃ¹ng Pet Ä‘Æ°á»£c API kiá»ƒm tra; completion consistency vÃ  Owner-only edit/complete enforced qua migration, grants/RLS/API.
- notification_events: event_type chá»‰ due_soon/overdue, index active-schedule chá»‘ng event trÃ¹ng vÃ  Owner/schedule/unread há»— trá»£ truy váº¥n; snapshot/cancel giá»¯ event cÅ© khÃ´ng pháº£i event hiá»‡n hÃ nh.
- Owner-only RLS á»Ÿ báº£ng dá»¯ liá»‡u; grants tá»‘i thiá»ƒu khÃ´ng thay tháº¿ ownership. Health Log UPDATE chá»‰ cá»™t nghiá»‡p vá»¥/date, identity/creator/logged_at khÃ´ng Ä‘Æ°á»£c client sá»­a; DELETE Owner cho phÃ©p. `rls_auto_enable()` khÃ´ng executable bá»Ÿi anon/authenticated.
- `vaccine_schedule_rules`: cÃ³ báº£ng/RLS khÃ´ng cÃ³ nghÄ©a ngÆ°á»i dÃ¹ng Ä‘Ã£ Ä‘á»c Ä‘Æ°á»£c hoáº·c cÃ³ dataset. CR-08 quyá»n/rule data chÆ°a hoÃ n táº¥t; khÃ´ng sá»­a grant trong Ä‘á»£t tÃ i liá»‡u nÃ y.

## 6. Storage (khÃ´ng pháº£i báº£ng public PetPhoto)

| Bucket | Quyá»n vÃ  file | Truy cáº­p runtime |
|---|---|---|
| pet-photos | Private tá»« migration Ä‘áº§u;5 MiB; image/jpeg,image/png,image/webp; Owner folder auth.uid(), SELECT/INSERT/DELETE | GET /api/pets/{petId}?photo=1 kiá»ƒm tra Owner rá»“i stream; tÃªn object duy nháº¥t, khÃ´ng cáº§n grant UPDATE/upsert |
| medical-record-attachments | Private; file limit5 MiB; JPEG/PNG/PDF theo route | Owner authorization rá»“i signed URL60s; metadata medical_attachments lÆ°u path |

`storage.objects` lÃ  object metadata do Supabase Storage quáº£n lÃ½; khÃ´ng thÃªm má»™t báº£ng public chá»©a binary. Preview/blob/dataURL khÃ´ng pháº£i permanent production URL. Legacy picture_url khÃ¡c managed path khÃ´ng tá»± chuyá»ƒn thÃ nh object Storage.

## 7. Dá»¯ liá»‡u demo tÃ¡ch biá»‡t

Máº«u ban Ä‘áº§u:3 Pet,31 Health Logs (Meo 15/Min 14/Sushi 2),4 Vaccine,2 Medical,7 Reminders,3 notification hiá»‡n hÃ nh (2 unread,1 read). NgÃ y neo Viá»‡t Nam lÃºc báº¯t Ä‘áº§u/reset. Meo/Min áº£nh demo Ä‘Æ°á»£c cung cáº¥p, Sushi picture_url null â†’fallback. CÃ¡c nhÃ³m tráº¡ng thÃ¡i khÃ´ng phÃ¢n bá»‘ báº±ng nhau hoáº·c báº¯t buá»™c Ä‘á»§ má»—i ká»³.

`demo/dataset.template.json` dÃ¹ng day offsets; export JSON/CSV lÃ  snapshot Ä‘á»ƒ Ä‘á»c, khÃ´ng import production. Demo `version,anchor_day,read_notifications`, snapshot notification IDs vÃ  sessionStorage lÃ  dá»¯ liá»‡u adapter, khÃ´ng cá»™t/UUID há»£p lá»‡ Ä‘á»ƒ seed database. Owner UUID máº«u khÃ´ng cÃ³ Auth account tháº­t. File do ngÆ°á»i xem chá»n Ä‘Æ°á»£c giá»¯ browser-local, khÃ´ng upload Storage. KhÃ´ng chá»©a secret, password hoáº·c vaccine rule interval.

## 8. Migration references vÃ  giá»›i háº¡n kiá»ƒm chá»©ng

| Version Ä‘á»“ng bá»™ | Ná»™i dung |
|---|---|
| 20260926193909 | notification_events_phase1 |
| 20261005081930 | pet_photos_storage |
| 20261005082042 | pet_photos_private_and_pet_idempotency |
| 20261007113449 | owner_edit_delete_health_logs |
| 20261009180809 | health_logs_post_idempotency |

ÄÃ¢y lÃ  cÃ¡c version Ä‘Æ°á»£c ghi nháº­n trong lá»‹ch sá»­ triá»ƒn khai trÆ°á»›c Ä‘Ã³, khÃ´ng pháº£i toÃ n bá»™ migration history vÃ  khÃ´ng pháº£i má»™t audit production má»›i. KhÃ´ng repair hoáº·c apply láº¡i chá»‰ Ä‘á»ƒ cáº­p nháº­t tÃ i liá»‡u. Presence cá»§a policy/index khÃ´ng lÃ  báº±ng chá»©ng Owner A/B runtime PASS.

### Phase 2.1 access boundary

`pet_access` grants per-Pet read-only Caretaker access after verified-email
acceptance. Pending invitations expose only the Pet-name snapshot and expiry.
Active access is required for Pet/Vaccine/Medical reads; Health Log, Reminder,
statistics, Notification Center and private assets remain unavailable.

| Version | Date | Change |
|---|---|---|
| 3.0 | 2026-10-11 | Sá»­a Ä‘Ãºng tÃªn/cá»™t/FK thá»±c táº¿, thÃªm Notification/rules/idempotency/Storage vÃ  ranh giá»›i demo. |
| 2.5 | 2026-09-22 | PhiÃªn báº£n cÅ© Ä‘Æ°á»£c thay trong láº§n Ä‘á»“ng bá»™; báº£n nÃ y nÃ¢ng lÃªn3.0, thuá»™c cÃ¹ng release Ä‘á»“ng bá»™2026-10-11. |

`GET /api/account/roles` returns the current profile name/email and boolean
role flags derived from owned Pets and active, unexpired `pet_access` rows.

