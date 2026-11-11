# MMinCare â€” Business Rules Document

**Scope:** MVP  
**Version:** 1.2  
**Source:** 14 User Stories, Acceptance Criteria, Data Dictionary vÃ  cÃ¡c quyáº¿t Ä‘á»‹nh sáº£n pháº©m Ä‘Ã£ chá»‘t

## 1. Má»¥c Ä‘Ã­ch

TÃ i liá»‡u nÃ y lÃ  nguá»“n tham chiáº¿u nghiá»‡p vá»¥ thá»‘ng nháº¥t cho MMinCare. Business Rules Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ:

- Thiáº¿t káº¿ giao diá»‡n, API vÃ  database.
- Triá»ƒn khai validation vÃ  authorization.
- Viáº¿t test case vÃ  RTM.
- Kiá»ƒm soÃ¡t sá»± nháº¥t quÃ¡n giá»¯a User Story, API, ERD vÃ  source code.

## 2. Quy Æ°á»›c

MÃ£ rule cÃ³ cáº¥u trÃºc `BR-[NHÃ“M]-[STT]`, vÃ­ dá»¥ `BR-VAC-03`.

| Rule Type | Ã nghÄ©a |
|---|---|
| Validation | Äiá»u kiá»‡n há»£p lá»‡ cá»§a dá»¯ liá»‡u Ä‘áº§u vÃ o |
| Authorization | Quyá»n truy cáº­p hoáº·c hÃ nh Ä‘á»™ng theo vai trÃ² |
| Process | TrÃ¬nh tá»± vÃ  tráº¡ng thÃ¡i cá»§a luá»“ng nghiá»‡p vá»¥ |
| Data Integrity | TÃ­nh nháº¥t quÃ¡n giá»¯a cÃ¡c entity |
| Computation / Derivation | GiÃ¡ trá»‹ do há»‡ thá»‘ng tÃ­nh hoáº·c suy ra |
| Constraint | Giá»›i háº¡n sá»‘ lÆ°á»£ng, dung lÆ°á»£ng hoáº·c pháº¡m vi |
| Security | Quy táº¯c báº£o máº­t |
| Data Definition | Dá»¯ liá»‡u báº¯t buá»™c, tÃ¹y chá»n hoáº·c táº­p giÃ¡ trá»‹ |
| Data Standardization | Chuáº©n hÃ³a dá»¯ liá»‡u trÆ°á»›c khi lÆ°u/so khá»›p |
| Display | Quy táº¯c hiá»ƒn thá»‹ |
| Audit | LÆ°u dáº¥u ngÆ°á»i táº¡o hoáº·c hÃ nh Ä‘á»™ng |
| Default Value | GiÃ¡ trá»‹ máº·c Ä‘á»‹nh |

## 3. Danh má»¥c Business Rules

### 3.1. TÃ i khoáº£n vÃ  xÃ¡c thá»±c (AUTH)

