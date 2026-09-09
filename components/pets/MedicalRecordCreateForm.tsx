"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import styles from "@/styles/petDetail.module.css";

const MAX_LENGTHS = {
  symptoms: 2000,
  diagnosis: 2000,
  clinic_name: 200,
  medication: 2000,
  note: 500,
} as const;

type SavedMedicalRecord = {
  record_id: string;
  visit_date: string;
  symptoms: string | null;
  diagnosis: string | null;
  clinic_name: string | null;
  medication: string | null;
  note: string | null;
};

type ApiResponse = { medical_record?: SavedMedicalRecord; error?: string };
type AttachmentApiResponse = { attachment?: { attachment_id: string }; error?: string };

type MedicalRecordCreateFormProps = {
  petId: string;
  onCancel: () => void;
  onRecordSaved: (entry: MedicalHistoryEntry) => void;
  onReadyForReminder: (entry: MedicalHistoryEntry) => void;
};

const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function toEntry(record: SavedMedicalRecord): MedicalHistoryEntry {
  return {
    id: record.record_id,
    type: "medical",
    eventDate: record.visit_date,
    title: record.diagnosis || "Lần khám bệnh",
    description: [record.symptoms, record.medication, record.note].filter(Boolean).join(" • "),
    clinicName: record.clinic_name,
    doseNumber: null,
    addedByCurrentUser: true,
  };
}

