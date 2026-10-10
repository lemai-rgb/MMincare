# MMinCare — API Documentation

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Contract and boundary

Production uses same-origin `/api/...` Next.js route handlers and Supabase SSR cookie sessions. There is no `/api/v1` or custom REST register/login endpoint. Auth forms use Supabase Auth; protected server pages fetch their data server-side. UUIDs in URLs identify resources, not authorization.

All data APIs require a valid Owner session and enforce ownership/RLS; missing session generally returns 401, invalid request 400, denied/not-found 403/404 according to route, unexpected server failure 500. Most JSON errors use `{ "error": "..." }`; some include `field`. Do not assume all routes have identical status semantics or disclose resource existence. Read route-specific responses below.

Dates are `YYYY-MM-DD`, timestamps ISO timestamptz. Stored Reminder enum values are case-sensitive `Upcoming|Completed`. Multipart files must be genuine supported files. Examples use placeholders, not real user credentials.

## 2. Implemented route inventory

| Method | Path | Success contract / operation |
|---|---|---|
| POST | `/api/pets` | 201 new / 200 replay `{pet}`; required multipart idempotency key |
| GET | `/api/pets/{petId}?photo=1` | 200 binary private photo; no JSON Pet detail |
| PATCH | `/api/pets/{petId}` | 200 `{pet,picture_cleanup,warnings}` |
| POST | `/api/pets/{petId}/vaccines` | 201 `{vaccine_record,suggested_next_due_date,suggestion_status,warning}` |
| DELETE | `/api/pets/{petId}/vaccines/{vaccineRecordId}` | 200 `{success,deleted_record_id,detached_reminders}` |
| GET | `/api/pets/{petId}/medical-history` | 200 `{records,latestMedicalRecord}` combined history |
| GET | `/api/pets/{petId}/medical-records` | 200 `{records}` medical history with attachment descriptors |
| POST | `/api/pets/{petId}/medical-records` | 201 `{medical_record}` |
| DELETE | `/api/pets/{petId}/medical-records/{medicalRecordId}` | 200 `{success,deleted_record_id,detached_reminders,deleted_attachments,attachment_cleanup,warnings}` |
| POST | `/api/medical-records/{recordId}/attachments` | 201 `{attachment}` |
| GET | `/api/medical-records/{recordId}/attachments?attachmentId={attachmentId}` | 200 `{signed_url,expires_in:60}` |
| GET | `/api/pets/{petId}/reminders` | 200 `{reminders}` for stored Upcoming of this Pet |
| POST | `/api/pets/{petId}/reminders` | 201 `{reminder}` |
| GET | `/api/reminders` | 200 `{reminders,pets}` for Owner |
| PATCH | `/api/reminders/{reminderId}` | 200 `{reminder}`; edit date/note |
| PATCH | `/api/reminders/{reminderId}/complete` | 200 `{reminder}`; complete |
| GET | `/api/notifications` | 200 `{notifications}` current eligible events |
| PATCH | `/api/notifications/{notificationId}/read` | 200 `{notification:{notification_event_id,read_at}}` |
| GET | `/api/pets/{petId}/health-logs` | 200 `{health_logs}` |
| POST | `/api/pets/{petId}/health-logs` | 201 new / 200 replay / 409 canonical recovery |
| PATCH | `/api/pets/{petId}/health-logs/{healthLogId}` | 200 `{health_log}` |
| DELETE | `/api/pets/{petId}/health-logs/{healthLogId}` | 200 `{deleted_health_log_id}` |
| GET | `/api/pets/{petId}/dashboard?period=week|month` | 200 dashboard object; period defaults per route |

**Not implemented:** GET `/api/pets` list, JSON GET Pet detail, GET vaccine collection, PATCH Vaccine/Medical, DELETE Pet/account/Reminder/Notification, bulk-read notifications, sharing/OAuth REST endpoints. Pet list/detail are protected pages, not these missing API contracts.

## 3. Pet and photo

POST `/api/pets` accepts `multipart/form-data`: required `name`, `species` (`Dog|Cat`), `gender` (`Male|Female|Unknown`), `idempotency_key` (non-empty ≤128 characters); optional `breed`, `date_of_birth`, `image` (File). Valid date of birth must not be future. Owner is derived from session; weight belongs in Health Log, not Pet payload.

