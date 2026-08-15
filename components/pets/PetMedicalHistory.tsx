"use client";

import { useMemo, useState } from "react";

import styles from "@/styles/petDetail.module.css";

type MedicalHistoryFilter = "all" | "vaccines" | "visits";

type MedicalHistoryEntry = {
  id: string;
  type: Exclude<MedicalHistoryFilter, "all">;
  eventDate: string;
  title: string;
  description?: string;
};

const filters: Array<{ id: MedicalHistoryFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "vaccines", label: "Tiêm phòng" },
  { id: "visits", label: "Khám bệnh" },
];

// Record queries are intentionally not added until the current app has verified table types/helpers.
const entries: MedicalHistoryEntry[] = [];

export function PetMedicalHistory() {
  const [filter, setFilter] = useState<MedicalHistoryFilter>("all");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => filter === "all" || entry.type === filter),
    [filter],
  );

  return (
    <section className={styles.medicalHistory} aria-labelledby="medical-history-title">
      <div className={styles.medicalToolbar}>
        <div className={styles.filterChips} role="group" aria-label="Lọc hồ sơ y tế">
          {filters.map((item) => (
            <button
              className={filter === item.id ? styles.activeFilterChip : styles.filterChip}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.addRecordMenu}>
          <button
            aria-expanded={isAddMenuOpen}
            aria-haspopup="menu"
            className={styles.addRecordButton}
            onClick={() => setIsAddMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span aria-hidden="true">+</span>
            Thêm bản ghi
          </button>

          {isAddMenuOpen && (
            <div className={styles.addRecordPopover} role="menu">
              <button aria-disabled="true" disabled role="menuitem" type="button">Thêm mũi tiêm</button>
              <button aria-disabled="true" disabled role="menuitem" type="button">Thêm lần khám</button>
            </div>
          )}
        </div>
      </div>

      {visibleEntries.length === 0 && (
        <section className={styles.medicalEmptyState}>
          <span className={styles.medicalEmptyMark} aria-hidden="true" />
          <h2 id="medical-history-title">Chưa có hồ sơ y tế</h2>
          <p>Thông tin tiêm phòng và các lần khám của bé sẽ xuất hiện tại đây.</p>
        </section>
      )}
    </section>
  );
}
