"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import styles from "@/styles/petDetail.module.css";

type PetOverviewProps = {
  petId: string;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function PetOverview({ petId }: PetOverviewProps) {
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pets/${encodeURIComponent(petId)}/medical-history`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { records?: MedicalHistoryEntry[] };
        if (!controller.signal.aborted) setEntries(Array.isArray(payload.records) ? payload.records : []);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [petId]);

  const vaccineEntries = useMemo(() => entries.filter((entry) => entry.type === "vaccine"), [entries]);
  const latestVaccine = vaccineEntries[0];
  const recentEntries = entries.slice(0, 3);

  function showComingSoon() {
    setNotice("Tính năng này sắp có.");
  }

  return (
    <>
      <section className={styles.summaryGrid} aria-label="Tổng quan chăm sóc">
        <SummaryCard title="Mũi tiêm gần nhất" value={latestVaccine ? `${latestVaccine.title}: ${formatDate(latestVaccine.eventDate)}` : "Chưa có dữ liệu"} />
        <SummaryCard title="Nhắc hẹn sắp tới" value="Chưa có lịch nhắc hẹn" />
        <SummaryCard title="Lần khám gần nhất" value="Chưa có dữ liệu" action="Thêm bản ghi đầu tiên" />
      </section>

      <section className={styles.overviewGrid} aria-label="Hoạt động và thao tác nhanh">
        <section className={styles.historyCard}>
          <div className={styles.cardHeading}><h2>Lịch sử gần đây</h2><span>Xem tất cả</span></div>
          {recentEntries.length > 0 ? <div className={styles.overviewHistoryList}>{recentEntries.map((entry) => <p key={entry.id}><strong>{entry.title}</strong><span>{formatDate(entry.eventDate)}</span></p>)}</div> : <p className={styles.emptyActivity}>Chưa có hoạt động nào</p>}
        </section>

        <section className={styles.quickActions}>
          <h2>Thao tác nhanh</h2>
          <Link href={`/pets/${encodeURIComponent(petId)}/vaccines/new`}>＋ Thêm mũi tiêm</Link>
          <button aria-describedby="quick-action-coming-soon" disabled onClick={showComingSoon} type="button">＋ Thêm lịch khám</button>
          <button aria-describedby="quick-action-coming-soon" disabled onClick={showComingSoon} type="button">＋ Tạo nhắc hẹn</button>
          <button aria-describedby="quick-action-coming-soon" disabled onClick={showComingSoon} type="button">＋ Thêm ghi chú sức khỏe</button>
          <span className={styles.comingSoonLabel} id="quick-action-coming-soon">Sắp có</span>
          {notice && <p className={styles.quickActionNotice} role="status">{notice}</p>}
        </section>
      </section>
    </>
  );
}

function SummaryCard({ title, value, action }: { title: string; value: string; action?: string }) {
  return <section className={styles.summaryCard}><h2>{title}</h2><p>{value}</p>{action && <span className={styles.summaryAction}>{action}</span>}</section>;
}
