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
- Migration history remains immutable. CI derives a sanitized legacy baseline by removing only later Notification objects before replaying historical migrations.
