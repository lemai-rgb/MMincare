"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { VaccineCreateForm, type VaccineSavedResult } from "@/components/pets/VaccineCreateForm";
import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/petDetail.module.css";

type MedicalHistoryFilter = "all" | "vaccines" | "visits";
type MedicalView =
  | { kind: "history" }
  | { kind: "add-vaccine" }
  | { kind: "suggestion"; entry: MedicalHistoryEntry; date: string; warning: string | null }
  | { kind: "saved-no-suggestion"; entry: MedicalHistoryEntry; warning: string | null };

type ApiHistoryResponse = { records?: MedicalHistoryEntry[]; error?: string };
const filters: Array<{ id: MedicalHistoryFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "vaccines", label: "Tiêm phòng" },
  { id: "visits", label: "Khám bệnh" },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function groupLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Lịch sử";
  return new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);
}

export function PetMedicalHistory({ form, petId, species }: { form?: string; petId: string; species: PetSpecies }) {
  const router = useRouter();
  const [filter, setFilter] = useState<MedicalHistoryFilter>("all");
  const [view, setView] = useState<MedicalView>(form === "vaccine" ? { kind: "add-vaccine" } : { kind: "history" });
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState("");
  const requestController = useRef<AbortController | null>(null);

  const formNotice = form === "medical-record" ? "Thêm lần khám: Sắp có." : null;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pets/${encodeURIComponent(petId)}/medical-history`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as ApiHistoryResponse;
        if (!response.ok) throw new Error(payload.error || "Không thể tải hồ sơ y tế.");
        if (!controller.signal.aborted) setEntries(Array.isArray(payload.records) ? payload.records : []);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Không thể tải hồ sơ y tế.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [petId]);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => filter === "all" || (filter === "vaccines" ? entry.type === "vaccine" : entry.type === "medical")),
    [entries, filter],
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, MedicalHistoryEntry[]>();
    visibleEntries.forEach((entry) => {
      const key = entry.eventDate.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return [...groups.entries()];
  }, [visibleEntries]);

  function openAddVaccine() {
    setIsAddMenuOpen(false);
    setError(null);
    setView({ kind: "add-vaccine" });
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical&form=vaccine`);
  }

  function goToHistory(message?: string) {
    setView({ kind: "history" });
    if (message) setNotice(message);
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical`);
  }

  function handleVaccineSaved(result: VaccineSavedResult) {
    setIsLoading(false);
    setError(null);
    setEntries((current) => [result.entry, ...current.filter((item) => item.id !== result.entry.id)]);
    setReminderDate(result.suggestedNextDueDate ?? "");
    setView({ kind: "history" });
    setNotice("Đã lưu mũi tiêm.");
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical`);
    router.refresh();
  }

  async function createReminder() {
    if (view.kind !== "suggestion" && view.kind !== "saved-no-suggestion") return;
    if (!reminderDate) {
      setError("Hãy chọn ngày nhắc hẹn trước khi tiếp tục.");
      return;
    }
    setError(null);
    setIsSaving(true);
    const controller = new AbortController();
    requestController.current?.abort();
    requestController.current = controller;
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/reminders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "Vaccine", due_date: reminderDate, source_vaccine_record_id: view.entry.id }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể tạo nhắc hẹn.");
      goToHistory("Đã tạo nhắc hẹn.");
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Không thể tạo nhắc hẹn.");
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);
    }
  }

  return (
    <section className={styles.medicalHistory} aria-labelledby="medical-history-title">
      {view.kind === "history" && (
        <>
          <div className={styles.medicalToolbar}>
            <div className={styles.filterChips} role="group" aria-label="Lọc hồ sơ y tế">
              {filters.map((item) => (
                <button className={filter === item.id ? styles.activeFilterChip : styles.filterChip} key={item.id} onClick={() => setFilter(item.id)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
            <div className={styles.addRecordMenu}>
              <button aria-expanded={isAddMenuOpen} aria-haspopup="menu" className={styles.addRecordButton} onClick={() => setIsAddMenuOpen((open) => !open)} type="button">
                <span aria-hidden="true">+</span>Thêm bản ghi
              </button>
              {isAddMenuOpen && (
                <div className={styles.addRecordPopover} role="menu">
                  <button onClick={openAddVaccine} role="menuitem" type="button">Thêm mũi tiêm</button>
                  <button aria-disabled="true" disabled role="menuitem" type="button">Thêm lần khám</button>
                </div>
              )}
            </div>
          </div>

          {(notice || formNotice) && <p className={styles.medicalNotice} role="status">{notice || formNotice}</p>}
          {error && <p className={styles.medicalError} role="alert">{error}</p>}
          {isLoading && <p className={styles.medicalLoading}>Đang tải hồ sơ y tế…</p>}
          {!isLoading && !error && groupedEntries.length === 0 && (
            <section className={styles.medicalEmptyState}>
              <span className={styles.medicalEmptyMark} aria-hidden="true" />
              <h2 id="medical-history-title">Chưa có hồ sơ y tế</h2>
              <p>Thông tin tiêm phòng và các lần khám của bé sẽ xuất hiện tại đây.</p>
            </section>
          )}
          {!isLoading && !error && groupedEntries.length > 0 && (
            <div className={styles.medicalTimeline} aria-labelledby="medical-history-title">
              {groupedEntries.map(([month, monthEntries]) => (
                <section className={styles.medicalMonth} key={month}>
                  <h2 id={month === groupedEntries[0][0] ? "medical-history-title" : undefined}>{groupLabel(monthEntries[0].eventDate)}</h2>
                  <div className={styles.medicalEntryList}>
                    {monthEntries.map((entry) => <MedicalEntryCard entry={entry} key={entry.id} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {view.kind === "add-vaccine" && (
        <div className={styles.medicalWorkspace}>
          <MedicalRecordPreview entries={entries} />
          <VaccineCreateForm onCancel={() => goToHistory()} onSaved={handleVaccineSaved} petId={petId} species={species} />
        </div>
      )}

      {(view.kind === "suggestion" || view.kind === "saved-no-suggestion") && (
        <div className={styles.medicalWorkspace}>
          <MedicalRecordPreview entries={entries} />
          <section className={styles.reminderSuggestion} aria-live="polite">
          <h2>Đã lưu mũi tiêm</h2>
          <p>Hệ thống chỉ gợi ý ngày khi có đủ thông tin và quy tắc phù hợp. Bạn có thể chỉnh sửa ngày trước khi tạo nhắc hẹn.</p>
          {view.kind === "saved-no-suggestion" && <p className={styles.suggestionMuted}>Chưa thể gợi ý lịch tiêm tiếp theo. Bạn có thể tự nhập ngày nhắc.</p>}
          <label>Ngày nhắc hẹn<input onChange={(event) => setReminderDate(event.target.value)} type="date" value={reminderDate} /></label>
          {view.warning && <p className={styles.suggestionWarning}>{view.warning}</p>}
          {error && <p className={styles.medicalError} role="alert">{error}</p>}
          <div className={styles.suggestionActions}><button disabled={isSaving} onClick={() => goToHistory("Đã lưu mũi tiêm.")} type="button">Để sau</button><button disabled={isSaving || !reminderDate} onClick={createReminder} type="button">{isSaving ? "Đang lưu…" : "Tạo nhắc hẹn"}</button></div>
          </section>
        </div>
      )}
    </section>
  );
}

function MedicalRecordPreview({ entries }: { entries: MedicalHistoryEntry[] }) {
  const recentEntries = entries.slice(0, 3);
  return (
    <section className={styles.medicalRecordPreview} aria-label="Lịch sử gần đây">
      <h2>Lịch sử gần đây</h2>
      {recentEntries.length > 0 ? recentEntries.map((entry) => <MedicalEntryCard entry={entry} key={entry.id} />) : <p>Chưa có hồ sơ y tế</p>}
    </section>
  );
}

function MedicalEntryCard({ entry }: { entry: MedicalHistoryEntry }) {
  return (
    <article className={styles.medicalEntryCard}>
      <span className={entry.type === "vaccine" ? styles.vaccineIcon : styles.medicalIcon} aria-hidden="true" />
      <div><h3>{entry.title}</h3><p>{formatDate(entry.eventDate)}{entry.clinicName ? ` • ${entry.clinicName}` : ""}</p>{entry.description && <span>{entry.description}</span>}</div>
    </article>
  );
}
