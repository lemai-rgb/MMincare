export type NotificationPet = {
  pet_id: string;
  name: string;
};

export type NotificationReminder = {
  reminder_id: string;
  note: string | null;
  due_date: string;
  status: string;
  pet: NotificationPet | NotificationPet[] | null;
};

export type NotificationRow = {
  notification_event_id: string;
  event_type: string;
  scheduled_for: string;
  read_at: string | null;
  reminders: NotificationReminder | NotificationReminder[] | null;
};

export function getEmbeddedReminder(
  reminders: NotificationRow["reminders"],
): NotificationReminder | null {
  return Array.isArray(reminders) ? reminders[0] ?? null : reminders;
}

export function selectCurrentNotifications(rows: NotificationRow[]): NotificationRow[] {
  const current = new Map<string, NotificationRow>();

  for (const row of rows) {
    const reminder = getEmbeddedReminder(row.reminders);
    if (!reminder || reminder.status !== "Upcoming") continue;

    const previous = current.get(reminder.reminder_id);
    if (
      !previous
      || (row.event_type === "overdue" && previous.event_type !== "overdue")
      || (row.event_type === previous.event_type && row.scheduled_for > previous.scheduled_for)
    ) {
      current.set(reminder.reminder_id, row);
    }
  }

  return [...current.values()];
}