Nguá»“n: US-01, US-02 vÃ  quyáº¿t Ä‘á»‹nh xÃ¡c thá»±c Ä‘Ã£ chá»‘t.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-AUTH-01 | Email pháº£i lÃ  duy nháº¥t trong toÃ n há»‡ thá»‘ng. | Data Integrity | US-01 |
| BR-AUTH-02 | Máº­t kháº©u pháº£i cÃ³ tá»‘i thiá»ƒu 8 kÃ½ tá»± vÃ  chá»©a Ã­t nháº¥t 1 chá»¯ sá»‘. | Validation | US-01 |
| BR-AUTH-03 | Email Ä‘Æ°á»£c trim khoáº£ng tráº¯ng Ä‘áº§u/cuá»‘i vÃ  chuáº©n hÃ³a vá» chá»¯ thÆ°á»ng trÆ°á»›c khi validate, lÆ°u hoáº·c so khá»›p. | Data Standardization | US-01 |
| BR-AUTH-04 | Há»‡ thá»‘ng cháº·n submit khi cÃ²n trÆ°á»ng báº¯t buá»™c trá»‘ng hoáº·c dá»¯ liá»‡u sai Ä‘á»‹nh dáº¡ng; lá»—i Ä‘Æ°á»£c hiá»ƒn thá»‹ táº¡i trÆ°á»ng liÃªn quan. | Validation | US-01, US-03 |
| BR-AUTH-05 | Khi Ä‘Äƒng nháº­p tháº¥t báº¡i, há»‡ thá»‘ng chá»‰ tráº£ thÃ´ng bÃ¡o chung â€œEmail hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºngâ€, khÃ´ng tiáº¿t lá»™ thÃ´ng tin nÃ o sai. | Security | US-02 |
| BR-AUTH-06 | PhiÃªn Ä‘Äƒng nháº­p Ä‘Æ°á»£c duy trÃ¬ cho Ä‘áº¿n khi ngÆ°á»i dÃ¹ng chá»§ Ä‘á»™ng Ä‘Äƒng xuáº¥t hoáº·c phiÃªn háº¿t hiá»‡u lá»±c theo cÆ¡ cháº¿ báº£o máº­t cá»§a há»‡ thá»‘ng. | Process / Security | US-02 |
| BR-AUTH-07 | `name` lÃ  dá»¯ liá»‡u báº¯t buá»™c cá»§a há»“ sÆ¡ nhÆ°ng khÃ´ng báº¯t buá»™c ngÆ°á»i dÃ¹ng nháº­p trÃªn form Ä‘Äƒng kÃ½. Vá»›i email/password, há»‡ thá»‘ng táº¡o `name` tá»« pháº§n trÆ°á»›c kÃ½ tá»± `@`. Vá»›i Google OAuth, há»‡ thá»‘ng Æ°u tiÃªn tÃªn do Google cung cáº¥p; náº¿u khÃ´ng cÃ³ thÃ¬ dÃ¹ng pháº§n trÆ°á»›c `@` cá»§a email. | Computation / Default Value | US-01, US-02; Product Decision |
| BR-AUTH-08 | Há»‡ thá»‘ng cho phÃ©p Ä‘Äƒng nháº­p báº±ng Google OAuth. Sau khi Google xÃ¡c thá»±c thÃ nh cÃ´ng, há»‡ thá»‘ng táº¡o hoáº·c truy xuáº¥t há»“ sÆ¡ theo email Ä‘Ã£ Ä‘Æ°á»£c provider xÃ¡c minh vÃ  Ã¡p dá»¥ng BR-AUTH-07 Ä‘á»ƒ xÃ¡c Ä‘á»‹nh `name`. | Process / Security | US-02; Product Decision |
| BR-AUTH-09 | Supabase Email Confirmation Ä‘Æ°á»£c báº­t. Sau Ä‘Äƒng kÃ½, náº¿u chÆ°a cÃ³ session, há»‡ thá»‘ng yÃªu cáº§u ngÆ°á»i dÃ¹ng kiá»ƒm tra email; chá»‰ Ä‘iá»u hÆ°á»›ng vÃ o khu vá»±c Ä‘Ã£ xÃ¡c thá»±c sau khi callback hoÃ n táº¥t vÃ  session há»£p lá»‡. | Process / Security | Product Decision; ADL-002 |
| BR-AUTH-10 | `/auth/callback` dÃ¹ng chung cho Email Confirmation vÃ  Google OAuth: exchange authorization code láº¥y session, chá»‰ cháº¥p nháº­n `next` lÃ  internal path há»£p lá»‡ vÃ  dÃ¹ng fallback an toÃ n náº¿u `next` khÃ´ng há»£p lá»‡. | Process / Security | Product Decision; ADL-003 |
| BR-AUTH-11 | MVP khÃ´ng há»— trá»£ hard-delete tÃ i khoáº£n. KhÃ´ng cascade xÃ³a pet hoáº·c lá»‹ch sá»­ chÄƒm sÃ³c; nhu cáº§u vÃ´ hiá»‡u hÃ³a/xÃ³a vá» sau dÃ¹ng soft delete hoáº·c tráº¡ng thÃ¡i inactive. | Data Integrity / Security | Product Decision; ADL-001 |
| BR-AUTH-12 | Sau Ä‘Äƒng nháº­p email/password thÃ nh cÃ´ng, há»‡ thá»‘ng Ä‘iá»u hÆ°á»›ng Ä‘áº¿n `/dashboard`. Trong MVP Ä‘Ã¢y lÃ  landing/pet-list cÆ¡ báº£n; dashboard phÃ¢n tÃ­ch nÃ¢ng cao váº«n thuá»™c Phase 2. | Process / Display | Product Decision; ADL-004 |
| BR-AUTH-13 | Lá»±a chá»n onboarding chá»‰ cháº¥p nháº­n `species=cat|dog`, pháº£i Ä‘Æ°á»£c báº£o toÃ n qua Email Confirmation vÃ  Ã¡nh xáº¡ `cat â†’ Cat`, `dog â†’ Dog` khi táº¡o pet. GiÃ¡ trá»‹ khÃ¡c bá»‹ tá»« chá»‘i vÃ  khÃ´ng Ä‘Æ°á»£c ghi database. | Validation / Process | Product Decision; ADL-005 |
| BR-AUTH-14 | Há»“ sÆ¡ `public.users` Ä‘Æ°á»£c táº¡o/Ä‘á»“ng bá»™ tá»« `auth.users` báº±ng cÆ¡ cháº¿ tin cáº­y phÃ­a server hoáº·c trigger. Client chá»‰ Ä‘Æ°á»£c sá»­a `name` vÃ  `phone_number`; khÃ´ng Ä‘Æ°á»£c sá»­a `user_id`, `email`, `created_at`. | Authorization / Data Integrity | Product Decision; ADL-007 |

