import assert from "node:assert/strict";

import { replaceReminder, type ReminderListItem } from "../reminders";

function reminder(reminder_id: string, due_date: string, note: string | null): ReminderListItem {
  return {
    reminder_id,
    pet_id: "pet-1",
    pet_name: "Meo",
    due_date,
    type: "Other",
    status: "Upcoming",
    display_status: "Upcoming",
    is_overdue: false,
    note,
    source_vaccine_record_id: null,
    source_vaccine_date: null,
    source_medical_record_id: null,
    source_medical_visit_date: null,
    completed_at: null,
  };
}

const original = [
  reminder("later", "2026-10-10", "later note"),
  reminder("edited", "2026-10-20", "old note"),
];
const updated = replaceReminder(original, {
  reminder_id: "edited",
  due_date: "2026-09-01",
  note: "new note",
});

assert.deepEqual(updated.map((item) => item.reminder_id), ["edited", "later"]);
assert.equal(updated[0].due_date, "2026-09-01");
assert.equal(updated[0].note, "new note");
assert.equal(original[1].due_date, "2026-10-20");
assert.equal(original[1].note, "old note");

console.log("Reminder edit state tests passed.");
