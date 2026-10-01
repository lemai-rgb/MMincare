import { getEmbeddedReminder, type NotificationRow } from "./current";

export type NotificationCenterStatus = "idle" | "loading" | "ready" | "error";

export type NotificationCenterState = {
  items: NotificationRow[];
  status: NotificationCenterStatus;
  loadErrorMessage: string;
  readErrorMessage: string;
  pendingReadIds: string[];
};

export const initialNotificationCenterState: NotificationCenterState = {
  items: [],
  status: "idle",
  loadErrorMessage: "",
  readErrorMessage: "",
  pendingReadIds: [],
};

export type NotificationCenterAction =
  | { type: "load-start" }
  | { type: "load-success"; items: NotificationRow[] }
  | { type: "load-error"; message: string }
  | { type: "read-start"; notificationId: string }
  | { type: "read-success"; notificationId: string; readAt: string }
  | { type: "read-failure"; notificationId: string; message: string };

export function notificationCenterReducer(
  state: NotificationCenterState,
  action: NotificationCenterAction,
): NotificationCenterState {
  switch (action.type) {
    case "load-start":
      return { ...state, status: "loading", loadErrorMessage: "", readErrorMessage: "" };
    case "load-success":
      return { ...state, items: action.items, status: "ready", loadErrorMessage: "" };
    case "load-error":
      return { ...state, status: "error", loadErrorMessage: action.message };
    case "read-start":
      return state.pendingReadIds.includes(action.notificationId)
        ? state
        : { ...state, pendingReadIds: [...state.pendingReadIds, action.notificationId] };
    case "read-success":
      return {
        ...state,
        items: state.items.map((item) => item.notification_event_id === action.notificationId
          ? { ...item, read_at: action.readAt }
          : item),
        pendingReadIds: state.pendingReadIds.filter((id) => id !== action.notificationId),
        readErrorMessage: "",
      };
    case "read-failure":
      return {
        ...state,
        pendingReadIds: state.pendingReadIds.filter((id) => id !== action.notificationId),
        readErrorMessage: action.message,
      };
  }
}

export function getUnreadNotificationCount(items: NotificationRow[]) {
  return items.reduce((count, item) => count + (item.read_at ? 0 : 1), 0);
}

export function getNotificationLabel(eventType: string) {
  return eventType === "overdue" ? "Quá hạn" : "Sắp đến hạn";
}

export function getNotificationReminder(item: NotificationRow) {
  return getEmbeddedReminder(item.reminders);
}

export function formatNotificationDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function formatNotificationRelativeTime(value: string, now = new Date()) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Vừa xong";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} phút trước`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} giờ trước`;
  if (elapsedSeconds < 2592000) return `${Math.floor(elapsedSeconds / 86400)} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(timestamp));
}