### 3.2. Há»“ sÆ¡ thÃº cÆ°ng (PET)

Nguá»“n: US-03, US-04, US-05.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-PET-01 | TrÆ°á»ng báº¯t buá»™c khi táº¡o há»“ sÆ¡ thÃº cÆ°ng gá»“m tÃªn, loÃ i vÃ  giá»›i tÃ­nh. LoÃ i chá»‰ nháº­n Dog hoáº·c Cat. | Validation | US-03 |
| BR-PET-02 | Giá»‘ng, ngÃ y sinh vÃ  áº£nh Ä‘áº¡i diá»‡n lÃ  cÃ¡c trÆ°á»ng tÃ¹y chá»n. | Data Definition | US-03 |
| BR-PET-03 | Má»™t tÃ i khoáº£n Ä‘Æ°á»£c táº¡o khÃ´ng giá»›i háº¡n sá»‘ há»“ sÆ¡ thÃº cÆ°ng trong MVP. | Constraint | US-03 |
| BR-PET-04 | Náº¿u khÃ´ng cÃ³ áº£nh Ä‘áº¡i diá»‡n, há»‡ thá»‘ng hiá»ƒn thá»‹ avatar máº·c Ä‘á»‹nh theo loÃ i chÃ³/mÃ¨o. | Computation / Default Value | US-03 AC-03 |
| BR-PET-05 | Owner chá»‰ tháº¥y pet do mÃ¬nh sá»Ÿ há»¯u; Caretaker chá»‰ tháº¥y pet Ä‘Æ°á»£c chia sáº» riÃªng cho mÃ¬nh vÃ  quyá»n váº«n cÃ²n hiá»‡u lá»±c. | Authorization | US-04, US-14 |
| BR-PET-06 | Chá»‰ Owner Ä‘Æ°á»£c chá»‰nh sá»­a thÃ´ng tin há»“ sÆ¡ cÆ¡ báº£n cá»§a pet; Caretaker khÃ´ng cÃ³ quyá»n chá»‰nh sá»­a. | Authorization | US-05 |
| BR-PET-07 | áº¢nh Ä‘áº¡i diá»‡n pet chá»‰ há»— trá»£ Ä‘á»‹nh dáº¡ng jpg/png vÃ  pháº£i náº±m trong giá»›i háº¡n dung lÆ°á»£ng há»‡ thá»‘ng cho phÃ©p. | Constraint | US-03 |

### 3.3. TiÃªm phÃ²ng (VAC)

