# MMinCare — Business Rules

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Rule conventions

- `Current` means implemented in the production baseline.
- `Planned` means approved but not yet available.
- `Phase 2` means outside the current runtime scope.
- Current runtime users are **Authenticated Owner** and **Public Demo Visitor**. System processing is internal, not a user actor.

## 2. Authentication

| ID | Rule | Status |
|---|---|---|
| BR-AUTH-01 | Email/password registration uses Supabase Auth and Email Confirmation. A user is not sent into a protected area until a valid session exists. | Current |
| BR-AUTH-02 | Email is trimmed and normalized to lowercase before validation or matching. | Current |
| BR-AUTH-03 | Password validation follows the active Supabase/project configuration; the documentation does not hard-code an unverified length or composition rule. | Current |
| BR-AUTH-04 | Login failure uses a generic message and must not disclose whether the email or password was incorrect. | Current |
| BR-AUTH-05 | Protected pages and APIs require a valid server-side session. | Current |
| BR-AUTH-06 | Logout invalidates the active session and returns the user to an unauthenticated route. | Current |
| BR-AUTH-07 | A forgot-password request returns a generic response whether or not the email exists. | Current |
| BR-AUTH-08 | A recovery link is processed through the Auth callback using PKCE `code` or a supported `token_hash`; the callback must establish a valid recovery session before redirecting. | Current |
| BR-AUTH-09 | Recovery redirect accepts only the internal `/reset-password` destination; unsafe or external destinations are rejected/fallback safely. | Current |
| BR-AUTH-10 | A user may submit a new password only while a valid recovery/authenticated session exists. The new password follows BR-AUTH-03. | Current |
| BR-AUTH-11 | Google OAuth is not shown as available until provider configuration, redirect allowlist and runtime verification are complete. | Planned — Phase 1 |
| BR-AUTH-12 | `public.users` is synchronized from `auth.users`; clients may not write identity fields or use a service-role secret. | Current |

## 3. Pet profile

| ID | Rule | Status |
|---|---|---|
| BR-PET-01 | Pet creation requires name, species (`Dog|Cat`), gender (`Male|Female|Unknown`) and POST idempotency key; ownership comes from the session. | Current |
| BR-PET-02 | Breed/date_of_birth/image are optional. Date of birth must be valid and not future. Weight is a Health Log field, not a pets column. | Current |
| BR-PET-03 | An Owner may read only Pets they own. | Current |
| BR-PET-04 | Only the Owner may create or update the Pet profile in the current runtime. | Current |
| BR-PET-05 | Optional JPG/JPEG/PNG/WebP ≤5 MiB; select/change/remove with preview. Private pet-photos object access is Owner-scoped; real photo cover fills a square, species fallback uses contain. | Current |
| BR-PET-06 | Pet card shows latest Health Log business date, status, weight and link to Health; hides food/amount. Missing values are explicit; latest order follows BR-HLOG-06. | Current |
| BR-PET-07 | Pet deletion is not part of the current API. | Current constraint |

## 4. Vaccine Record

| ID | Rule | Status |
|---|---|---|
| BR-VAC-01 | A Vaccine Record represents a vaccination that already occurred. `vaccine_name` and `vaccine_date` are required. | Current |
| BR-VAC-02 | `vaccine_date` must not be later than the current business date; client and server both reject a future value. | Current |
| BR-VAC-03 | `dose_number`, `clinic_name` and `note` are optional. | Current |
| BR-VAC-04 | The backend may calculate `suggested_next_due_date = vaccine_date + standard_interval_days` when a matching schedule exists. | Current |
| BR-VAC-05 | `suggested_next_due_date` is a transient suggestion and is never persisted in `vaccine_records`. | Current |
| BR-VAC-06 | Suggestion distinguishes matched/no_match/unavailable/not_checked. No-match and rule-query failure differ; no guessed interval. CR-08 access/dataset is not complete, so manual Reminder date remains available. | Current |
| BR-VAC-07 | Saving a Vaccine Record does not automatically create a Reminder. The Owner must confirm or edit the proposed date. | Current |
| BR-VAC-08 | Owner may hard-delete a Vaccine Record after confirmation; linked Reminders remain with null source FK. No PATCH/edit endpoint for Vaccine Records. | Current |

## 5. Medical Record and Attachment

