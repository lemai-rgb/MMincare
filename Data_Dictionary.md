# MMinCare Data Dictionary

**PhiÃªn báº£n:** 2.1  
**Ná»n táº£ng dá»¯ liá»‡u:** Supabase Auth, PostgreSQL, Storage vÃ  Row Level Security (RLS)  
**Pháº¡m vi:** MVP hiá»‡n táº¡i vÃ  cÃ¡c báº£ng Phase 2 Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c Ä‘á»‹nh  
**NgÃ´n ngá»¯ dá»¯ liá»‡u:** tÃªn báº£ng/cá»™t báº±ng tiáº¿ng Anh; mÃ´ táº£ nghiá»‡p vá»¥ báº±ng tiáº¿ng Viá»‡t

---

## 1. Má»¥c Ä‘Ã­ch vÃ  nguá»“n Ä‘á»‘i chiáº¿u

TÃ i liá»‡u nÃ y lÃ  báº£n Data Dictionary chuáº©n hÃ³a cho MMinCare, Ä‘Æ°á»£c cáº­p nháº­t Ä‘á»ƒ thá»‘ng nháº¥t vá»›i:

- `MMinCare_Business_Rules(1).md` â€” phiÃªn báº£n 1.1.
- `MMinCare_API_Documentation.md` â€” phiÃªn báº£n 1.1.
- User Story, MVP, ERD vÃ  cÃ¡c quyáº¿t Ä‘á»‹nh sáº£n pháº©m Ä‘Ã£ chá»‘t.
- MÃ´ hÃ¬nh xÃ¡c thá»±c vÃ  phÃ¢n quyá»n cá»§a Supabase.

Khi cÃ³ khÃ¡c biá»‡t giá»¯a tÃ i liá»‡u cÅ©, thá»© tá»± Æ°u tiÃªn Ã¡p dá»¥ng lÃ :

1. Business Rules phiÃªn báº£n má»›i nháº¥t.
2. API Documentation phiÃªn báº£n má»›i nháº¥t.
3. Quyáº¿t Ä‘á»‹nh sáº£n pháº©m Ä‘Ã£ chá»‘t.
4. Data Dictionary nÃ y.
5. ERD vÃ  User Story cÅ©.

> **Äiá»ƒm Ä‘Ã£ thay tháº¿:** quy táº¯c cÅ© mÃ´ táº£ lá»‹ch tiÃªm dá»±a chá»§ yáº¿u vÃ o `dose_number` khÃ´ng cÃ²n Ä‘Æ°á»£c Ã¡p dá»¥ng. Backend pháº£i xÃ¡c Ä‘á»‹nh gá»£i Ã½ lá»‹ch tiáº¿p theo báº±ng **loÃ i + tÃªn vaccine + Ä‘á»™ tuá»•i cá»§a thÃº cÆ°ng táº¡i ngÃ y tiÃªm**. `dose_number` chá»‰ lÃ  dá»¯ liá»‡u bá»• sung vÃ  khÃ´ng pháº£i tiÃªu chÃ­ chÃ­nh.

---

## 2. CÃ¡c quyáº¿t Ä‘á»‹nh dá»¯ liá»‡u Ä‘Ã£ chá»‘t

1. Supabase Auth (`auth.users`) quáº£n lÃ½ email, máº­t kháº©u, Google OAuth vÃ  phiÃªn Ä‘Äƒng nháº­p.
2. KhÃ´ng lÆ°u `password_hash` trong báº£ng `public.users`.
3. Má»—i tÃ i khoáº£n Auth cÃ³ má»™t há»“ sÆ¡ á»©ng dá»¥ng tÆ°Æ¡ng á»©ng trong `public.users`.
4. `users.name` lÃ  báº¯t buá»™c:
   - ÄÄƒng kÃ½ email: máº·c Ä‘á»‹nh láº¥y pháº§n trÆ°á»›c kÃ½ tá»± `@`.
   - ÄÄƒng nháº­p Google: Æ°u tiÃªn tÃªn Google; náº¿u thiáº¿u thÃ¬ láº¥y pháº§n trÆ°á»›c `@`.
   - NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ sá»­a tÃªn sau Ä‘Ã³.
5. Viá»‡c chá»n card ChÃ³/MÃ¨o á»Ÿ Home chá»‰ truyá»n lá»±a chá»n qua URL; khÃ´ng tá»± táº¡o báº£n ghi thÃº cÆ°ng.
6. ThÃº cÆ°ng báº¯t buá»™c cÃ³ `name`, `species`, `gender`; cÃ¡c trÆ°á»ng giá»‘ng, ngÃ y sinh vÃ  áº£nh lÃ  tÃ¹y chá»n.
7. KhÃ´ng cÃ³ áº£nh riÃªng thÃ¬ giao diá»‡n dÃ¹ng áº£nh máº·c Ä‘á»‹nh theo loÃ i; URL áº£nh máº·c Ä‘á»‹nh khÃ´ng cáº§n lÆ°u láº·p láº¡i trong tá»«ng báº£n ghi.
8. KhÃ´ng lÆ°u `next_due_date` trong `vaccine_records`.
9. NgÃ y nháº¯c Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng xÃ¡c nháº­n má»›i lÆ°u vÃ o `reminders.due_date`.
10. `display_status = Overdue` lÃ  giÃ¡ trá»‹ suy ra khi hiá»ƒn thá»‹, khÃ´ng lÆ°u trong cÆ¡ sá»Ÿ dá»¯ liá»‡u.
11. NgÆ°á»i chÄƒm sÃ³c Ä‘Æ°á»£c chia sáº» cÃ³ thá»ƒ xem vÃ  thÃªm báº£n ghi vaccine, khÃ¡m bá»‡nh, nháº­t kÃ½ sá»©c khá»e; khÃ´ng Ä‘Æ°á»£c sá»­a/xÃ³a báº£n ghi cÃ³ sáºµn, sá»­a reminder hoáº·c chia sáº» tiáº¿p.
12. Táº¥t cáº£ quyá»n truy cáº­p dá»¯ liá»‡u ngÆ°á»i dÃ¹ng pháº£i Ä‘Æ°á»£c thá»±c thi báº±ng Supabase RLS, khÃ´ng chá»‰ kiá»ƒm tra á»Ÿ giao diá»‡n.
13. MVP khÃ´ng há»— trá»£ hard-delete tÃ i khoáº£n; quan há»‡ `public.users.user_id â†’ auth.users.id` dÃ¹ng `ON DELETE RESTRICT`/`NO ACTION` vÃ  khÃ´ng cascade xÃ³a dá»¯ liá»‡u chÄƒm sÃ³c.
14. Email Confirmation Ä‘Æ°á»£c báº­t; há»“ sÆ¡ `public.users` Ä‘Æ°á»£c táº¡o/Ä‘á»“ng bá»™ tá»« `auth.users` báº±ng trigger hoáº·c cÆ¡ cháº¿ server tin cáº­y.
15. Client chá»‰ Ä‘Æ°á»£c cáº­p nháº­t `users.name` vÃ  `users.phone_number`; email Ä‘Æ°á»£c Ä‘á»“ng bá»™ tá»« Auth.

