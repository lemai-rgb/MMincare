import { describe, expect, it } from "vitest";
import { createDemoState, DEMO_STORAGE_KEY, demoReminderStatus, getDemoNotifications, parseDemoState, shiftDemoDate, sortDemoHealthLogs } from "./data";
import { applyDemoAction, createDemoStore } from "./store";
import { aggregateOtherStatusBreakdown, aggregateStatusCounts, getPeriodRange } from "@/lib/healthLogs/dashboard";
import { HEALTH_STATUS_OPTIONS } from "@/lib/healthLogs/statusOptions";
import type { DemoHealthLog } from "./types";

const now = new Date("2026-10-10T03:00:00Z");
const today = "2026-10-10";
const newId = "00000000-0000-4000-8000-000000000999";

describe("synthetic portfolio dataset", () => {
  it("uses distinct uneven histories without forcing every status into every Pet or week", () => {
    const state = createDemoState(today);
    const rows = (name: string) => state.health_logs.filter((log) =>
      log.pet_id === state.pets.find((pet) => pet.name === name)!.pet_id);
    const month = getPeriodRange("month", now);
    const meo = aggregateStatusCounts(rows("Meo"), month);
    const min = aggregateStatusCounts(rows("Min"), month);
    expect(meo.map((group) => group.status)).toEqual([...HEALTH_STATUS_OPTIONS]);
    expect(meo.map((group) => group.count)).toEqual([4, 1, 0, 0, 1, 2]);
    expect(min.map((group) => group.count)).toEqual([4, 0, 1, 1, 0, 2]);
    expect(aggregateOtherStatusBreakdown(rows("Meo"), month).map((group) => group.label))
      .toEqual(expect.arrayContaining(["Sốt", "Tránh ánh sáng"]));
    expect(aggregateOtherStatusBreakdown(rows("Min"), month).map((group) => group.label)).toEqual(["Rụng lông"]);
    expect(rows("Meo").some((log) => log.status === "Nôn")).toBe(false);
    expect(rows("Min").some((log) => log.status === "Sốt" || log.status === "Tránh ánh sáng")).toBe(false);
    for (const name of ["Meo", "Min"]) {
      const logs = rows(name);
      const count = new Map<string | null, number>();
      for (const log of logs) count.set(log.status, (count.get(log.status) ?? 0) + 1);
      expect(count.get("Bình thường")).toBeGreaterThan(Math.max(...[...count.entries()].filter(([status]) => status !== "Bình thường").map(([, n]) => n)));
    }
    for (let day = 5; day <= 11; day++) {
      const anchor = `2026-10-${String(day).padStart(2, "0")}`;
      const snapshot = createDemoState(anchor);
      expect(parseDemoState(snapshot)).toEqual(snapshot);
      expect(snapshot.health_logs.find((log) => log.health_log_id.endsWith("380"))?.recorded_on)
        .toBe(shiftDemoDate(anchor, -8));
      const week = getPeriodRange("week", new Date(`${anchor}T12:00:00+07:00`));
      for (const pet of snapshot.pets) {
        const counts = aggregateStatusCounts(snapshot.health_logs.filter((log) => log.pet_id === pet.pet_id), week);
        expect(counts.some((group) => group.count === 0)).toBe(true);
      }
    }
    expect(createDemoState(today)).toEqual(state);
  });

  const additional = (log: DemoHealthLog) => /00000000038[0-4]$/.test(log.health_log_id);
  const oldBaseline = () => createDemoState(today).health_logs.filter((log) => !additional(log))
    .map((log) => /000000000(?:308|309|320)$/.test(log.health_log_id) ? {...log, status:"Bình thường"} : log);

  it("upgrades revision 2 once while preserving visitor edits, deletions and removed photos", () => {
    const state = createDemoState(today);
    const oldLogs = oldBaseline();
    const deletedId = oldLogs[1].health_log_id;
    const edited = {...oldLogs[0], status:"Quan sát riêng", note:"Giữ sửa đổi của người xem"};
    const legacy = {...state, seed_revision:2 as const, pets:state.pets.map((pet) => ({...pet,picture_url:null})),
      health_logs:oldLogs.filter((log) => log.health_log_id !== deletedId).map((log) => log.health_log_id === edited.health_log_id ? edited : log)};
    const upgraded = parseDemoState(legacy)!;
    expect(upgraded.seed_revision).toBe(4);
    expect(upgraded.health_logs).toHaveLength(30);
    expect(upgraded.health_logs.find((log) => log.health_log_id === edited.health_log_id)).toEqual(edited);
    expect(upgraded.health_logs.some((log) => log.health_log_id === deletedId)).toBe(false);
    expect(upgraded.pets.every((pet) => pet.picture_url === null)).toBe(true);
    expect(parseDemoState(upgraded)).toEqual(upgraded);
    const removed = {...upgraded, health_logs:upgraded.health_logs.filter((log) => !additional(log))};
    expect(parseDemoState(removed)).toEqual(removed);
  });

  it("replaces untouched revision 3 forced examples without losing edited rows or restoring deleted originals", () => {
    const state = createDemoState(today);
    const statuses = ["Mệt mỏi", "Ăn kém/Bỏ ăn", "Nôn", "Tiêu chảy", "Sốt", "Rụng lông", "Tránh ánh sáng"];
    const legacyExtras: DemoHealthLog[] = [101, 102].flatMap((pet, p) => statuses.map((status, i) => {
      const day = shiftDemoDate(today, Math.max(i - 6, -5));
      return {
        health_log_id: `00000000-0000-4000-8000-${String(360 + p * 7 + i).padStart(12, "0")}`,
        pet_id: `00000000-0000-4000-8000-${String(pet).padStart(12, "0")}`, created_by: state.pets[0].owner_id,
        recorded_on: day, logged_at: `${day}T10:${String(i * 5).padStart(2, "0")}:00+07:00`,
        weight:null, food_amount:null, food_type:null, status,
        note:`Quan sát ${status.toLocaleLowerCase("vi-VN")} (dữ liệu mẫu).`,
      };
    }));
    const editedExtra = {...legacyExtras[0],note:"Nội dung người xem sửa"};
    const deletedId = oldBaseline()[1].health_log_id;
    const editedOriginal = {...oldBaseline().find((log) => log.health_log_id.endsWith("308"))!,note:"Giữ trạng thái người xem"};
    const legacy = {...state,seed_revision:3 as const,health_logs:[
      ...oldBaseline().filter((log) => log.health_log_id !== deletedId)
        .map((log) => log.health_log_id === editedOriginal.health_log_id ? editedOriginal : log),
      editedExtra,...legacyExtras.slice(1),
    ]};
    const upgraded = parseDemoState(legacy)!;
    expect(upgraded.seed_revision).toBe(4);
    expect(upgraded.health_logs).toHaveLength(31);
    expect(upgraded.health_logs.find((log) => log.health_log_id === editedExtra.health_log_id)).toEqual(editedExtra);
    expect(upgraded.health_logs.find((log) => log.health_log_id === editedOriginal.health_log_id)).toEqual(editedOriginal);
    expect(upgraded.health_logs.some((log) => log.health_log_id === deletedId)).toBe(false);
    expect(upgraded.health_logs.some((log) => log.health_log_id.endsWith("361"))).toBe(false);
    expect(upgraded.health_logs.find((log) => log.health_log_id.endsWith("309"))?.status).toBe("Tiêu chảy");
    expect(parseDemoState(upgraded)).toEqual(upgraded);
    const pristine = parseDemoState({...state,seed_revision:3,health_logs:[...oldBaseline(),...legacyExtras]})!;
    expect(pristine.health_logs).toHaveLength(31);
    expect([...pristine.health_logs].sort((a,b) => a.health_log_id.localeCompare(b.health_log_id)))
      .toEqual([...state.health_logs].sort((a,b) => a.health_log_id.localeCompare(b.health_log_id)));
  });

  it("has coherent ownership, unique IDs, relation sources and a basic Sushi profile", () => {
    const state = createDemoState(today);
    expect(parseDemoState(state)).toEqual(state);
    expect(state.pets).toHaveLength(3);
    expect(state.health_logs).toHaveLength(31);
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
    expect(second.health_logs).toHaveLength(31);
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
    expect(applyDemoAction(edited, { type: "health-delete", id: newId }, now).health_logs).toHaveLength(31);
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
