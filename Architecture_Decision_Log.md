# Architecture Decision Log

## ADR-001 — Notification events for Reminder Phase 1

- Status: Proposed (not production until migration and deployment complete)
- Decision: a database trigger maintains two events for every `Upcoming` Reminder so all creation paths remain atomic.
- Schedule: D-2 and D+2 at 08:00 `Asia/Ho_Chi_Minh`, stored as `timestamptz`.
- Reschedule: cancel active old events, retain history, then insert the new pair. A partial unique index makes retries idempotent and permits returning to an earlier date.
- Completion: mark active events cancelled. Future queries also require the Reminder to remain `Upcoming`.
- Backfill: create both schedule rows for existing `Upcoming` reminders, including timestamps already in the past. No delivery channel runs in this phase, so the migration has no external side effect.
- Security: authenticated Owners can select their own events and update only `read_at`; clients cannot insert, delete or change scheduling fields. The trigger function is `SECURITY DEFINER` because authenticated callers intentionally have no scheduling-field grants; it uses an empty `search_path`, schema-qualified objects, and has EXECUTE revoked from client roles.
- Current notification selection: `overdue` supersedes `due_soon` after D+2, so at most one active notification is returned per Reminder.
- Reminder updates are guarded by a database trigger: edit keeps `Upcoming` and only changes due date/note; completion changes only status/completed_at. `updated_at` is database-managed and not client-writable.
- Migration history remains immutable. CI takes `database/schema.sql` from the base branch as the pre-Notification baseline, verifies that it contains no Notification Phase 1 objects, then replays each migration exactly once.

## ADR-002 — In-app Notification Center

- Status: Current for the web experience.
- Decision: render one accessible notification popover in the shared header and consume the existing Owner-only GET/read API without duplicating event-selection rules in the client.
- Read flow: opening the popover never marks events read; selecting an unread event performs one idempotent read request, updates the badge only after success, and navigates to the existing Reminder route with its supported `highlight` contract.
- Scope: loading, retry, empty and read/unread states are supported. Email delivery, browser push, notification deletion, bulk read and settings remain outside this UI decision.
