"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ReminderCreateForm } from "@/components/reminders/ReminderCreateForm";
import {
  getReminderTypeLabel,
  type ReminderStoredStatus,
  type ReminderType,
} from "@/lib/reminders";
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

async function fetchPetReminders(petId: string) {
  const result = await fetch(`/api/pets/${encodeURIComponent(petId)}/reminders`, {
    cache: "no-store",
  });
  const payload = await result.json() as { reminders?: PetReminder[]; error?: string };
  if (!result.ok || !Array.isArray(payload.reminders)) throw new Error("Reminder request failed");
  return payload.reminders;
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
  const router = useRouter();
  const [reminders, setReminders] = useState<PetReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const today = getTodayInVietnam();

  useEffect(() => {
    let active = true;

    void fetchPetReminders(petId)
      .then((nextReminders) => {
        if (!active) return;
        setReminders(nextReminders);
        setLoadError(undefined);
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải nhắc hẹn lúc này.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [petId]);

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
    router.refresh();
    void fetchPetReminders(petId)
      .then((nextReminders) => {
        setReminders(nextReminders);
        setLoadError(undefined);
      })
      .catch(() => setLoadError("Không thể tải nhắc hẹn lúc này."));
  }

  return (
    <section className={styles.petReminderWorkspace} aria-label="Nhắc hẹn của thú cưng">
      <div className={styles.petReminderSummaries} aria-live="polite">
        {isLoading ? (
          <p className={styles.petReminderLoadState}>Đang tải nhắc hẹn…</p>
        ) : loadError ? (
          <p className={styles.petReminderLoadError}>{loadError}</p>
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
