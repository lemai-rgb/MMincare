# MMinCare â€” API Documentation

**Scope:** MVP  
**Version:** 1.2  
**Prepared for:** BA/SA Portfolio  
**Business Rule reference:** `MMinCare_Business_Rules_v1.1.md`

## 1. API Overview

| Item | Decision |
|---|---|
| Base URL | `/api/v1` |
| Authentication | Bearer token/session do authentication layer cáº¥p |
| Request/Response | JSON; `multipart/form-data` cho upload file |
| ID format | UUID biá»ƒu diá»…n dÆ°á»›i dáº¡ng string |
| Main actors | Owner, Caretaker |
| Owner scope | Quáº£n lÃ½ pet do mÃ¬nh sá»Ÿ há»¯u vÃ  dá»¯ liá»‡u liÃªn quan |
| Caretaker scope | View only trÃªn pet Ä‘Æ°á»£c chia sáº» vÃ  quyá»n cÃ²n hiá»‡u lá»±c trong Phase 2.1 |
| Vaccine suggestion | Backend suy ra tá»« loÃ i + loáº¡i vaccine + Ä‘á»™ tuá»•i táº¡i ngÃ y tiÃªm |
| Reminder stored status | `Upcoming`, `Completed` |
| Reminder display status | `Upcoming`, `Overdue`, `Completed` â€” do API suy ra |

### 1.1. Standard success response

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

