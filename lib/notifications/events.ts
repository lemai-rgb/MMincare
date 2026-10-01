export const NOTIFICATION_CENTER_INVALIDATED_EVENT = "mmincare:notifications-invalidated";

export function invalidateNotificationCenter() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_CENTER_INVALIDATED_EVENT));
  }
}
