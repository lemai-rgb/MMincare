# MMinCare — Persona Document

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Scope and provenance

These are **constructed product personas**, not verified interview participants. Names/profiles and the representative quote below are illustrative. Informal user feedback reported during development is documented separately; do not attribute it to these fictional people or claim formal user research.

MMinCare currently serves authenticated Owners of dogs and cats. Caretaker is retained as a secondary future persona, not as a current production actor.

## 2. Primary Persona — Nguyễn Minh Anh

**Profile:** Student, first-time cat owner, mainly uses a smartphone.

### Context and behavior

- Keeps vaccination cards, prescriptions and photos in different places.
- Searches online or asks a veterinarian when unsure.
- Usually records information only when a problem occurs.
- Needs a simple flow and clear validation rather than technical terminology.

### Goals

- Keep vaccination and medical history in one place.
- Know which care dates are upcoming or overdue when opening the application.
- Record weight, food and symptoms over time.
- Retrieve a complete record when visiting a different clinic.
- Recover account access without technical assistance.

### Pain points

- Forgets vaccination or recheck dates.
- Cannot quickly reconstruct prior treatment.
- Does not consistently monitor weight or eating behavior.
- Worries about entering an incorrect date or losing a record when an attachment upload fails.

### Current MMinCare value

- Centralized Pet/photos, Vaccine and Medical Records with confirmed deletion.
- In-app Reminders with editing/completion and Notification unread dot; no push/email claim.
- Optional private attachments with retry.
- Owner-only Health Log create/edit/delete, Enter guard, per-Pet weekly/monthly statistics.
- Password recovery.

### Illustrative quote (not an interview citation)

> “Mình muốn mở một nơi là thấy lịch sử của mèo và những việc sắp tới, thay vì phải tìm lại ảnh và tin nhắn cũ.”

## 3. Secondary Persona — Trần Quốc Huy

**Priority:** Secondary product persona; Caretaker collaboration is Phase 2.

**Profile:** Office worker, owns multiple pets and is frequently away.

### Goals

- Avoid mixing up records and schedules among pets.
- Review each Pet's current condition remotely.
- Eventually let an authorized Caretaker view and add selected records.
- Eventually see a multi-Pet overview.

### Pain points

- Information is split across people and chat threads.
- No reliable audit of who recorded an event.
- Difficult to know whether a report relates to the correct Pet and date.

### Current value

- Manages multiple Owner-owned Pet profiles.
- Opens each Pet's Health Dashboard and Reminder list.
- Uses in-app records and reminders when accessing MMinCare.

### Future value

- Caretaker sharing and multi-Pet aggregate dashboard after the Phase 2 authorization flow is implemented and tested.
- External proactive notification only after a separate product and technical decision.

## 4. Design implications

- Keep the Owner's current actions visible and do not expose inactive Caretaker controls.
- Always distinguish the business date from the entry timestamp in health records.
- Show loading, empty and error states for lists and charts.
- Do not imply that an in-app Reminder sends push/email alerts.
- Preserve keyboard and touch accessibility for chart detail interactions.
- Explain attachment failure without implying that the Medical Record was lost.

## 5. Feedback-driven UX and portfolio viewer

Reported feedback (not persona interview results): use a file picker instead of URL, distinguish information labels, compact summary/cards, prevent accidental Enter save, offer log corrections and preserve mobile labels. Current code implements these responses; real-device visual/IME QA remains pending.

A **Public Demo Visitor** is a portfolio viewing context, not a third clinical/caretaker persona: they use public `/demo`, same screens/flows with3 synthetic Pets,2 supplied photos and1 fallback, browser-local changes/reset. The demo must explain its boundary and return to the main site; it does not prove real security, email or storage behavior.

## 6. Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Đồng bộ code đã triển khai, CRUD/ảnh/thông báo, request lifecycle/idempotency và demo cùng UI; tách phạm vi kiểm chứng và kế hoạch. |
| 1.1 | 2026-09-22 | Distinguished Current Owner capability from Phase 2 Caretaker capability; replaced proactive-notification claims with in-app Reminder wording; added Health Dashboard and recovery needs. |
| 1.0 | 2026-06-29 | Initial personas. |