---

## 3. Quy Æ°á»›c chung

| Quy Æ°á»›c | Quy Ä‘á»‹nh |
|---|---|
| KhÃ³a chÃ­nh | `uuid`, sinh báº±ng `gen_random_uuid()` trá»« `public.users.user_id` dÃ¹ng ID tá»« `auth.users.id` |
| KhÃ³a ngoáº¡i ngÆ°á»i dÃ¹ng | Tham chiáº¿u `auth.users(id)` hoáº·c `public.users(user_id)` tÃ¹y quan há»‡ |
| Thá»i gian | `timestamptz`, lÆ°u theo UTC |
| NgÃ y nghiá»‡p vá»¥ | `date` |
| Chuá»—i | `text`; chuáº©n hÃ³a báº±ng `trim`, email dÃ¹ng chá»¯ thÆ°á»ng |
| Sá»‘ thá»±c | `numeric`, khÃ´ng dÃ¹ng kiá»ƒu chuá»—i cho cÃ¢n náº·ng |
| GiÃ¡ trá»‹ tÃ¹y chá»n | Cho phÃ©p `NULL`; khÃ´ng dÃ¹ng chuá»—i rá»—ng thay cho `NULL` |
| Audit | Æ¯u tiÃªn cÃ³ `created_at`; báº£ng cÃ³ chá»‰nh sá»­a há»“ sÆ¡ dÃ¹ng thÃªm `updated_at` |
| XÃ³a dá»¯ liá»‡u | MVP khÃ´ng há»— trá»£ hard-delete tÃ i khoáº£n, thÃº cÆ°ng hoáº·c há»“ sÆ¡ lá»‹ch sá»­; khÃ´ng cascade xÃ³a pet vÃ  lá»‹ch sá»­ chÄƒm sÃ³c. TÆ°Æ¡ng lai dÃ¹ng soft delete hoáº·c tráº¡ng thÃ¡i inactive theo quy trÃ¬nh Ä‘Æ°á»£c kiá»ƒm soÃ¡t |
| RLS | Báº­t trÃªn má»i báº£ng thuá»™c `public` cÃ³ dá»¯ liá»‡u ngÆ°á»i dÃ¹ng |

### 3.1 Danh má»¥c enum/check

CÃ³ thá»ƒ triá»ƒn khai báº±ng PostgreSQL enum hoáº·c cá»™t `text` kÃ¨m `CHECK`. API pháº£i tráº£ Ä‘Ãºng cÃ¡c giÃ¡ trá»‹ sau:

| NhÃ³m | GiÃ¡ trá»‹ há»£p lá»‡ |
|---|---|
| `pet_species` | `Dog`, `Cat` |
| `pet_gender` | `Male`, `Female`, `Unknown` |
| `reminder_type` | `Vaccine`, `Recheck`, `Medication`, `Other` |
| `reminder_status` | `Upcoming`, `Completed` |
| `pet_access_status` | `Pending`, `Active`, `Revoked` |
| `attachment_file_type` | `jpg`, `jpeg`, `png`, `pdf` |

`Expired` khÃ´ng cáº§n lÆ°u trong `pet_access.status`; tráº¡ng thÃ¡i truy cáº­p háº¿t háº¡n Ä‘Æ°á»£c suy ra tá»« `valid_until < current_date`.

---

## 4. SÆ¡ Ä‘á»“ báº£ng vÃ  pháº¡m vi

| Báº£ng | Pháº¡m vi | Má»¥c Ä‘Ã­ch |
|---|---|---|
| `auth.users` | Supabase managed | Danh tÃ­nh, thÃ´ng tin Ä‘Äƒng nháº­p vÃ  OAuth |
| `public.users` | Core MVP | Há»“ sÆ¡ á»©ng dá»¥ng cá»§a ngÆ°á»i dÃ¹ng |
| `public.pets` | Core MVP | Há»“ sÆ¡ thÃº cÆ°ng |
| `public.vaccine_schedule_rules` | Core MVP, backend | Bá»™ quy táº¯c gá»£i Ã½ lá»‹ch vaccine |
| `public.vaccine_records` | Core MVP | Lá»‹ch sá»­ tiÃªm vaccine |
| `public.reminders` | Core MVP | Nháº¯c lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng xÃ¡c nháº­n |
| `public.medical_records` | Core MVP | Há»“ sÆ¡ khÃ¡m/chá»¯a bá»‡nh |
| `public.medical_attachments` | Core MVP | Tá»‡p Ä‘Ã­nh kÃ¨m há»“ sÆ¡ y táº¿ |
| `public.health_logs` | Phase 2 | Nháº­t kÃ½ cÃ¢n náº·ng, Äƒn uá»‘ng vÃ  tÃ¬nh tráº¡ng |
| `public.pet_access` | Phase 2 | Chia sáº» quyá»n chÄƒm sÃ³c thÃº cÆ°ng |

---

## 5. Chi tiáº¿t báº£ng

### 5.1 `auth.users` â€” Supabase managed

Báº£ng do Supabase Auth quáº£n lÃ½. á»¨ng dá»¥ng khÃ´ng tá»± táº¡o schema, khÃ´ng ghi trá»±c tiáº¿p máº­t kháº©u vÃ  khÃ´ng Ä‘Æ°a báº£ng nÃ y vÃ o API cÃ´ng khai.

| Thuá»™c tÃ­nh liÃªn quan | Ã nghÄ©a |
|---|---|
| `id` | UUID danh tÃ­nh, Ä‘Æ°á»£c dÃ¹ng lÃ m `public.users.user_id` |
| `email` | Email Ä‘Äƒng nháº­p do Supabase quáº£n lÃ½ |
| `encrypted_password` | Do Supabase quáº£n lÃ½; tuyá»‡t Ä‘á»‘i khÃ´ng sao chÃ©p sang `public` |
| `raw_user_meta_data` | CÃ³ thá»ƒ chá»©a tÃªn/avatar tá»« Google OAuth trÆ°á»›c khi Ä‘á»“ng bá»™ há»“ sÆ¡ á»©ng dá»¥ng |

