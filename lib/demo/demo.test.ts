import { describe, expect, it } from "vitest";
import { createDemoState, DEMO_STORAGE_KEY, demoReminderStatus, getDemoNotifications, parseDemoState, shiftDemoDate, sortDemoHealthLogs } from "./data";
import { applyDemoAction, createDemoStore } from "./store";

const now = new Date("2026-10-10T03:00:00Z");
const today = "2026-10-10";
const newId = "00000000-0000-4000-8000-000000000999";

describe("synthetic portfolio dataset", () => {
  it("has coherent ownership, unique IDs, relation sources and a basic Sushi profile", () => {
    const state = createDemoState(today);
    expect(parseDemoState(state)).toEqual(state);
    expect(state.pets).toHaveLength(3);
    expect(state.health_logs).toHaveLength(26);
    expect(state.reminders).toHaveLength(7);
    const empty = state.pets.find((p) => p.name === "Sushi")!;
    expect(state.health_logs.filter((r) => r.pet_id === empty.pet_id)).toHaveLength(2);
    expect(state.reminders.some((r) => r.pet_id === empty.pet_id)).toBe(true);
    expect(empty.breed).toBe("Mèo nhà");
    expect(state.medical_records.some((r) => r.pet_id === empty.pet_id)).toBe(false);
    expect(state.pets.map((p) => p.picture_url)).toEqual(["/images/demo/meo.webp", "/images/demo/min.webp", null]);
  });

  it("resolves offsets across year/leap-day boundaries and retains upcoming/overdue/completed scenarios", () => {
    expect(shiftDemoDate("2028-03-01", -1)).toBe("2028-02-29");
    for (const anchor of ["2026-01-01", "2028-03-01", "2030-12-31"]) {
      const state = createDemoState(anchor);
      expect(parseDemoState(state)).not.toBeNull();
      expect(new Set(state.reminders.map((r) => demoReminderStatus(state, r.reminder_id, anchor))))
        .toEqual(new Set(["Upcoming", "Overdue", "Completed"]));
      expect(state.health_logs.every((r) => r.recorded_on <= anchor)).toBe(true);
      expect(state.vaccine_records.every((r) => r.vaccine_date <= anchor)).toBe(true);
    }
  });

  it("does not let backdated entries override newer business dates and handles missing weight", () => {
    const state = createDemoState(today);
    const min = state.pets.find((p) => p.name === "Min")!;
    expect(sortDemoHealthLogs(state.health_logs.filter((r) => r.pet_id === min.pet_id))[0].recorded_on).toBe(today);
    const meo = state.pets.find((p) => p.name === "Meo")!;
    expect(sortDemoHealthLogs(state.health_logs.filter((r) => r.pet_id === meo.pet_id))[0].weight).toBeNull();
  });

  it("does not share mutable fixture arrays across sessions and rejects malformed persisted data", () => {
    const first = createDemoState(today); const second = createDemoState(today);
    first.health_logs.length = 0;
    expect(second.health_logs).toHaveLength(26);
    expect(parseDemoState({ ...second, pets: [] })).toBeNull();
    expect(parseDemoState({ ...second, health_logs: [{ ...second.health_logs[0], weight: "2.1" }] })).toBeNull();
    expect(parseDemoState({ ...second, reminders: [{ ...second.reminders[0], source_medical_record_id: second.medical_records[0].record_id }] })).toBeNull();
    expect(parseDemoState({ ...second, pets: second.pets.map((p) => ({ ...p, picture_url: "https://external.invalid/pet.jpg" })) })).toBeNull();
    const legacy = { ...second, seed_revision: undefined, pets: second.pets.map((p) => ({ ...p, picture_url: null })) };
    legacy.health_logs[0].note = "Visitor edit kept after photo update";
    const restored = parseDemoState(legacy)!;
    expect(restored.pets.map((p) => p.picture_url)).toEqual(["/images/demo/meo.webp", "/images/demo/min.webp", null]);
    expect(restored.health_logs[0].note).toBe("Visitor edit kept after photo update");
  });
});