Same Owner/key + identical normalized payload/file hash returns existing Pet (200); different payload returns 409. This prevents retry from creating a second Pet, but is not a general idempotency guarantee for all API POSTs.

PATCH accepts current fields `name,species,gender,breed,date_of_birth,image,remove_picture`; multipart is used for images and `remove_picture="true"`. The route also retains compatible JSON-to-form handling for legacy callers. Owner/ID are not client-editable. Photo selection is optional. JPEG/PNG/WebP only, ≤5,242,880 bytes; client size/type checks plus server file-signature validation. Private unique user-folder objects are saved, reference committed, and obsolete managed object cleanup reported. `picture_cleanup="pending"`/warnings means profile save succeeded but cleanup needs attention.

GET with `photo=1` returns Owner-authorized binary object with private cache handling. Without `photo=1` it returns 405; invalid UUID/missing object/no access may return 404, unauthenticated 401. It is not an endpoint returning a signed URL or Pet JSON. Legacy external pictures can still be displayed; new uploads use managed private paths.

## 4. Vaccine, Medical and attachments

Vaccine POST JSON: required `vaccine_name` (trimmed, max 100), `vaccine_date` (valid, not future); optional positive integer `dose_number`, `clinic_name`, `note`. Date future check currently compares UTC date in the handler; Health Log business date uses Vietnam. Do not silently claim every API has identical timezone behavior.

Suggestion states: `matched` (date calculated from approved matching rule), `no_match` (query succeeded, no match), `unavailable` (rule query failed), `not_checked` (age/date-of-birth prerequisites absent). `suggested_next_due_date` may be null; it is never a persisted vaccine column or an automatically created Reminder. CR-08 still needs approved rule read access/dataset. The UTF-8 UI warning is “Chưa thể tải quy tắc gợi ý. Bạn có thể tự nhập ngày nhắc.” `warning` exists for compatibility; future dates are rejected before insert.

Medical POST JSON: required valid `visit_date`; optional `symptoms,diagnosis,medication,clinic_name,note`, normalized/limited by route. Attachment is a subsequent independent request; its failure does not undo the Medical Record.

Attachment POST uses multipart `file` (JPG/JPEG/PNG/PDF, ≤5 MiB). Metadata includes `attachment_id,record_id,file_url,file_type,file_size,uploaded_at`; `file_url` contains Storage object path, not permanent public URL. GET requires `attachmentId`, verifies record/Pet access and returns a signed URL valid for 60 seconds. Histories provide UI descriptors, not the raw table shape. No independent attachment DELETE is currently exposed.

Vaccine/Medical DELETE confirms in UI and hard-deletes the record. Linked Reminders survive with source FK null. Medical deletes attachment metadata through FK cascade and attempts private-object cleanup; `attachment_cleanup` plus warnings reports the outcome. Unknown network outcome is not inferred from a visual state alone.

## 5. Reminders

POST JSON: `type` (`Vaccine|Recheck|Medication|Other`), `due_date`; optional `note`, `source_vaccine_record_id`, `source_medical_record_id`. Both source IDs cannot be present. Source must belong to same Pet; vaccine source requires type Vaccine, medical source type Recheck. Manual has both null. Past due dates are allowed.

Stored status is Upcoming or Completed; Overdue is derived from Upcoming + due date before today's business date. Per-Pet GET returns stored Upcoming rows including derived overdue. Global GET also returns Pet/source context for filters/display.

Edit PATCH allows only `due_date,note`, at least one; Owner and stored Upcoming required. A race/state conflict returns 409. Complete PATCH is separate and uses server state/timestamp; there is no reopening endpoint. Changing/finishing a Reminder invalidates UI notifications/reads. No automatic Reminder is inserted by Vaccine/Medical creation.

## 6. Notifications

GET returns events selected as current/eligible, with Reminder/Pet context. Events are `due_soon|overdue`; canceled, obsolete or no-longer-eligible records are filtered. The UI derives unread from null read_at; red dot only, accessible label retained.

Read PATCH is Owner-only and idempotently returns canonical read_at for an already-read eligible event. Stale/nonexistent events can return404; failure leaves unread state unchanged. Panel opening performs GET revalidation, not read-all. Successful item action deep-links to `/reminders?highlight={reminder_id}`. Notification IDs are event UUIDs, not Reminder IDs. No external push/email delivery is implied.

