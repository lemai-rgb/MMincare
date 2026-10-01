import assert from "node:assert/strict";

import {
  formatNotificationDate,
  formatNotificationRelativeTime,
  getNotificationLabel,
  getUnreadNotificationCount,
  initialNotificationCenterState,
  notificationCenterReducer,
} from "./center";
import type { NotificationRow } from "./current";

const unread: NotificationRow = {
  notification_event_id: "event-1",
  event_type: "due_soon",
  scheduled_for: "2026-09-30T08:00:00.000Z",
  read_at: null,
  reminders: {
    reminder_id: "reminder-1",
    note: "Tiêm phòng",
    due_date: "2026-10-02",
    status: "Upcoming",
    pet: { pet_id: "pet-1", name: "Meo" },
  },
};

const read = { ...unread, notification_event_id: "event-2", read_at: "2026-09-30T09:00:00.000Z" };
assert.equal(getUnreadNotificationCount([unread, read]), 1);
assert.equal(getNotificationLabel("due_soon"), "Sắp đến hạn");
assert.equal(getNotificationLabel("overdue"), "Quá hạn");
assert.equal(formatNotificationDate("2026-10-02"), "02/10/2026");
assert.equal(formatNotificationRelativeTime("2026-09-30T08:00:00.000Z", new Date("2026-09-30T10:00:00.000Z")), "2 giờ trước");

let state = notificationCenterReducer(initialNotificationCenterState, { type: "load-start" });
assert.equal(state.status, "loading");
state = notificationCenterReducer(state, { type: "load-success", items: [unread, read] });
assert.equal(state.status, "ready");
assert.equal(state.items.length, 2);

state = notificationCenterReducer(state, { type: "read-start", notificationId: "event-1" });
state = notificationCenterReducer(state, { type: "read-start", notificationId: "event-1" });
assert.deepEqual(state.pendingReadIds, ["event-1"], "double-click chỉ giữ một request đang chờ");
state = notificationCenterReducer(state, { type: "read-success", notificationId: "event-1", readAt: "2026-09-30T10:01:00.000Z" });
assert.equal(getUnreadNotificationCount(state.items), 0);
assert.deepEqual(state.pendingReadIds, []);

state = notificationCenterReducer(state, { type: "read-start", notificationId: "event-2" });
state = notificationCenterReducer(state, { type: "read-failure", notificationId: "event-2", message: "Thử lại" });
assert.equal(state.items[1]?.read_at, read.read_at, "PATCH lỗi không làm thay đổi trạng thái đã đọc");
assert.equal(state.readErrorMessage, "Thử lại");