export function MedicalRecordCreateForm({ petId, onCancel, onRecordSaved, onReadyForReminder }: MedicalRecordCreateFormProps) {
  const [visitDate, setVisitDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [medication, setMedication] = useState("");
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [savedEntry, setSavedEntry] = useState<MedicalHistoryEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionGuard = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("medical-record-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      requestController.current?.abort();
    };
  }, []);

  function updateField(setter: (value: string) => void, value: string) {
    setter(value);
    if (error) setError(null);
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setSelectedFile(null);
      setFileError("Chỉ hỗ trợ file JPG, JPEG, PNG hoặc PDF.");
      event.target.value = "";
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setFileError(file.size <= 0 ? "File khám bệnh không được để trống." : "File khám bệnh không được vượt quá 5MB.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadAttachment(recordId: string, file: File, signal: AbortSignal) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/medical-records/${encodeURIComponent(recordId)}/attachments`, {
      method: "POST",
      body: formData,
      signal,
    });
    const payload = (await response.json()) as AttachmentApiResponse;
    if (!response.ok || !payload.attachment) {
      throw new Error(payload.error || "Không thể tải file khám bệnh.");
    }
  }

  async function retryAttachment() {
    if (!savedRecordId || !savedEntry || !selectedFile || submissionGuard.current) return;
    submissionGuard.current = true;
    setError(null);
    setIsSaving(true);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      await uploadAttachment(savedRecordId, selectedFile, controller.signal);
      onReadyForReminder(savedEntry);
    } catch {
      if (!controller.signal.aborted) setError("Đã lưu lần khám nhưng tải file thất bại");
    } finally {
      submissionGuard.current = false;
      if (!controller.signal.aborted) setIsSaving(false);
    }
  }

  function continueWithoutAttachment() {
    if (!savedEntry || submissionGuard.current || isSaving) return;
    setError(null);
    onReadyForReminder(savedEntry);
  }

  async function saveMedicalRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionGuard.current) return;
    setError(null);

    if (fileError) return;

    if (!visitDate) {
      setError("Vui lòng chọn ngày khám.");
      return;
    }
    if (visitDate > today) {
      setError("Ngày khám không được ở tương lai.");
      return;
    }

    submissionGuard.current = true;
    setIsSaving(true);
    const controller = new AbortController();
    requestController.current = controller;

    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/medical-records`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visit_date: visitDate, symptoms, diagnosis, clinic_name: clinicName, medication, note }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.medical_record) {
        throw new Error(payload.error || "Không thể lưu lần khám.");
      }
      const entry = toEntry(payload.medical_record);
      setSavedRecordId(payload.medical_record.record_id);
      setSavedEntry(entry);
      onRecordSaved(entry);
      if (!selectedFile) {
        onReadyForReminder(entry);
        return;
      }
      try {
        await uploadAttachment(payload.medical_record.record_id, selectedFile, controller.signal);
        onReadyForReminder(entry);
      } catch {
        if (!controller.signal.aborted) setError("Đã lưu lần khám nhưng tải file thất bại");
      }
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) {
        setError(requestError instanceof TypeError
          ? "Không thể kết nối máy chủ. Vui lòng thử lại."
          : requestError instanceof Error ? requestError.message : "Không thể lưu lần khám.");
      }
    } finally {
      submissionGuard.current = false;
      if (!controller.signal.aborted) setIsSaving(false);
    }
  }

  return (
    <form className={`${styles.vaccineFormPanel} ${styles.medicalRecordFormPanel}`} id="medical-record-form" onSubmit={saveMedicalRecord}>
      <div className={styles.formPanelHeader}>
        <h2>THÊM LẦN KHÁM</h2>
      </div>
      <div className={`${styles.vaccineFormGrid} ${styles.medicalRecordFormGrid}`}>
        <label>
          <span className={styles.fieldLabel}>Triệu chứng</span>
          <textarea maxLength={MAX_LENGTHS.symptoms} onChange={(event) => updateField(setSymptoms, event.target.value)} placeholder="Mô tả triệu chứng" value={symptoms} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Chẩn đoán</span>
          <textarea maxLength={MAX_LENGTHS.diagnosis} onChange={(event) => updateField(setDiagnosis, event.target.value)} placeholder="Viêm đường hô hấp" value={diagnosis} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Phòng khám</span>
          <input maxLength={MAX_LENGTHS.clinic_name} onChange={(event) => updateField(setClinicName, event.target.value)} placeholder="Tên phòng khám" value={clinicName} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Thuốc kê</span>
          <input maxLength={MAX_LENGTHS.medication} onChange={(event) => updateField(setMedication, event.target.value)} placeholder="Thuốc hoặc điều trị" value={medication} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Ngày khám <span aria-hidden="true">*</span></span>
          <input max={today} onChange={(event) => updateField(setVisitDate, event.target.value)} required type="date" value={visitDate} />
        </label>
        <div className={styles.medicalFileField}>
          <span className={styles.fieldLabel}>File khám bệnh</span>
          {selectedFile ? (
            <div className={styles.medicalSelectedFile}>
              <label htmlFor={fileInputId} title={selectedFile.name}>
                <span aria-hidden="true">▧</span>
                <span>{selectedFile.name}</span>
              </label>
              <button aria-label="Bỏ file" disabled={isSaving || savedRecordId !== null} onClick={removeFile} type="button">×</button>
            </div>
          ) : (
            <label className={styles.medicalFilePicker} htmlFor={fileInputId}>
              <span aria-hidden="true">+</span>
              <span>Tải ảnh hoặc PDF</span>
            </label>
          )}
          <input
            accept="image/jpeg,image/png,application/pdf"
            className={styles.medicalFileInput}
            disabled={isSaving || savedRecordId !== null}
            id={fileInputId}
            onChange={selectFile}
            ref={fileInputRef}
            type="file"
          />
          <p className={fileError ? styles.medicalFieldError : styles.medicalFileHelp} role={fileError ? "alert" : undefined}>
            {fileError || "JPG, JPEG, PNG hoặc PDF · Tối đa 5MB"}
          </p>
        </div>
        <label className={styles.fullWidthField}>
          <span className={styles.fieldLabel}>Ghi chú</span>
          <textarea maxLength={MAX_LENGTHS.note} onChange={(event) => updateField(setNote, event.target.value)} placeholder="Ghi chú thêm về lần khám" value={note} />
        </label>
      </div>
      {error && <p className={styles.medicalError} role="alert">{error}</p>}
      <div className={styles.formPanelActions}>
        <button disabled={isSaving} onClick={onCancel} type="button">Hủy</button>
        {savedRecordId && selectedFile
          ? <>
              <button disabled={isSaving} onClick={continueWithoutAttachment} type="button">Bỏ qua và tạo nhắc hẹn</button>
              <button disabled={isSaving} onClick={retryAttachment} type="button">{isSaving ? "Đang tải…" : "Thử tải file lại"}</button>
            </>
          : <button disabled={isSaving || Boolean(fileError)} type="submit">{isSaving ? "Đang lưu…" : "Lưu lần khám"}</button>}
      </div>
    </form>
  );
}
