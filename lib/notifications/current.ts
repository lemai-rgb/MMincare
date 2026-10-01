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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isValidDateOnly(value: unknown): value is string {
  if (!isNonEmptyString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isNotificationPet(value: unknown): value is NotificationPet {
  return isRecord(value) && isNonEmptyString(value.pet_id) && isNonEmptyString(value.name);
}

function isNotificationReminder(value: unknown): value is NotificationReminder {
  if (!isRecord(value)
    || !isNonEmptyString(value.reminder_id)
    || (value.note !== null && typeof value.note !== "string")
    || !isValidDateOnly(value.due_date)
    || !isNonEmptyString(value.status)) {
    return false;
  }
  if (value.pet === null) return true;
  if (Array.isArray(value.pet)) return value.pet.length > 0 && value.pet.every(isNotificationPet);
  return isNotificationPet(value.pet);
}

function isNotificationReminders(value: unknown): value is NotificationReminder | NotificationReminder[] {
  if (Array.isArray(value)) return value.length > 0 && value.every(isNotificationReminder);
  return isNotificationReminder(value);
}

/** Validate server payloads before they reach the rendered list. */
export function parseNotificationRows(value: unknown): NotificationRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: NotificationRow[] = [];
  for (const item of value) {
    if (!isRecord(item)
      || !isNonEmptyString(item.notification_event_id)
      || !isNonEmptyString(item.event_type)
      || !isValidTimestamp(item.scheduled_for)
      || (item.read_at !== null && !isValidTimestamp(item.read_at))
      || !isNotificationReminders(item.reminders)) return null;
    rows.push(item as NotificationRow);
  }
  return rows;
}

export function parseNotificationReadAt(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.notification) || !isValidTimestamp(value.notification.read_at)) return null;
  return value.notification.read_at;
}

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
