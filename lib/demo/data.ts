import template from "@/demo/dataset.template.json";
import { getVietnamToday } from "@/lib/healthLogs/dashboard";
import { getReminderDisplayStatus } from "@/lib/reminders";
import type { DemoHealthInput, DemoHealthLog, DemoNotification, DemoState } from "./types";

export const DEMO_OWNER_ID = template.owner_id;
export const DEMO_STORAGE_KEY = "mmincare:portfolio-demo:v1";
const demoPhoto = (petId: unknown) => template.pets.find((pet) => pet.pet_id === petId)?.picture_url ?? null;
const imageData = (v: unknown) => typeof v === "string" && v.length <= 7_000_000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);

export function isDemoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftDemoDate(day: string, offset: number) {
  if (!isDemoDate(day) || !Number.isInteger(offset)) throw new Error("Invalid demo date");
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

const timestamp = (day: string, time = "08:00:00") => `${day}T${time}+07:00`;

/** No database/Auth client. Every date is resolved from one explicit anchor. */
export function createDemoState(today = getVietnamToday()): DemoState {
  if (!isDemoDate(today)) throw new Error("Invalid demo anchor");
  const state: DemoState = {
    version: 1, seed_revision: 4, anchor_day: today, read_notifications: [],
    pets: template.pets.map((pet) => ({
      pet_id: pet.pet_id, owner_id: DEMO_OWNER_ID, name: pet.name,
      species: pet.species as "Cat" | "Dog", gender: pet.gender as "Male" | "Female" | "Unknown",
      breed: pet.breed, picture_url: pet.picture_url,
      date_of_birth: pet.birth_days_ago === null ? null : shiftDemoDate(today, -pet.birth_days_ago),
      created_at: timestamp(shiftDemoDate(today, -pet.created_days_ago)), updated_at: timestamp(today),
    })),
    health_logs: template.health_logs.map((log) => ({
      health_log_id: log.health_log_id, pet_id: log.pet_id, created_by: DEMO_OWNER_ID,
      recorded_on: shiftDemoDate(today, log.recorded_day_offset),
      logged_at: timestamp(shiftDemoDate(today, log.logged_day_offset), log.logged_time),
      weight: log.weight, food_amount: log.food_amount, food_type: log.food_type, status: log.status, note: log.note,
    })),
    vaccine_records: template.vaccine_records.map((row) => ({
      vaccine_record_id: row.vaccine_record_id, pet_id: row.pet_id, created_by: DEMO_OWNER_ID,
      vaccine_name: row.vaccine_name, vaccine_date: shiftDemoDate(today, row.vaccine_day_offset),
      dose_number: row.dose_number, clinic_name: row.clinic_name, note: row.note,
      created_at: timestamp(shiftDemoDate(today, row.vaccine_day_offset)),
    })),
    medical_records: template.medical_records.map((row) => ({
      record_id: row.record_id, pet_id: row.pet_id, created_by: DEMO_OWNER_ID,
      visit_date: shiftDemoDate(today, row.visit_day_offset), symptoms: row.symptoms,
      diagnosis: row.diagnosis, medication: row.medication, clinic_name: row.clinic_name, note: row.note,
      created_at: timestamp(shiftDemoDate(today, row.visit_day_offset)),
    })),
    reminders: template.reminders.map((row) => ({
      reminder_id: row.reminder_id, pet_id: row.pet_id, user_id: DEMO_OWNER_ID,
      type: row.type as "Vaccine" | "Recheck" | "Medication" | "Other",
      due_date: shiftDemoDate(today, row.due_day_offset), status: row.status as "Upcoming" | "Completed",
      note: row.note, source_vaccine_record_id: row.source_vaccine_record_id,
      source_medical_record_id: row.source_medical_record_id,
      completed_at: row.completed_day_offset === null ? null : timestamp(shiftDemoDate(today, row.completed_day_offset)),
      created_at: timestamp(shiftDemoDate(today, -30)), updated_at: timestamp(today),
    })),
  };
  state.read_notifications = getDemoNotifications(state, today)
    .filter((event) => template.reminders.some((row) => row.reminder_id === event.reminder_id && row.notification_read))
    .map((event) => event.notification_event_id);
  return state;
}

export function sortDemoHealthLogs(rows: DemoHealthLog[]) {
  return [...rows].sort((a, b) => b.recorded_on.localeCompare(a.recorded_on)
    || Date.parse(b.logged_at) - Date.parse(a.logged_at) || b.health_log_id.localeCompare(a.health_log_id));
}

export function getDemoNotifications(state: DemoState, today = getVietnamToday()): DemoNotification[] {
  const notifications: DemoNotification[] = [];
  for (const reminder of state.reminders) {
    if (reminder.status !== "Upcoming" || shiftDemoDate(reminder.due_date, -2) > today) continue;
    const overdue = shiftDemoDate(reminder.due_date, 2) <= today;
    const eventType = overdue ? "overdue" : "due_soon";
    // Date snapshot prevents a read event for an old date hiding a new event.
    const id = `${reminder.reminder_id}:${reminder.due_date}:${eventType}`;
    notifications.push({
      notification_event_id: id, reminder_id: reminder.reminder_id, pet_id: reminder.pet_id,
      event_type: eventType, due_date_snapshot: reminder.due_date,
      scheduled_for: timestamp(shiftDemoDate(reminder.due_date, overdue ? 2 : -2)),
      read_at: state.read_notifications.includes(id) ? timestamp(today) : null,
    });
  }
  return notifications.sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
}

export function demoReminderStatus(state: DemoState, id: string, today = getVietnamToday()) {
  const reminder = state.reminders.find((row) => row.reminder_id === id);
  return reminder ? getReminderDisplayStatus(reminder.status, reminder.due_date, today) : null;
}

export function validateDemoHealth(input: DemoHealthInput, today: string): string | null {
  if (!isDemoDate(input.recorded_on) || input.recorded_on > today) return "Ngày ghi nhận phải hợp lệ và không ở tương lai.";
  if (input.weight !== null && (!Number.isFinite(input.weight) || input.weight <= 0
    || input.weight > 9999.99 || Math.abs(input.weight * 100 - Math.round(input.weight * 100)) > 1e-7)) {
    return "Cân nặng phải lớn hơn 0, tối đa 9999,99 kg và hai chữ số thập phân.";
  }
  if ([input.food_amount, input.food_type, input.status, input.note].some((value) => value !== null && typeof value !== "string")) {
    return "Thông tin nhật ký không hợp lệ.";
  }
  if (input.weight === null && ![input.food_amount, input.food_type, input.status, input.note].some((value) => value?.trim())) {
    return "Vui lòng nhập ít nhất một thông tin sức khỏe.";
  }
  return null;
}

const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const optionalText = (v: unknown) => v === null || typeof v === "string";
const stamp = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
const id = (v: unknown) => text(v) && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const fields = (v: Record<string, unknown>, names: string[]) => names.every((key) => optionalText(v[key]));

/** Session storage is untrusted input: reject malformed rows and broken relations. */
export function parseDemoState(value: unknown): DemoState | null {
  if (!record(value) || value.version !== 1 || !isDemoDate(value.anchor_day)) return null;
  for (const key of ["pets", "health_logs", "vaccine_records", "medical_records", "reminders", "read_notifications"]) {
    if (!Array.isArray(value[key]) || value[key].length > 1000) return null;
  }
  const pets = value.pets as unknown[];
  if (!pets.length || !pets.every((p) => record(p) && id(p.pet_id) && p.owner_id === DEMO_OWNER_ID
    && text(p.name) && ["Cat", "Dog"].includes(String(p.species)) && ["Male", "Female", "Unknown"].includes(String(p.gender))
    && optionalText(p.breed) && (p.picture_url === null || (demoPhoto(p.pet_id) !== null && p.picture_url === demoPhoto(p.pet_id)) || imageData(p.picture_url))
    && (p.date_of_birth === null || isDemoDate(p.date_of_birth)) && stamp(p.created_at) && stamp(p.updated_at))) return null;
  const ids = new Set(pets.map((p) => (p as Record<string, unknown>).pet_id));
  const owned = (r: Record<string, unknown>) => ids.has(r.pet_id) && r.created_by === DEMO_OWNER_ID;
  if (!(value.health_logs as unknown[]).every((r) => record(r) && owned(r) && id(r.health_log_id)
    && isDemoDate(r.recorded_on) && stamp(r.logged_at) && (r.weight === null || (typeof r.weight === "number" && Number.isFinite(r.weight) && r.weight > 0 && r.weight <= 9999.99))
    && fields(r, ["food_amount", "food_type", "status", "note"]))) return null;
  if (!(value.vaccine_records as unknown[]).every((r) => record(r) && owned(r) && id(r.vaccine_record_id)
    && text(r.vaccine_name) && isDemoDate(r.vaccine_date) && stamp(r.created_at)
    && (r.dose_number === null || (typeof r.dose_number === "number" && Number.isInteger(r.dose_number) && r.dose_number > 0))
    && fields(r, ["clinic_name", "note"]))) return null;
  if (!(value.medical_records as unknown[]).every((r) => record(r) && owned(r) && id(r.record_id)
    && isDemoDate(r.visit_date) && stamp(r.created_at) && fields(r, ["diagnosis", "symptoms", "medication", "clinic_name", "note"]))) return null;
  const vaccineRows = value.vaccine_records as Record<string, unknown>[];
  const medicalRows = value.medical_records as Record<string, unknown>[];
  if (!(value.reminders as unknown[]).every((r) => record(r) && ids.has(r.pet_id) && r.user_id === DEMO_OWNER_ID
    && id(r.reminder_id) && isDemoDate(r.due_date) && ["Upcoming", "Completed"].includes(String(r.status))
    && ["Vaccine", "Recheck", "Medication", "Other"].includes(String(r.type)) && optionalText(r.note)
    && stamp(r.created_at) && stamp(r.updated_at)
    && (r.status === "Completed" ? stamp(r.completed_at) : r.completed_at === null)
    && !(r.source_vaccine_record_id !== null && r.source_medical_record_id !== null)
    && (r.source_vaccine_record_id === null || vaccineRows.some((v) => v.vaccine_record_id === r.source_vaccine_record_id && v.pet_id === r.pet_id))
    && (r.source_medical_record_id === null || medicalRows.some((v) => v.record_id === r.source_medical_record_id && v.pet_id === r.pet_id)))) return null;
  const allIds = [
    ...pets.map((r) => (r as Record<string, unknown>).pet_id),
    ...(value.health_logs as Record<string, unknown>[]).map((r) => r.health_log_id),
    ...vaccineRows.map((r) => r.vaccine_record_id), ...medicalRows.map((r) => r.record_id),
    ...(value.reminders as Record<string, unknown>[]).map((r) => r.reminder_id),
  ];
  if (new Set(allIds).size !== allIds.length || !(value.read_notifications as unknown[]).every((r) => typeof r === "string")) return null;
  if (value.attachments !== undefined && (!Array.isArray(value.attachments) || value.attachments.length > 100
    || !value.attachments.every((a) => record(a) && id(a.attachment_id) && text(a.file_name)
      && medicalRows.some((m) => m.record_id === a.record_id) && ["jpg","jpeg","png","pdf"].includes(String(a.file_type))
      && typeof a.data === "string" && a.data.length <= 7_000_000
      && /^data:(?:image\/(?:jpeg|png)|application\/pdf);base64,[A-Za-z0-9+/]+={0,2}$/.test(a.data)))) return null;
  let state = value as unknown as DemoState;
  if (state.seed_revision !== 2 && state.seed_revision !== 3 && state.seed_revision !== 4) {
    const base = createDemoState(state.anchor_day);
    const sushi = base.pets.find((p) => p.name === "Sushi")!;
    const oldSushi = state.pets.find((p) => p.pet_id === sushi.pet_id);
    state = {...state,seed_revision:2,
      pets:state.pets.map((p) => p.pet_id === sushi.pet_id && p.breed === null && p.date_of_birth === null ? {...sushi,picture_url:p.picture_url} : {...p,picture_url:p.picture_url ?? demoPhoto(p.pet_id)}),
      health_logs:oldSushi && !state.health_logs.some((l) => l.pet_id === sushi.pet_id) ? [...state.health_logs,...base.health_logs.filter((l) => l.pet_id === sushi.pet_id)] : state.health_logs,
      vaccine_records:oldSushi && !state.vaccine_records.some((l) => l.pet_id === sushi.pet_id) ? [...state.vaccine_records,...base.vaccine_records.filter((l) => l.pet_id === sushi.pet_id)] : state.vaccine_records,
      reminders:oldSushi && !state.reminders.some((l) => l.pet_id === sushi.pet_id) ? [...state.reminders,...base.reminders.filter((l) => l.pet_id === sushi.pet_id)] : state.reminders};
  }
  if (state.seed_revision !== 4) {
    // Revision 3 forced identical observations into the current week. Remove
    // only unchanged seed rows; a visitor's edits to those rows must survive.
    const legacyRows = legacyStatusExamples(state.anchor_day);
    const base = createDemoState(state.anchor_day);
    const statusChanges = new Set(["00000000-0000-4000-8000-000000000308", "00000000-0000-4000-8000-000000000309", "00000000-0000-4000-8000-000000000320"]);
    const kept = state.health_logs.filter((log) => {
      const old = legacyRows.find((row) => row.health_log_id === log.health_log_id);
      return !old || Object.keys(log).length !== Object.keys(old).length
        || Object.entries(old).some(([key, field]) => log[key as keyof DemoHealthLog] !== field);
    });
    const updated = kept.map((log) => {
      if (!statusChanges.has(log.health_log_id)) return log;
      const current = base.health_logs.find((row) => row.health_log_id === log.health_log_id)!;
      const old = {...current, status:"Bình thường"};
      return Object.keys(log).length === Object.keys(old).length
        && Object.entries(old).every(([key, field]) => log[key as keyof DemoHealthLog] === field)
        ? current : log;
    });
    const existingIds = new Set(updated.map((log) => log.health_log_id));
    const additions = base.health_logs.filter((log) =>
      /^00000000-0000-4000-8000-00000000038[0-4]$/.test(log.health_log_id)
      && !existingIds.has(log.health_log_id) && ids.has(log.pet_id));
    return {...state, seed_revision:4, health_logs:[...updated,...additions]};
  }
  return state;
}

/** Exact previous seed values, used only to upgrade saved browser sessions. */
function legacyStatusExamples(anchor: string): DemoHealthLog[] {
  const elapsedWeekDays = (new Date(`${anchor}T00:00:00Z`).getUTCDay() + 6) % 7;
  const statuses = ["Mệt mỏi", "Ăn kém/Bỏ ăn", "Nôn", "Tiêu chảy", "Sốt", "Rụng lông", "Tránh ánh sáng"];
  return [101, 102].flatMap((pet, petIndex) => statuses.map((status, index) => {
    const day = shiftDemoDate(anchor, Math.max(index - 6, -elapsedWeekDays));
    return {
      health_log_id: `00000000-0000-4000-8000-${String(360 + petIndex * 7 + index).padStart(12, "0")}`,
      pet_id: `00000000-0000-4000-8000-${String(pet).padStart(12, "0")}`, created_by: DEMO_OWNER_ID,
      recorded_on: day, logged_at: timestamp(day, `10:${String(index * 5).padStart(2, "0")}:00`),
      weight: null, food_amount: null, food_type: null, status,
      note: `Quan sát ${status.toLocaleLowerCase("vi-VN")} (dữ liệu mẫu).`,
    };
  }));
}
