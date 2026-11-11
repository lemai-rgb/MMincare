# MMinCare â€” Architecture Decision Log

## ADR-005 â€” Per-pet Caretaker read-only sharing (Phase 2.1)

- Owner invitations are stored in `pet_access` as Pending until a verified
  Caretaker account accepts the exact normalized email invite.
- Active access is per Pet and expires by `valid_until`; revoke/expiry is
  enforced by API and RLS for every subsequent request.
- Phase 2.1 allows only basic Pet data and textual Vaccine/Medical history.
  Health Log, Reminder, statistics, Notification Center, private assets,
  writes and further sharing remain denied.

**PhiÃªn báº£n:** 2.0 Â· **Cáº­p nháº­t:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline á»©ng dá»¥ng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` â€” PR #26 Ä‘Ã£ merge, Vercel Production thÃ nh cÃ´ng.  
**á»¨ng dá»¥ng:** https://m-mincare.vercel.app/ Â· **Tráº£i nghiá»‡m thá»­:** https://m-mincare.vercel.app/demo

> Current = code Ä‘Ã£ triá»ƒn khai táº¡i baseline trÃªn. Tráº¡ng thÃ¡i nÃ y khÃ´ng cÃ³ nghÄ©a má»i ká»‹ch báº£n Ä‘Ã£ kiá»ƒm thá»­ thá»±c táº¿. Demo dÃ¹ng dá»¯ liá»‡u giáº£ láº­p á»Ÿ trÃ¬nh duyá»‡t; khÃ´ng chá»©ng minh Auth, Owner A/B, Storage hoáº·c hiá»‡u nÄƒng backend.

## 1. Quy Æ°á»›c tráº¡ng thÃ¡i

| Tráº¡ng thÃ¡i | Ã nghÄ©a |
|---|---|
| Accepted / Current | ÄÃ£ Ä‘Æ°á»£c cháº¥p nháº­n vÃ  thuá»™c baseline hiá»‡n táº¡i. |
| Superseded | Quyáº¿t Ä‘á»‹nh cÅ© Ä‘Ã£ Ä‘Æ°á»£c thay tháº¿; giá»¯ láº¡i Ä‘á»ƒ truy váº¿t. |
| Planned | CÃ³ Ä‘á»‹nh hÆ°á»›ng nhÆ°ng chÆ°a pháº£i hÃ nh vi production. |
| Proposed | Cáº§n chá»‘t thÃªm trÆ°á»›c khi triá»ƒn khai. |
| Pending deployment | ÄÃ£ cÃ³ thay Ä‘á»•i ngoÃ i `main`, chÆ°a Ä‘Æ°á»£c coi lÃ  production. |

## 2. Decision register

### ADL-001 â€” KhÃ´ng cung cáº¥p hard-delete tÃ i khoáº£n trong MVP

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** MVP khÃ´ng cÃ³ luá»“ng xÃ³a vÄ©nh viá»…n tÃ i khoáº£n.
- **LÃ½ do:** trÃ¡nh xÃ³a dÃ¢y chuyá»n dá»¯ liá»‡u sá»©c khá»e vÃ  cáº§n thÃªm chÃ­nh sÃ¡ch lÆ°u trá»¯/audit trÆ°á»›c khi triá»ƒn khai.

### ADL-002 â€” ÄÄƒng kÃ½ báº±ng email cáº§n xÃ¡c nháº­n email

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** dÃ¹ng Supabase Auth email/password; ngÆ°á»i dÃ¹ng xÃ¡c nháº­n email trÆ°á»›c khi sá»­ dá»¥ng Ä‘áº§y Ä‘á»§ há»‡ thá»‘ng.
- **Há»‡ quáº£:** Auth redirect allowlist vÃ  origin production pháº£i Ä‘Æ°á»£c cáº¥u hÃ¬nh Ä‘Ãºng.

### ADL-003 â€” Redirect xÃ¡c thá»±c pháº£i Ä‘Æ°á»£c kiá»ƒm soÃ¡t

- **Tráº¡ng thÃ¡i:** Superseded bá»Ÿi ADL-015
- **Quyáº¿t Ä‘á»‹nh cÅ©:** chá»‰ redirect Ä‘áº¿n Ä‘Æ°á»ng dáº«n ná»™i bá»™ há»£p lá»‡.
- **Ghi chÃº:** nguyÃªn táº¯c váº«n cÃ²n hiá»‡u lá»±c; luá»“ng recovery hiá»‡n Ä‘Æ°á»£c mÃ´ táº£ Ä‘áº§y Ä‘á»§ á»Ÿ ADL-015.

### ADL-004 â€” Dashboard gáº¯n vá»›i tá»«ng Pet

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** dashboard sá»©c khá»e Ä‘Æ°á»£c truy cáº­p trong ngá»¯ cáº£nh má»™t Pet qua `/api/pets/{petId}/dashboard`, há»— trá»£ `period=week|month`.
- **Há»‡ quáº£:** má»i truy váº¥n dashboard pháº£i xÃ¡c thá»±c quyá»n trÃªn Pet trÆ°á»›c khi tá»•ng há»£p.

### ADL-005 â€” Táº¡o Pet lÃ  má»™t luá»“ng chÃ­nh thá»©c

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** Owner cÃ³ thá»ƒ táº¡o, xem vÃ  cáº­p nháº­t Pet; ghi chÃº cÅ© cho ráº±ng thiáº¿u `/pets/new` khÃ´ng cÃ²n lÃ  tráº¡ng thÃ¡i hiá»‡n táº¡i.

### ADL-006 â€” Google OAuth khÃ´ng thuá»™c baseline hiá»‡n táº¡i

- **Tráº¡ng thÃ¡i:** Planned
- **Quyáº¿t Ä‘á»‹nh:** giá»¯ Google OAuth trong Phase 1 khi cáº¥u hÃ¬nh provider vÃ  redirect hoÃ n chá»‰nh; khÃ´ng mÃ´ táº£ lÃ  Ä‘Ã£ deploy.

### ADL-007 â€” Há»“ sÆ¡ á»©ng dá»¥ng tÃ¡ch khá»i `auth.users`

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** danh tÃ­nh xÃ¡c thá»±c thuá»™c `auth.users`; dá»¯ liá»‡u há»“ sÆ¡ á»©ng dá»¥ng thuá»™c báº£ng public tÆ°Æ¡ng á»©ng vÃ  liÃªn káº¿t báº±ng user id.

### ADL-008 â€” Chuáº©n hÃ³a email táº¡i lá»›p Auth

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** dá»±a vÃ o cÆ¡ cháº¿ xÃ¡c thá»±c/unique cá»§a Supabase Auth; khÃ´ng táº¡o má»™t nguá»“n email cáº¡nh tranh trong nghiá»‡p vá»¥.

### ADL-009 â€” Next.js SSR dÃ¹ng cookie session

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** session phÃ­a server Ä‘Æ°á»£c Ä‘á»c/ghi báº±ng cookie; route server pháº£i xÃ¡c thá»±c user trÆ°á»›c khi truy cáº­p dá»¯ liá»‡u.
- **Há»‡ quáº£:** mÃ´i trÆ°á»ng cáº§n `NEXT_PUBLIC_SUPABASE_URL` vÃ  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### ADL-010 â€” Nháº¯c lá»‹ch trong á»©ng dá»¥ng lÃ  kÃªnh MVP

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** reminder hiá»‡n hiá»ƒn thá»‹ trong á»©ng dá»¥ng; push/email notification chÆ°a thuá»™c baseline.

### ADL-011 â€” Vaccine Record lÃ  sá»± kiá»‡n Ä‘Ã£ xáº£y ra

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** `vaccine_date` khÃ´ng Ä‘Æ°á»£c á»Ÿ tÆ°Æ¡ng lai. NgÃ y gá»£i Ã½ tiáº¿p theo chá»‰ lÃ  giÃ¡ trá»‹ há»— trá»£ nháº­p liá»‡u, khÃ´ng tá»± Ä‘á»™ng trá»Ÿ thÃ nh má»™t mÅ©i tiÃªm Ä‘Ã£ thá»±c hiá»‡n.

### ADL-012 â€” Medical Record vÃ  attachment riÃªng tÆ°

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** há»“ sÆ¡ y táº¿ cÃ³ thá»ƒ kÃ¨m tá»‡p trong bucket private `medical-record-attachments`; truy cáº­p báº±ng signed URL sau khi kiá»ƒm tra quyá»n.
- **Há»‡ quáº£:** upload cÃ³ tráº¡ng thÃ¡i lá»—i vÃ  cho phÃ©p retry; khÃ´ng cÃ´ng khai URL tÄ©nh.

### ADL-013 â€” Health Log dÃ¹ng ngÃ y ghi nháº­n vÃ  thá»i Ä‘iá»ƒm nháº­p

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** `recorded_on` biá»ƒu diá»…n ngÃ y sá»©c khá»e; `logged_at` biá»ƒu diá»…n thá»i Ä‘iá»ƒm nháº­p. KhÃ´ng cho ngÃ y tÆ°Æ¡ng lai theo mÃºi giá» Viá»‡t Nam.
- **Sáº¯p xáº¿p má»›i nháº¥t:** `recorded_on DESC`, `logged_at DESC`, `health_log_id DESC`.

### ADL-014 â€” Owner-only á»Ÿ runtime hiá»‡n táº¡i

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** Owner lÃ  actor váº­n hÃ nh hiá»‡n táº¡i. Caretaker/pet access chá»‰ lÃ  pháº§n schema/Phase 2, chÆ°a quáº£ng bÃ¡ lÃ  kháº£ dá»¥ng.

### ADL-015 â€” Password recovery dÃ¹ng callback an toÃ n

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** há»— trá»£ cáº£ PKCE code vÃ  token hash qua callback xÃ¡c thá»±c, sau Ä‘Ã³ chuyá»ƒn Ä‘áº¿n `/reset-password` Ä‘á»ƒ Ä‘áº·t máº­t kháº©u má»›i.
- **Há»‡ quáº£:** callback URL pháº£i cÃ³ trong allowlist cá»§a Auth á»Ÿ má»i mÃ´i trÆ°á»ng.

### ADL-016 â€” Reminder cÃ³ tá»‘i Ä‘a má»™t nguá»“n nghiá»‡p vá»¥

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** reminder cÃ³ thá»ƒ táº¡o thá»§ cÃ´ng, tá»« Vaccine Record hoáº·c tá»« Medical Record. Hai khÃ³a `source_vaccine_record_id` vÃ  `source_medical_record_id` khÃ´ng Ä‘Æ°á»£c cÃ¹ng cÃ³ giÃ¡ trá»‹.

### ADL-017 â€” HoÃ n táº¥t reminder lÃ  thao tÃ¡c Ä‘Æ°á»£c giá»›i háº¡n

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** hoÃ n táº¥t reminder chá»‰ cáº­p nháº­t `status` vÃ  `completed_at`; UI cháº·n double-click trong khi request Ä‘ang cháº¡y.
- **Báº£o máº­t:** anon khÃ´ng cÃ³ quyá»n; authenticated chá»‰ cÃ³ grant cáº§n thiáº¿t vÃ  váº«n chá»‹u RLS/kiá»ƒm tra ownership.

### ADL-018 â€” Dashboard sá»©c khá»e dÃ¹ng taxonomy cá»‘ Ä‘á»‹nh

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** sÃ¡u nhÃ³m tráº¡ng thÃ¡i lÃ  `BÃ¬nh thÆ°á»ng`, `Má»‡t má»i`, `Ä‚n kÃ©m/Bá» Äƒn`, `NÃ´n`, `TiÃªu cháº£y`, `KhÃ¡c`; giÃ¡ trá»‹ ngoÃ i nÄƒm nhÃ³m chuáº©n Ä‘Æ°á»£c gom vÃ o `KhÃ¡c`.
- **TÆ°Æ¡ng tÃ¡c hiá»‡n táº¡i:** tooltip biá»ƒu Ä‘á»“ tráº¡ng thÃ¡i há»— trá»£ hover, keyboard focus, Enter/Space vÃ  tap; hiá»ƒn thá»‹ tá»‘i Ä‘a 3 báº£n ghi gáº§n nháº¥t cÃ¹ng sá»‘ lÆ°á»£ng cÃ²n láº¡i, khÃ´ng gá»i thÃªm API.

### ADL-019 â€” Thu há»“i quyá»n cháº¡y hÃ m quáº£n trá»‹ RLS

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** `rls_auto_enable()` khÃ´ng Ä‘Æ°á»£c thá»±c thi bá»Ÿi `anon` hoáº·c `authenticated`.

### ADL-020 â€” Migration lÃ  nguá»“n sá»± tháº­t nhÆ°ng pháº£i xá»­ lÃ½ drift

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** migration trong repository lÃ  nguá»“n lá»‹ch sá»­ schema; khi mÃ´i trÆ°á»ng cÃ³ drift pháº£i reconcile trÆ°á»›c khi replay hoáº·c promote.
- **Há»‡ quáº£:** khÃ´ng suy Ä‘oÃ¡n production schema chá»‰ tá»« má»™t file migration cÅ©.

### ADL-021 â€” Baseline triá»ƒn khai cÃ³ thá»ƒ tÃ¡i táº¡o

- **Tráº¡ng thÃ¡i:** Accepted / Current
- **Quyáº¿t Ä‘á»‹nh:** dÃ¹ng Next.js `16.3.5`, Node.js `>=20.9`, cÃ i phá»¥ thuá»™c báº±ng `npm ci` vÃ  xÃ¡c minh báº±ng `npm run build`.
- **Phá»¥ thuá»™c ngoÃ i mÃ£ nguá»“n:** Supabase URL/key, Auth redirect/origin, migrations, RLS/grants, constraints/indexes vÃ  private Storage bucket.

### ADL-022 â€” Owner xÃ¡c nháº­n xÃ³a Vaccine/Medical Record

- **Tráº¡ng thÃ¡i:** Accepted / Current; thay quyáº¿t Ä‘á»‹nh Proposed á»Ÿ v1.6.
- **Quyáº¿t Ä‘á»‹nh:** hard-delete báº£n ghi sau dialog xÃ¡c nháº­n; chÆ°a cÃ³ sá»­a Vaccine/Medical Record.
- **Phá»¥ thuá»™c:** Reminder tham chiáº¿u nguá»“n Ä‘Æ°á»£c giá»¯ láº¡i, FK nguá»“n thÃ nh null; xÃ³a Medical cascade metadata attachment vÃ  dá»n object Storage. Náº¿u cleanup object tháº¥t báº¡i, API tráº£ cáº£nh bÃ¡o, khÃ´ng bÃ¡o ráº±ng báº£n ghi cÃ²n tá»“n táº¡i.
- **Giá»›i háº¡n:** khÃ´ng cÃ³ xÃ³a Pet/tÃ i khoáº£n, khÃ´ng bá»• sung quyá»n Caretaker, khÃ´ng tuyÃªn bá»‘ Ä‘Ã£ cÃ³ audit trail cho xÃ³a.

### ADL-023 â€” Biá»ƒu Ä‘á»“ cÃ¢n náº·ng vÃ  tráº¡ng thÃ¡i thuá»™c production

- **Tráº¡ng thÃ¡i:** Accepted / Current; tráº¡ng thÃ¡i pending PR #7 Ä‘Ã£ káº¿t thÃºc.
- **Quyáº¿t Ä‘á»‹nh:** ká»³ tuáº§n/thÃ¡ng, trá»¥c toÃ n ká»³, tooltip dá»¯ liá»‡u táº¡i Ä‘iá»ƒm; tráº¡ng thÃ¡i theo sÃ¡u nhÃ³m, nhÃ£n gá»‘c cá»§a KhÃ¡c Ä‘Æ°á»£c giá»¯ trong chi tiáº¿t. Dá»¯ liá»‡u thiáº¿u/khÃ´ng Ä‘á»§ Ä‘iá»ƒm cÃ³ thÃ´ng bÃ¡o, khÃ´ng dá»±ng giÃ¡ trá»‹ thay tháº¿.

### ADL-024 â€” Sá»­a Reminder tÃ¡ch khá»i hoÃ n táº¥t

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** chá»‰ sá»­a `due_date`, `note` khi status lÆ°u lÃ  `Upcoming`; `Overdue` lÃ  tráº¡ng thÃ¡i suy ra vÃ  khÃ´ng tá»± lÃ m Reminder háº¿t quyá»n sá»­a. Complete lÃ  endpoint riÃªng, cáº­p nháº­t `status`, `completed_at`.

### ADL-025 â€” Notification Center vÃ  cháº¥m Ä‘á» chÆ°a Ä‘á»c

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** event `due_soon`/`overdue` tá»« Reminder; chá»‰ cháº¥m Ä‘á» khi cÃ²n unread, khÃ´ng hiá»‡n sá»‘/dÃ²ng mÃ´ táº£ dÆ°á»›i chuÃ´ng. Accessible name váº«n truyá»n Ä‘áº¡t unread. Má»Ÿ panel khÃ´ng tá»± Ä‘Ã¡nh dáº¥u Ä‘á»c; Ä‘á»c thÃ nh cÃ´ng rá»“i Ä‘iá»u hÆ°á»›ng Reminder highlight.
- **Há»‡ quáº£:** revalidate/invalidation, timeout vÃ  request lá»—i thá»i pháº£i Ä‘Æ°á»£c xá»­ lÃ½; khÃ´ng suy ra cÃ³ push/email tá»« in-app notification.

### ADL-026 â€” áº¢nh Pet khÃ´ng báº¯t buá»™c, private Storage

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** chá»n JPG/JPEG/PNG/WebP tá»‘i Ä‘a 5 MiB; kiá»ƒm tra file á»Ÿ client/server; bucket `pet-photos` private ngay tá»« migration Ä‘áº§u. Object path theo user vÃ  tÃªn duy nháº¥t; stream áº£nh qua endpoint Owner-authorized.
- **UI:** áº£nh tháº­t phá»§ khung vuÃ´ng báº±ng cover, avatar máº·c Ä‘á»‹nh theo loÃ i giá»¯ contain; bá» áº£nh trá»Ÿ vá» avatar. KhÃ´ng báº¯t ngÆ°á»i dÃ¹ng nháº­p URL; Ä‘Æ°á»ng dáº«n áº£nh cÅ© Ä‘Æ°á»£c giá»¯ tÆ°Æ¡ng thÃ­ch.
- **Retry:** POST Pet cÃ³ key/hash chá»‘ng táº¡o trÃ¹ng; khÃ´ng dÃ¹ng service-role phÃ­a client.

### ADL-027 â€” Health Log CRUD vÃ  káº¿t quáº£ lÆ°u chÆ°a xÃ¡c Ä‘á»‹nh

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** Owner Ä‘Æ°á»£c POST/PATCH/DELETE; chá»‰ cÃ¡c trÆ°á»ng nghiá»‡p vá»¥ Ä‘Æ°á»£c sá»­a. ID, Owner vÃ  `logged_at` báº¥t biáº¿n. POST báº¯t buá»™c `idempotency_key`, unique theo Owner/Pet/key.
- **Timeout:** khÃ´ng coi máº¥t response lÃ  chÆ°a lÆ°u. Giá»¯ snapshot payload/key báº¥t biáº¿n, khÃ³a trÆ°á»ng khi chÆ°a rÃµ káº¿t quáº£; retry cÃ¹ng snapshot nháº­n canonical row. Khi Há»§y sau lá»—i/timeout, invalidate operation cÅ© vÃ  GET láº¡i.
- **DELETE:** retry 404 sau máº¥t pháº£n há»“i khÃ´ng tá»± suy ra thÃ nh cÃ´ng; Ä‘á»“ng bá»™ báº±ng GET canonical.

### ADL-028 â€” Enter khÃ´ng vÃ´ tÃ¬nh lÆ°u nháº­t kÃ½

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** Enter á»Ÿ cÃ¢n náº·ng/thá»©c Äƒn/lÆ°á»£ng Äƒn khÃ´ng submit; ghi chÃº xuá»‘ng dÃ²ng, dropdown/ngÃ y giá»¯ hÃ nh vi control; nÃºt LÆ°u focus váº«n Enter/Space. TÃ´n trá»ng IME; khÃ´ng cháº·n Enter toÃ n trang hoáº·c tá»± chuyá»ƒn focus.

### ADL-029 â€” Demo dÃ¹ng chÃ­nh giao diá»‡n vÃ  nghiá»‡p vá»¥ á»©ng dá»¥ng

- **Tráº¡ng thÃ¡i:** Accepted / Current â€” PR #26 Ä‘Ã£ merge/deploy.
- **Quyáº¿t Ä‘á»‹nh:** public `/demo` tÃ¡i sá»­ dá»¥ng component/form/CSS production; adapter request/navigation qua React context chá»‰ trong cÃ¢y demo; khÃ´ng patch global fetch. NhÃ£n riÃªng Tráº£i nghiá»‡m thá»­ (reset cÃ³ xÃ¡c nháº­n) vÃ  Vá» trang chá»§.
- **Dá»¯ liá»‡u:** Meo/Min cÃ³ áº£nh, Sushi avatar máº·c Ä‘á»‹nh vÃ  dá»¯ liá»‡u cÆ¡ báº£n; tá»•ng 31 Health Logs phÃ¢n bá»‘ khÃ¡c nhau. Snapshot ngÃ y Viá»‡t Nam; sessionStorage tá»«ng tab; reload giá»¯ thay Ä‘á»•i, reset táº¡o máº«u má»›i. KhÃ´ng ghi Supabase/API/Storage production.
- **Giá»›i háº¡n:** chá»‰ mÃ´ phá»ng nghiá»‡p vá»¥ táº¡i trÃ¬nh duyá»‡t; khÃ´ng chá»©ng minh phÃ¢n quyá»n tháº­t, gá»­i email hoáº·c hiá»‡u nÄƒng backend.

### ADL-030 â€” Responsive vÃ  thá»i gian chá» cÃ³ kiá»ƒm soÃ¡t

- **Tráº¡ng thÃ¡i:** Accepted / Current.
- **Quyáº¿t Ä‘á»‹nh:** tab Pet mobile 2 Ã— 2, metadata wrap, cá»¥m tuá»•i nguyÃªn nhÃ³m, khoáº£ng cÃ¡ch dÆ°Æ¡ng; footer nháº­t kÃ½ attribution trÃ¡i/actions pháº£i; vÃ¹ng cháº¡m Ã­t nháº¥t 44px.
- **Request:** timeout 15 giÃ¢y bao phá»§ nháº­n response body, abort/cleanup, retry, chá»‘ng stale GET/mutation; giáº£m summary query theo tab Ä‘ang má»Ÿ; giá»¯ Auth/RLS vÃ  force-dynamic.
- **Báº±ng chá»©ng:** cÃ³ regression tests vÃ  instrumentation tÃ¹y chá»n; chÆ°a cÃ³ sá»‘ Ä‘o production trÆ°á»›c/sau, khÃ´ng cÃ´ng bá»‘ má»©c tÄƒng tá»‘c.


## 3. Current vÃ  Planned

| Pháº¡m vi | Current | Planned / chÆ°a hoÃ n táº¥t |
|---|---|---|
| Actor | Owner cá»§a app; ngÆ°á»i xem demo public | Caretaker |
| Auth | Email/password, confirmation, recovery | Google OAuth |
| Reminder/Notification | Create/edit/complete, in-app event/read/red dot | Push/email |
| Há»“ sÆ¡ | Pet vÃ  áº£nh; Vaccine/Medical create/read/delete; Health CRUD | Pet/account delete, Vaccine/Medical edit |
| Thá»‘ng kÃª | Per-Pet, tuáº§n/thÃ¡ng, weight/status tooltips | Aggregate nhiá»u Pet |
| Demo | CÃ¹ng UI, máº«u browser-local, reset | KhÃ´ng thay tháº¿ kiá»ƒm thá»­ dá»‹ch vá»¥ tháº­t |
| Gá»£i Ã½ ngÃ y tiÃªm | Contract matched/no_match/unavailable/not_checked | CR-08: quyá»n Ä‘á»c vÃ  dataset Ä‘Æ°á»£c duyá»‡t |


## 4. Checklist promote má»™t quyáº¿t Ä‘á»‹nh sang Current

1. Thay Ä‘á»•i Ä‘Ã£ merge vÃ o `main` vÃ  cÃ³ commit xÃ¡c Ä‘á»‹nh.
2. Migration liÃªn quan Ä‘Ã£ reconcile vÃ  Ã¡p dá»¥ng Ä‘Ãºng thá»© tá»±.
3. `npm ci` vÃ  `npm run build` thÃ nh cÃ´ng vá»›i Node.js phÃ¹ há»£p.
4. Cáº¥u hÃ¬nh Auth, Storage, RLS/grants, constraints/indexes Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c minh á»Ÿ mÃ´i trÆ°á»ng Ä‘Ã­ch.
5. Smoke test Ä‘Ãºng actor, Ä‘Ãºng timezone vÃ  Ä‘Ãºng luá»“ng lá»—i.
6. Cáº­p nháº­t Ä‘á»“ng thá»i Business Rules, User Stories, API, Data Dictionary vÃ  ba sÆ¡ Ä‘á»“.

## 5. Lá»‹ch sá»­ phiÃªn báº£n

| PhiÃªn báº£n | NgÃ y | Thay Ä‘á»•i |
|---|---|---|
| 2.0 | 2026-10-11 | Äá»“ng bá»™ code Ä‘Ã£ triá»ƒn khai, CRUD/áº£nh/thÃ´ng bÃ¡o, request lifecycle/idempotency vÃ  demo cÃ¹ng UI; tÃ¡ch pháº¡m vi kiá»ƒm chá»©ng vÃ  káº¿ hoáº¡ch. |
| 1.6 | 22/09/2026 | Äá»“ng bá»™ decision register vá»›i baseline `cd701979â€¦`; bá»• sung recovery, source reminder, dashboard sá»©c khá»e, hardening RLS, portability, CR delete vÃ  tráº¡ng thÃ¡i PR #7. |
| 1.5 trá»Ÿ vá» trÆ°á»›c | TrÆ°á»›c 22/09/2026 | Lá»‹ch sá»­ cÅ©; cÃ¡c má»¥c mÃ¢u thuáº«n Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u Superseded trong báº£n nÃ y. |