Nguá»“n: US-06.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-VAC-01 | TrÆ°á»ng báº¯t buá»™c khi thÃªm Vaccine Record gá»“m tÃªn vaccine vÃ  ngÃ y tiÃªm. | Validation | US-06 |
| BR-VAC-02 | Sá»‘ liá»u, tÃªn phÃ²ng khÃ¡m vÃ  ghi chÃº lÃ  cÃ¡c trÆ°á»ng tÃ¹y chá»n. | Data Definition | US-06 |
| BR-VAC-03 | Chu ká»³ tiÃªm chuáº©n Ä‘Æ°á»£c xÃ¡c Ä‘á»‹nh dá»±a trÃªn ba yáº¿u tá»‘: loÃ i, loáº¡i vaccine vÃ  Ä‘á»™ tuá»•i cá»§a pet táº¡i ngÃ y tiÃªm. | Computation / Derivation | US-06 |
| BR-VAC-04 | NgÃ y tiÃªm tiáº¿p theo do há»‡ thá»‘ng gá»£i Ã½ cÃ³ thá»ƒ Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng chá»‰nh sá»­a trÆ°á»›c khi xÃ¡c nháº­n táº¡o Reminder. | Process | US-06 |
| BR-VAC-05 | Vaccine Record khÃ´ng lÆ°u `next_due_date`; ngÃ y nháº¯c tiÃªm tiáº¿p theo Ä‘Æ°á»£c quáº£n lÃ½ táº¡i Reminder. | Data Integrity | US-06 |
| BR-VAC-06 | Backend láº¥y `species` vÃ  `date_of_birth` tá»« Pet, tÃ­nh Ä‘á»™ tuá»•i táº¡i `vaccine_date`, chá»n chu ká»³ chuáº©n theo `species + vaccine_name + age_at_vaccination`, sau Ä‘Ã³ tÃ­nh `suggested_next_due_date = vaccine_date + standard_interval`. `dose_number` lÃ  thÃ´ng tin tÃ¹y chá»n, khÃ´ng pháº£i tiÃªu chÃ­ chÃ­nh Ä‘á»ƒ chá»n chu ká»³. | Computation / Derivation | US-06 |
| BR-VAC-07 | NgÃ y tiÃªm trong tÆ°Æ¡ng lai váº«n Ä‘Æ°á»£c phÃ©p lÆ°u nhÆ°ng há»‡ thá»‘ng pháº£i tráº£ cáº£nh bÃ¡o má»m â€œNgÃ y tiÃªm chÆ°a Ä‘áº¿nâ€. | Validation / Soft Warning | US-06 AC-03 |
| BR-VAC-08 | Náº¿u Pet chÆ°a cÃ³ `date_of_birth` hoáº·c khÃ´ng tÃ¬m tháº¥y chu ká»³ phÃ¹ há»£p, backend khÃ´ng tá»± Ä‘oÃ¡n vÃ  tráº£ `suggested_next_due_date = null`; ngÆ°á»i dÃ¹ng váº«n cÃ³ thá»ƒ tá»± nháº­p ngÃ y Ä‘á»ƒ táº¡o Reminder. | Process / Fallback | US-06; Product Decision |

### 3.4. Há»“ sÆ¡ khÃ¡m bá»‡nh (MED)

Nguá»“n: US-07.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-MED-01 | NgÃ y khÃ¡m lÃ  trÆ°á»ng báº¯t buá»™c khi thÃªm Medical Record. | Validation | US-07 |
| BR-MED-02 | TÃªn phÃ²ng khÃ¡m, triá»‡u chá»©ng, cháº©n Ä‘oÃ¡n, thuá»‘c kÃª, ghi chÃº vÃ  file Ä‘Ã­nh kÃ¨m lÃ  tÃ¹y chá»n. | Data Definition | US-07 |
| BR-MED-03 | Má»—i file Ä‘Ã­nh kÃ¨m tá»‘i Ä‘a 5MB; file vÆ°á»£t giá»›i háº¡n hoáº·c sai Ä‘á»‹nh dáº¡ng bá»‹ tá»« chá»‘i. | Constraint | US-07 |

### 3.5. Lá»‹ch sá»­ y táº¿ vÃ  kiá»ƒm soÃ¡t truy cáº­p (MEDHIST)

Nguá»“n: US-08, US-09.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-MEDHIST-01 | Lá»‹ch sá»­ y táº¿ gá»“m Vaccine Record vÃ  Medical Record, hiá»ƒn thá»‹ má»›i nháº¥t trÆ°á»›c vÃ  cÃ³ thá»ƒ lá»c theo loáº¡i báº£n ghi. | Process / Display | US-08 |
| BR-MEDHIST-02 | Má»—i Vaccine Record vÃ  Medical Record pháº£i lÆ°u ngÆ°á»i táº¡o lÃ  Owner hoáº·c Caretaker. | Data Integrity / Audit | US-09 |
| BR-MEDHIST-03 | Caretaker khÃ´ng Ä‘Æ°á»£c xÃ³a báº¥t ká»³ báº£n ghi y táº¿ nÃ o. | Authorization | US-09 |
| BR-MEDHIST-04 | Caretaker khÃ´ng Ä‘Æ°á»£c chá»‰nh sá»­a báº£n ghi y táº¿ Ä‘Ã£ tá»“n táº¡i, ká»ƒ cáº£ báº£n ghi do chÃ­nh Caretaker táº¡o. | Authorization | US-09 |
| BR-MEDHIST-05 | Caretaker chá»‰ Ä‘Æ°á»£c truy cáº­p há»“ sÆ¡ y táº¿ cá»§a pet Ä‘Ã£ Ä‘Æ°á»£c chia sáº» vÃ  quyá»n cÃ²n hiá»‡u lá»±c. | Authorization | US-09 |

