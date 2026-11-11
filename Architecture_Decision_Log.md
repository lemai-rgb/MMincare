# Architecture Decision Log

## ADR-001 â€” Notification events for Reminder Phase 1

- Status: Proposed (not production until migration and deployment complete)
- Decision: a database trigger maintains two events for every `Upcoming` Reminder so all creation paths remain atomic.
- Schedule: D-2 and D+2 at 08:00 `Asia/Ho_Chi_Minh`, stored as `timestamptz`.
- Reschedule: cancel active old events, retain history, then insert the new pair. A partial unique index makes retries idempotent and permits returning to an earlier date.
- Completion: mark active events cancelled. Future queries also require the Reminder to remain `Upcoming`.
- Backfill: create both schedule rows for existing `Upcoming` reminders, including timestamps already in the past. No delivery channel runs in this phase, so the migration has no external side effect.
- Security: authenticated Owners can select their own events and update only `read_at`; clients cannot insert, delete or change scheduling fields. The trigger function is `SECURITY DEFINER` because authenticated callers intentionally have no scheduling-field grants; it uses an empty `search_path`, schema-qualified objects, and has EXECUTE revoked from client roles.
- Current notification selection: `overdue` supersedes `due_soon` after D+2, so at most one active notification is returned per Reminder.
- Reminder updates are guarded by a database trigger: edit keeps `Upcoming` and only changes due date/note; completion changes only status/completed_at. `updated_at` is database-managed and not client-writable.
- Migration history remains immutable. CI uses the committed `supabase/ci-legacy-baseline.sql` snapshot sourced from `2396d45^` (the pre-Notification schema), verifies that it contains no Notification Phase 1 objects, then replays each migration exactly once.

## ADR-002 â€” In-app Notification Center

- Status: Current for the web experience.
- Decision: render one accessible notification popover in the shared header and consume the existing Owner-only GET/read API without duplicating event-selection rules in the client.
- Read flow: opening the popover never marks events read; selecting an unread event performs one idempotent read request, updates the badge only after success, and navigates to the existing Reminder route with its supported `highlight` contract.
- Scope: loading, retry, empty and read/unread states are supported. Email delivery, browser push, notification deletion, bulk read and settings remain outside this UI decision.

## ADR-003 â€” Owner-private Pet photos and idempotent creation

- Status: Proposed for PR #19; production Storage/database are unchanged until separately reviewed and applied.
- Decision: new Pet photos use the private `pet-photos` bucket, with Owner-scoped Storage SELECT/INSERT/DELETE policies. `pets.picture_url` stores a stable object path; authenticated server rendering streams the object through the Pet route, while existing external/legacy URLs remain readable.
- Cleanup: only objects owned by the current Owner and managed by the application are eligible for removal, after the new database reference is committed. Cleanup failures are reported as pending and never roll back a successful Pet update.
- Creation retries: nullable `creation_key` and `creation_payload_hash` plus a unique `(owner_id, creation_key)` index make concurrent retries converge on one Pet; a reused key with a different payload returns `409`.

## ADR-004 â€” Owner-managed Health Log corrections

- Status: Proposed for PR #20; migration and production deployment remain subject to the normal review gates.
- Decision: Pet Owners may edit `recorded_on`, `weight`, `food_amount`, `food_type`, `status`, and `note`, or hard-delete a Health Log after confirmation. `health_log_id`, `pet_id`, `created_by`, and `logged_at` remain immutable.
- Authorization: the API validates the authenticated Owner and the database enforces Owner-only `UPDATE`/`DELETE` policies using Pet ownership. Caretakers and anonymous users retain no mutation privilege.
- Integrity: edits are allowlisted, preserve the at-least-one-business-field constraint, and return the canonical row. Deletion removes only the selected row; list ordering remains `recorded_on DESC`, `logged_at DESC`, `health_log_id DESC`.

## ADR-005 â€” Per-pet Caretaker read-only sharing (Phase 2.1)

- Status: Proposed for review; migration and production deployment remain pending.
- Decision: Owner invitations are stored in `pet_access` as `Pending` until the
  verified recipient accepts. Access is scoped to one `pet_id` and expires at
  the end of the selected Vietnam calendar date.
- Authorization: RLS policies require the authenticated session, matching
  `pet_id`, `caretaker_id`/email and active unexpired state. A database trigger
  permits only recipient `Pending â†’ Active` or granting-owner `Pending/Active â†’
  Revoked` transitions. Identity columns are not client-writable.
- Scope: Caretaker can read basic pet fields and text Vaccine/Medical history
  only. Private photos, attachments, Health Logs, Reminders, Notifications,
  Owner data, writes and further sharing remain Owner-only.
- Concurrency: conditional updates and the transition trigger make late accept
  requests unable to restore access after revocation. A partial unique index
  prevents duplicate pending/active invitations for one pet and email.