Quy táº¯c máº­t kháº©u tá»‘i thiá»ƒu 8 kÃ½ tá»± vÃ  cÃ³ Ã­t nháº¥t má»™t chá»¯ sá»‘ Ä‘Æ°á»£c cáº¥u hÃ¬nh/kiá»ƒm tra táº¡i táº§ng Auth vÃ  validation cá»§a á»©ng dá»¥ng.

---

### 5.2 `public.users` â€” Há»“ sÆ¡ ngÆ°á»i dÃ¹ng

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `user_id` | `uuid` | KhÃ´ng | PK, FK â†’ `auth.users.id`, `ON DELETE RESTRICT` hoáº·c máº·c Ä‘á»‹nh `NO ACTION` | ID há»“ sÆ¡ trÃ¹ng vá»›i ID Supabase Auth; khÃ´ng hard-delete trong MVP |
| `email` | `text` | KhÃ´ng | UNIQUE, CHECK `email = lower(trim(email))`, email há»£p lá»‡ | Email dÃ¹ng trong á»©ng dá»¥ng; chá»‰ Ä‘á»“ng bá»™ tá»« Auth |
| `name` | `text` | KhÃ´ng | `CHECK (length(trim(name)) > 0)` | TÃªn hiá»ƒn thá»‹ báº¯t buá»™c |
| `phone_number` | `text` | CÃ³ | Äá»‹nh dáº¡ng sá»‘ Ä‘iá»‡n thoáº¡i náº¿u nháº­p | Sá»‘ Ä‘iá»‡n thoáº¡i tÃ¹y chá»n |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o há»“ sÆ¡ |
| `updated_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm cáº­p nháº­t gáº§n nháº¥t |

### Quy táº¯c táº¡o `name`

- Email/password: láº¥y pháº§n trÆ°á»›c `@` lÃ m máº·c Ä‘á»‹nh.
- Google OAuth: Æ°u tiÃªn `full_name`/`name` tá»« metadata; náº¿u khÃ´ng cÃ³ thÃ¬ láº¥y pháº§n trÆ°á»›c `@`.
- GiÃ¡ trá»‹ máº·c Ä‘á»‹nh váº«n pháº£i Ä‘Æ°á»£c ghi vÃ o `name`, vÃ¬ cá»™t nÃ y khÃ´ng cho phÃ©p `NULL`.

### Äá»“ng bá»™ vÃ  quyá»n cáº­p nháº­t há»“ sÆ¡

- Profile Ä‘Æ°á»£c táº¡o tá»« `auth.users` báº±ng trigger hoáº·c cÆ¡ cháº¿ server tin cáº­y; khÃ´ng cho client tá»± táº¡o profile tÃ¹y Ã½.
- `phone_number` Ä‘Æ°á»£c phÃ©p `NULL`.
- Client chá»‰ Ä‘Æ°á»£c cáº­p nháº­t `name` vÃ  `phone_number`; khÃ´ng Ä‘Æ°á»£c cáº­p nháº­t `user_id`, `email` hoáº·c `created_at`.
- Khi email Auth thay Ä‘á»•i vÃ  Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c minh, cÆ¡ cháº¿ server/trigger Ä‘á»“ng bá»™ `public.users.email = lower(trim(auth.users.email))`.
- `updated_at` pháº£i Ä‘Æ°á»£c gÃ¡n `now()` báº±ng trigger `BEFORE UPDATE`; khÃ´ng chá»‰ dá»±a vÃ o giÃ¡ trá»‹ default lÃºc insert.
- KhÃ´ng dÃ¹ng service-role key trong client. Service role, náº¿u cáº§n cho tÃ¡c vá»¥ quáº£n trá»‹ tin cáº­y, chá»‰ tá»“n táº¡i phÃ­a server.

### KhÃ´ng tá»“n táº¡i trong báº£ng

- `password_hash`, access token, refresh token hoáº·c OAuth secret.
- CÃ¡c giÃ¡ trá»‹ nÃ y thuá»™c Supabase Auth/session.

---

### 5.3 `public.pets` â€” Há»“ sÆ¡ thÃº cÆ°ng

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `pet_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID thÃº cÆ°ng |
| `owner_id` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Chá»§ sá»Ÿ há»¯u duy nháº¥t cá»§a thÃº cÆ°ng |
| `name` | `text` | KhÃ´ng | KhÃ´ng Ä‘Æ°á»£c rá»—ng | TÃªn thÃº cÆ°ng |
| `species` | `pet_species` | KhÃ´ng | `Dog` hoáº·c `Cat` | LoÃ i thÃº cÆ°ng |
| `gender` | `pet_gender` | KhÃ´ng | `Male`, `Female`, `Unknown` | Giá»›i tÃ­nh |
| `breed` | `text` | CÃ³ | â€” | Giá»‘ng thÃº cÆ°ng |
| `date_of_birth` | `date` | CÃ³ | KhÃ´ng lá»›n hÆ¡n ngÃ y hiá»‡n táº¡i khi nháº­p chÃ­nh thá»©c | NgÃ y sinh; cÃ³ thá»ƒ chÆ°a biáº¿t |
| `picture_url` | `text` | CÃ³ | URL/path Storage há»£p lá»‡ | áº¢nh riÃªng cá»§a thÃº cÆ°ng; áº£nh má»›i lÃ  object path private |
| `creation_key` | `text` | CÃ³ | Unique theo `owner_id` khi khÃ¡c NULL | KhÃ³a idempotency cho cÃ¹ng má»™t láº§n táº¡o |
| `creation_payload_hash` | `text` | CÃ³ | Hash payload táº¡o tÆ°Æ¡ng á»©ng | PhÃ¡t hiá»‡n retry cÃ¹ng khÃ³a nhÆ°ng khÃ¡c dá»¯ liá»‡u |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o |
| `updated_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm cáº­p nháº­t |

### LÆ°u Ã½

- Má»™t ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ cÃ³ khÃ´ng giá»›i háº¡n sá»‘ thÃº cÆ°ng.
- Query `/register?species=cat|dog` vÃ  `/pets/new?species=...` chá»‰ lÃ  tráº¡ng thÃ¡i Ä‘iá»u hÆ°á»›ng; khÃ´ng pháº£i cá»™t riÃªng.
- Chá»‰ cháº¥p nháº­n `cat` hoáº·c `dog`; giÃ¡ trá»‹ khÃ¡c bá»‹ tá»« chá»‘i. Khi táº¡o pet, Ã¡nh xáº¡ `cat â†’ Cat` vÃ  `dog â†’ Dog` trÆ°á»›c khi ghi `pets.species`.
- Lá»±a chá»n há»£p lá»‡ pháº£i Ä‘Æ°á»£c báº£o toÃ n qua Email Confirmation Ä‘á»ƒ callback chuyá»ƒn Ä‘áº¿n `/pets/new?species=cat|dog` sau khi cÃ³ session.
- Khi `picture_url IS NULL`, frontend chá»n avatar máº·c Ä‘á»‹nh theo `species`.
- áº¢nh má»›i dÃ¹ng bucket private `pet-photos`; URL signed khÃ´ng Ä‘Æ°á»£c lÆ°u vÃ o database. URL cÅ©/legacy váº«n Ä‘Æ°á»£c giá»¯.
- `creation_key` Ä‘Æ°á»£c scope theo Owner vÃ  unique Ä‘á»ƒ retry POST khÃ´ng táº¡o Pet trÃ¹ng.
- Chá»‰ owner Ä‘Æ°á»£c sá»­a há»“ sÆ¡ thÃº cÆ°ng. Caretaker chá»‰ Ä‘Æ°á»£c xem khi quyá»n chia sáº» cÃ²n hiá»‡u lá»±c.

---

### 5.4 `public.vaccine_schedule_rules` â€” Quy táº¯c lá»‹ch vaccine

Báº£ng ná»™i bá»™ Ä‘á»ƒ backend tÃ­nh gá»£i Ã½ lá»‹ch tiáº¿p theo. Client thÃ´ng thÆ°á»ng khÃ´ng Ä‘Æ°á»£c ghi hoáº·c Ä‘á»c trá»±c tiáº¿p toÃ n bá»™ báº£ng nÃ y.

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `schedule_rule_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID quy táº¯c |
| `species` | `pet_species` | KhÃ´ng | `Dog` hoáº·c `Cat` | LoÃ i Ã¡p dá»¥ng |
| `vaccine_name` | `text` | KhÃ´ng | KhÃ´ng rá»—ng; chuáº©n hÃ³a khi so khá»›p | TÃªn vaccine/nhÃ³m vaccine |
| `min_age_days` | `integer` | KhÃ´ng | `>= 0` | Tuá»•i tá»‘i thiá»ƒu táº¡i ngÃ y tiÃªm |
| `max_age_days` | `integer` | CÃ³ | `>= min_age_days` | Tuá»•i tá»‘i Ä‘a; `NULL` nghÄ©a lÃ  khÃ´ng giá»›i háº¡n |
| `standard_interval_days` | `integer` | KhÃ´ng | `> 0` | Khoáº£ng cÃ¡ch chuáº©n Ä‘áº¿n láº§n tiáº¿p theo |
| `is_active` | `boolean` | KhÃ´ng | Default `true` | Quy táº¯c cÃ²n Ä‘Æ°á»£c sá»­ dá»¥ng hay khÃ´ng |
| `note` | `text` | CÃ³ | â€” | Ghi chÃº quáº£n trá»‹ |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o |
| `updated_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm cáº­p nháº­t |

### Thuáº­t toÃ¡n gá»£i Ã½

1. Láº¥y `pets.species` vÃ  `pets.date_of_birth`.
2. TÃ­nh `age_in_days = vaccine_date - date_of_birth`.
3. TÃ¬m quy táº¯c Ä‘ang hoáº¡t Ä‘á»™ng khá»›p `species`, tÃªn vaccine Ä‘Ã£ chuáº©n hÃ³a vÃ  khoáº£ng tuá»•i.
4. Tráº£ `suggested_next_date = vaccine_date + standard_interval_days`.
5. Náº¿u thiáº¿u ngÃ y sinh hoáº·c khÃ´ng cÃ³ quy táº¯c khá»›p, tráº£ `null`.
6. NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ sá»­a ngÃ y gá»£i Ã½ trÆ°á»›c khi xÃ¡c nháº­n táº¡o Reminder.

`dose_number` khÃ´ng tham gia nhÆ° tiÃªu chÃ­ chÃ­nh trong thuáº­t toÃ¡n nÃ y.

---

### 5.5 `public.vaccine_records` â€” Lá»‹ch sá»­ tiÃªm vaccine

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `vaccine_record_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID báº£n ghi tiÃªm |
| `pet_id` | `uuid` | KhÃ´ng | FK â†’ `public.pets.pet_id` | ThÃº cÆ°ng Ä‘Æ°á»£c tiÃªm |
| `created_by` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Owner hoáº·c caretaker Ä‘Ã£ táº¡o báº£n ghi |
| `vaccine_name` | `text` | KhÃ´ng | KhÃ´ng rá»—ng | TÃªn vaccine |
| `vaccine_date` | `date` | KhÃ´ng | Cho phÃ©p ngÃ y tÆ°Æ¡ng lai kÃ¨m cáº£nh bÃ¡o má»m | NgÃ y tiÃªm/Ä‘Æ°á»£c lÃªn káº¿ hoáº¡ch |
| `dose_number` | `integer` | CÃ³ | `> 0` náº¿u nháº­p | Sá»‘ mÅ©i tÃ¹y chá»n, phá»¥c vá»¥ mÃ´ táº£ |
| `clinic_name` | `text` | CÃ³ | â€” | CÆ¡ sá»Ÿ tiÃªm |
| `note` | `text` | CÃ³ | â€” | Ghi chÃº |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o báº£n ghi |

