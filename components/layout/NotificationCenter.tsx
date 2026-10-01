"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import {
  formatNotificationDate,
  formatNotificationRelativeTime,
  getNotificationLabel,
  getNotificationReminder,
  getUnreadNotificationCount,
  initialNotificationCenterState,
  notificationCenterReducer,
} from "@/lib/notifications/center";
import { parseNotificationReadAt, parseNotificationRows, type NotificationRow } from "@/lib/notifications/current";
import { NOTIFICATION_CENTER_INVALIDATED_EVENT } from "@/lib/notifications/events";
import styles from "@/styles/dashboard.module.css";

const PANEL_ID = "notification-center-panel";

type NotificationResponse = { notifications?: unknown; error?: string };

type NotificationCenterProps = {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

class NotificationApiError extends Error {}

async function parseResponse<T>(response: Response, fallback: string) {
  try {
    return await response.json() as T;
  } catch {
    throw new Error(fallback);
  }
}

function serverError(_payload: { error?: string }, fallback: string) {
  return new NotificationApiError(fallback);
}

export function NotificationCenter({ isOpen: controlledOpen, onOpenChange }: NotificationCenterProps = {}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(notificationCenterReducer, initialNotificationCenterState);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);
  const loadSequence = useRef(0);
  const readRequestsRef = useRef(new Map<string, AbortController>());
  const readGeneration = useRef(0);
  const mountedRef = useRef(false);
  const pendingReadRef = useRef(new Set<string>());
  const readOverridesRef = useRef(new Map<string, string>());
  const unreadCount = getUnreadNotificationCount(state.items);

  const setIsOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  const loadNotifications = useCallback(async () => {
    loadRequestRef.current?.abort();
    const controller = new AbortController();
    loadRequestRef.current = controller;
    const sequence = ++loadSequence.current;
    dispatch({ type: "load-start" });

    try {
      const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
      const payload = await parseResponse<NotificationResponse>(response, "Không thể tải thông báo lúc này.");
      if (!response.ok) throw serverError(payload, "Không thể tải thông báo lúc này.");
      const rows = parseNotificationRows(payload.notifications);
      if (!rows) throw new NotificationApiError("Không thể tải thông báo lúc này.");
      if (!mountedRef.current || controller.signal.aborted || sequence !== loadSequence.current) return;
      const items = rows.map((item) => {
        const override = readOverridesRef.current.get(item.notification_event_id);
        if (override && !item.read_at) return { ...item, read_at: override };
        if (item.read_at) readOverridesRef.current.delete(item.notification_event_id);
        return item;
      });
      dispatch({ type: "load-success", items });
    } catch (error: unknown) {
      if (!mountedRef.current || controller.signal.aborted || sequence !== loadSequence.current) return;
      dispatch({ type: "load-error", message: error instanceof NotificationApiError ? error.message : "Không thể tải thông báo lúc này." });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadNotifications();
    const readRequests = readRequestsRef.current;
    return () => {
      mountedRef.current = false;
      readGeneration.current += 1;
      loadRequestRef.current?.abort();
      loadRequestRef.current = null;
      for (const controller of readRequests.values()) controller.abort();
      readRequests.clear();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const invalidate = () => {
      readGeneration.current += 1;
      for (const controller of readRequestsRef.current.values()) controller.abort();
      void loadNotifications();
    };
    window.addEventListener(NOTIFICATION_CENTER_INVALIDATED_EVENT, invalidate);
    return () => window.removeEventListener(NOTIFICATION_CENTER_INVALIDATED_EVENT, invalidate);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, setIsOpen]);

  function togglePanel() {
    const nextOpen = !isOpen;
    if (nextOpen) void loadNotifications();
    setIsOpen(nextOpen);
  }

  async function handleNotificationClick(item: NotificationRow) {
    const reminder = getNotificationReminder(item);
    if (!reminder || pendingReadRef.current.has(item.notification_event_id)) return;
    if (item.read_at) {
      setIsOpen(false);
      router.push(`/reminders?highlight=${encodeURIComponent(reminder.reminder_id)}`);
      return;
    }

    const operationGeneration = readGeneration.current;
    const controller = new AbortController();
    readRequestsRef.current.set(item.notification_event_id, controller);
    pendingReadRef.current.add(item.notification_event_id);
    dispatch({ type: "read-start", notificationId: item.notification_event_id });
    const isCurrent = () => mountedRef.current
      && readGeneration.current === operationGeneration
      && pendingReadRef.current.has(item.notification_event_id)
      && !controller.signal.aborted;
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(item.notification_event_id)}/read`, { method: "PATCH", signal: controller.signal });
      if (!isCurrent()) return;
      if (response.status === 404) {
        const staleMessage = "Thông báo này không còn hiệu lực. Danh sách đã được cập nhật.";
        await loadNotifications();
        if (!isCurrent()) return;
        dispatch({ type: "read-failure", notificationId: item.notification_event_id, message: staleMessage });
        return;
      }
      const payload = await parseResponse<{ notification?: { read_at?: string | null }; error?: string }>(response, "Không thể cập nhật thông báo lúc này.");
      if (!isCurrent()) return;
      if (!response.ok) throw serverError(payload, "Không thể cập nhật thông báo lúc này.");
      const readAt = parseNotificationReadAt(payload);
      if (!readAt) throw new NotificationApiError("Không thể cập nhật thông báo lúc này.");
      if (!isCurrent()) return;
      readOverridesRef.current.set(item.notification_event_id, readAt);
      dispatch({ type: "read-success", notificationId: item.notification_event_id, readAt });
      setIsOpen(false);
      router.push(`/reminders?highlight=${encodeURIComponent(reminder.reminder_id)}`);
    } catch (error: unknown) {
      if (isCurrent()) dispatch({ type: "read-failure", notificationId: item.notification_event_id, message: error instanceof NotificationApiError ? error.message : "Không thể cập nhật thông báo lúc này." });
    } finally {
      pendingReadRef.current.delete(item.notification_event_id);
      if (readRequestsRef.current.get(item.notification_event_id) === controller) readRequestsRef.current.delete(item.notification_event_id);
    }
  }

  return (
    <div className={styles.notificationContainer}>
      <button
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        className={styles.notificationTrigger}
        onClick={togglePanel}
        ref={triggerRef}
        type="button"
      >
        <svg aria-hidden="true" className={styles.notificationBellIcon} viewBox="0 0 24 24">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && <span aria-hidden="true" className={styles.notificationBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
        <span className={styles.srOnly}>{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo chưa đọc"}</span>
      </button>

      {isOpen && (
        <section aria-labelledby="notification-center-title" aria-live="polite" className={styles.notificationPanel} id={PANEL_ID} ref={panelRef}>
          <header className={styles.notificationPanelHeader}>
            <h2 id="notification-center-title">Thông báo</h2>
          </header>
          {state.status === "loading" && <p className={styles.notificationState} role="status">Đang tải thông báo…</p>}
          {state.readErrorMessage && <p className={styles.notificationReadError} role="alert">{state.readErrorMessage}</p>}
          {state.status === "error" && (
            <div className={styles.notificationState} role="alert">
              <p>{state.loadErrorMessage}</p>
              <button className={styles.notificationRetry} onClick={() => void loadNotifications()} type="button">Thử lại</button>
            </div>
          )}
          {state.status === "ready" && state.items.length === 0 && (
            <div className={styles.notificationEmpty}>
              <span aria-hidden="true" className={styles.notificationEmptyMark}>⌁</span>
              <p>Chưa có thông báo.</p>
              <span>Các nhắc hẹn sắp đến hạn hoặc quá hạn sẽ hiển thị tại đây.</span>
            </div>
          )}
          {state.status === "ready" && state.items.length > 0 && (
            <div className={styles.notificationList}>
              {state.items.map((item) => {
                const reminder = getNotificationReminder(item);
                if (!reminder) return null;
                const pet = Array.isArray(reminder.pet) ? reminder.pet[0] : reminder.pet;
                const isUnread = !item.read_at;
                const isPending = state.pendingReadIds.includes(item.notification_event_id);
                return (
                  <button
                    aria-label={`${getNotificationLabel(item.event_type)}: ${reminder.note || "Nhắc hẹn"} cho ${pet?.name || "thú cưng"}`}
                    className={`${styles.notificationItem} ${isUnread ? styles.notificationItemUnread : ""}`}
                    disabled={isPending}
                    key={item.notification_event_id}
                    onClick={() => void handleNotificationClick(item)}
                    type="button"
                  >
                    <span className={styles.notificationItemTopline}>
                      <span className={`${styles.notificationType} ${item.event_type === "overdue" ? styles.notificationTypeOverdue : ""}`}>{getNotificationLabel(item.event_type)}</span>
                      <span className={styles.notificationRelativeTime}>{formatNotificationRelativeTime(item.scheduled_for)}</span>
                    </span>
                    <strong>{reminder.note || "Nhắc hẹn chăm sóc"}</strong>
                    <span className={styles.notificationPet}>{pet?.name || "Thú cưng"} · Đến hạn {formatNotificationDate(reminder.due_date)}</span>
                    {isUnread && <span aria-hidden="true" className={styles.notificationUnreadDot} />}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