describe("isolated demo lifecycle", () => {
  it("create retries with one ID stay single, edits keep logged_at and deletion removes the canonical row", () => {
    const state = createDemoState(today);
    const action = { type: "health-save" as const, petId: state.pets[2].pet_id, id: newId,
      input: { recorded_on: today, weight: 3.1, food_amount: null, food_type: null, status: null, note: null } };
    const once = applyDemoAction(state, action, now);
    const twice = applyDemoAction(once, action, now);
    expect(twice.health_logs.filter((r) => r.health_log_id === newId)).toHaveLength(1);
    const edited = applyDemoAction(twice, { ...action, input: { ...action.input, weight: 3.2 } }, new Date("2026-10-10T05:00:00Z"));
    expect(edited.health_logs.find((r) => r.health_log_id === newId)?.logged_at).toBe(now.toISOString());
    expect(applyDemoAction(edited, { type: "health-delete", id: newId }, now).health_logs).toHaveLength(26);
  });

  it("rejects invalid future, empty, precision and cross-Pet health operations", () => {
    const state = createDemoState(today);
    const action = { type: "health-save" as const, petId: state.pets[0].pet_id, id: newId,
      input: { recorded_on: "2026-10-11", weight: 3, food_amount: null, food_type: null, status: null, note: null } };
    expect(() => applyDemoAction(state, action, now)).toThrow(/tương lai/);
    expect(() => applyDemoAction(state, { ...action, input: { ...action.input, recorded_on: today, weight: 2.123 } }, now)).toThrow(/thập phân/);
    expect(() => applyDemoAction(state, { ...action, input: { ...action.input, recorded_on: today, weight: null } }, now)).toThrow(/ít nhất/);
    expect(() => applyDemoAction(state, { ...action, id: state.health_logs[0].health_log_id, petId: state.pets[1].pet_id,
      input: { ...action.input, recorded_on: today } }, now)).toThrow(/không thuộc/);
  });

  it("notification reads are idempotent, complete removes events, reschedule creates a new date snapshot", () => {
    const state = createDemoState(today);
    const event = getDemoNotifications(state, today).find((e) => !e.read_at)!;
    const read = applyDemoAction(state, { type: "notification-read", id: event.notification_event_id }, now);
    const repeated = applyDemoAction(read, { type: "notification-read", id: event.notification_event_id }, now);
    expect(repeated.read_notifications).toEqual(read.read_notifications);
    const completed = applyDemoAction(read, { type: "reminder-complete", id: event.reminder_id }, now);
    expect(getDemoNotifications(completed, today).some((e) => e.reminder_id === event.reminder_id)).toBe(false);
    const changed = applyDemoAction(read, { type: "reminder-edit", id: event.reminder_id, due_date: shiftDemoDate(event.due_date_snapshot, -1), note: null }, now);
    const newEvent = getDemoNotifications(changed, today).find((e) => e.reminder_id === event.reminder_id);
    expect(newEvent?.notification_event_id).not.toBe(event.notification_event_id);
    expect(newEvent?.read_at).toBeNull();
  });

  it("rejects editing completed reminders and dates before a linked source", () => {
    const state = createDemoState(today);
    const completed = state.reminders.find((r) => r.status === "Completed")!;
    expect(() => applyDemoAction(state, { type: "reminder-edit", id: completed.reminder_id, due_date: today, note: null }, now)).toThrow(/chưa hoàn thành/);
    expect(() => applyDemoAction(state, { type: "reminder-edit", id: state.reminders[0].reminder_id, due_date: "2020-01-01", note: null }, now)).toThrow(/hồ sơ nguồn/);
  });

  it("reload restores a tab's data, stores are independent, reset does not touch other storage keys", () => {
    const map = new Map([["real-user-preference", "unchanged"]]);
    const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, val: string) => { map.set(key, val); } };
    const store = createDemoStore(); store.start(() => storage, now);
    const first = store.getSnapshot()!.data.reminders[0].reminder_id;
    store.dispatch({ type: "reminder-complete", id: first }, now);
    const reloaded = createDemoStore(); reloaded.start(() => storage, now);
    expect(reloaded.getSnapshot()!.data.reminders[0].status).toBe("Completed");
    const independent = createDemoStore(); independent.start(() => ({ getItem: () => null, setItem: () => {} }), now);
    expect(independent.getSnapshot()!.data.reminders[0].status).toBe("Upcoming");
    reloaded.reset(now);
    expect(map.get("real-user-preference")).toBe("unchanged");
    expect(JSON.parse(map.get(DEMO_STORAGE_KEY)!).reminders[0].status).toBe("Upcoming");
  });

  it("does not touch storage before start; blocked/corrupt storage recovers with actionable messaging", () => {
    const store = createDemoStore();
    expect(store.getSnapshot()).toBeNull();
    store.start(() => { throw new Error("SecurityError"); }, now);
    expect(store.getSnapshot()!.data.pets).toHaveLength(3);
    expect(store.getSnapshot()!.persistenceWarning).toContain("không cho lưu");
    const corrupt = createDemoStore();
    corrupt.start(() => ({ getItem: () => "{}", setItem: () => {} }), now);
    expect(corrupt.getSnapshot()!.persistenceWarning).toContain("không hợp lệ");
  });
});
