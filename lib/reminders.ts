export const REMINDER_TYPES = ["Vaccine", "Recheck", "Medication", "Other"] as const;
export const REMINDER_STORED_STATUSES = ["Upcoming", "Completed"] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderStoredStatus = (typeof REMINDER_STORED_STATUSES)[number];
export type ReminderDisplayStatus = "Upcoming" | "Overdue" | "Completed";

export type ReminderPetOption = {
  pet_id: string;
  name: string;
};

export type ReminderListItem = {
  reminder_id: string;
  pet_id: string;
  pet_name: string;
  due_date: string;
  type: ReminderType;
  status: ReminderStoredStatus;
  display_status: ReminderDisplayStatus;
  is_overdue: boolean;
  note: string | null;
  source_vaccine_record_id: string | null;
  source_vaccine_date: string | null;
  source_medical_record_id: string | null;
  source_medical_visit_date: string | null;
  completed_at: string | null;
  updated_at?: string | null;
};

export type ReminderUpdate = Partial<ReminderListItem> & { reminder_id: string };

export function sortReminders(items: ReminderListItem[]) {
  return [...items].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.reminder_id.localeCompare(b.reminder_id));
}

export function replaceReminder(items: ReminderListItem[], updated: ReminderUpdate) {
  return sortReminders(items.map((item) => item.reminder_id === updated.reminder_id ? { ...item, ...updated } : item));
}

export function getReminderDisplayStatus(
  status: ReminderStoredStatus,
  dueDate: string,
  today = new Date().toISOString().slice(0, 10),
): ReminderDisplayStatus {
  if (status === "Completed") return "Completed";
  return dueDate < today ? "Overdue" : "Upcoming";
}

export function getDaysOverdue(dueDate: string, today = new Date().toISOString().slice(0, 10)) {
  const due = Date.parse(`${dueDate}T00:00:00.000Z`);
  const current = Date.parse(`${today}T00:00:00.000Z`);
  if (Number.isNaN(due) || Number.isNaN(current) || due >= current) return 0;
  return Math.floor((current - due) / 86_400_000);
}

export function getReminderTypeLabel(type: ReminderType) {
  if (type === "Vaccine") return "Tiêm phòng";
  if (type === "Recheck") return "Tái khám";
  if (type === "Medication") return "Uống thuốc";
  return "Khác";
}