| ID | Rule | Status |
|---|---|---|
| BR-MED-01 | `visit_date` is required and must pass the server validation implemented by the current route. | Current |
| BR-MED-02 | Clinic, symptoms, diagnosis, medication and note are optional. | Current |
| BR-MED-03 | A Medical Record may be saved without an attachment. | Current |
| BR-MED-04 | Attachment upload is a separate operation. Upload failure does not roll back the Medical Record or create false attachment metadata. | Current |
| BR-MED-05 | The user may retry an attachment upload against the same Medical Record. | Current |
| BR-MED-06 | Accepted attachment formats are the image/PDF MIME types allowed by the route; the effective maximum size is 5 MiB per file. | Current |
| BR-MED-07 | Medical attachments are private and stored in bucket `medical-record-attachments`. Access uses authorization checks and time-limited signed URLs. | Current |
| BR-MED-08 | Medical Records and attachments are Owner-only under the current runtime policies. | Current |
| BR-MED-09 | Owner may hard-delete a Medical Record after confirmation; attachment metadata cascades, Storage cleanup may return pending/warnings, Reminders remain with null source FK. No PATCH/edit endpoint. | Current |

## 6. Reminder

| ID | Rule | Status |
|---|---|---|
| BR-REM-01 | A Reminder requires a Pet, type and `due_date`; note is optional. A past due date is permitted. | Current |
| BR-REM-02 | A Reminder may be manual, linked to one Vaccine Record, or linked to one Medical Record. | Current |
| BR-REM-03 | At most one source field is populated: `source_vaccine_record_id` XOR `source_medical_record_id`, or both are null for a manual Reminder. | Current |
| BR-REM-04 | A source record must belong to the same Pet as the Reminder. | Current |
| BR-REM-05 | `source_vaccine_record_id` is nullable and non-unique; one Vaccine Record may therefore be referenced by zero or more Reminders. Any duplicate-handling beyond database constraints follows the current route behavior. | Current |
| BR-REM-06 | Submit controls use a loading/disabled state to reduce accidental double-click creation. | Current |
| BR-REM-07 | Stored status is `Upcoming` or `Completed`. `Overdue` is derived when an Upcoming Reminder has `due_date` before the current date. | Current |
| BR-REM-08 | Only Owner may list/create/edit/complete Reminders. Edit accepts due_date and note only, for stored Upcoming status; derived Overdue remains Upcoming in storage. | Current |
| BR-REM-09 | Complete sets status=Completed and completed_at through its dedicated endpoint; edit uses separate allowlist due_date/note. API, RLS and grants enforce operation scope. | Current |
| BR-REM-10 | Anonymous users have no Reminder privileges; authenticated users receive only the grants required by Owner policies. | Current |
| BR-REM-11 | Current Reminders are in-app only; no push/email delivery is implied. | Current constraint |

## 7. Health Log and Dashboard

| ID | Rule | Status |
|---|---|---|
| BR-HLOG-01 | Health Log GET/POST/PATCH/DELETE is Owner-only; Pet membership and creator/ownership are checked in API/RLS. | Current |
| BR-HLOG-02 | `recorded_on` is required and represents the business date selected by the Owner. | Current |
| BR-HLOG-03 | `logged_at` is the system entry timestamp and is not accepted from the client. | Current |
| BR-HLOG-04 | `recorded_on` cannot be later than the current date in `Asia/Ho_Chi_Minh`. | Current |
| BR-HLOG-05 | Weight is optional positive numeric up to 9999.99 with at most two decimals; food_amount/food_type/status/note optional text. At least one business value required; clearing all values is rejected. | Current |
| BR-HLOG-06 | The latest Health Log is selected by `recorded_on DESC`, then `logged_at DESC`, then `health_log_id DESC`. | Current |
| BR-HLOG-07 | Owner may edit business fields and recorded_on, or delete after confirmation. health_log_id/pet_id/created_by/logged_at are immutable; no soft-delete/audit history is claimed. | Current |
| BR-HLOG-08 | The per-Pet dashboard accepts `period=week|month`; all period filtering uses `recorded_on`. | Current |
| BR-HLOG-09 | Weight trend uses available weight values in the selected period. Loading, error, empty and insufficient-data states must be explicit. | Current |
| BR-HLOG-10 | Status frequency displays Bình thường, Mệt mỏi, Ăn kém/Bỏ ăn, Nôn, Tiêu chảy and Khác. Any value outside the five named standard groups is aggregated into Khác. | Current |
| BR-HLOG-11 | Status tooltip supports hover, keyboard focus, Enter/Space and tap; it shows at most three recent records plus the remaining count. Khác may show the original status breakdown. | Current |
| BR-HLOG-12 | Tooltip interaction uses data already returned by the dashboard request and must not trigger a new fetch. | Current |
| BR-HLOG-13 | A dashboard aggregating all Pets is not current. | Phase 2 |

## 8. Sharing and Caretaker

| ID | Rule | Status |
|---|---|---|
| BR-SHARE-01 | `pet_access` may remain in the schema as reserved data design but does not make Caretaker a current runtime actor. | Phase 2/reserved |
| BR-SHARE-02 | Target Caretaker permission is View + Add Vaccine/Medical for an explicitly shared Pet; Caretaker cannot create, edit or complete Reminders. | Phase 2 |
| BR-SHARE-03 | Caretaker cannot edit/delete existing medical history or share a Pet onward. | Phase 2 |
| BR-SHARE-04 | Caretaker Health Log access requires a separate approved implementation; current Health Log remains Owner-only. | Phase 2 |

