"use client";
import { useRuntimeRequest } from "@/lib/appRuntime";

import { AppLink as Link } from "@/lib/appRuntime";
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
  const request = useRuntimeRequest();
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
    request(`/api/pets/${encodeURIComponent(petId)}/medical-history`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể tải tổng quan thú cưng.");
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
  }, [petId, request]);

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
      ].filter(Boolean).join(" • ")
    : null;
  const latestMedicalCard = loadState === "loading"
    ? { value: "Đang tải…" }
    : loadState === "error"
      ? { value: "Không thể tải dữ liệu" }
      : latestMedicalValue
        ? { value: latestMedicalValue }
        : { value: "Chưa có dữ liệu", action: "Thêm bản ghi đầu tiên", actionHref: addMedicalRecordHref };
  const nextReminderValue = reminderLoadError
    ? "Không thể tải lịch nhắc hẹn"
    : nextReminder
      ? [
          getReminderTypeLabel(nextReminder.type),
          nextReminder.note?.trim(),
          formatDate(nextReminder.due_date),
        ].filter(Boolean).join(" • ")
      : "Chưa có lịch nhắc hẹn";

  return (
    <>
      <section className={styles.summaryGrid} aria-label="Tổng quan chăm sóc">
        <SummaryCard title="Mũi tiêm gần nhất" value={latestVaccine ? `${latestVaccine.title}: ${formatDate(latestVaccine.eventDate)}` : "Chưa có dữ liệu"} />
        <SummaryCard title="Nhắc hẹn sắp tới" value={nextReminderValue} />
        <SummaryCard title="Lần khám gần nhất" {...latestMedicalCard} />
      </section>

      <section className={styles.overviewGrid} aria-label="Hoạt động và thao tác nhanh">
        <section className={styles.historyCard}>
          <div className={styles.cardHeading}><h2>Lịch sử gần đây</h2><span>Xem tất cả</span></div>
          {loadState === "loading"
            ? <p className={styles.emptyActivity}>Đang tải hoạt động…</p>
            : loadState === "error"
              ? <p className={styles.emptyActivity}>Không thể tải hoạt động lúc này</p>
              : recentEntries.length > 0
                ? <div className={styles.overviewHistoryList}>{recentEntries.map((entry) => <p key={entry.id}><strong>{entry.title}</strong><span>{formatDate(entry.eventDate)}</span></p>)}</div>
                : <p className={styles.emptyActivity}>Chưa có hoạt động nào</p>}
        </section>

        {!readOnly && <section className={styles.quickActions}>
          <h2>Thao tác nhanh</h2>
          <Link href={`/pets/${encodeURIComponent(petId)}?tab=medical&form=vaccine`}>＋ Thêm mũi tiêm</Link>
          <Link href={addMedicalRecordHref}>＋ Thêm lần khám</Link>
          <Link href={addReminderHref}>＋ Tạo nhắc hẹn</Link>
          <Link href={`/pets/${encodeURIComponent(petId)}?tab=health&form=health-log`}>＋ Thêm ghi chú sức khỏe</Link>
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

