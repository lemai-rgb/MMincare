import assert from "node:assert/strict";

import { selectCurrentNotifications, type NotificationRow } from "./current";

const reminder = {
  reminder_id: "reminder-1",
  note: "Nhắc lịch",
  due_date: "2026-09-20",
  status: "Upcoming",
  pet: { pet_id: "pet-1", name: "Meo" },
};

const rows: NotificationRow[] = [
  {
    notification_event_id: "due-soon",
    event_type: "due_soon",
    scheduled_for: "2026-09-18T01:00:00.000Z",
    read_at: null,
    reminders: reminder,
  },
  {
    notification_event_id: "overdue",
    event_type: "overdue",
    scheduled_for: "2026-09-22T01:00:00.000Z",
    read_at: null,
    reminders: [reminder],
  },
];

const selected = selectCurrentNotifications(rows);
assert.equal(selected.length, 1);
assert.equal(selected[0]?.notification_event_id, "overdue");