### KhÃ´ng tá»“n táº¡i trong báº£ng

- `next_due_date` hoáº·c `suggested_next_date`.
- NgÃ y nháº¯c chÃ­nh thá»©c thuá»™c `public.reminders.due_date`.
- KhÃ´ng cÃ³ API sá»­a/xÃ³a Vaccine Record trong MVP.

---

### 5.6 `public.reminders` â€” Nháº¯c lá»‹ch

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `reminder_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID nháº¯c lá»‹ch |
| `user_id` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Owner chá»‹u trÃ¡ch nhiá»‡m vá»›i reminder |
| `pet_id` | `uuid` | KhÃ´ng | FK â†’ `public.pets.pet_id` | ThÃº cÆ°ng liÃªn quan |
| `source_vaccine_record_id` | `uuid` | CÃ³ | FK â†’ `public.vaccine_records.vaccine_record_id` | Nguá»“n vaccine náº¿u reminder Ä‘Æ°á»£c táº¡o tá»« gá»£i Ã½ |
| `due_date` | `date` | KhÃ´ng | â€” | NgÃ y nháº¯c do owner xÃ¡c nháº­n; cho phÃ©p ngÃ y quÃ¡ khá»© |
| `type` | `reminder_type` | KhÃ´ng | Enum há»£p lá»‡ | Loáº¡i nháº¯c |
| `status` | `reminder_status` | KhÃ´ng | Default `Upcoming` | Tráº¡ng thÃ¡i lÆ°u trá»¯ |
| `note` | `text` | CÃ³ | â€” | Ghi chÃº |
| `completed_at` | `timestamptz` | CÃ³ | CÃ³ khi `status = Completed` | Thá»i Ä‘iá»ƒm hoÃ n thÃ nh |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o |

### Quy táº¯c

- Chá»‰ táº¡o khi owner xÃ¡c nháº­n, ká»ƒ cáº£ khi backend Ä‘Ã£ tráº£ ngÃ y gá»£i Ã½.
- Cho phÃ©p nhiá»u reminder trÃ¹ng ngÃ y hoáº·c cÃ¹ng loáº¡i.
- `user_id` pháº£i lÃ  `owner_id` cá»§a `pet_id`.
- Náº¿u cÃ³ `source_vaccine_record_id`, vaccine record pháº£i thuá»™c cÃ¹ng `pet_id`.
- Caretaker chá»‰ Ä‘Æ°á»£c xem reminder cá»§a pet Ä‘Æ°á»£c chia sáº»; khÃ´ng Ä‘Æ°á»£c táº¡o/sá»­a/hoÃ n thÃ nh/xÃ³a.
- Chá»‰ owner Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u hoÃ n thÃ nh.

### Tráº¡ng thÃ¡i hiá»ƒn thá»‹ suy ra

```text
display_status =
  Completed, náº¿u status = Completed
  Overdue,   náº¿u status = Upcoming vÃ  due_date < current_date
  Upcoming,  trong cÃ¡c trÆ°á»ng há»£p cÃ²n láº¡i