### 1.2. Standard error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dá»¯ liá»‡u khÃ´ng há»£p lá»‡",
    "details": []
  }
}
```

### 1.3. HTTP status codes

| HTTP Code | Meaning | Use case |
|---:|---|---|
| 200 | OK | Äá»c/cáº­p nháº­t thÃ nh cÃ´ng |
| 201 | Created | Táº¡o resource thÃ nh cÃ´ng |
| 302 | Redirect | Äiá»u hÆ°á»›ng trong Email Confirmation hoáº·c Google OAuth flow |
| 400 | Bad Request | Request sai cáº¥u trÃºc hoáº·c thiáº¿u dá»¯ liá»‡u |
| 401 | Unauthorized | ChÆ°a Ä‘Äƒng nháº­p hoáº·c phiÃªn háº¿t hiá»‡u lá»±c |
| 403 | Forbidden | KhÃ´ng cÃ³ quyá»n truy cáº­p resource |
| 404 | Not Found | KhÃ´ng tÃ¬m tháº¥y resource |
| 409 | Conflict | Email Ä‘Ã£ tá»“n táº¡i hoáº·c xung Ä‘á»™t nghiá»‡p vá»¥ |
| 422 | Validation Error | Request Ä‘Ãºng cáº¥u trÃºc nhÆ°ng vi pháº¡m Business Rule |

## 2. Entity & API Mapping

| Entity | API chÃ­nh | Ghi chÃº |
|---|---|---|
| User/Profile | `/auth/*` | Email/password do authentication layer quáº£n lÃ½; há»“ sÆ¡ luÃ´n cÃ³ `name` |
| Pet | `/pets`, `/pets/{pet_id}` | Thuá»™c Owner qua `owner_id` |
| VaccineRecord | `/pets/{pet_id}/vaccines` | KhÃ´ng lÆ°u `next_due_date` |
| MedicalRecord | `/pets/{pet_id}/medical-records` | CÃ³ thá»ƒ cÃ³ nhiá»u attachment |
| MedicalAttachment | `/medical-records/{record_id}/attachments` | File tá»‘i Ä‘a 5MB |
| Reminder | `/pets/{pet_id}/reminders` | CÃ³ thá»ƒ liÃªn káº¿t Vaccine Record nguá»“n |
| HealthLog | `/pets/{pet_id}/health-logs` | Má»—i láº§n nháº­p táº¡o log má»›i |
| PetAccess | `/pets/{pet_id}/access`, `/shared-pets` | Quyá»n theo pet vÃ  thá»i háº¡n |

## 3. Endpoint Index

| Group | Method | Endpoint | Purpose |
|---|---|---|---|
| Auth | POST | `/auth/register` | ÄÄƒng kÃ½ báº±ng email/password |
| Auth | POST | `/auth/login` | ÄÄƒng nháº­p báº±ng email/password |
| Auth | POST | `/auth/google` | Khá»Ÿi táº¡o Google OAuth |
| Auth | GET | `/auth/callback` | Callback chung cho Email Confirmation vÃ  Google OAuth |
| Auth | POST | `/auth/logout` | ÄÄƒng xuáº¥t |
| Auth | GET | `/auth/me` | Láº¥y user hiá»‡n táº¡i |
| Pet | GET | `/pets` | Danh sÃ¡ch pet cÃ³ quyá»n truy cáº­p |
| Pet | POST | `/pets` | Táº¡o pet |
| Pet | GET | `/pets/{pet_id}` | Xem pet detail |
| Pet | PUT | `/pets/{pet_id}` | Owner sá»­a pet |
| Vaccine | GET | `/pets/{pet_id}/vaccines` | Danh sÃ¡ch Vaccine Record |
| Vaccine | POST | `/pets/{pet_id}/vaccines` | ThÃªm Vaccine Record vÃ  nháº­n ngÃ y gá»£i Ã½ |
| Vaccine | GET | `/vaccines/{vaccine_record_id}` | Xem Vaccine Record detail |
| Medical | GET | `/pets/{pet_id}/medical-records` | Danh sÃ¡ch Medical Record |
| Medical | POST | `/pets/{pet_id}/medical-records` | ThÃªm Medical Record |
| Medical | GET | `/medical-records/{record_id}` | Xem Medical Record detail |
| Attachment | POST | `/medical-records/{record_id}/attachments` | Upload attachment |
| Attachment | GET | `/medical-records/{record_id}/attachments` | Xem attachments |
| Reminder | GET | `/pets/{pet_id}/reminders` | Xem Reminder theo pet |
| Reminder | POST | `/pets/{pet_id}/reminders` | Owner táº¡o Reminder |
| Reminder | PATCH | `/reminders/{reminder_id}/complete` | Owner Ä‘Ã¡nh dáº¥u hoÃ n thÃ nh |
| Reminder | PATCH | `/reminders/{reminder_id}` | Owner sá»­a ngÃ y háº¹n/ghi chÃº cá»§a Reminder Upcoming |
| Notification | GET | `/notifications` | Owner xem event Ä‘Ã£ Ä‘áº¿n lá»‹ch, chÆ°a há»§y |
| Notification | PATCH | `/notifications/{notification_id}/read` | Owner Ä‘Ã¡nh dáº¥u event Ä‘Ã£ Ä‘á»c |

`GET /notifications` chá»‰ tráº£ notification hiá»‡n hÃ nh: event chÆ°a há»§y, `scheduled_for <= now`, Reminder cÃ²n `Upcoming`; tá»« D+2 `overdue` thay tháº¿ `due_soon`, tá»‘i Ä‘a má»™t event cho má»—i Reminder. Endpoint read chá»‰ Ä‘Ã¡nh dáº¥u event hiá»‡n hÃ nh vÃ  idempotent.

Web Notification Center dÃ¹ng hai endpoint nÃ y trong shared header. ChuÃ´ng hiá»ƒn thá»‹ sá»‘ event chÆ°a Ä‘á»c; panel cÃ³ loading, retry, empty state vÃ  danh sÃ¡ch theo `event_type`. Chá»n event chÆ°a Ä‘á»c gá»i `PATCH /notifications/{notification_id}/read` má»™t láº§n rá»“i Ä‘iá»u hÆ°á»›ng Ä‘áº¿n `/reminders?highlight={reminder_id}`; event Ä‘Ã£ Ä‘á»c Ä‘iá»u hÆ°á»›ng trá»±c tiáº¿p. KhÃ´ng cÃ³ thao tÃ¡c Ä‘Ã¡nh dáº¥u táº¥t cáº£, xÃ³a notification hoáº·c push/email trong pháº¡m vi web UI.
| HealthLog | GET | `/pets/{pet_id}/health-logs` | Xem Health Log |
| HealthLog | POST | `/pets/{pet_id}/health-logs` | ThÃªm Health Log |
| HealthLog | PATCH | `/pets/{pet_id}/health-logs/{health_log_id}` | Owner sá»­a trÆ°á»ng nghiá»‡p vá»¥ Health Log |
| HealthLog | DELETE | `/pets/{pet_id}/health-logs/{health_log_id}` | Owner xÃ³a Health Log sau xÃ¡c nháº­n |
| Dashboard | GET | `/dashboard` | Tá»•ng quan nhiá»u pet |
| Dashboard | GET | `/pets/{pet_id}/dashboard` | Tá»•ng quan má»™t pet |
| Access | POST | `/pets/{pet_id}/access` | Chia sáº» pet |
| Access | GET | `/pets/{pet_id}/access` | Danh sÃ¡ch quyá»n Ä‘Ã£ cáº¥p |
| Access | PATCH | `/pet-access/{access_id}/revoke` | Thu há»“i quyá»n |
| Access | GET | `/shared-pets` | Pet Ä‘Æ°á»£c chia sáº» cho Caretaker |

## 4. Authentication APIs

### 4.1. POST `/auth/register`

ÄÄƒng kÃ½ báº±ng email/password. Frontend khÃ´ng gá»­i `name`; backend tá»± táº¡o theo BR-AUTH-07.

**Actor:** Guest  
**Scope:** Must Have  
**Business Rules:** BR-AUTH-01, BR-AUTH-02, BR-AUTH-03, BR-AUTH-04, BR-AUTH-07

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| email | string | Yes | Email Ä‘Äƒng kÃ½ |
| password | string | Yes | Tá»‘i thiá»ƒu 8 kÃ½ tá»± vÃ  cÃ³ Ã­t nháº¥t 1 chá»¯ sá»‘ |
| phone_number | string | No | Sá»‘ Ä‘iá»‡n thoáº¡i |

Backend processing:

1. Trim vÃ  lowercase email.
2. Kiá»ƒm tra email unique.
3. Táº¡o tÃ i khoáº£n.
4. Táº¡o `name` tá»« pháº§n trÆ°á»›c `@`.
5. Trigger/cÆ¡ cháº¿ server táº¡o há»“ sÆ¡ `public.users`; `phone_number` cÃ³ thá»ƒ lÃ  `null`.
6. VÃ¬ Email Confirmation Ä‘Æ°á»£c báº­t, `signUp` cÃ³ thá»ƒ chÆ°a tráº£ session. Khi Ä‘Ã³ tráº£ tráº¡ng thÃ¡i yÃªu cáº§u ngÆ°á»i dÃ¹ng kiá»ƒm tra email, khÃ´ng redirect vÃ o route Ä‘Æ°á»£c báº£o vá»‡.

Success `201` data:

| Field | Type | Description |
|---|---|---|
| user_id | string | UUID user |
| email | string | Email Ä‘Ã£ chuáº©n hÃ³a |
| name | string | TÃªn do há»‡ thá»‘ng táº¡o |
| session | object/null | `null` khi Ä‘ang chá» xÃ¡c nháº­n email |
| email_confirmation_required | boolean | `true` khi ngÆ°á»i dÃ¹ng pháº£i kiá»ƒm tra email |
| next | string | Internal path há»£p lá»‡ cáº§n tiáº¿p tá»¥c sau xÃ¡c nháº­n, vÃ­ dá»¥ `/pets/new?species=cat` |

Chá»‰ chuyá»ƒn Ä‘áº¿n `/pets/new?species=cat|dog` khi callback Ä‘Ã£ exchange code thÃ nh cÃ´ng vÃ  session há»£p lá»‡. `species` chá»‰ nháº­n `cat` hoáº·c `dog`; giÃ¡ trá»‹ khÃ¡c bá»‹ tá»« chá»‘i. Khi táº¡o pet, backend Ã¡nh xáº¡ `cat â†’ Cat` vÃ  `dog â†’ Dog`.

### 4.2. POST `/auth/login`

**Actor:** Owner/Caretaker  
**Scope:** Must Have  
**Business Rules:** BR-AUTH-03, BR-AUTH-05, BR-AUTH-06

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| email | string | Yes | Email Ä‘Äƒng nháº­p |
| password | string | Yes | Máº­t kháº©u |

Success `200` data:

| Field | Type | Description |
|---|---|---|
| user | object | User profile |
| redirect_to | string | LuÃ´n lÃ  `/dashboard` trong MVP |

ÄÄƒng nháº­p tháº¥t báº¡i chá»‰ tráº£: `Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng`.

### 4.3. POST `/auth/google` â€” checkpoint sau

Khá»Ÿi táº¡o Google OAuth.

**Actor:** Guest  
**Scope:** Business Rule Ä‘Ã£ chá»‘t, triá»ƒn khai á»Ÿ checkpoint riÃªng sau email/password Auth  
**Business Rules:** BR-AUTH-08

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| redirect_url | string | No | URL quay láº¡i sau khi xÃ¡c thá»±c |

Success `200` data:

| Field | Type | Description |
|---|---|---|
| authorization_url | string | URL Ä‘á»ƒ frontend chuyá»ƒn ngÆ°á»i dÃ¹ng tá»›i Google |

Cho Ä‘áº¿n khi endpoint nÃ y Ä‘Æ°á»£c triá»ƒn khai hoÃ n chá»‰nh, UI khÃ´ng Ä‘Æ°á»£c hiá»ƒn thá»‹ nÃºt Google nhÆ° má»™t chá»©c nÄƒng kháº£ dá»¥ng.

### 4.4. GET `/auth/callback`

Callback dÃ¹ng chung cho Email Confirmation vÃ  Google OAuth.

**Business Rules:** BR-AUTH-03, BR-AUTH-07, BR-AUTH-08

Query:

| Field | Type | Required | Description |
|---|---|:---:|---|
| code | string | Yes | Authorization code do Supabase Auth cáº¥p |
| next | string | No | Internal path cáº§n redirect sau callback |

Backend xá»­ lÃ½:

1. DÃ¹ng Supabase server client exchange `code` Ä‘á»ƒ táº¡o session.
2. XÃ¡c nháº­n session há»£p lá»‡ vÃ  táº¡o hoáº·c truy xuáº¥t há»“ sÆ¡ `public.users`.
3. Vá»›i Google OAuth, chá»‰ dÃ¹ng email Ä‘Ã£ Ä‘Æ°á»£c provider xÃ¡c minh vÃ  Ã¡p dá»¥ng BR-AUTH-07 cho `name`.
4. Chá»‰ cháº¥p nháº­n `next` lÃ  internal path báº¯t Ä‘áº§u báº±ng Ä‘Ãºng má»™t `/`, khÃ´ng chá»©a origin/protocol hoáº·c dáº¡ng `//host`; náº¿u khÃ´ng há»£p lá»‡ dÃ¹ng `/dashboard`.
5. Vá»›i Email Confirmation tá»« onboarding, chá»‰ cho phÃ©p `/pets/new?species=cat` hoáº·c `/pets/new?species=dog`.
6. Redirect an toÃ n sau khi session Ä‘Ã£ tá»“n táº¡i.

### 4.5. POST `/auth/logout`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-AUTH-06

Success `200`: káº¿t thÃºc phiÃªn hiá»‡n táº¡i.

Route dÃ nh cho ngÆ°á»i Ä‘Ã£ Ä‘Äƒng nháº­p pháº£i kiá»ƒm tra session phÃ­a server. Cookie/session Ä‘Æ°á»£c refresh theo mÃ´ hÃ¬nh `@supabase/ssr`; khÃ´ng dÃ¹ng service-role key á»Ÿ client.

### 4.6. GET `/auth/me`

**Actor:** Owner/Caretaker

Success `200` data:

| Field | Type | Description |
|---|---|---|
| user_id | string | UUID user |
| email | string | Email |
| name | string | TÃªn hiá»ƒn thá»‹ |
| phone_number | string/null | Sá»‘ Ä‘iá»‡n thoáº¡i |

## 5. Pet APIs

### 5.1. GET `/pets`

Owner tháº¥y pet mÃ¬nh sá»Ÿ há»¯u; Caretaker tháº¥y pet Ä‘Æ°á»£c chia sáº» vÃ  quyá»n cÃ²n hiá»‡u lá»±c.

**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data: `pets[]` gá»“m `pet_id`, `name`, `species`, `date_of_birth`, `age`, `picture_url`, `access_type`.

### 5.2. POST `/pets`

**Actor:** Owner  
**Scope:** Must Have  
**Business Rules:** BR-PET-01, BR-PET-02, BR-PET-03, BR-PET-04, BR-PET-07

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| name | string | Yes | TÃªn pet |
| species | enum | Yes | `Dog`, `Cat` |
| gender | enum | Yes | `Male`, `Female`, `Unknown` |
| breed | string | No | Giá»‘ng |
| date_of_birth | date | No | NgÃ y sinh |
| image | file | No | JPG/JPEG/PNG/WebP, tá»‘i Ä‘a 5 MB; upload multipart |
| idempotency_key | string | Yes | KhÃ³a retry cho cÃ¹ng má»™t thao tÃ¡c táº¡o, scope theo Owner |

Success `201` data: Pet vá»«a táº¡o. `picture_url` lÃ  object path á»•n Ä‘á»‹nh, khÃ´ng pháº£i signed URL.

`POST` cÃ¹ng `idempotency_key` vÃ  cÃ¹ng payload tráº£ láº¡i cÃ¹ng Pet; cÃ¹ng khÃ³a nhÆ°ng payload khÃ¡c tráº£ `409`.

### 5.3. GET `/pets/{pet_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data:

| Field | Type | Description |
|---|---|---|
| pet | object | Pet detail |
| access | object | Vai trÃ² vÃ  quyá»n hiá»‡n táº¡i |

### 5.4. PUT `/pets/{pet_id}`

**Actor:** Owner  
**Business Rules:** BR-PET-01, BR-PET-02, BR-PET-06, BR-PET-07

Request giá»‘ng POST `/pets`, thÃªm `remove_picture=true` Ä‘á»ƒ bá» áº£nh. Success data lÃ  Pet sau cáº­p nháº­t; cleanup áº£nh cÅ© tháº¥t báº¡i tráº£ `picture_cleanup: "pending"`.

### 5.5. GET `/api/pets/{pet_id}?photo=1`

Owner Ä‘Ã£ xÃ¡c thá»±c cÃ³ thá»ƒ Ä‘á»c áº£nh private cá»§a Pet mÃ¬nh. Server kiá»ƒm tra ownership rá»“i stream object tá»« bucket `pet-photos`; khÃ´ng phÃ¡t hÃ nh URL public hoáº·c lÆ°u signed URL vÃ o database. Pet khÃ¡c/anonymous nháº­n `401/404`.

KhÃ´ng cung cáº¥p Pet Delete trong MVP.

## 6. Vaccine Record APIs

### 6.1. GET `/pets/{pet_id}/vaccines`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-01, BR-MEDHIST-05

Success data: `vaccines[]`, sáº¯p xáº¿p `vaccine_date` giáº£m dáº§n.

### 6.2. POST `/pets/{pet_id}/vaccines`

Táº¡o Vaccine Record vÃ  tráº£ ngÃ y tiÃªm tiáº¿p theo náº¿u tÃ­nh Ä‘Æ°á»£c.

**Actor:** Owner/Caretaker  
**Business Rules:** BR-VAC-01 Ä‘áº¿n BR-VAC-08, BR-MEDHIST-02, BR-MEDHIST-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| vaccine_name | string | Yes | TÃªn/loáº¡i vaccine |
| vaccine_date | date | Yes | NgÃ y tiÃªm |
| dose_number | integer | No | Sá»‘ liá»u, chá»‰ lÃ  dá»¯ liá»‡u mÃ´ táº£ |
| clinic_name | string | No | TÃªn phÃ²ng khÃ¡m |
| note | string | No | Ghi chÃº |

Frontend khÃ´ng gá»­i `species`, `date_of_birth` hoáº·c tuá»•i.

Backend processing:

1. Kiá»ƒm tra quyá»n vá»›i Pet.
2. LÆ°u Vaccine Record vÃ  `created_by`.
3. Láº¥y `Pet.species` vÃ  `Pet.date_of_birth`.
4. TÃ­nh `age_at_vaccination` táº¡i `vaccine_date`.
5. TÃ¬m `standard_interval` theo loÃ i + vaccine + Ä‘á»™ tuá»•i.
6. TÃ­nh `suggested_next_due_date = vaccine_date + standard_interval`.
7. KhÃ´ng persist ngÃ y gá»£i Ã½ vÃ o Vaccine Record.

Success `201` data:

| Field | Type | Description |
|---|---|---|
| vaccine_record | object | Vaccine Record vá»«a táº¡o |
| suggested_next_due_date | date/null | NgÃ y gá»£i Ã½ hoáº·c null náº¿u khÃ´ng Ä‘á»§ cÆ¡ sá»Ÿ |
| warning | string/null | Cáº£nh bÃ¡o má»m náº¿u ngÃ y tiÃªm á»Ÿ tÆ°Æ¡ng lai |

NgÆ°á»i dÃ¹ng cÃ³ thá»ƒ chá»‰nh ngÃ y gá»£i Ã½ trÆ°á»›c khi gá»i POST Reminder.

### 6.3. GET `/vaccines/{vaccine_record_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data: Vaccine Record detail.

KhÃ´ng cung cáº¥p API sá»­a/xÃ³a Vaccine Record trong MVP.

## 7. Medical Record APIs

### 7.1. GET `/pets/{pet_id}/medical-records`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-01, BR-MEDHIST-05

Success data: `medical_records[]`, sáº¯p xáº¿p `visit_date` giáº£m dáº§n.

### 7.2. POST `/pets/{pet_id}/medical-records`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MED-01, BR-MED-02, BR-MEDHIST-02, BR-MEDHIST-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| visit_date | date | Yes | NgÃ y khÃ¡m |
| clinic_name | string | No | TÃªn phÃ²ng khÃ¡m |
| symptoms | text | No | Triá»‡u chá»©ng |
| diagnosis | text | No | Cháº©n Ä‘oÃ¡n |
| medication | text | No | Thuá»‘c kÃª |
| note | string | No | Ghi chÃº |

Success `201` data: Medical Record vá»«a táº¡o, gá»“m `created_by`.

### 7.3. GET `/medical-records/{record_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data gá»“m Medical Record detail vÃ  `attachments[]`.

### 7.4. POST `/medical-records/{record_id}/attachments`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MED-03, BR-MEDHIST-05

Request `multipart/form-data`:

| Field | Type | Required | Description |
|---|---|:---:|---|
| file | file | Yes | jpg/png/pdf, tá»‘i Ä‘a 5MB |

Success `201` data: `attachment_id`, `file_url`, `file_type`, `file_size`, `uploaded_at`.

### 7.5. GET `/medical-records/{record_id}/attachments`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data: `attachments[]`.

KhÃ´ng cung cáº¥p API sá»­a/xÃ³a Medical Record trong MVP.

## 8. Reminder APIs

### 8.1. GET `/pets/{pet_id}/reminders`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-REM-05, BR-REM-06, BR-REM-09

Success data: `reminders[]` gá»“m:

| Field | Type | Description |
|---|---|---|
| reminder_id | string | UUID |
| due_date | date | NgÃ y háº¹n |
| type | enum | Vaccine, Recheck, Medication, Other |
| status | enum | Tráº¡ng thÃ¡i lÆ°u trá»¯: Upcoming/Completed |
| display_status | enum | Upcoming/Overdue/Completed |
| is_overdue | boolean | QuÃ¡ háº¡n vÃ  chÆ°a hoÃ n thÃ nh |
| note | string/null | Ghi chÃº |
| source_vaccine_record_id | string/null | Vaccine Record nguá»“n |

### 8.2. POST `/pets/{pet_id}/reminders`

Owner táº¡o Reminder thá»§ cÃ´ng hoáº·c xÃ¡c nháº­n ngÃ y gá»£i Ã½ tá»« Vaccine Record.

**Actor:** Owner  
**Business Rules:** BR-REM-01, BR-REM-02, BR-REM-03, BR-REM-04, BR-REM-07, BR-VAC-04

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| type | enum | Yes | Vaccine, Recheck, Medication, Other |
| due_date | date | Yes | NgÃ y ngÆ°á»i dÃ¹ng xÃ¡c nháº­n |
| note | string | No | Ghi chÃº |
| source_vaccine_record_id | string | No | Vaccine Record nguá»“n |

Success `201` data: Reminder vá»«a táº¡o vá»›i `status = Upcoming`.

### 8.3. PATCH `/reminders/{reminder_id}/complete`

**Actor:** Owner  
**Business Rules:** BR-REM-08

Success `200` data: Reminder vá»›i `status = Completed` vÃ  `display_status = Completed`.

## 9. Health Log APIs

CÃ¡c endpoint trong má»¥c nÃ y thuá»™c Should Have / Phase 2.

### 9.1. GET `/pets/{pet_id}/health-logs`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-HLOG-01, BR-HLOG-05

Success data: `health_logs[]`, sáº¯p xáº¿p `logged_at` giáº£m dáº§n.

### 9.2. POST `/pets/{pet_id}/health-logs`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-HLOG-01, BR-HLOG-02, BR-HLOG-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| recorded_on | date | Yes | NgÃ y nháº­t kÃ½, khÃ´ng á»Ÿ tÆ°Æ¡ng lai theo `Asia/Ho_Chi_Minh` |
| weight | decimal | No | CÃ¢n náº·ng kg |
| food_amount | string | No | LÆ°á»£ng thá»©c Äƒn |
| food_type | string | No | Loáº¡i thá»©c Äƒn |
| status | string | No | Tráº¡ng thÃ¡i sá»©c khá»e |
| note | string | No | Ghi chÃº |

Ãt nháº¥t má»™t trÆ°á»ng pháº£i cÃ³ giÃ¡ trá»‹. Success `201` tráº£ Health Log vá»«a táº¡o. API khÃ´ng tá»± cáº£nh bÃ¡o cÃ¢n náº·ng báº¥t thÆ°á»ng vÃ¬ chÆ°a cÃ³ rule xÃ¡c Ä‘á»‹nh ngÆ°á»¡ng.

### 9.3. PATCH `/pets/{pet_id}/health-logs/{health_log_id}`

**Actor:** Owner cá»§a Pet

Chá»‰ nháº­n cÃ¡c trÆ°á»ng `recorded_on`, `weight`, `food_amount`, `food_type`, `status` vÃ  `note`. CÃ¡c trÆ°á»ng Ä‘á»‹nh danh `health_log_id`, `pet_id`, `created_by` vÃ  `logged_at` khÃ´ng Ä‘Æ°á»£c sá»­a. CÃ³ thá»ƒ gá»­i `null` Ä‘á»ƒ xÃ³a giÃ¡ trá»‹ cá»§a trÆ°á»ng tÃ¹y chá»n, nhÆ°ng báº£n ghi sau cáº­p nháº­t váº«n pháº£i cÃ³ Ã­t nháº¥t má»™t trÆ°á»ng nghiá»‡p vá»¥. `recorded_on` khÃ´ng Ä‘Æ°á»£c á»Ÿ tÆ°Æ¡ng lai theo mÃºi giá» `Asia/Ho_Chi_Minh`.

Success `200` tráº£ `{ "health_log": ... }` lÃ  báº£n ghi chuáº©n sau khi cáº­p nháº­t. Owner khÃ¡c, Caretaker vÃ  Anonymous khÃ´ng Ä‘Æ°á»£c truy cáº­p; resource ngoÃ i pháº¡m vi tráº£ `404` theo nguyÃªn táº¯c báº£o vá»‡ riÃªng tÆ°.

### 9.4. DELETE `/pets/{pet_id}/health-logs/{health_log_id}`

**Actor:** Owner cá»§a Pet

XÃ³a vÄ©nh viá»…n má»™t Health Log sau khi UI xÃ¡c nháº­n. Success `200` tráº£ `{ "deleted_health_log_id": "..." }`. Request láº·p hoáº·c resource ngoÃ i pháº¡m vi tráº£ `404`; khÃ´ng thay Ä‘á»•i cÃ¡c báº£ng liÃªn quan.

## 10. Dashboard APIs

Route UI `/dashboard` lÃ  landing/pet-list cÆ¡ báº£n thuá»™c Core MVP vÃ  lÃ  Ä‘Ã­ch sau login. CÃ¡c API tá»•ng há»£p/phÃ¢n tÃ­ch trong má»¥c nÃ y váº«n thuá»™c Should Have / Phase 2.

### 10.1. GET `/dashboard`

**Actor:** Owner  
**Business Rules:** BR-HLOG-03, BR-HLOG-04, BR-REM-09

Query:

| Field | Type | Required | Description |
|---|---|:---:|---|
| period | enum | No | `week`, `month`; máº·c Ä‘á»‹nh `week` |
| pet_id | string | No | Lá»c theo pet |

Success data:

| Field | Type | Description |
|---|---|---|
| total_pets | integer | Tá»•ng sá»‘ pet |
| upcoming_reminders | array | Reminder chÆ°a Ä‘áº¿n háº¡n |
| overdue_reminders | array | Reminder quÃ¡ háº¡n chÆ°a hoÃ n thÃ nh |
| latest_medical_records | array | Láº§n khÃ¡m gáº§n nháº¥t |
| weight_trends | array/null | Dá»¯ liá»‡u cÃ¢n náº·ng hoáº·c null náº¿u chÆ°a Ä‘á»§ dá»¯ liá»‡u |

### 10.2. GET `/pets/{pet_id}/dashboard`

**Actor:** Owner  
**Business Rules:** BR-HLOG-03, BR-HLOG-04, BR-REM-09

Query: `period=week|month`.

Success data: Pet summary, upcoming/overdue reminders, latest medical record vÃ  weight trend.

## 11. Pet Access APIs

CÃ¡c endpoint trong má»¥c nÃ y thuá»™c Should Have / Phase 2.

### 11.1. POST `/pets/{pet_id}/access`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-02, BR-SHARE-04, BR-SHARE-05, BR-SHARE-06, BR-SHARE-08

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| caretaker_email | string | Yes | Email Caretaker |
| valid_until | date | Yes | NgÃ y háº¿t hiá»‡u lá»±c |

Success `201` data: `access_id`, `status`, `caretaker_email`, `valid_until`.

### 11.2. GET `/pets/{pet_id}/access`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-02

Success data: `access_list[]`.

### 11.3. PATCH `/pet-access/{access_id}/revoke`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-07

Success data: access vá»›i `status = Revoked`.

### 11.4. GET `/shared-pets`

**Actor:** Caretaker  
**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data: danh sÃ¡ch pet Ä‘Æ°á»£c chia sáº» vÃ  quyá»n cÃ²n hiá»‡u lá»±c.

### 11.5. POST `/pets/{pet_id}/access`

**Actor:** Owner cá»§a pet.

Táº¡o lá»i má»i `Pending` vá»›i `caretaker_email` Ä‘Ã£ trim/lowercase vÃ  `valid_until`
theo ngÃ y Viá»‡t Nam. Server tá»± gáº¯n `granted_by`, `pet_id` vÃ  tÃªn snapshot; khÃ´ng
nháº­n `caretaker_id` hoáº·c tráº¡ng thÃ¡i tá»« client. Lá»i má»i trÃ¹ng cÃ²n hiá»‡u lá»±c tráº£
`409`.

### 11.6. PATCH `/pet-access/{access_id}/revoke`

**Actor:** Owner Ä‘Ã£ cáº¥p quyá»n.

Chuyá»ƒn `Pending` hoáº·c `Active` sang `Revoked`. KhÃ´ng thá»ƒ kÃ­ch hoáº¡t láº¡i lá»i má»i
Ä‘Ã£ thu há»“i; muá»‘n chia sáº» tiáº¿p pháº£i táº¡o lá»i má»i má»›i.

### 11.7. GET `/pet-access/invitations`

**Actor:** Authenticated user cÃ³ email Ä‘Ã£ xÃ¡c minh.

Tráº£ lá»i má»i `Pending` cá»§a chÃ­nh email, chá»‰ gá»“m tÃªn snapshot vÃ  ngÃ y háº¿t háº¡n.
ChÆ°a cháº¥p nháº­n thÃ¬ chÆ°a tráº£ há»“ sÆ¡ chi tiáº¿t.

### 11.8. POST `/pet-access/{access_id}/accept`

**Actor:** Authenticated user cÃ³ email Ä‘Ã£ xÃ¡c minh trÃ¹ng lá»i má»i.

Trong má»™t thao tÃ¡c cÃ³ Ä‘iá»u kiá»‡n, kiá»ƒm tra `Pending`, email khá»›p vÃ  chÆ°a háº¿t háº¡n,
sau Ä‘Ã³ gáº¯n `caretaker_id` tá»« phiÃªn vÃ  chuyá»ƒn `Active`. Request Ä‘áº¿n muá»™n hoáº·c
cháº¥p nháº­n láº§n hai tráº£ `409`.

## 12. Key Backend Logic

| Logic | Rule | Implementation requirement |
|---|---|---|
| Email normalization | BR-AUTH-03 | Trim + lowercase táº¡i má»i Ä‘iá»ƒm so khá»›p email |
| Name generation | BR-AUTH-07 | Email local-part hoáº·c Google name; luÃ´n cÃ³ fallback |
| Google OAuth | BR-AUTH-08 | Chá»‰ tin email Ä‘Ã£ Ä‘Æ°á»£c provider xÃ¡c minh |
| Email confirmation | BR-AUTH-09/10 | KhÃ´ng giáº£ Ä‘á»‹nh `signUp` luÃ´n cÃ³ session; callback exchange code trÆ°á»›c khi redirect |
| Safe redirect | BR-AUTH-10/13 | Chá»‰ cháº¥p nháº­n internal `next`; báº£o toÃ n duy nháº¥t `species=cat|dog` qua onboarding |
| User profile write | BR-AUTH-14 | Client chá»‰ sá»­a `name`, `phone_number`; email do Auth Ä‘á»“ng bá»™ |
| Pet authorization | BR-PET-05, BR-SHARE-04/05 | Kiá»ƒm tra Owner hoáº·c PetAccess active, chÆ°a háº¿t háº¡n |
| Vaccine suggestion | BR-VAC-03/05/06/08 | LoÃ i + vaccine + Ä‘á»™ tuá»•i; vaccine_date lÃ  má»‘c cá»™ng chu ká»³ |
| Reminder creation | BR-REM-03/07 | Chá»‰ persist sau khi Owner xÃ¡c nháº­n |
| Reminder display status | BR-REM-09 | Derive tá»« stored status, due_date vÃ  current date |
| Health Log validation | BR-HLOG-02 | Reject náº¿u táº¥t cáº£ trÆ°á»ng nghiá»‡p vá»¥ Ä‘á»u trá»‘ng |
| Attachment validation | BR-MED-03 | Reject náº¿u file > 5MB hoáº·c sai Ä‘á»‹nh dáº¡ng |
| Caretaker model | CC-03 | View only Vaccine/Medical dáº¡ng vÄƒn báº£n; khÃ´ng Health Log/Reminder |

## 13. Development Notes

- KhÃ´ng lÆ°u `next_due_date` trong Vaccine Record.
- Frontend khÃ´ng gá»­i láº¡i loÃ i hoáº·c tuá»•i khi táº¡o Vaccine Record.
- Náº¿u thiáº¿u ngÃ y sinh hoáº·c khÃ´ng cÃ³ chu ká»³ phÃ¹ há»£p, tráº£ ngÃ y gá»£i Ã½ lÃ  null.
- `dose_number` khÃ´ng pháº£i tiÃªu chÃ­ chÃ­nh Ä‘á»ƒ chá»n chu ká»³ trong rule hiá»‡n táº¡i.
- Reminder chá»‰ Ä‘Æ°á»£c táº¡o sau khi Owner xÃ¡c nháº­n ngÃ y.
- Database lÆ°u Reminder status lÃ  Upcoming/Completed; API suy ra Overdue.
- KhÃ´ng Ä‘Æ°a Pet Delete vÃ o MVP.
- Health Log cÃ³ PATCH/DELETE Owner-only theo má»¥c 9.3â€“9.4; Vaccine Record vÃ  Medical Record váº«n chÆ°a cÃ³ API sá»­a/xÃ³a trong MVP.
- `/dashboard` landing/pet-list cÆ¡ báº£n thuá»™c MVP; Dashboard phÃ¢n tÃ­ch nÃ¢ng cao, Health Log vÃ  Pet Access lÃ  Should Have / Phase 2.
- MVP khÃ´ng há»— trá»£ hard-delete tÃ i khoáº£n; khÃ´ng cascade xÃ³a pet hoáº·c lá»‹ch sá»­ chÄƒm sÃ³c.
- Háº¡ táº§ng Auth dá»± kiáº¿n dÃ¹ng `@supabase/ssr`, browser/server client tÃ¡ch riÃªng, cookie/session refresh vÃ  route protection.
- KhÃ´ng dÃ¹ng service-role key á»Ÿ client.

