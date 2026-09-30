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
import type { NotificationRow } from "@/lib/notifications/current";
import styles from "@/styles/dashboard.module.css";

const PANEL_ID = "notification-center-panel";

type NotificationResponse = { notifications?: NotificationRow[]; error?: string };

export function NotificationCenter() {
  const router = useRouter();
  const [state, dispatch] = useReducer(notificationCenterReducer, initialNotificationCenterState);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const mountedRef = useRef(false);
  const pendingReadRef = useRef(new Set<string>());
  const unreadCount = getUnreadNotificationCount(state.items);

  const loadNotifications = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const sequence = ++requestSequence.current;
    dispatch({ type: "load-start" });

    try {
      const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
      const payload = await response.json() as NotificationResponse;
      if (!response.ok) throw new Error(payload.error || "Không thể tải thông báo lúc này.");
      if (!mountedRef.current || controller.signal.aborted || sequence !== requestSequence.current) return;
      dispatch({ type: "load-success", items: Array.isArray(payload.notifications) ? payload.notifications : [] });
    } catch (error: unknown) {
      if (!mountedRef.current || controller.signal.aborted || sequence !== requestSequence.current) return;
      dispatch({ type: "load-error", message: error instanceof Error ? error.message : "Không thể tải thông báo lúc này." });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadNotifications();
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
    };
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
  }, [isOpen]);

  async function handleNotificationClick(item: NotificationRow) {
    const reminder = getNotificationReminder(item);
    if (!reminder || pendingReadRef.current.has(item.notification_event_id)) return;
    if (item.read_at) {
      setIsOpen(false);
      router.push(`/reminders?highlight=${encodeURIComponent(reminder.reminder_id)}`);
      return;
    }

    pendingReadRef.current.add(item.notification_event_id);
    dispatch({ type: "read-start", notificationId: item.notification_event_id });
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(item.notification_event_id)}/read`, { method: "PATCH" });
      const payload = await response.json() as { notification?: { read_at?: string | null }; error?: string };
      if (!response.ok || !payload.notification?.read_at) throw new Error(payload.error || "Không thể cập nhật thông báo lúc này.");
      if (!mountedRef.current) return;
      dispatch({ type: "read-success", notificationId: item.notification_event_id, readAt: payload.notification.read_at });
      setIsOpen(false);
      router.push(`/reminders?highlight=${encodeURIComponent(reminder.reminder_id)}`);
    } catch (error: unknown) {
      if (mountedRef.current) dispatch({ type: "read-failure", notificationId: item.notification_event_id, message: error instanceof Error ? error.message : "Không thể cập nhật thông báo lúc này." });
    } finally {
      pendingReadRef.current.delete(item.notification_event_id);
    }
  }

  return (
    <div className={styles.notificationContainer}>
      <button
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        className={styles.notificationTrigger}
        onClick={() => setIsOpen((open) => !open)}
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
          {state.status === "error" && (
            <div className={styles.notificationState} role="alert">
              <p>{state.errorMessage}</p>
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