```

KhÃ´ng táº¡o cá»™t `display_status` hoáº·c lÆ°u giÃ¡ trá»‹ `Overdue`.

---

### 5.7 `public.medical_records` â€” Há»“ sÆ¡ khÃ¡m bá»‡nh

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `record_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID há»“ sÆ¡ y táº¿ |
| `pet_id` | `uuid` | KhÃ´ng | FK â†’ `public.pets.pet_id` | ThÃº cÆ°ng liÃªn quan |
| `created_by` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Owner hoáº·c caretaker táº¡o há»“ sÆ¡ |
| `visit_date` | `date` | KhÃ´ng | â€” | NgÃ y khÃ¡m báº¯t buá»™c |
| `diagnosis` | `text` | CÃ³ | â€” | Cháº©n Ä‘oÃ¡n |
| `symptoms` | `text` | CÃ³ | â€” | Triá»‡u chá»©ng |
| `medication` | `text` | CÃ³ | â€” | Thuá»‘c/Ä‘iá»u trá»‹ |
| `clinic_name` | `text` | CÃ³ | â€” | TÃªn cÆ¡ sá»Ÿ khÃ¡m |
| `note` | `text` | CÃ³ | â€” | Ghi chÃº |
| `created_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº¡o |

KhÃ´ng cÃ³ API sá»­a/xÃ³a Medical Record trong MVP. Lá»‹ch sá»­ Ä‘Æ°á»£c sáº¯p xáº¿p má»›i nháº¥t trÆ°á»›c vÃ  cÃ³ thá»ƒ lá»c theo loáº¡i/ngÃ y.

---

### 5.8 `public.medical_attachments` â€” Tá»‡p há»“ sÆ¡ y táº¿

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `attachment_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID tá»‡p |
| `record_id` | `uuid` | KhÃ´ng | FK â†’ `public.medical_records.record_id` | Há»“ sÆ¡ y táº¿ chá»©a tá»‡p |
| `uploaded_by` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | NgÆ°á»i táº£i lÃªn, phá»¥c vá»¥ audit |
| `file_url` | `text` | KhÃ´ng | Storage path/URL há»£p lá»‡ | ÄÆ°á»ng dáº«n tá»‡p |
| `file_type` | `attachment_file_type` | KhÃ´ng | `jpg`, `jpeg`, `png`, `pdf` | Loáº¡i tá»‡p |
| `file_size` | `bigint` | KhÃ´ng | `> 0` vÃ  `<= 5 * 1024 * 1024` | KÃ­ch thÆ°á»›c byte, tá»‘i Ä‘a 5 MB |
| `uploaded_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm táº£i lÃªn |

Storage policy pháº£i Ä‘á»“ng bá»™ vá»›i RLS cá»§a Medical Record: owner vÃ  caretaker cÃ²n quyá»n cÃ³ thá»ƒ xem/táº£i lÃªn; khÃ´ng cÃ³ thao tÃ¡c sá»­a/xÃ³a trong MVP.

---

### 5.9 `public.health_logs` â€” Nháº­t kÃ½ sá»©c khá»e (Phase 2)

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `health_log_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID nháº­t kÃ½ |
| `pet_id` | `uuid` | KhÃ´ng | FK â†’ `public.pets.pet_id` | ThÃº cÆ°ng liÃªn quan |
| `created_by` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Owner hoáº·c caretaker táº¡o |
| `weight` | `numeric(6,2)` | CÃ³ | `> 0` náº¿u nháº­p | CÃ¢n náº·ng, Ä‘Æ¡n vá»‹ kg |
| `food_amount` | `text` | CÃ³ | â€” | LÆ°á»£ng thá»©c Äƒn, giá»¯ cáº£ sá»‘ vÃ  Ä‘Æ¡n vá»‹ ngÆ°á»i dÃ¹ng nháº­p |
| `food_type` | `text` | CÃ³ | â€” | Loáº¡i thá»©c Äƒn |
| `status` | `text` | CÃ³ | â€” | Tráº¡ng thÃ¡i/tÃ¬nh tráº¡ng tá»•ng quÃ¡t |
| `note` | `text` | CÃ³ | â€” | Ghi chÃº |
| `logged_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm ghi nháº­n |
| `recorded_on` | `date` | KhÃ´ng | KhÃ´ng á»Ÿ tÆ°Æ¡ng lai theo `Asia/Ho_Chi_Minh` | NgÃ y nháº­t kÃ½ do ngÆ°á»i dÃ¹ng chá»n |

Pháº£i cÃ³ Ã­t nháº¥t má»™t trong `weight`, `food_amount`, `food_type`, `status`, `note`. Má»—i láº§n ghi nháº­n táº¡o báº£n ghi má»›i. Owner Ä‘Æ°á»£c sá»­a cÃ¡c trÆ°á»ng nghiá»‡p vá»¥ (cÃ³ thá»ƒ xÃ³a giÃ¡ trá»‹ tÃ¹y chá»n nhÆ°ng váº«n pháº£i cÃ²n Ã­t nháº¥t má»™t trÆ°á»ng) hoáº·c xÃ³a sau xÃ¡c nháº­n; `health_log_id`, `pet_id`, `created_by`, `logged_at` lÃ  báº¥t biáº¿n. Caretaker khÃ´ng Ä‘Æ°á»£c sá»­a/xÃ³a.

---

### 5.10 `public.pet_access` â€” Chia sáº» ngÆ°á»i chÄƒm sÃ³c (Phase 2)

| Cá»™t | Kiá»ƒu | Null | KhÃ³a/RÃ ng buá»™c | MÃ´ táº£ |
|---|---|---:|---|---|
| `access_id` | `uuid` | KhÃ´ng | PK, default `gen_random_uuid()` | ID quyá»n truy cáº­p |
| `pet_id` | `uuid` | KhÃ´ng | FK â†’ `public.pets.pet_id` | ThÃº cÆ°ng Ä‘Æ°á»£c chia sáº» |
| `granted_by` | `uuid` | KhÃ´ng | FK â†’ `public.users.user_id` | Owner cáº¥p quyá»n |
| `caretaker_email` | `text` | KhÃ´ng | Lowercase/trim, email há»£p lá»‡ | Email Ä‘Æ°á»£c má»i; dÃ¹ng cáº£ khi tÃ i khoáº£n chÆ°a tá»“n táº¡i |
| `caretaker_id` | `uuid` | CÃ³ | FK â†’ `public.users.user_id` | `NULL` khi lá»i má»i cÃ²n Pending |
| `pet_name_snapshot` | `text` | CÃ³ | TÃªn táº¡i thá»i Ä‘iá»ƒm má»i | Hiá»ƒn thá»‹ Ä‘á»ƒ nháº­n biáº¿t lá»i má»i mÃ  chÆ°a cáº§n Ä‘á»c há»“ sÆ¡ |
| `valid_until` | `date` | KhÃ´ng | KhÃ´ng sá»›m hÆ¡n ngÃ y cáº¥p khi táº¡o | NgÃ y háº¿t hiá»‡u lá»±c báº¯t buá»™c |
| `status` | `pet_access_status` | KhÃ´ng | `Pending`, `Active`, `Revoked` | Tráº¡ng thÃ¡i lÆ°u trá»¯ |
| `granted_at` | `timestamptz` | KhÃ´ng | Default `now()` | Thá»i Ä‘iá»ƒm cáº¥p/má»i |
| `activated_at` | `timestamptz` | CÃ³ | â€” | Thá»i Ä‘iá»ƒm lá»i má»i kÃ­ch hoáº¡t |
| `revoked_at` | `timestamptz` | CÃ³ | â€” | Thá»i Ä‘iá»ƒm thu há»“i |

### Quy táº¯c lá»i má»i

- Má»i email Ä‘á»u báº¯t Ä‘áº§u á»Ÿ tráº¡ng thÃ¡i `Pending`; thÃ´ng bÃ¡o khÃ´ng tiáº¿t lá»™ email Ä‘Ã£ cÃ³ tÃ i khoáº£n hay chÆ°a.
- Sau khi Ä‘Äƒng nháº­p báº±ng email Ä‘Ã£ xÃ¡c minh vÃ  cháº¥p nháº­n, server gáº¯n `caretaker_id` tá»« phiÃªn vÃ  chuyá»ƒn `Active` náº¿u váº«n cÃ²n háº¡n.
- Owner khÃ´ng Ä‘Æ°á»£c chia sáº» cho chÃ­nh mÃ¬nh.
- Chá»‰ owner Ä‘Æ°á»£c cáº¥p hoáº·c thu há»“i quyá»n.
- Caretaker khÃ´ng Ä‘Æ°á»£c chia sáº» tiáº¿p vÃ  trong Phase 2.1 khÃ´ng cÃ³ quyá»n Ä‘á»c Health Log, Reminder hoáº·c Notification.
- Thu há»“i cÃ³ hiá»‡u lá»±c ngay láº­p tá»©c.
- Quyá»n hiá»‡u lá»±c khi `status = Active`, `caretaker_id` khá»›p ngÆ°á»i dÃ¹ng hiá»‡n táº¡i vÃ  `valid_until >= current_date`.

---

## 6. Dá»¯ liá»‡u suy ra hoáº·c chá»‰ tá»“n táº¡i táº¡m thá»i

CÃ¡c giÃ¡ trá»‹ sau khÃ´ng Ä‘Æ°á»£c táº¡o thÃ nh cá»™t lÆ°u trá»¯ Ä‘á»™c láº­p:

| GiÃ¡ trá»‹ | Nguá»“n tÃ­nh/giá»¯ | LÃ½ do khÃ´ng lÆ°u |
|---|---|---|
| `password_hash` | Supabase Auth | TrÃ¡nh trÃ¹ng láº·p vÃ  rá»§i ro báº£o máº­t |
| `selected_species` á»Ÿ Home | Query `species=cat|dog` | Chá»‰ lÃ  tráº¡ng thÃ¡i onboarding trÆ°á»›c khi táº¡o pet |
| Avatar máº·c Ä‘á»‹nh | Frontend chá»n theo `pets.species` | KhÃ´ng lÆ°u cÃ¹ng URL máº·c Ä‘á»‹nh cho má»i pet |
| Tuá»•i thÃº cÆ°ng | `current_date - date_of_birth` hoáº·c táº¡i `vaccine_date` | Thay Ä‘á»•i theo thá»i gian/ngá»¯ cáº£nh |
| `suggested_next_date` | Backend + `vaccine_schedule_rules` | Chá»‰ lÃ  gá»£i Ã½, chÆ°a pháº£i dá»¯ liá»‡u Ä‘Ã£ xÃ¡c nháº­n |
| `next_due_date` | KhÃ´ng sá»­ dá»¥ng | NgÃ y nháº¯c chÃ­nh thá»©c náº±m trong `reminders.due_date` |
| `display_status`/`Overdue` | `reminders.status` + `due_date` | LÃ  tráº¡ng thÃ¡i trÃ¬nh bÃ y |
| `pet_access` háº¿t háº¡n | `valid_until < current_date` | CÃ³ thá»ƒ suy ra; khÃ´ng cáº§n tráº¡ng thÃ¡i lÆ°u `Expired` |
| Dashboard metrics | Truy váº¥n tá»•ng há»£p | TrÃ¡nh dá»¯ liá»‡u tá»•ng há»£p bá»‹ lá»‡ch nguá»“n |

---

## 7. Quan há»‡ dá»¯ liá»‡u

| Quan há»‡ | Cardinality |
|---|---|
| `auth.users` â€” `public.users` | 1 â€” 1 |
| `users` â€” `pets` (owner) | 1 â€” N |
| `pets` â€” `vaccine_records` | 1 â€” N |
| `pets` â€” `medical_records` | 1 â€” N |
| `medical_records` â€” `medical_attachments` | 1 â€” N |
| `pets` â€” `reminders` | 1 â€” N |
| `vaccine_records` â€” `reminders` | 1 â€” 0..N, liÃªn káº¿t tÃ¹y chá»n |
| `pets` â€” `health_logs` | 1 â€” N |
| `pets` â€” `pet_access` | 1 â€” N |
| `users` â€” báº£n ghi qua `created_by` | 1 â€” N |

---

## 8. Ma tráº­n quyá»n RLS tá»‘i thiá»ƒu

| Báº£ng | Owner | Caretaker Active, cÃ²n háº¡n | NgÆ°á»i khÃ¡c |
|---|---|---|---|
| `users` | Xem há»“ sÆ¡ cá»§a chÃ­nh mÃ¬nh; chá»‰ sá»­a `name`, `phone_number` | Chá»‰ há»“ sÆ¡ cá»§a chÃ­nh mÃ¬nh; chá»‰ sá»­a `name`, `phone_number` | KhÃ´ng |
| `pets` | Xem, táº¡o, sá»­a pet cá»§a mÃ¬nh | Chá»‰ xem pet Ä‘Æ°á»£c chia sáº» | KhÃ´ng |
| `vaccine_records` | Xem, thÃªm | Xem, thÃªm | KhÃ´ng |
| `medical_records` | Xem, thÃªm | Xem, thÃªm | KhÃ´ng |
| `medical_attachments` | Xem, thÃªm | Xem, thÃªm | KhÃ´ng |
| `reminders` | Xem, táº¡o, sá»­a tráº¡ng thÃ¡i | Chá»‰ xem | KhÃ´ng |
| `health_logs` | Xem, thÃªm, sá»­a, xÃ³a | KhÃ´ng truy cáº­p trong Phase 2.1 | KhÃ´ng |
| `pet_access` | Xem, cáº¥p, thu há»“i trÃªn pet cá»§a mÃ¬nh | Xem quyá»n cá»§a chÃ­nh mÃ¬nh | KhÃ´ng |
| `vaccine_schedule_rules` | KhÃ´ng truy cáº­p trá»±c tiáº¿p | KhÃ´ng truy cáº­p trá»±c tiáº¿p | KhÃ´ng; backend/service role quáº£n lÃ½ |

Vá»›i Vaccine Record vÃ  Medical Record, MVP/Business Rules khÃ´ng cho sá»­a/xÃ³a báº£n ghi lá»‹ch sá»­ Ä‘Ã£ táº¡o. Health Log lÃ  ngoáº¡i lá»‡: Owner cÃ³ thá»ƒ sá»­a cÃ¡c trÆ°á»ng nghiá»‡p vá»¥ Ä‘Æ°á»£c cho phÃ©p hoáº·c xÃ³a sau xÃ¡c nháº­n; Caretaker Phase 2.1 chá»‰ Ä‘á»c Vaccine/Medical dáº¡ng vÄƒn báº£n.

---

## 9. Chá»‰ má»¥c vÃ  rÃ ng buá»™c Ä‘á» xuáº¥t

| Báº£ng | Chá»‰ má»¥c/rÃ ng buá»™c |
|---|---|
| `users` | CHECK `email = lower(trim(email))`; má»™t UNIQUE constraint trÃªn `email`; khÃ´ng táº¡o expression unique index trÃ¹ng chá»©c nÄƒng; trigger `BEFORE UPDATE` cáº­p nháº­t `updated_at` |
| `pets` | INDEX `(owner_id, created_at DESC)` |
| `vaccine_schedule_rules` | INDEX `(species, lower(vaccine_name), is_active)`; trÃ¡nh khoáº£ng tuá»•i chá»“ng láº¥n cho cÃ¹ng rule |
| `vaccine_records` | INDEX `(pet_id, vaccine_date DESC)`; INDEX `created_by` |
| `medical_records` | INDEX `(pet_id, visit_date DESC)`; INDEX `created_by` |
| `medical_attachments` | INDEX `record_id` |
| `reminders` | INDEX `(user_id, due_date, status)`; INDEX `(pet_id, due_date)` |
| `health_logs` | INDEX `(pet_id, logged_at DESC)` |
| `pet_access` | INDEX `(caretaker_id, status, valid_until)`; INDEX `(pet_id, status)`; háº¡n cháº¿ quyá»n active trÃ¹ng cho cÃ¹ng pet/caretaker |

KhÃ´ng Ä‘áº·t UNIQUE trÃªn Reminder theo ngÃ y/loáº¡i vÃ¬ Business Rules cho phÃ©p trÃ¹ng.

---

## 10. Supabase Storage

Äá» xuáº¥t tÃ¡ch bucket hoáº·c prefix:

| NhÃ³m | Ná»™i dung | Quyá»n |
|---|---|---|
| `pet-photos` | áº¢nh Ä‘áº¡i diá»‡n thÃº cÆ°ng JPG/PNG/WebP, tá»‘i Ä‘a 5 MB | Private; Owner cá»§a Pet upload/Ä‘á»c/xÃ³a theo prefix user |
| `medical-attachments` | JPG/PNG/PDF tá»‘i Ä‘a 5 MB | Owner/caretaker active Ä‘Æ°á»£c Ä‘á»c vÃ  thÃªm theo quyá»n Medical Record |

KhÃ´ng dÃ¹ng public bucket cho há»“ sÆ¡ y táº¿. Storage policies pháº£i kiá»ƒm tra quyá»n dá»±a trÃªn `pet_id`/`record_id`, tÆ°Æ¡ng thÃ­ch vá»›i RLS báº£ng dá»¯ liá»‡u.

---

## 11. Thay Ä‘á»•i so vá»›i Data Dictionary cÅ©

| Ná»™i dung cÅ© | Báº£n 2.0 |
|---|---|
| ID dáº¡ng `VARCHAR(36)` | DÃ¹ng PostgreSQL `uuid` |
| `users.password_hash` | Loáº¡i bá»; Supabase Auth quáº£n lÃ½ |
| `DATETIME` | DÃ¹ng `timestamptz` |
| ChÆ°a cÃ³ báº£ng quy táº¯c lá»‹ch tiÃªm | ThÃªm `vaccine_schedule_rules` cho backend |
| CÃ³ thá»ƒ hiá»ƒu ngÃ y tiÃªm káº¿ tiáº¿p thuá»™c Vaccine Record | Kháº³ng Ä‘á»‹nh khÃ´ng lÆ°u; Reminder giá»¯ `due_date` |
| Gá»£i Ã½ lá»‹ch dá»±a vÃ o sá»‘ mÅ©i | Dá»±a vÃ o loÃ i + tÃªn vaccine + Ä‘á»™ tuá»•i; sá»‘ mÅ©i tÃ¹y chá»n |
| `pet_access.caretaker_id` báº¯t buá»™c | Cho phÃ©p `NULL` Ä‘á»ƒ há»— trá»£ email chÆ°a Ä‘Äƒng kÃ½ |
| Pet Access khÃ´ng lÆ°u email lá»i má»i | ThÃªm `caretaker_email` báº¯t buá»™c |
| Thiáº¿u audit lá»i má»i/thu há»“i | ThÃªm `activated_at`, `revoked_at` |
| Reminder chá»‰ cÃ³ status Ä‘Æ¡n giáº£n | LÃ m rÃµ status lÆ°u trá»¯ vÃ  `Overdue` suy ra |
| Health Log khÃ´ng báº¯t buá»™c ná»™i dung | ThÃªm CHECK pháº£i cÃ³ Ã­t nháº¥t má»™t dá»¯ liá»‡u sá»©c khá»e |
| Attachment thiáº¿u ngÆ°á»i táº£i lÃªn | ThÃªm `uploaded_by` Ä‘á»ƒ audit vÃ  Ã¡p dá»¥ng RLS |
| ChÆ°a mÃ´ táº£ RLS | Bá»• sung ma tráº­n quyá»n theo Owner/Caretaker |

---

## 12. Checklist triá»ƒn khai Supabase

- [ ] DÃ¹ng Supabase Auth cho email/password; báº­t Email Confirmation.
- [ ] Triá»ƒn khai Google OAuth á»Ÿ checkpoint riÃªng; trÆ°á»›c Ä‘Ã³ khÃ´ng hiá»ƒn thá»‹ nÃºt Google nhÆ° chá»©c nÄƒng kháº£ dá»¥ng.
- [ ] Táº¡o trigger hoáº·c server callback Ä‘á»ƒ Ä‘á»“ng bá»™ `auth.users` â†’ `public.users` vÃ  sinh `name` máº·c Ä‘á»‹nh.
- [ ] DÃ¹ng FK `public.users.user_id â†’ auth.users.id` vá»›i `ON DELETE RESTRICT`/`NO ACTION`; khÃ´ng hard-delete tÃ i khoáº£n trong MVP.
- [ ] Táº¡o trigger `BEFORE UPDATE` cho `public.users.updated_at`.
- [ ] Giá»›i háº¡n quyá»n update client trÃªn `public.users` á»Ÿ `name`, `phone_number`.
- [ ] DÃ¹ng `@supabase/ssr`, tÃ¡ch browser/server client, refresh cookie/session vÃ  báº£o vá»‡ route phÃ­a server.
- [ ] DÃ¹ng chung `/auth/callback` cho Email Confirmation vÃ  Google OAuth; exchange code vÃ  chá»‰ redirect tá»›i internal path Ä‘Ã£ kiá»ƒm tra.
- [ ] KhÃ´ng Ä‘Æ°a service-role key vÃ o client hoáº·c biáº¿n mÃ´i trÆ°á»ng `NEXT_PUBLIC_*`.
- [ ] KhÃ´ng táº¡o cá»™t `password_hash` trong schema public.
- [ ] Báº­t RLS trÃªn táº¥t cáº£ báº£ng dá»¯ liá»‡u ngÆ°á»i dÃ¹ng.
- [ ] Táº¡o policy Owner/Caretaker Ä‘Ãºng ma tráº­n quyá»n.
- [ ] Táº¡o vÃ  seed `vaccine_schedule_rules` tá»« nguá»“n quy táº¯c nghiá»‡p vá»¥ Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t.
- [ ] TÃ­nh gá»£i Ã½ lá»‹ch vaccine á»Ÿ backend; khÃ´ng tin dá»¯ liá»‡u tuá»•i/interval do client gá»­i.
- [ ] Chá»‰ táº¡o Reminder sau khi owner xÃ¡c nháº­n ngÃ y.
- [ ] Ãp dá»¥ng Storage policy vÃ  giá»›i háº¡n loáº¡i/kÃ­ch thÆ°á»›c tá»‡p.
- [ ] Kiá»ƒm tra constraint liÃªn báº£ng: owner cá»§a Reminder, source vaccine cÃ¹ng pet, ngÆ°á»i cáº¥p quyá»n lÃ  owner.

## notification_events (Notification Phase 1)

| Column | Type | Rule |
|---|---|---|
| notification_event_id | uuid | PK, generated |
| user_id | uuid | Owner, FK users |
| reminder_id | uuid | FK reminders, ON DELETE CASCADE |
| event_type | text | `due_soon` hoáº·c `overdue` |
| due_date_snapshot | date | NgÃ y háº¹n táº¡i lÃºc táº¡o lá»‹ch |
| scheduled_for | timestamptz | D-2/D+2 lÃºc 08:00 Asia/Ho_Chi_Minh |
| read_at | timestamptz nullable | Chá»‰ trÆ°á»ng client Ä‘Æ°á»£c phÃ©p cáº­p nháº­t |
| cancelled_at | timestamptz nullable | Há»§y khi Ä‘á»•i ngÃ y/hoÃ n thÃ nh |
| created_at, updated_at | timestamptz | Audit timestamps |

Partial unique index báº£o Ä‘áº£m tá»‘i Ä‘a má»™t event Ä‘ang hoáº¡t Ä‘á»™ng cho `(reminder_id, event_type, due_date_snapshot)` nhÆ°ng váº«n giá»¯ lá»‹ch sá»­ Ä‘Ã£ há»§y.

Notification query dÃ¹ng `overdue` thay `due_soon` sau D+2; event tÆ°Æ¡ng lai, Ä‘Ã£ há»§y hoáº·c Reminder Completed khÃ´ng pháº£i notification hiá»‡n hÃ nh.
- [ ] Kiá»ƒm thá»­ RLS báº±ng Ã­t nháº¥t ba tÃ i khoáº£n: owner, caretaker vÃ  ngÆ°á»i khÃ´ng cÃ³ quyá»n.

---

**Káº¿t luáº­n:** Schema nÃ y phÃ¢n tÃ¡ch rÃµ dá»¯ liá»‡u xÃ¡c thá»±c, dá»¯ liá»‡u nghiá»‡p vá»¥ Ä‘Æ°á»£c lÆ°u, dá»¯ liá»‡u suy ra vÃ  dá»¯ liá»‡u chá»‰ dÃ¹ng trong luá»“ng giao diá»‡n. ÄÃ¢y lÃ  báº£n Data Dictionary nÃªn Ä‘Æ°á»£c dÃ¹ng lÃ m nguá»“n chuáº©n khi táº¡o migration Supabase, TypeScript types vÃ  triá»ƒn khai API MMinCare.