## 7. Health Log CRUD and idempotency

GET returns Owner logs ordered `recorded_on DESC, logged_at DESC, health_log_id DESC`. POST JSON requires `recorded_on` and `idempotency_key` (non-empty max 128); business fields `weight,food_amount,food_type,status,note` may be null/omitted, but at least one value is required. Weight is a positive number ≤ 9999.99, at most 2 decimals. Non-string text is rejected; literal string `invalid` is accepted. Dates cannot be future in Asia/Ho_Chi_Minh.

```json
{
  "recorded_on": "2026-10-10",
  "weight": 2.1,
  "food_type": "Thức ăn mẫu",
  "food_amount": "100 g/ngày",
  "status": "Bình thường",
  "note": null,
  "idempotency_key": "new-log-operation-key"
}
```

The key is scoped to Owner/Pet and normalized payload hash. New insert 201; same-key same-payload retry 200 canonical row. Same key with different payload 409:

```json
{
  "error": "Mã tạo đã được dùng cho dữ liệu khác.",
  "recovery": "canonical",
  "health_log": { "health_log_id": "<existing UUID>", "recorded_on": "2026-10-10" }
}
```

The health_log in this abbreviated example represents the full canonical row, not a partial route response. Database creation_key/hash are internal; API returns business row fields without the hash.

PATCH allows non-empty subset `recorded_on,weight,food_amount,food_type,status,note`. Null clears optional values, omitted values are retained; merged row must keep at least one business value. Cannot change identity, Pet, creator or logged_at. DELETE 200 includes deleted ID;404 can mean absent resource and is not sufficient to resolve a preceding lost response.

The form keeps immutable payload/key on timeout/network uncertainty and locks fields before retry. It does not start a new POST with changed payload. Failed/ambiguous mutation followed by cancel invalidates requests and GETs history; stale GET cannot overwrite a newer mutation. Lost DELETE response + retry 404 remains ambiguous until canonical revalidation.

## 8. Dashboard statistics

Query `period=week|month`; week Monday–Sunday, month first–last day using Asia/Ho_Chi_Minh. Response:

- `period,period_start,period_end`.
- `summary`: health_log_count, latest_health_log_at, latest_weight, upcoming_reminder, latest_medical_record.
- `weight_trend`: points `{health_log_id,weight,recorded_on,logged_at}`.
- `status_counts`: six groups with `status,label,count,records`; records retain original status and business/entry dates.

Counts/trends use Health Log recorded_on in selected period. Summary latest_weight may use the latest eligible value through period end; upcoming Reminder/latest Medical have their own query scope, not necessarily only selected-period records. Dashboard queries run in parallel; valid timestamp/range contracts are checked client-side. Loading/error/retry/empty/insufficient data are separate states. Outside standard status groups is aggregated into Khác; missing status is not fabricated as Bình thường. No aggregate multi-Pet endpoint exists.

## 9. Waiting, abort and demo boundary

Shared timeout helper bounds supported Pet/Health/Notification request pipelines to 15 seconds including response body parsing, handles abort/cleanup and rejects stale operation results. This is a client-side waiting safeguard, not a server execution deadline, an SLA or evidence of a15-second page load.

Public `/demo` is a page route, not a second production API. Shared components call an explicit local request/navigation adapter in the demo React context; it simulates supported responses from per-tab state and does not send writes/files to production. Unsupported calls fail locally. Auth/email/RLS/private-storage enforcement and real backend timings are not simulated evidence. Default context outside demo retains original fetch/Next router.

## 10. Evidence and maintenance

Source: all `app/api/**/route.ts`, `lib/healthLogs/dashboard.ts`, migrations and demo transport at the stated application SHA. Inventory includes23 method/path combinations. Unit/rendered tests and CI are regression evidence; real Owner A/B, upload/retry and full visual QA remain unverified. No secret or real payload is included.

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Replace conflicting original-design API examples with actual routes, payloads, idempotency, deletions, private photos, Notification and demo boundaries. |
| 1.6 | 2026-09-22 | Earlier Owner API baseline; retained in version history, superseded here. |
