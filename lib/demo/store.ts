import { getVietnamToday } from "@/lib/healthLogs/dashboard";
import { createDemoState, DEMO_OWNER_ID, DEMO_STORAGE_KEY, getDemoNotifications, isDemoDate, parseDemoState, validateDemoHealth } from "./data";
import type { DemoHealthInput, DemoState } from "./types";

export type DemoAction =
  | { type: "health-save"; petId: string; id: string; input: DemoHealthInput }
  | { type: "health-delete"; id: string }
  | { type: "reminder-complete"; id: string }
  | { type: "reminder-edit"; id: string; due_date: string; note: string | null }
  | { type: "notification-read"; id: string };

export function applyDemoAction(state: DemoState, action: DemoAction, now = new Date()): DemoState {
  const today = getVietnamToday(now);
  const updatedAt = now.toISOString();
  if (action.type === "health-save") {
    if (!state.pets.some((p) => p.pet_id === action.petId)) throw new Error("Không tìm thấy thú cưng mẫu.");
    const error = validateDemoHealth(action.input, today);
    if (error) throw new Error(error);
    const existing = state.health_logs.find((r) => r.health_log_id === action.id);
    if (existing && existing.pet_id !== action.petId) throw new Error("Nhật ký không thuộc thú cưng này.");
    const log = { ...action.input, health_log_id: action.id, pet_id: action.petId,
      created_by: DEMO_OWNER_ID, logged_at: existing?.logged_at ?? updatedAt };
    return { ...state, health_logs: [...state.health_logs.filter((r) => r.health_log_id !== action.id), log] };
  }
  if (action.type === "health-delete") {
    return { ...state, health_logs: state.health_logs.filter((r) => r.health_log_id !== action.id) };
  }
  if (action.type === "notification-read") {
    if (!getDemoNotifications(state, today).some((e) => e.notification_event_id === action.id)) return state;
    return { ...state, read_notifications: [...new Set([...state.read_notifications, action.id])] };
  }
  const reminder = state.reminders.find((r) => r.reminder_id === action.id);
  if (!reminder || reminder.status !== "Upcoming") throw new Error("Chỉ có thể thay đổi nhắc hẹn chưa hoàn thành.");
  if (action.type === "reminder-edit") {
    if (!isDemoDate(action.due_date)) throw new Error("Ngày nhắc hẹn không hợp lệ.");
    const source = state.vaccine_records.find((r) => r.vaccine_record_id === reminder.source_vaccine_record_id)?.vaccine_date
      ?? state.medical_records.find((r) => r.record_id === reminder.source_medical_record_id)?.visit_date;
    if (source && action.due_date < source) throw new Error("Ngày nhắc không được trước ngày của hồ sơ nguồn.");
  }
  return { ...state, reminders: state.reminders.map((r) => r.reminder_id !== action.id ? r : action.type === "reminder-complete"
    ? { ...r, status: "Completed", completed_at: updatedAt, updated_at: updatedAt }
    : { ...r, due_date: action.due_date, note: action.note, updated_at: updatedAt }) };
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type DemoSnapshot = { data: DemoState; persistenceWarning: string | null } | null;

/** One store per mounted demo. Constructing it does not touch browser storage. */
export function createDemoStore() {
  let snapshot: DemoSnapshot = null;
  let storage: StorageLike | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  function save(data: DemoState, warning: string | null = null) {
    try {
      if (!storage) throw new Error("storage unavailable");
      storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    } catch {
      warning = "Trình duyệt không cho lưu dữ liệu demo. Bạn vẫn thao tác được, nhưng tải lại sẽ khôi phục mẫu.";
    }
    snapshot = { data, persistenceWarning: warning };
    emit();
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start(getStorage: () => StorageLike = () => window.sessionStorage, now = new Date()) {
      if (snapshot) return;
      let data: DemoState | null = null;
      let warning: string | null = null;
      try {
        storage = getStorage();
        const raw = storage.getItem(DEMO_STORAGE_KEY);
        data = raw ? parseDemoState(JSON.parse(raw)) : null;
        if (raw && !data) warning = "Dữ liệu demo cũ không hợp lệ; đã khôi phục bộ mẫu.";
      } catch { storage = null; }
      save(data ?? createDemoState(getVietnamToday(now)), warning);
    },
    dispatch(action: DemoAction, now = new Date()) {
      if (!snapshot) throw new Error("Demo chưa sẵn sàng.");
      save(applyDemoAction(snapshot.data, action, now));
    },
    reset(now = new Date()) { save(createDemoState(getVietnamToday(now))); },
  };
}
