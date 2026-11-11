"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { LatestMedicalRecordSummary, MedicalHistoryEntry } from "@/lib/medicalHistory";
import { getReminderTypeLabel, type ReminderType } from "@/lib/reminders";
import styles from "@/styles/petDetail.module.css";

export type PetOverviewReminder = {
  due_date: string;
  type: ReminderType;
  note: string | null;
};

type PetOverviewProps = {
  nextReminder: PetOverviewReminder | null;
  petId: string;
  readOnly?: boolean;
  reminderLoadError: boolean;
};

type OverviewData = {
  petId: string;
  entries: MedicalHistoryEntry[];
  latestMedicalRecord: LatestMedicalRecordSummary | null;
  loadState: "loading" | "ready" | "error";
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function PetOverview({ nextReminder, petId, readOnly = false, reminderLoadError }: PetOverviewProps) {
  const [overviewData, setOverviewData] = useState<OverviewData>({
    petId,
    entries: [],
    latestMedicalRecord: null,
    loadState: "loading",
  });
  const currentData = overviewData.petId === petId
    ? overviewData
    : { petId, entries: [], latestMedicalRecord: null, loadState: "loading" as const };
  const { entries, latestMedicalRecord, loadState } = currentData;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pets/${encodeURIComponent(petId)}/medical-history`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("KhÃ´ng thá»ƒ táº£i tá»•ng quan thÃº cÆ°ng.");
        const payload = (await response.json()) as {
          records?: MedicalHistoryEntry[];
          latestMedicalRecord?: LatestMedicalRecordSummary | null;
        };
        if (!controller.signal.aborted) {
          setOverviewData({
            petId,
            entries: Array.isArray(payload.records) ? payload.records : [],
            latestMedicalRecord: payload.latestMedicalRecord ?? null,
            loadState: "ready",
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOverviewData({ petId, entries: [], latestMedicalRecord: null, loadState: "error" });
        }
      });
    return () => controller.abort();
  }, [petId]);

  const vaccineEntries = useMemo(() => entries.filter((entry) => entry.type === "vaccine"), [entries]);
  const latestVaccine = vaccineEntries[0];
  const recentEntries = entries.slice(0, 3);
  const addMedicalRecordHref = `/pets/${encodeURIComponent(petId)}?tab=medical&form=medical-record#medical-record-form`;
  const addReminderHref = `/pets/${encodeURIComponent(petId)}?tab=reminders&form=reminder#pet-reminder-form`;
  const latestMedicalValue = latestMedicalRecord
    ? [
        formatDate(latestMedicalRecord.visitDate),
        latestMedicalRecord.diagnosis || latestMedicalRecord.symptoms,
        latestMedicalRecord.clinicName,
      ].filter(Boolean).join(" â€¢ ")
    : null;
  const latestMedicalCard = loadState === "loading"
    ? { value: "Äang táº£iâ€¦" }
    : loadState === "error"
      ? { value: "KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u" }
      : latestMedicalValue
        ? { value: latestMedicalValue }
        : { value: "ChÆ°a cÃ³ dá»¯ liá»‡u", action: "ThÃªm báº£n ghi Ä‘áº§u tiÃªn", actionHref: addMedicalRecordHref };
  const nextReminderValue = reminderLoadError
    ? "KhÃ´ng thá»ƒ táº£i lá»‹ch nháº¯c háº¹n"
    : nextReminder
      ? [
          getReminderTypeLabel(nextReminder.type),
          nextReminder.note?.trim(),
          formatDate(nextReminder.due_date),
        ].filter(Boolean).join(" â€¢ ")
      : "ChÆ°a cÃ³ lá»‹ch nháº¯c háº¹n";

  return (
    <>
      <section className={styles.summaryGrid} aria-label="Tá»•ng quan chÄƒm sÃ³c">
        <SummaryCard title="MÅ©i tiÃªm gáº§n nháº¥t" value={latestVaccine ? `${latestVaccine.title}: ${formatDate(latestVaccine.eventDate)}` : "ChÆ°a cÃ³ dá»¯ liá»‡u"} />
        <SummaryCard title="Nháº¯c háº¹n sáº¯p tá»›i" value={nextReminderValue} />
        <SummaryCard title="Láº§n khÃ¡m gáº§n nháº¥t" {...latestMedicalCard} />
      </section>

      <section className={styles.overviewGrid} aria-label="Hoáº¡t Ä‘á»™ng vÃ  thao tÃ¡c nhanh">
        <section className={styles.historyCard}>
          <div className={styles.cardHeading}><h2>Lá»‹ch sá»­ gáº§n Ä‘Ã¢y</h2><span>Xem táº¥t cáº£</span></div>
          {loadState === "loading"
            ? <p className={styles.emptyActivity}>Äang táº£i hoáº¡t Ä‘á»™ngâ€¦</p>
            : loadState === "error"
              ? <p className={styles.emptyActivity}>KhÃ´ng thá»ƒ táº£i hoáº¡t Ä‘á»™ng lÃºc nÃ y</p>
              : recentEntries.length > 0
                ? <div className={styles.overviewHistoryList}>{recentEntries.map((entry) => <p key={entry.id}><strong>{entry.title}</strong><span>{formatDate(entry.eventDate)}</span></p>)}</div>
                : <p className={styles.emptyActivity}>ChÆ°a cÃ³ hoáº¡t Ä‘á»™ng nÃ o</p>}
        </section>

        {!readOnly && <section className={styles.quickActions}>
          <h2>Thao tÃ¡c nhanh</h2>
          <Link href={`/pets/${encodeURIComponent(petId)}?tab=medical&form=vaccine`}>ï¼‹ ThÃªm mÅ©i tiÃªm</Link>
          <Link href={addMedicalRecordHref}>ï¼‹ ThÃªm láº§n khÃ¡m</Link>
          <Link href={addReminderHref}>ï¼‹ Táº¡o nháº¯c háº¹n</Link>
          <Link href={`/pets/${encodeURIComponent(petId)}?tab=health&form=health-log`}>ï¼‹ ThÃªm ghi chÃº sá»©c khá»e</Link>
        </section>}
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  action,
  actionHref,
}: {
  title: string;
  value: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <section className={styles.summaryCard}>
      <h2>{title}</h2>
      <p>{value}</p>
      {action && actionHref && <Link className={styles.summaryAction} href={actionHref}>{action}</Link>}
    </section>
  );
}

