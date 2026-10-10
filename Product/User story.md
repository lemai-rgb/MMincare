# MMinCare — User Story Document

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## Epic 1 — Authentication

### US-01 — Register and confirm email

**Actor:** Guest  
**Priority/Status:** Must Have — Current  
**Story:** As a new Owner, I want to register and confirm my email so that my Pet data is protected by an authenticated account.

**Acceptance criteria**

- Valid email/password registration creates the Auth account/profile or returns the confirmation-required state.
- The user does not enter protected pages before a valid session exists.
- Invalid email/password data is rejected at the form and server boundary.
- Confirmation callback supports approved token-hash/PKCE processing and safe internal redirect.

**Rules:** BR-AUTH-01, BR-AUTH-02, BR-AUTH-03, BR-AUTH-05.

### US-02 — Login and logout

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- Valid credentials establish a session and open `/dashboard`.
- Invalid credentials produce a generic error.
- Protected routes redirect an unauthenticated request.
- Logout ends the session.

**Rules:** BR-AUTH-04, BR-AUTH-05, BR-AUTH-06.

### US-03 — Forgot and reset password

**Actor:** Guest/Owner  
**Priority/Status:** Must Have — Current  
**Story:** As an Owner who cannot sign in, I want to request recovery and set a new password without revealing whether an email is registered.

**Acceptance criteria**

- Forgot-password submission returns a generic response.
- A valid recovery callback establishes a session and redirects only to `/reset-password`.
- Reset is rejected without a valid session.
- A new password is accepted only when it satisfies the active Supabase/project password policy.
- Success returns the user to the intended authentication flow.

**Rules:** BR-AUTH-03, BR-AUTH-07, BR-AUTH-08, BR-AUTH-09, BR-AUTH-10.

### US-04 — Google OAuth

**Status:** Planned — Phase 1 pending provider/redirect configuration.  
The UI must not present Google login as available before runtime verification.

## Epic 2 — Pet profile

### US-05 — Create Pet

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- The payload must pass the required-field validation of the deployed form and server route.
- Optional fields and allowed values follow the deployed contract rather than a separately invented enum.
- The created Pet belongs to the authenticated Owner.
- An Owner cannot create a Pet on behalf of another user by changing an id in the request.

**Rules:** BR-PET-01, BR-PET-02, BR-PET-05.

### US-06 — View and update Pet

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- The dashboard lists only Pets owned by the session user.
- Selecting a card opens the correct Pet detail.
- The Owner can update permitted Pet fields.
- Loading, empty and error states are visible.
- The Pet card displays the latest Health summary when available.

**Rules:** BR-PET-03, BR-PET-04, BR-PET-06, BR-HLOG-06.

## Epic 3 — Medical history

### US-07 — Add Vaccine Record

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- Vaccine name and date are required.
- A future `vaccine_date` is rejected and no row is inserted.
- Suggestion result distinguishes `matched`, `no_match`, `unavailable`, `not_checked`; approved rule access/dataset remains incomplete (CR-08), no invented interval.
- The suggestion can be edited before the Owner separately creates a Reminder.
- The saved Vaccine Record appears in recent history.

**Rules:** BR-VAC-01 through BR-VAC-07.

### US-08 — Add Medical Record and optional attachment

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- A valid `visit_date` creates a Medical Record.
- Record creation succeeds without a file.
- Valid image/PDF attachment is stored privately and can be opened through authorized signed access.
- Invalid size/type is rejected.
- Failed upload leaves the Medical Record intact and offers retry on the same record.

**Rules:** BR-MED-01 through BR-MED-08.

### US-09 — View medical history and details

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- The Owner views Vaccine and Medical history for the selected Pet.
- Records are ordered by their business dates, latest first.
- Selecting an implemented detail opens the correct record and authorized attachments.
- Empty and error states do not claim data was deleted.

## Epic 4 — Reminder

### US-10 — Create manual or linked Reminder

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- A manual Reminder may have no source.
- A Reminder may link to one Vaccine Record or one Medical Record belonging to the same Pet.
- Both source fields cannot be populated together.
- A past date may be saved and will display as Overdue while still Upcoming in storage.
- Loading/disabled submit behavior reduces accidental duplicate requests.

**Rules:** BR-REM-01 through BR-REM-06.

### US-11 — View and complete Reminder

**Actor:** Owner  
**Priority/Status:** Must Have — Current

- Upcoming and Overdue lists use the derived display state.
- Completing a Reminder sets `status=Completed` and `completed_at`.
- Refresh preserves the completed state.
- Empty, loading and error states are presented.

**Rules:** BR-REM-07 through BR-REM-11.

## Epic 5 — Health Log

### US-12 — Add Health Log

**Actor:** Owner  
**Priority/Status:** Should Have — Implemented early

- `recorded_on` is required and cannot be in the future according to Vietnam time.
- `logged_at` is generated by the system.
- The form supports weight, food amount, food type/name, status and note according to the deployed route validation.
- A new logical operation inserts one row; retry with the same idempotency key returns the canonical row.
- The newest applicable record appears in Health history and Pet summary.

**Rules:** BR-HLOG-01 through BR-HLOG-07.

### US-13 — View per-Pet Health Dashboard

**Actor:** Owner  
**Priority/Status:** Should Have — Implemented early