### 3.6. Nháº¯c háº¹n (REM)

Nguá»“n: US-10, US-11.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-REM-01 | TrÆ°á»ng báº¯t buá»™c khi táº¡o Reminder gá»“m pet, loáº¡i nháº¯c háº¹n vÃ  ngÃ y háº¹n. | Validation | US-10 |
| BR-REM-02 | Reminder cÃ³ ngÃ y háº¹n Ä‘Ã£ qua váº«n Ä‘Æ°á»£c phÃ©p lÆ°u Ä‘á»ƒ ghi nháº­n lá»‹ch sá»­. | Process | US-10 |
| BR-REM-03 | Khi Reminder Ä‘Æ°á»£c táº¡o tá»« gá»£i Ã½ sau tiÃªm, ngÃ y háº¹n Ä‘Æ°á»£c lÆ°u táº¡i `Reminder.due_date`, khÃ´ng lÆ°u trong Vaccine Record. | Data Integrity | US-10 |
| BR-REM-04 | Há»‡ thá»‘ng cho phÃ©p nhiá»u Reminder cÃ¹ng ngÃ y cho cÃ¹ng má»™t pet, khÃ´ng cháº·n trÃ¹ng. | Constraint | US-10 |
| BR-REM-05 | Caretaker chá»‰ Ä‘Æ°á»£c xem Reminder cá»§a pet Ä‘Ã£ Ä‘Æ°á»£c chia sáº» vÃ  quyá»n cÃ²n hiá»‡u lá»±c. | Authorization | US-11 |
| BR-REM-06 | Caretaker khÃ´ng Ä‘Æ°á»£c táº¡o, sá»­a, hoÃ n thÃ nh hoáº·c xÃ³a Reminder. | Authorization | US-11 |
| BR-REM-07 | Sau khi lÆ°u Vaccine Record, há»‡ thá»‘ng chá»‰ táº¡o Reminder khi Owner xÃ¡c nháº­n ngÃ y gá»£i Ã½ hoáº·c ngÃ y Ä‘Ã£ chá»‰nh sá»­a. | Process | US-06, US-10 |
| BR-REM-08 | Chá»‰ Owner Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u Reminder lÃ  Completed. Khi hoÃ n thÃ nh, há»‡ thá»‘ng cáº­p nháº­t tráº¡ng thÃ¡i lÆ°u trá»¯ thÃ nh `Completed`. | Authorization / Process | US-10 AC-03 |
| BR-REM-11 | Owner chá»‰ Ä‘Æ°á»£c sá»­a ngÃ y háº¹n vÃ  ghi chÃº khi Reminder cÃ²n `Upcoming`; Caretaker khÃ´ng Ä‘Æ°á»£c sá»­a. | Authorization / Process | Notification Phase 1 |
| BR-NOT-01 | Má»—i Reminder `Upcoming` cÃ³ hai event hoáº¡t Ä‘á»™ng: `due_soon` táº¡i D-2 vÃ  `overdue` táº¡i D+2, Ä‘á»u lÃºc 08:00 `Asia/Ho_Chi_Minh`. | Process | Notification Phase 1 |
| BR-NOT-02 | Äá»•i ngÃ y háº¹n há»§y event lá»‹ch cÅ© vÃ  táº¡o lá»‹ch má»›i; hoÃ n thÃ nh Reminder há»§y cÃ¡c event cÃ²n hoáº¡t Ä‘á»™ng. | Audit / Data Integrity | Notification Phase 1 |
| BR-NOT-03 | Notification hiá»‡n hÃ nh chá»‰ tráº£ tá»‘i Ä‘a má»™t event cho má»—i Reminder; `overdue` thay tháº¿ `due_soon` tá»« D+2. | Presentation / Process | Notification Phase 1 |
| BR-NOT-04 | Web Notification Center chá»‰ hiá»ƒn thá»‹ event hiá»‡n hÃ nh tá»« API; chá»n event chÆ°a Ä‘á»c Ä‘Ã¡nh dáº¥u Ä‘Ãºng event má»™t láº§n rá»“i má»Ÿ Reminder tÆ°Æ¡ng á»©ng. | Presentation / Process | Notification Center |
| BR-REM-10 | Database tá»« chá»‘i trá»™n transition Edit vÃ  Complete trong cÃ¹ng update; `updated_at` do database quáº£n lÃ½. | Data Integrity | Notification Phase 1 |
| BR-REM-09 | Tráº¡ng thÃ¡i lÆ°u trá»¯ gá»“m `Upcoming` vÃ  `Completed`. `display_status` Ä‘Æ°á»£c suy ra khi Ä‘á»c dá»¯ liá»‡u: Completed náº¿u tráº¡ng thÃ¡i lÆ°u trá»¯ lÃ  Completed; Overdue náº¿u chÆ°a hoÃ n thÃ nh vÃ  `due_date < current_date`; Upcoming trong cÃ¡c trÆ°á»ng há»£p cÃ²n láº¡i. | Computation / Display | US-10; Product Decision |

