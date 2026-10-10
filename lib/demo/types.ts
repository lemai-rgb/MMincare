import type { Pet } from "@/lib/pets";
import type { ReminderStoredStatus, ReminderType } from "@/lib/reminders";

export type DemoHealthLog = {
  health_log_id: string; pet_id: string; created_by: string;
  recorded_on: string; logged_at: string; weight: number | null;
  food_amount: string | null; food_type: string | null;
  status: string | null; note: string | null;
};
export type DemoVaccine = {
  vaccine_record_id: string; pet_id: string; created_by: string;
  vaccine_name: string; vaccine_date: string; dose_number: number | null;
  clinic_name: string | null; note: string | null; created_at: string;
};
export type DemoMedical = {
  record_id: string; pet_id: string; created_by: string; visit_date: string;
  diagnosis: string | null; symptoms: string | null; medication: string | null;
  clinic_name: string | null; note: string | null; created_at: string;
};
export type DemoReminder = {
  reminder_id: string; pet_id: string; user_id: string; type: ReminderType;
  due_date: string; status: ReminderStoredStatus; note: string | null;
  source_vaccine_record_id: string | null; source_medical_record_id: string | null;
  completed_at: string | null; created_at: string; updated_at: string;
};
export type DemoState = {
  version: 1; seed_revision?: 2 | 3; anchor_day: string; pets: Pet[]; health_logs: DemoHealthLog[];
  vaccine_records: DemoVaccine[]; medical_records: DemoMedical[];
  reminders: DemoReminder[]; read_notifications: string[];
  attachments?: { attachment_id: string; record_id: string; file_name: string; file_type: "jpg" | "jpeg" | "png" | "pdf"; data: string }[];
};
export type DemoHealthInput = Pick<DemoHealthLog,
  "recorded_on" | "weight" | "food_amount" | "food_type" | "status" | "note">;
export type DemoNotification = {
  notification_event_id: string; reminder_id: string; pet_id: string;
  event_type: "due_soon" | "overdue"; due_date_snapshot: string;
  scheduled_for: string; read_at: string | null;
};
