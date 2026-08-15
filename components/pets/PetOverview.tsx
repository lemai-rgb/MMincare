"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { VaccineCreateForm, type VaccineSavedResult } from "@/components/pets/VaccineCreateForm";
import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/petDetail.module.css";

type PetOverviewProps = {
  petId: string;
  species: PetSpecies;
  isVaccineModalOpen: boolean;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function PetOverview({ petId, species, isVaccineModalOpen }: PetOverviewProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!isVaccineModalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.replace(`/pets/${encodeURIComponent(petId)}?tab=overview`);
    };
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [isVaccineModalOpen, petId, router]);

  const vaccineEntries = useMemo(() => entries.filter((entry) => entry.type === "vaccine"), [entries]);
  const latestVaccine = vaccineEntries[0];
  const recentEntries = entries.slice(0, 3);

  function openModal() {
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=overview&action=add-vaccine`);
  }

  function closeModal() {
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=overview`);
  }

  function handleSaved(result: VaccineSavedResult) {
    setEntries((current) => [result.entry, ...current.filter((entry) => entry.id !== result.entry.id)]);
    setNotice("Đã lưu mũi tiêm.");
    closeModal();
    router.refresh();
  }

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
          <button onClick={openModal} type="button">＋ Thêm mũi tiêm</button>
          <button onClick={showComingSoon} type="button">＋ Thêm lịch khám</button>
          <button onClick={showComingSoon} type="button">＋ Tạo nhắc hẹn</button>
          <button onClick={showComingSoon} type="button">＋ Thêm ghi chú sức khỏe</button>
          {notice && <p className={styles.quickActionNotice} role="status">{notice}</p>}
        </section>
      </section>

      {isVaccineModalOpen && (
        <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section aria-labelledby="quick-vaccine-title" aria-modal="true" className={styles.vaccineDialog} role="dialog">
            <div className={styles.dialogHeader}><h2 id="quick-vaccine-title">Thêm mũi tiêm</h2><button aria-label="Đóng" className={styles.dialogClose} onClick={closeModal} ref={closeButtonRef} type="button">×</button></div>
            <VaccineCreateForm onCancel={closeModal} onSaved={handleSaved} petId={petId} species={species} />
          </section>
        </div>
      )}
    </>
  );
}

function SummaryCard({ title, value, action }: { title: string; value: string; action?: string }) {
  return <section className={styles.summaryCard}><h2>{title}</h2><p>{value}</p>{action && <span className={styles.summaryAction}>{action}</span>}</section>;
}