### 3.7. Chá»‰ sá»‘ sá»©c khá»e (HLOG)

Nguá»“n: US-12, US-13.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-HLOG-01 | Má»—i láº§n nháº­p Health Log táº¡o má»™t báº£n ghi má»›i cÃ³ timestamp. Khi chá»‰nh sá»­a, chá»‰ cáº­p nháº­t cÃ¡c trÆ°á»ng nghiá»‡p vá»¥ Ä‘Æ°á»£c cho phÃ©p; khÃ´ng thay Ä‘á»•i `health_log_id`, `pet_id`, `created_by` hoáº·c `logged_at`. | Data Integrity | US-12 |
| BR-HLOG-02 | Health Log pháº£i cÃ³ Ã­t nháº¥t má»™t trong cÃ¡c trÆ°á»ng: weight, food_amount, food_type, status hoáº·c note. | Validation | US-12 |
| BR-HLOG-03 | Biá»ƒu Ä‘á»“ xu hÆ°á»›ng cÃ¢n náº·ng hiá»ƒn thá»‹ theo tuáº§n hoáº·c thÃ¡ng tÃ¹y lá»±a chá»n cá»§a ngÆ°á»i dÃ¹ng. | Display / Computation | US-13 |
| BR-HLOG-04 | Náº¿u pet cÃ³ dÆ°á»›i hai báº£n ghi cÃ¢n náº·ng, Dashboard hiá»ƒn thá»‹ â€œChÆ°a Ä‘á»§ dá»¯ liá»‡uâ€ thay vÃ¬ biá»ƒu Ä‘á»“ trá»‘ng. | Data Sufficiency | US-13 AC-03 |
| BR-HLOG-05 | Caretaker chÆ°a cÃ³ quyá»n Health Log trong Phase 2.1; chá»‰ Owner Ä‘Æ°á»£c thao tÃ¡c nháº­t kÃ½ sá»©c khá»e. | Authorization | US-12, US-14 |
| BR-HLOG-06 | Chá»‰ Owner cá»§a Pet Ä‘Æ°á»£c chá»‰nh sá»­a hoáº·c xÃ³a Health Log; thao tÃ¡c xÃ³a cáº§n xÃ¡c nháº­n vÃ  khÃ´ng thá»ƒ hoÃ n tÃ¡c. | Authorization / Process | US-12 |

### 3.8. PhÃ¢n quyá»n vÃ  chia sáº» (SHARE)

Nguá»“n: US-14.

| MÃ£ BR | Business Rule | Loáº¡i Rule | Nguá»“n |
|---|---|---|---|
| BR-SHARE-01 | Chá»‰ Owner Ä‘Æ°á»£c cáº¥p hoáº·c thu há»“i quyá»n Caretaker. | Authorization | US-14 |
| BR-SHARE-02 | Má»™t pet cÃ³ thá»ƒ Ä‘Æ°á»£c chia sáº» cho nhiá»u Caretaker cÃ¹ng lÃºc. | Constraint | US-14 |
| BR-SHARE-03 | Caretaker khÃ´ng Ä‘Æ°á»£c chia sáº» tiáº¿p quyá»n truy cáº­p cho ngÆ°á»i khÃ¡c. | Authorization | US-14 |
| BR-SHARE-04 | Caretaker chá»‰ tháº¥y pet Ä‘Æ°á»£c Owner chá»‰ Ä‘á»‹nh chia sáº». | Authorization | US-14 |
| BR-SHARE-05 | Má»—i quyá»n Caretaker pháº£i cÃ³ ngÃ y háº¿t hiá»‡u lá»±c. | Constraint | US-14 |
| BR-SHARE-06 | Náº¿u email Ä‘Ã£ cÃ³ tÃ i khoáº£n, quyá»n Ä‘Æ°á»£c cáº¥p ngay; náº¿u email chÆ°a cÃ³ tÃ i khoáº£n, há»‡ thá»‘ng gá»­i lá»i má»i vÃ  chá»‰ kÃ­ch hoáº¡t quyá»n sau khi ngÆ°á»i Ä‘Æ°á»£c má»i Ä‘Äƒng kÃ½. | Process | US-14 |
| BR-SHARE-07 | Thu há»“i quyá»n cÃ³ hiá»‡u lá»±c ngay láº­p tá»©c; request tiáº¿p theo cá»§a Caretaker pháº£i bá»‹ cháº·n vÃ  giao diá»‡n pháº£i rá»i khá»i dá»¯ liá»‡u vá»«a bá»‹ thu há»“i. | Process / Security | US-14 |
| BR-SHARE-08 | Owner khÃ´ng Ä‘Æ°á»£c chia sáº» pet cho chÃ­nh email cá»§a mÃ¬nh. | Validation | US-14 |

