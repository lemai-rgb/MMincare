# MMinCare — Problem Statement

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Problem hypothesis (not a quantified research finding)

The project starts from the hypothesis that pet health information is split across paper vaccination books, prescriptions, photographs, clinic messages and personal notes. Owners therefore lack one reliable source when they need to recall a vaccination, treatment, symptom or care date.

Owners also struggle to observe gradual changes in weight, food intake and health condition. Without dated records, it is difficult to explain a pattern to a veterinarian or notice that a condition has changed.

Care dates are often remembered manually. A missed vaccination or recheck may only be noticed after the date has passed.

## 2. Who experiences it?

- **Current primary actor:** an authenticated Owner responsible for one or more dogs or cats.
- **Future supporting actor:** an authorized Caretaker. The complete sharing and authorization flow is Phase 2.
- **Out of scope:** veterinary clinic administration, appointment booking, payment and clinical diagnosis.

## 3. Where and when?

- At home while monitoring food, weight or symptoms.
- At a clinic when a veterinarian requests prior history.
- After a vaccination or examination when the Owner needs to record the event.
- When checking upcoming or overdue care dates.
- During account recovery when the Owner cannot log in.

## 4. Why do current alternatives fail?

- Paper records can be lost and are not always available.
- General notes and chat applications mix pet information with unrelated content.
- Calendar entries do not preserve the clinical context or source record.
- Photos provide evidence but are difficult to search chronologically.
- Informal sharing does not reliably enforce which Pet another person may access.

## 5. Current solution capability

MMinCare currently allows an Owner to:

- Maintain Pet profiles with optional selectable private photos and centralized vaccination/medical history, including confirmed deletion.
- Store optional medical attachments privately.
- Create manual or record-linked in-app Reminders; edit eligible dates/notes and complete them; read in-app Notifications.
- Create/edit/delete dated Health Logs and view a weekly/monthly dashboard for one Pet; correct records with confirmation/idempotent retry safeguards.
- Recover a password safely.

The current product does not send proactive push/email reminders and does not provide Caretaker runtime access.

## 6. Expected outcome

- Owners retrieve consistent records without relying on memory or paper.
- Upcoming and overdue care work is visible when the Owner opens the application.
- Weight and health-status patterns are easier to discuss with a veterinarian.
- Attachment failure does not cause loss of the underlying Medical Record.
- Owner data remains isolated by authentication, authorization and RLS.

## 7. Target/future outcome

- Controlled Caretaker sharing with View + Add permission for authorized Pet records.
- Aggregate dashboard across multiple Pets.
- Optional proactive external notifications after separate product, privacy and delivery decisions.
- Editing Vaccine/Medical records after a separate design decision; confirmed deletion is already Current.

## 8. Reported usability feedback and response

The project owner reported informal feedback; no sample size, interview transcript or quantitative result is inferred. Users found photo URLs technical, cards dense, Enter saving logs prematurely, mobile labels cut off and loading slow. Delivered responses: file picker/default avatar, compact summaries/footer, Enter guard and Health edit/delete, mobile wrap/tabs and bounded request waiting. These are implemented responses; full visual QA and production performance measurement remain pending.

Public `/demo` is deployed with same product UI and synthetic per-tab records so a CV reviewer can inspect the solution without registration. It is not evidence of market adoption, clinical effectiveness, real Owner isolation or backend performance.

## 9. Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Đồng bộ code đã triển khai, CRUD/ảnh/thông báo, request lifecycle/idempotency và demo cùng UI; tách phạm vi kiểm chứng và kế hoạch. |
| 1.1 | 2026-09-22 | Separated Current capability from target outcome; added Health Log/dashboard and recovery; moved Caretaker and external notifications to future scope. |
| 1.0 | 2026-06-29 | Initial problem statement. |
