"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/petDetail.module.css";

const CUSTOM_VACCINE = "__custom__";
const vaccineOptions: Record<PetSpecies, string[]> = {
  Cat: ["Vaccine dại", "Vaccine 3 bệnh (FVRCP)", "Vaccine 4 bệnh", "Vaccine FeLV"],
  Dog: ["Vaccine dại", "Vaccine 5 bệnh", "Vaccine 7 bệnh", "Vaccine Kennel cough (ho cũi chó)"],
};

type SavedVaccine = {
  vaccine_record_id: string;
  vaccine_name: string;
  vaccine_date: string;
  dose_number: number | null;
  clinic_name: string | null;
  note: string | null;
};

type ApiResponse = {
  vaccine_record?: SavedVaccine;
  suggested_next_due_date?: string | null;
  suggestion_status?: "not_checked" | "no_match" | "matched" | "unavailable";
  warning?: string | null;
  error?: string;
};

export type VaccineSavedResult = {
  entry: MedicalHistoryEntry;
  suggestedNextDueDate: string | null;
  warning: string | null;
};

type VaccineCreateFormProps = {
  petId: string;
  species: PetSpecies;
  onCancel: () => void;
  onSaved: (result: VaccineSavedResult) => void;
};

function toEntry(record: SavedVaccine): MedicalHistoryEntry {
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

export function VaccineCreateForm({ petId, species, onCancel, onSaved }: VaccineCreateFormProps) {
  const [vaccineSelection, setVaccineSelection] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [doseNumber, setDoseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => () => requestController.current?.abort(), []);

  async function saveVaccine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedVaccineName = vaccineSelection === CUSTOM_VACCINE ? customVaccineName.trim() : vaccineSelection;
    setError(null);
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
        body: JSON.stringify({ vaccine_name: submittedVaccineName, vaccine_date: vaccineDate, dose_number: doseNumber, clinic_name: clinicName, note }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.vaccine_record) throw new Error(payload.error || "Không thể lưu mũi tiêm.");
      onSaved({
        entry: toEntry(payload.vaccine_record),
        suggestedNextDueDate: payload.suggested_next_due_date ?? null,
        warning: payload.warning ?? (payload.suggestion_status === "unavailable"
          ? "ChÆ°a thá»ƒ táº£i quy táº¯c gá»£i Ã½. Báº¡n cÃ³ thá»ƒ tá»± nháº­p ngÃ y nháº¯c."
          : null),
      });
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) {
        setError(requestError instanceof TypeError ? "Không thể kết nối máy chủ. Vui lòng thử lại." : requestError instanceof Error ? requestError.message : "Không thể lưu mũi tiêm.");
      }
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);
    }
  }

  return (
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
      <div className={styles.formPanelActions}><button disabled={isSaving} onClick={onCancel} type="button">Hủy</button><button disabled={isSaving} type="submit">{isSaving ? "Đang lưu…" : "Lưu mũi tiêm"}</button></div>
    </form>
  );
}