## 9. Security and deployment

| ID | Rule | Status |
|---|---|---|
| BR-SEC-01 | RLS is enabled on user-data tables and access is enforced server-side/database-side, not only in UI. | Current |
| BR-SEC-02 | `rls_auto_enable()` is not executable by `anon` or `authenticated`. | Current hardening |
| BR-SEC-03 | Migrations are the repository source of truth, but detected remote migration-history drift must be reconciled before automated replay. | Current operational rule |
| BR-SEC-04 | Portable configuration uses production-origin settings; public app/demo links are recorded explicitly as release evidence, not secrets. | Current |
| BR-SEC-05 | A new host must provide Node.js `>=20.9.0`, run `npm ci` and `npm run build`, and configure the public Supabase URL/publishable key. | Current portability rule |
| BR-SEC-06 | A host migration must verify SSR cookies, Auth Site URL/redirect allowlist, signed URLs, RLS, grants, constraints and indexes. | Current portability rule |

## 10. Change requests and delivery

- **CR-DELETE-001:** delivered — Vaccine/Medical hard-delete with confirmation, retained source-free Reminders and attachment cleanup reporting.
- **CR-CHART-001:** delivered — full-period weight axis and point tooltip.
- **CR-01/CR-02/CR-03:** PR #22 delivered request timeout/lifecycle, stale GET protection, literal `invalid` validation, immutable POST retry and idempotency. Automated regression evidence does not establish runtime A/B/retry tests.
- **CR-08:** status contract fixed, production rule access/dataset still incomplete; no rule/interval fabricated for demo.

### Additional current rules

| ID | Rule | Status |
|---|---|---|
| BR-HLOG-14 | POST requires idempotency_key ≤128 characters; same Owner/Pet/key and normalized payload returns canonical row. A different payload returns 409 with recovery=canonical and existing row. | Current |
| BR-HLOG-15 | Unknown POST result keeps immutable payload/key and locks fields until resolved; retry does not start a new logical creation. Cancel/error invalidates old requests and revalidates history. | Current |
| BR-HLOG-16 | DELETE timeout/network/malformed response is ambiguous; retry 404 is not automatic success. Cancel revalidates canonical GET; stale GET cannot undo mutations. | Current |
| BR-UX-01 | Enter in weight/food_type/food_amount never implicitly saves; textarea newline, date/select native action, Save button keyboard activation and IME preserved. | Current |
| BR-UX-02 | Mobile Pet tabs form 2 × 2; group age metadata, wrap long content, use positive spacing; compact attribution/actions footer and 44px touch targets. | Current |
| BR-NOTIF-01 | Notification events are due_soon/overdue for eligible current Upcoming Reminders; opening panel does not mark read. | Current |
| BR-NOTIF-02 | Only a red dot shows unread visually; accessible label may contain count. Successful read updates dot and navigates to linked Reminder highlight; errors retain unread with retry. | Current |
| BR-NOTIF-03 | Revalidate on panel open and invalidate after Reminder mutations; abort/stale-response safeguards prevent obsolete reads or navigation. Escape/outside closes and restores focus; panel and mobile menu are exclusive. | Current |
| BR-PHOTO-01 | pet-photos private from creation, size/MIME restrictions and Owner folder policies; files validated server-side. No service-role in client; photo GET streams authorized object. | Current |
| BR-DEMO-01 | /demo is public and uses existing application components/forms/styles through a scoped local transport; no real Auth/production API/DB/Storage operations. | Current |
| BR-DEMO-02 | Meo/Min photos, Sushi fallback/basic records; fixtures fixed, date anchored to Vietnam on start/reset; no random reshuffle or forced equal status frequencies. | Current |
| BR-DEMO-03 | Changes live in per-tab sessionStorage with in-memory fallback; reload retains state if storage works; reset confirms then replaces demo key only. Browser duplicated/opened tabs may start from copied browser state, then remain independent. | Current |
| BR-DEMO-04 | Sample observations illustrate UI/data only, no diagnosis, dose or vaccine interval guidance; demo success is not Owner isolation/backend performance evidence. | Current |


## 11. Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Đồng bộ code đã triển khai, CRUD/ảnh/thông báo, request lifecycle/idempotency và demo cùng UI; tách phạm vi kiểm chứng và kế hoạch. |
| 1.6 | 2026-09-22 | Rebuilt rules for password recovery, current Owner-only Health Log/dashboard, Medical-source Reminder, completion hardening, private attachment bucket, deployment portability and pending changes. |
| 1.5 | 2026-09-16 | Added initial Health Log date semantics. |