#### Phase 2.1 â€” chá»‰ xem

Phase 2.1 triá»ƒn khai lá»i má»i theo tá»«ng pet vá»›i cÃ¡c tráº¡ng thÃ¡i `Pending`,
`Active`, `Revoked`. Quyá»n Caretaker cÃ³ hiá»‡u lá»±c khi `status = Active`,
`caretaker_id` khá»›p phiÃªn hiá»‡n táº¡i vÃ  `valid_until` chÆ°a qua ngÃ y hiá»‡n táº¡i
theo mÃºi giá» `Asia/Ho_Chi_Minh`. Caretaker chá»‰ Ä‘á»c thÃ´ng tin cÆ¡ báº£n cÃ¹ng lá»‹ch
sá»­ Vaccine/Medical dáº¡ng vÄƒn báº£n; áº£nh riÃªng tÆ°, attachment, Health Log,
Reminder, Notification vÃ  thÃ´ng tin Owner váº«n thuá»™c pháº¡m vi Owner.

Owner cÃ³ thá»ƒ thu há»“i lá»i má»i Ä‘ang chá» hoáº·c quyá»n Ä‘ang hoáº¡t Ä‘á»™ng. Má»i thao tÃ¡c
cháº¥p nháº­n/thu há»“i Ä‘á»u kiá»ƒm tra láº¡i tráº¡ng thÃ¡i á»Ÿ server vÃ  táº§ng RLS; thao tÃ¡c
Ä‘áº¿n muá»™n khÃ´ng Ä‘Æ°á»£c khÃ´i phá»¥c quyá»n Ä‘Ã£ thu há»“i. Phase nÃ y chÆ°a cáº¥p quyá»n ghi
cho Caretaker.

## 4. Cross-cutting Rules

### CC-01. Vaccine Record â†’ Reminder

Backend lÆ°u Vaccine Record trÆ°á»›c, sau Ä‘Ã³:

1. Láº¥y `species` vÃ  `date_of_birth` tá»« Pet.
2. TÃ­nh Ä‘á»™ tuá»•i táº¡i `vaccine_date`.
3. Chá»n chu ká»³ chuáº©n theo loÃ i, loáº¡i vaccine vÃ  Ä‘á»™ tuá»•i.
4. Tráº£ `suggested_next_due_date` nhÆ°ng khÃ´ng lÆ°u vÃ o Vaccine Record.
5. Chá»‰ táº¡o Reminder khi Owner xÃ¡c nháº­n; ngÃ y Ä‘Æ°á»£c lÆ°u táº¡i `Reminder.due_date` vÃ  liÃªn káº¿t nguá»“n báº±ng `source_vaccine_record_id`.

### CC-02. Chuáº©n hÃ³a email

BR-AUTH-03 Ã¡p dá»¥ng táº¡i má»i Ä‘iá»ƒm so khá»›p email, bao gá»“m Ä‘Äƒng kÃ½, Ä‘Äƒng nháº­p, Google OAuth, má»i Caretaker vÃ  kiá»ƒm tra Owner tá»± chia sáº» cho chÃ­nh mÃ¬nh.

Email lÆ°u trong `public.users` pháº£i thá»a `email = lower(trim(email))` vÃ  dÃ¹ng má»™t UNIQUE constraint trÃªn giÃ¡ trá»‹ Ä‘Ã£ chuáº©n hÃ³a. KhÃ´ng táº¡o thÃªm expression unique index trÃ¹ng chá»©c nÄƒng.

