"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
type ApiVaccineResponse = {
  vaccine_record?: {
    vaccine_record_id: string;
    vaccine_name: string;
    vaccine_date: string;
    dose_number: number | null;
    clinic_name: string | null;
    note: string | null;
  };
  suggested_next_due_date?: string | null;
  warning?: string | null;
  error?: string;
};

const filters: Array<{ id: MedicalHistoryFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "vaccines", label: "Tiêm phòng" },
  { id: "visits", label: "Khám bệnh" },
];

const CUSTOM_VACCINE = "__custom__";
const vaccineOptions: Record<PetSpecies, string[]> = {
  Cat: ["Vaccine dại", "Vaccine 3 bệnh (FVRCP)", "Vaccine 4 bệnh", "Vaccine FeLV"],
  Dog: ["Vaccine dại", "Vaccine 5 bệnh", "Vaccine 7 bệnh", "Vaccine Kennel cough (ho cũi chó)"],
};

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

function entryFromSavedVaccine(record: NonNullable<ApiVaccineResponse["vaccine_record"]>): MedicalHistoryEntry {
  return {
    id: record.vaccine_record_id,
    type: "vaccine",
    eventDate: record.vaccine_date,
    title: record.vaccine_name,
    description: [record.dose_number ? `Mũi số ${record.dose_number}` : null, record.note].filter(Boolean).join(" • "),
    clinicName: record.clinic_name,
    doseNumber: record.dose_number,
  };
}

export function PetMedicalHistory({ petId, species }: { petId: string; species: PetSpecies }) {
  const [filter, setFilter] = useState<MedicalHistoryFilter>("all");
  const [view, setView] = useState<MedicalView>({ kind: "history" });
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [vaccineSelection, setVaccineSelection] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [doseNumber, setDoseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const requestController = useRef<AbortController | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const controller = new AbortController();
    requestController.current = controller;
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

  useEffect(() => () => requestController.current?.abort(), []);

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

  function resetForm() {
    setVaccineSelection("");
    setCustomVaccineName("");
    setVaccineDate("");
    setDoseNumber("");
    setClinicName("");
    setNote("");
    setReminderDate("");
  }

  function openAddVaccine() {
    setIsAddMenuOpen(false);
    setError(null);
    resetForm();
    setView({ kind: "add-vaccine" });
  }

  function goToHistory(message?: string) {
    setView({ kind: "history" });
    if (message) setNotice(message);
  }

  async function saveVaccine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const submittedVaccineName = vaccineSelection === CUSTOM_VACCINE ? customVaccineName.trim() : vaccineSelection;
    if (!submittedVaccineName) {
      setError(vaccineSelection === CUSTOM_VACCINE ? "Vui lòng nhập tên vaccine khác." : "Vui lòng chọn vaccine.");
      return;
    }
    if (!vaccineDate || vaccineDate > today) {
      setError("Ngày tiêm không được ở tương lai.");
      return;
    }
    setIsSaving(true);
    const controller = new AbortController();
    requestController.current?.abort();
    requestController.current = controller;
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/vaccines`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vaccine_name: submittedVaccineName,
          vaccine_date: vaccineDate,
          dose_number: doseNumber,
          clinic_name: clinicName,
          note,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as ApiVaccineResponse;
      if (!response.ok || !payload.vaccine_record) throw new Error(payload.error || "Không thể lưu mũi tiêm.");
      const entry = entryFromSavedVaccine(payload.vaccine_record);
      setIsLoading(false);
      setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
      const suggestedDate = payload.suggested_next_due_date ?? null;
      setReminderDate(suggestedDate ?? "");
      setView(suggestedDate
        ? { kind: "suggestion", entry, date: suggestedDate, warning: payload.warning ?? null }
        : { kind: "saved-no-suggestion", entry, warning: payload.warning ?? null });
      resetForm();
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Không thể lưu mũi tiêm.");
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);
    }
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

          {notice && <p className={styles.medicalNotice} role="status">{notice}</p>}
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
          <form className={styles.vaccineFormPanel} onSubmit={saveVaccine}>
          <div className={styles.formPanelHeader}><h2>Thêm mũi tiêm</h2><p>Ghi nhận vaccine cho thú cưng của bạn.</p></div>
          <div className={styles.vaccineFormGrid}>
            <label><span className={styles.fieldLabel}>Tên vaccine <span aria-hidden="true">*</span></span><select required onChange={(event) => { setVaccineSelection(event.target.value); if (event.target.value !== CUSTOM_VACCINE) setCustomVaccineName(""); }} value={vaccineSelection}><option disabled value="">Chọn vaccine</option>{vaccineOptions[species].map((option) => <option key={option} value={option}>{option}</option>)}<option value={CUSTOM_VACCINE}>Khác – nhập tên vaccine</option></select></label>
            {vaccineSelection === CUSTOM_VACCINE && <label className={styles.fullWidthField}><span className={styles.fieldLabel}>Tên vaccine khác <span aria-hidden="true">*</span></span><input required maxLength={100} onChange={(event) => setCustomVaccineName(event.target.value)} placeholder="Nhập tên vaccine" value={customVaccineName} /></label>}
            <label><span className={styles.fieldLabel}>Ngày tiêm <span aria-hidden="true">*</span></span><input required max={today} onChange={(event) => setVaccineDate(event.target.value)} type="date" value={vaccineDate} /></label>
            <label><span className={styles.fieldLabel}>Số mũi</span><input min="1" onChange={(event) => setDoseNumber(event.target.value)} placeholder="VD: 1" type="number" value={doseNumber} /></label>
            <label><span className={styles.fieldLabel}>Phòng khám</span><input maxLength={200} onChange={(event) => setClinicName(event.target.value)} placeholder="VD: Pet Care" value={clinicName} /></label>
            <label className={styles.fullWidthField}><span className={styles.fieldLabel}>Ghi chú</span><textarea maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="VD: Sau khi tiêm nên theo dõi bé" value={note} /></label>
          </div>
          {error && <p className={styles.medicalError} role="alert">{error}</p>}
          <div className={styles.formPanelActions}><button onClick={() => goToHistory()} type="button">Hủy</button><button disabled={isSaving} type="submit">{isSaving ? "Đang lưu…" : "Lưu mũi tiêm"}</button></div>
          </form>
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
