"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ReminderCreateForm } from "@/components/reminders/ReminderCreateForm";
import {
  getReminderTypeLabel,
  type ReminderStoredStatus,
  type ReminderType,
} from "@/lib/reminders";
import { fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
import styles from "@/styles/petDetail.module.css";

type PetReminder = {
  reminder_id: string;
  pet_id: string;
  due_date: string;
  type: ReminderType;
  status: ReminderStoredStatus;
  note: string | null;
  source_vaccine_record_id: string | null;
  source_medical_record_id: string | null;
  completed_at: string | null;
};

function isPetReminder(value: unknown): value is PetReminder {
  if (!value || typeof value !== "object") return false;
  const reminder = value as Partial<PetReminder>;
  return typeof reminder.reminder_id === "string"
    && typeof reminder.pet_id === "string"
    && typeof reminder.due_date === "string"
    && typeof reminder.type === "string"
    && typeof reminder.status === "string"
    && (reminder.note === null || typeof reminder.note === "string")
    && (reminder.completed_at === null || typeof reminder.completed_at === "string");
}

function getTodayInVietnam() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getDayDifference(fromDate: string, toDate: string) {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

function getUpcomingLabel(dueDate: string, today: string) {
  const days = getDayDifference(today, dueDate);
  if (days <= 0) return "Hôm nay";
  return `Còn ${days} ngày`;
}

function getOverdueLabel(dueDate: string, today: string) {
  const days = getDayDifference(dueDate, today);
  return `Quá hạn ${Math.max(1, days)} ngày`;
}

async function fetchPetReminders(petId: string, signal: AbortSignal) {
  const { response: result, payload: rawPayload } = await fetchJsonWithTimeout(`/api/pets/${encodeURIComponent(petId)}/reminders`, {
    cache: "no-store",
    signal,
  });
  const payload = (rawPayload && typeof rawPayload === "object" ? rawPayload : {}) as { reminders?: unknown };
  if (!result.ok || !Array.isArray(payload.reminders)) throw new Error("Reminder request failed");
  if (!payload.reminders.every(isPetReminder)) throw new Error("Reminder response invalid");
  return payload.reminders as PetReminder[];
}

function ReminderSummaryCard({
  title,
  reminder,
  timingLabel,
  tone,
  emptyText,
}: {
  title: string;
  reminder?: PetReminder;
  timingLabel?: string;
  tone: "upcoming" | "overdue";
  emptyText: string;
}) {
  return (
    <article className={`${styles.petReminderSummaryCard} ${tone === "overdue" ? styles.petReminderSummaryCardOverdue : ""}`}>
      <h2>{title}</h2>
      {reminder ? (
        <div className={styles.petReminderSummaryContent}>
          <span>{getReminderTypeLabel(reminder.type)}</span>
          <strong>{timingLabel}</strong>
        </div>
      ) : (
        <div className={styles.petReminderEmpty}>
          {tone === "upcoming" && (
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            </svg>
          )}
          <span>{emptyText}</span>
        </div>
      )}
    </article>
  );
}

export function PetReminders({
  focusForm = false,
  petId,
  petName,
}: {
  focusForm?: boolean;
  petId: string;
  petName: string;
}) {
  const [reminders, setReminders] = useState<PetReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);
  const today = getTodayInVietnam();

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
      setIsLoading(true);
      setLoadError(undefined);
      setReminders([]);
    });

    void fetchPetReminders(petId, controller.signal)
      .then((nextReminders) => {
        if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
        setReminders(nextReminders);
        setLoadError(undefined);
      })
      .catch(() => {
        if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
        if (active) setLoadError("Không thể tải nhắc hẹn lúc này.");
      })
      .finally(() => {
        if (active && activeRequestId === requestId.current) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [petId, reloadToken]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const { nextReminder, latestOverdueReminder } = useMemo(() => {
    const upcoming = reminders
      .filter((reminder) => reminder.status === "Upcoming" && reminder.due_date >= today)
      .sort((left, right) => left.due_date.localeCompare(right.due_date));
    const overdue = reminders
      .filter((reminder) => reminder.status === "Upcoming" && reminder.due_date < today)
      .sort((left, right) => right.due_date.localeCompare(left.due_date));

    return {
      nextReminder: upcoming[0],
      latestOverdueReminder: overdue[0],
    };
  }, [reminders, today]);

  function handleReminderCreated() {
    setNotice("Đã tạo nhắc hẹn.");
    setReloadToken((token) => token + 1);
  }

  return (
    <section className={styles.petReminderWorkspace} aria-label="Nhắc hẹn của thú cưng">
      <div className={styles.petReminderSummaries} aria-live="polite">
        {isLoading ? (
          <p className={styles.petReminderLoadState}>Đang tải nhắc hẹn…</p>
        ) : loadError ? (
          <div className={styles.petReminderLoadError} role="alert">
            <p>{loadError}</p>
            <button onClick={() => setReloadToken((token) => token + 1)} type="button">Thử lại</button>
          </div>
        ) : (
          <>
            <ReminderSummaryCard
              emptyText="Chưa có nhắc hẹn sắp tới"
              reminder={nextReminder}
              timingLabel={nextReminder ? getUpcomingLabel(nextReminder.due_date, today) : undefined}
              title="Nhắc hẹn sắp tới"
              tone="upcoming"
            />
            <ReminderSummaryCard
              emptyText="Không có nhắc hẹn quá hạn"
              reminder={latestOverdueReminder}
              timingLabel={latestOverdueReminder ? getOverdueLabel(latestOverdueReminder.due_date, today) : undefined}
              title="Nhắc hẹn quá hạn"
              tone="overdue"
            />
          </>
        )}
      </div>

      <ReminderCreateForm
        focusOnMount={focusForm}
        formId="pet-reminder-form"
        mode="pet"
        onCreated={handleReminderCreated}
        petId={petId}
        petName={petName}
      />

      {notice && <p className={styles.petReminderToast} role="status">{notice}</p>}
    </section>
  );
}