- The dashboard belongs to one selected Pet.
- The Owner switches between `week` and `month`.
- Weight trend uses `recorded_on` in the selected period.
- Status counts use the six display groups, with nonstandard values under Khác.
- Loading, error, empty and insufficient-data states are distinct.
- Status tooltip supports hover, keyboard focus, Enter/Space and tap.
- Tooltip shows at most three recent records plus a remaining count and allows Khác breakdown.
- Tooltip interaction performs no additional fetch.

**Rules:** BR-HLOG-08 through BR-HLOG-12.

### US-14 — Weight-point tooltip and full-period axis

**Actor:** Owner · **Priority/Status:** Should Have — Current

- Week/month axis spans the selected period; weight points retain business date and entry timestamp.
- Hover/focus/keyboard/tap reveals point details using loaded data; empty/insufficient values are handled.
- Date/range contract validation matches the dashboard payload; no tooltip request is needed.

**Rules:** BR-HLOG-08, BR-HLOG-09, BR-HLOG-12; ADL-023.


### US-15 — Aggregate multi-Pet dashboard

**Status:** Phase 2.  
The current dashboard is per Pet and must not be presented as an aggregate implementation.

## Epic 6 — Caretaker sharing

### US-16 — Share Pet with Caretaker

**Status:** Phase 2/schema reserved.

Target permission is View + Add Vaccine/Medical for an authorized Pet. Caretaker cannot manage Reminders or modify/delete existing history. This story is not a current production capability.

## Epic 7 — Correction and deletion

### US-17 — Delete wrongly entered Vaccine/Medical Record

**Actor:** Owner · **Priority/Status:** Current

- Delete requires confirmation and explicit failure/retry state.
- Linked Reminders remain after source FK is set null.
- Medical attachment metadata cascades; Storage cleanup warning does not falsely imply record deletion failed.
- No edit permission for Vaccine/Medical records or additional Caretaker rights is implied.

**Rules:** BR-VAC-08, BR-MED-09; ADL-022.

## Epic 8 — Delivered feedback and public demo

### US-18 — Edit an eligible Reminder

**Actor:** Owner · **Status:** Current

- Edit due_date/note only for stored Upcoming; show conflict if state changed; completion is a separate action.
- Refresh/invalidation keeps Reminder and Notification canonical states synchronized.

**Rules:** BR-REM-08, BR-REM-09, BR-NOTIF-03.

### US-19 — Open and read Notification Center

**Actor:** Owner · **Status:** Current

- Red dot only if unread, accessible name preserved; opening does not read all.
- Read success updates unread and navigates to `/reminders?highlight={reminder_id}`; filter reset/scroll/focus when necessary.
- Error/retry, Escape/outside close, focus restore; no simultaneous mobile menu and panel.

**Rules:** BR-NOTIF-01 through BR-NOTIF-03.

### US-20 — Select/change/remove Pet photo

**Actor:** Owner · **Status:** Current

- Choose file on phone/computer; JPEG/PNG/WebP ≤5 MiB, immediate format/size feedback.
- Preview and real image cover fill square; removal restores species fallback.
- Server validates and uploads Owner-scoped private object; database/reference and cleanup result are explicit.

**Rules:** BR-PET-05, BR-PHOTO-01; ADL-026.

### US-21 — Correct/delete Health Log without losing canonical data

**Actor:** Owner · **Status:** Current

- Edit date/business fields while identity/Owner/logged_at stay immutable; cannot clear all values.
- Confirm delete, retry/errors/cancel supported; old GET cannot overwrite a successful mutation.
- Timeout can mean server committed: POST snapshot/key remains immutable; retry recovers canonical row without duplicate logical creation.
- Cancel after failed/ambiguous mutation triggers fresh GET; DELETE retry 404 does not imply success.
- Enter behavior follows BR-UX-01, including Vietnamese IME.

**Rules:** BR-HLOG-01, BR-HLOG-07, BR-HLOG-14 through BR-HLOG-16, BR-UX-01.

### US-22 — Try the product without registration

**Actor:** Public Demo Visitor · **Status:** Current — PR #26 deployed

- Open public `/demo`, use same production screens/forms/styles; only demo label/reset and return-home control differ.
- Meo and Min have photos and distinct history; Sushi uses default avatar with basic non-empty records and no medical visit.
- Try Pet, care-record, Reminder, Notification and Health flows; reload preserves tab changes when sessionStorage is available.
- Reset requires confirmation, restores current-date synthetic snapshot; no production data or real authentication is modified.

**Rules:** BR-DEMO-01 through BR-DEMO-04; ADL-029.

### US-23 — Read mobile screens without cut-off labels

**Actor:** Owner / Demo Visitor · **Status:** Current implementation; full mobile visual QA pending

- Pet tabs 2 × 2, age stays grouped, long names/breeds wrap, no negative history margin.
- Attribution sits left and edit/delete actions right where space permits; footer wraps on narrow screens.
- Touch targets at least 44px; no claim of universal device compatibility without test evidence.

**Rules:** BR-UX-02; ADL-030.

## Verification and traceability

Acceptance criteria above describe expected behavior; they are not all executed UAT results. Current code and automated regressions support delivered state. Public production demo smoke covered three Pets, Min history/statistics/Other detail and return-home. Authenticated Owner A/B, real upload/email/retry, full mobile matrix and production timings remain unverified. Complete the execution records in `docs/PORTFOLIO_EVIDENCE.md` when tested.

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Kept US-01…US-17 IDs, moved delivered chart/deletion into Current and added US-18…US-23 for shipped feedback/demo flows. |
| 1.6 | 2026-09-22 | Owner baseline, recovery, health/dashboard, future scope and pending changes. |