### CC-03. Lá»™ trÃ¬nh Google OAuth

BR-AUTH-08 váº«n lÃ  Business Rule Ä‘Ã£ chá»‘t. Tuy nhiÃªn, Google OAuth Ä‘Æ°á»£c triá»ƒn khai á»Ÿ checkpoint riÃªng sau email/password Auth. TrÆ°á»›c khi hoÃ n táº¥t checkpoint Ä‘Ã³, giao diá»‡n khÃ´ng Ä‘Æ°á»£c trÃ¬nh bÃ y nÃºt Google nhÆ° má»™t chá»©c nÄƒng kháº£ dá»¥ng.

### CC-04. Quyá»n cá»‘ Ä‘á»‹nh cá»§a Caretaker

Trong Phase 2.1, Caretaker cÃ³ quyá»n **View only** trÃªn Ä‘Ãºng pet Ä‘Æ°á»£c chia sáº» vÃ  cÃ²n hiá»‡u lá»±c:

- ÄÆ°á»£c xem há»“ sÆ¡ pet vÃ  lá»‹ch sá»­ Vaccine/Medical dáº¡ng vÄƒn báº£n.
- KhÃ´ng Ä‘Æ°á»£c xem Health Log, Reminder, thá»‘ng kÃª hoáº·c Notification Center.
- KhÃ´ng Ä‘Æ°á»£c sá»­a/xÃ³a dá»¯ liá»‡u Ä‘Ã£ tá»“n táº¡i.
- KhÃ´ng Ä‘Æ°á»£c táº¡o, sá»­a, hoÃ n thÃ nh hoáº·c xÃ³a Reminder.
- KhÃ´ng Ä‘Æ°á»£c cáº¥p quyá»n cho ngÆ°á»i khÃ¡c.

### CC-05. Reminder status

Database chá»‰ cáº§n lÆ°u `Upcoming` hoáº·c `Completed`. API suy ra `display_status` dá»±a trÃªn `status`, `due_date` vÃ  ngÃ y hiá»‡n táº¡i; khÃ´ng cáº§n tiáº¿n trÃ¬nh cáº­p nháº­t tráº¡ng thÃ¡i má»—i ngÃ y.

## 5. Thá»‘ng kÃª

| NhÃ³m | Tiá»n tá»‘ | Sá»‘ rule |
|---|---:|---:|
| Authentication | AUTH | 14 |
| Pet | PET | 7 |
| Vaccine | VAC | 8 |
| Medical Record | MED | 3 |
| Medical History | MEDHIST | 5 |
| Reminder | REM | 9 |
| Health Log | HLOG | 6 |
| Sharing | SHARE | 8 |
| **Tá»•ng cá»™ng** |  | **59** |

## 6. Quyáº¿t Ä‘á»‹nh pháº¡m vi triá»ƒn khai

- Core MVP: Authentication, Pet Profile, Vaccine Record, Reminder vÃ  Medical Record.
- Core MVP: `/dashboard` lÃ m landing/pet-list cÆ¡ báº£n sau Ä‘Äƒng nháº­p.
- Should Have / Phase 2: Health Log, Dashboard phÃ¢n tÃ­ch nÃ¢ng cao vÃ  Caretaker Sharing.
- Google OAuth Ä‘Æ°á»£c triá»ƒn khai trong checkpoint riÃªng sau email/password Auth; BR-AUTH-08 khÃ´ng bá»‹ há»§y bá».
- KhÃ´ng há»— trá»£ hard-delete tÃ i khoáº£n trong MVP; phÆ°Æ¡ng Ã¡n tÆ°Æ¡ng lai lÃ  soft delete hoáº·c tráº¡ng thÃ¡i inactive.
- Health Log há»— trá»£ Owner chá»‰nh sá»­a cÃ¡c trÆ°á»ng nghiá»‡p vá»¥ Ä‘Æ°á»£c phÃ©p vÃ  xÃ³a cÃ³ xÃ¡c nháº­n; Caretaker khÃ´ng Ä‘Æ°á»£c sá»­a/xÃ³a.
- KhÃ´ng Ä‘Æ°a Pet Delete vÃ o MVP khi chÆ°a cÃ³ User Story vÃ  Business Rule riÃªng.
- KhÃ´ng tÃ­ch há»£p AI, clinic-side system, booking hoáº·c payment trong MVP.

