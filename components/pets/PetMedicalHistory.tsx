"use client";
import { useRuntimeRouter, useRuntimeRequest, useRuntimeJson, useAppRuntime } from "@/lib/appRuntime";

import Image from "next/image";
import { AppLink as Link } from "@/lib/appRuntime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MedicalRecordCreateForm } from "@/components/pets/MedicalRecordCreateForm";
import { VaccineCreateForm, type VaccineSavedResult } from "@/components/pets/VaccineCreateForm";
import type { MedicalHistoryAttachment, MedicalHistoryEntry } from "@/lib/medicalHistory";
import { parseMedicalHistoryRecords } from "@/lib/medicalHistoryValidation";
import type { PetSpecies } from "@/lib/pets";
import { invalidateNotificationCenter } from "@/lib/notifications/events";
import styles from "@/styles/petDetail.module.css";

type MedicalHistoryFilter = "all" | "vaccines" | "visits";
type MedicalView =
  | { kind: "history" }
  | { kind: "add-vaccine" }
  | { kind: "add-medical-record" }
  | { kind: "suggestion"; entry: MedicalHistoryEntry; date: string; warning: string | null }
  | { kind: "saved-no-suggestion"; entry: MedicalHistoryEntry; warning: string | null }
  | { kind: "medical-reminder"; entry: MedicalHistoryEntry };

type SignedUrlResponse = { signed_url?: string; error?: string };
type DeleteTarget = { entry: MedicalHistoryEntry; trigger: HTMLButtonElement | null };
type DeleteResponse = {
  attachment_cleanup?: "complete" | "pending";
  error?: string;
  warnings?: string[];
};
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

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function PetMedicalHistory({ form, isOwner = false, petId, species }: { form?: string; isOwner?: boolean; petId: string; species: PetSpecies }) {
  const requestJson = useRuntimeJson();
  const request = useRuntimeRequest();
  const router = useRuntimeRouter();
  const [filter, setFilter] = useState<MedicalHistoryFilter>(form === "medical-record" ? "visits" : "all");
  const [view, setView] = useState<MedicalView>(
    form === "vaccine"
      ? { kind: "add-vaccine" }
      : form === "medical-record" ? { kind: "add-medical-record" } : { kind: "history" },
  );
  const [entries, setEntries] = useState<MedicalHistoryEntry[]>([]);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState(`${petId}:${form ?? ""}`);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createdReminderId, setCreatedReminderId] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const historyRequestController = useRef<AbortController | null>(null);
  const reminderMutationController = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const reminderSubmissionGuard = useRef(false);
  const deleteSubmissionGuard = useRef(false);
  const deleteDialogRef = useRef<HTMLDivElement | null>(null);
  const deleteCancelRef = useRef<HTMLButtonElement | null>(null);

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) return;
    const trigger = deleteTarget?.trigger;
    setDeleteTarget(null);
    setDeleteError(null);
    trigger?.focus();
  }, [deleteTarget, isDeleting]);

  const loadHistory = useCallback(() => {
    const activeRequestId = ++requestId.current;
    historyRequestController.current?.abort();
    const controller = new AbortController();
    historyRequestController.current = controller;
    const historyKey = `${petId}:${form ?? ""}`;
    const endpoint = form === "medical-record" ? "medical-records" : "medical-history";
    setEntries([]);
    setLoadedHistoryKey("");
    setError(null);
    setIsLoading(true);

    const isCurrent = () => historyRequestController.current === controller
      && activeRequestId === requestId.current
      && !controller.signal.aborted;

    void requestJson(`/api/pets/${encodeURIComponent(petId)}/${endpoint}`, { signal: controller.signal })
      .then(({ response, payload }) => {
        if (!response.ok) throw new Error("Medical history request failed");
        const records = parseMedicalHistoryRecords(payload);
        if (!records) throw new Error("Medical history response invalid");
        if (!isCurrent()) return;
        setEntries(records);
        setLoadedHistoryKey(historyKey);
      })
      .catch(() => {
        if (!isCurrent()) return;
        setLoadedHistoryKey(historyKey);
        setError("Không thể tải hồ sơ y tế lúc này. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!isCurrent()) return;
        setIsLoading(false);
        historyRequestController.current = null;
      });

    return controller;
  }, [form, petId, requestJson]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) loadHistory();
    });
    return () => {
      active = false;
      requestId.current += 1;
      historyRequestController.current?.abort();
      historyRequestController.current = null;
    };
  }, [loadHistory]);

  function retryHistory() {
    loadHistory();
  }

  useEffect(() => () => {
    reminderMutationController.current?.abort();
    reminderMutationController.current = null;
  }, []);

  useEffect(() => {
    if (!deleteTarget) return;
    deleteCancelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        closeDeleteDialog();
        return;
      }
      if (event.key === "Tab") {
        const focusable = deleteDialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])",
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeDeleteDialog, deleteTarget, isDeleting]);

  const visibleEntries = useMemo(
    () => (loadedHistoryKey === `${petId}:${form ?? ""}` ? entries : [])
      .filter((entry) => filter === "all" || (filter === "vaccines" ? entry.type === "vaccine" : entry.type === "medical")),
    [entries, filter, form, loadedHistoryKey, petId],
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, MedicalHistoryEntry[]>();
    visibleEntries.forEach((entry) => {
      const key = entry.eventDate.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return [...groups.entries()];
  }, [visibleEntries]);

  const medicalVisitNumbers = useMemo(() => new Map(
    entries
      .filter((entry) => entry.type === "medical")
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.id.localeCompare(b.id))
      .map((entry, index) => [entry.id, index + 1]),
  ), [entries]);
  const currentHistoryKey = `${petId}:${form ?? ""}`;
  const historyReady = loadedHistoryKey === currentHistoryKey;
  const historyLoading = isLoading || !historyReady;
  const historyError = historyReady ? error : null;

  function openAddVaccine() {
    setIsAddMenuOpen(false);
    setError(null);
    setView({ kind: "add-vaccine" });
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical&form=vaccine`);
  }

  function openAddMedicalRecord() {
    setIsAddMenuOpen(false);
    setError(null);
    setFilter("visits");
    setView({ kind: "add-medical-record" });
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical&form=medical-record`);
  }

  function goToHistory(message?: string, reminderId?: string) {
    setView({ kind: "history" });
    setError(null);
    setReminderDate("");
    setReminderNote("");
    setCreatedReminderId(reminderId ?? null);
    if (message) setNotice(message);
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical`);
  }

  function handleVaccineSaved(result: VaccineSavedResult) {
    setIsLoading(false);
    setError(null);
    setEntries((current) => [result.entry, ...current.filter((item) => item.id !== result.entry.id)]);
    setReminderDate(result.suggestedNextDueDate ?? "");
    setReminderNote("");
    setView(result.suggestedNextDueDate !== null
      ? {
          kind: "suggestion",
          entry: result.entry,
          date: result.suggestedNextDueDate,
          warning: result.warning,
        }
      : {
          kind: "saved-no-suggestion",
          entry: result.entry,
          warning: result.warning,
        });
    setNotice(null);
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical`);
    router.refresh();
  }

  function handleMedicalRecordSaved(entry: MedicalHistoryEntry) {
    setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate)));
    router.refresh();
  }

  function handleMedicalRecordReady(entry: MedicalHistoryEntry) {
    setError(null);
    setNotice(null);
    setReminderDate("");
    setReminderNote("");
    setView({ kind: "medical-reminder", entry });
    router.replace(`/pets/${encodeURIComponent(petId)}?tab=medical`);
    router.refresh();
  }

  function openDeleteDialog(entry: MedicalHistoryEntry, trigger: HTMLButtonElement | null) {
    if (!isOwner || deleteSubmissionGuard.current) return;
    setDeleteError(null);
    setDeleteTarget({ entry, trigger });
  }

  async function deleteEntry() {
    if (!deleteTarget || deleteSubmissionGuard.current) return;
    deleteSubmissionGuard.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    const { entry } = deleteTarget;
    const resource = entry.type === "vaccine" ? "vaccines" : "medical-records";
    const response = await request(
      `/api/pets/${encodeURIComponent(petId)}/${resource}/${encodeURIComponent(entry.id)}`,
      { method: "DELETE" },
    ).catch(() => null);

    try {
      const payload = response ? await response.json() as DeleteResponse : null;
      if (!response || !response.ok) {
        const message = response?.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : response?.status === 403 || response?.status === 404
            ? "Không tìm thấy bản ghi hoặc bạn không có quyền xóa."
            : response?.status === 409
              ? "Bản ghi còn dữ liệu liên quan chưa thể xóa."
              : payload?.error || "Không thể xóa bản ghi lúc này. Vui lòng thử lại.";
        throw new Error(message);
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setDeleteTarget(null);
      setNotice(payload?.attachment_cleanup === "pending"
        ? "Hồ sơ đã được xóa. Một số tệp đang chờ hệ thống dọn dẹp."
        : entry.type === "vaccine" ? "Đã xóa bản ghi tiêm phòng." : "Đã xóa hồ sơ khám bệnh.");
      router.refresh();
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "Không thể xóa bản ghi lúc này. Vui lòng thử lại.");
    } finally {
      deleteSubmissionGuard.current = false;
      setIsDeleting(false);
    }
  }

  async function createReminder() {
    const isVaccineSource = view.kind === "suggestion" || view.kind === "saved-no-suggestion";
    const isMedicalSource = view.kind === "medical-reminder";
    if (!isVaccineSource && !isMedicalSource) return;
    if (reminderSubmissionGuard.current) return;
    if (!validDate(reminderDate)) {
      setError("Hãy chọn ngày nhắc hẹn trước khi tiếp tục.");
      return;
    }
    reminderSubmissionGuard.current = true;
    setError(null);
    setIsSaving(true);
    const controller = new AbortController();
    reminderMutationController.current?.abort();
    reminderMutationController.current = controller;
    try {
      const requestBody = isMedicalSource
        ? {
            type: "Recheck",
            due_date: reminderDate,
            note: reminderNote,
            source_medical_record_id: view.entry.id,
          }
        : {
            type: "Vaccine",
            due_date: reminderDate,
            source_vaccine_record_id: view.entry.id,
          };
      const response = await request(`/api/pets/${encodeURIComponent(petId)}/reminders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      const payload = (await response.json()) as { reminder?: { reminder_id: string }; error?: string };
      if (!response.ok || !payload.reminder?.reminder_id) throw new Error(payload.error || "Không thể tạo nhắc hẹn.");
      invalidateNotificationCenter();
      goToHistory(isMedicalSource ? "Đã tạo nhắc tái khám." : "Đã tạo nhắc hẹn thành công", payload.reminder.reminder_id);
    } catch {
      if (!controller.signal.aborted) {
        setError(isMedicalSource
          ? "Lần khám đã được lưu nhưng chưa thể tạo nhắc hẹn."
          : "Mũi tiêm đã được lưu nhưng chưa thể tạo nhắc hẹn.");
      }
    } finally {
      reminderSubmissionGuard.current = false;
      if (reminderMutationController.current === controller) {
        reminderMutationController.current = null;
        if (!controller.signal.aborted) setIsSaving(false);
      }
    }
  }

  function deferReminder() {
    if (reminderSubmissionGuard.current) return;
    goToHistory(view.kind === "medical-reminder" ? "Đã lưu lần khám." : "Đã lưu mũi tiêm.");
  }

  return (
    <section className={`${styles.medicalHistory} ${view.kind === "add-medical-record" || view.kind === "medical-reminder" ? styles.medicalRecordMode : ""}`} aria-labelledby="medical-history-title">
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
                  <button onClick={openAddMedicalRecord} role="menuitem" type="button">Thêm lần khám</button>
                </div>
              )}
            </div>
          </div>

          {notice && (
            <p className={styles.medicalNotice} role="status">
              {notice}
              {createdReminderId && <Link className={styles.medicalNoticeLink} href={`/reminders?highlight=${encodeURIComponent(createdReminderId)}`}>Xem nhắc hẹn</Link>}
            </p>
          )}
          {historyError && (
            <div className={styles.medicalError} role="alert">
              <p>{historyError}</p>
              <button className={styles.medicalRetryButton} disabled={historyLoading} onClick={retryHistory} type="button">Thử lại</button>
            </div>
          )}
          {historyLoading && <p className={styles.medicalLoading}>Đang tải hồ sơ y tế…</p>}
          {!historyLoading && !historyError && groupedEntries.length === 0 && (
            <section className={styles.medicalEmptyState}>
              <span className={styles.medicalEmptyMark} aria-hidden="true" />
              <h2 id="medical-history-title">Chưa có hồ sơ y tế</h2>
              <p>Thông tin tiêm phòng và các lần khám của bé sẽ xuất hiện tại đây.</p>
            </section>
          )}
          {!historyLoading && !historyError && groupedEntries.length > 0 && (
            <div className={styles.medicalTimeline} aria-labelledby="medical-history-title">
              {groupedEntries.map(([month, monthEntries]) => (
                <section className={styles.medicalMonth} key={month}>
                  <h2 id={month === groupedEntries[0][0] ? "medical-history-title" : undefined}>{groupLabel(monthEntries[0].eventDate)}</h2>
                  <div className={styles.medicalEntryList}>
                    {monthEntries.map((entry) => (
                      <MedicalEntryCard
                        canDelete={isOwner}
                        entry={entry}
                        key={entry.id}
                        onDelete={openDeleteDialog}
                        visitNumber={medicalVisitNumbers.get(entry.id)}
                      />
                    ))}
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

      {view.kind === "add-medical-record" && (
        <div className={`${styles.medicalWorkspace} ${styles.medicalRecordWorkspace}`}>
          <MedicalRecordPreview entries={entries} medicalOnly />
          <MedicalRecordCreateForm
            onCancel={() => goToHistory()}
            onRecordSaved={handleMedicalRecordSaved}
            onReadyForReminder={handleMedicalRecordReady}
            petId={petId}
          />
        </div>
      )}

      {(view.kind === "suggestion" || view.kind === "saved-no-suggestion") && (
        <div className={styles.medicalWorkspace}>
          <MedicalRecordPreview entries={entries} />
          <PostSaveReminderForm
            entry={view.entry}
            error={error}
            isSaving={isSaving}
            mode="vaccine"
            noSuggestion={view.kind === "saved-no-suggestion"}
            onDateChange={(value) => {
              setReminderDate(value);
              setError(null);
            }}
            onDefer={deferReminder}
            onSubmit={() => void createReminder()}
            reminderDate={reminderDate}
            warning={view.warning}
          />
        </div>
      )}

      {view.kind === "medical-reminder" && (
        <div className={`${styles.medicalWorkspace} ${styles.medicalRecordWorkspace}`}>
          <MedicalRecordPreview entries={entries} medicalOnly />
          <PostSaveReminderForm
            entry={view.entry}
            error={error}
            isSaving={isSaving}
            mode="medical"
            onDateChange={(value) => {
              setReminderDate(value);
              setError(null);
            }}
            onDefer={deferReminder}
            onNoteChange={(value) => {
              setReminderNote(value);
              setError(null);
            }}
            onSubmit={() => void createReminder()}
            reminderDate={reminderDate}
            reminderNote={reminderNote}
          />
        </div>
      )}

      {deleteTarget && (
        <div className={styles.dialogBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) closeDeleteDialog();
        }}>
          <div
            aria-labelledby="delete-record-title"
            aria-modal="true"
            className={styles.vaccineDialog}
            ref={deleteDialogRef}
            role="dialog"
          >
            <div className={styles.dialogHeader}>
              <h2 id="delete-record-title">
                {deleteTarget.entry.type === "vaccine" ? "Xóa bản ghi tiêm phòng?" : "Xóa hồ sơ khám bệnh?"}
              </h2>
              <button aria-label="Đóng" className={styles.dialogClose} disabled={isDeleting} onClick={closeDeleteDialog} type="button">×</button>
            </div>
            <div className={styles.deleteDialogBody}>
              <p>
                Bạn sắp xóa vĩnh viễn {deleteTarget.entry.type === "vaccine" ? "bản ghi" : "hồ sơ"} “{deleteTarget.entry.title}” ngày {formatDate(deleteTarget.entry.eventDate)}.
              </p>
              <p>
                {deleteTarget.entry.type === "medical"
                  ? "Các tệp đính kèm cũng sẽ bị xóa. Nhắc hẹn liên quan sẽ được giữ lại nhưng không còn liên kết với hồ sơ."
                  : "Nhắc hẹn được tạo từ bản ghi này sẽ được giữ lại nhưng không còn liên kết với bản ghi tiêm phòng."}
              </p>
              <p className={styles.deleteDialogWarning}>Thao tác này không thể hoàn tác.</p>
              {deleteError && <p className={styles.medicalError} role="alert">{deleteError}</p>}
              <div className={styles.dialogActions}>
                <button disabled={isDeleting} onClick={closeDeleteDialog} type="button">Hủy</button>
                <button className={styles.deleteRecordConfirm} disabled={isDeleting} onClick={() => void deleteEntry()} type="button">
                  {isDeleting ? "Đang xóa…" : "Xóa bản ghi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PostSaveReminderForm({
  mode,
  entry,
  reminderDate,
  reminderNote = "",
  noSuggestion = false,
  warning = null,
  error,
  isSaving,
  onDateChange,
  onNoteChange,
  onDefer,
  onSubmit,
}: {
  mode: "vaccine" | "medical";
  entry: MedicalHistoryEntry;
  reminderDate: string;
  reminderNote?: string;
  noSuggestion?: boolean;
  warning?: string | null;
  error: string | null;
  isSaving: boolean;
  onDateChange: (value: string) => void;
  onNoteChange?: (value: string) => void;
  onDefer: () => void;
  onSubmit: () => void;
}) {
  const isMedical = mode === "medical";

  return (
    <section className={styles.reminderSuggestion} aria-live="polite">
      <h2>{isMedical ? "Tạo nhắc tái khám" : "Đã lưu mũi tiêm"}</h2>
      {isMedical ? (
        <>
          <p>Đã lưu lần khám.</p>
          <p className={styles.suggestionMuted}>Tạo từ lần khám ngày {formatDate(entry.eventDate)}</p>
          {entry.title !== "Lần khám bệnh" && <p className={styles.suggestionWarning}>{entry.title}</p>}
        </>
      ) : (
        <p>Hệ thống chỉ gợi ý ngày khi có đủ thông tin và quy tắc phù hợp. Bạn có thể chỉnh sửa ngày trước khi tạo nhắc hẹn.</p>
      )}
      {!isMedical && noSuggestion && <p className={styles.suggestionMuted}>Chưa thể gợi ý lịch tiêm tiếp theo. Bạn có thể tự nhập ngày nhắc.</p>}
      <label>
        {isMedical ? "Ngày tái khám" : "Ngày nhắc hẹn"}
        <input onChange={(event) => onDateChange(event.target.value)} required type="date" value={reminderDate} />
      </label>
      {isMedical && onNoteChange && (
        <label className={styles.reminderNoteField}>
          Ghi chú
          <textarea maxLength={500} onChange={(event) => onNoteChange(event.target.value)} placeholder="Ghi chú cho lần tái khám" value={reminderNote} />
        </label>
      )}
      {!isMedical && warning && <p className={styles.suggestionWarning}>{warning}</p>}
      {error && <p className={styles.medicalError} role="alert">{error}</p>}
      <div className={styles.suggestionActions}>
        <button disabled={isSaving} onClick={onDefer} type="button">Để sau</button>
        <button disabled={isSaving || !reminderDate} onClick={onSubmit} type="button">
          {isSaving ? "Đang lưu…" : "Tạo nhắc hẹn"}
        </button>
      </div>
    </section>
  );
}

function MedicalRecordPreview({ entries, medicalOnly = false }: { entries: MedicalHistoryEntry[]; medicalOnly?: boolean }) {
  const relevantEntries = medicalOnly ? entries.filter((entry) => entry.type === "medical") : entries;
  const recentEntries = relevantEntries.slice(0, 3);
  const visitNumbers = new Map(
    relevantEntries
      .filter((entry) => entry.type === "medical")
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.id.localeCompare(b.id))
      .map((entry, index) => [entry.id, index + 1]),
  );
  return (
    <section className={styles.medicalRecordPreview} aria-label="Lịch sử gần đây">
      <h2>{medicalOnly ? "Lịch sử khám bệnh" : "Lịch sử gần đây"}</h2>
      {recentEntries.length > 0
        ? recentEntries.map((entry) => <MedicalEntryCard entry={entry} key={entry.id} visitNumber={visitNumbers.get(entry.id)} />)
        : <p>{medicalOnly ? "Chưa có lần khám nào" : "Chưa có hồ sơ y tế"}</p>}
    </section>
  );
}

function MedicalEntryCard({ canDelete = false, entry, onDelete, visitNumber }: { canDelete?: boolean; entry: MedicalHistoryEntry; onDelete?: (entry: MedicalHistoryEntry, trigger: HTMLButtonElement | null) => void; visitNumber?: number }) {
  const title = entry.type === "medical" && entry.title === "Lần khám bệnh"
    ? `Lần khám ngày ${formatDate(entry.eventDate)}`
    : entry.title;
  return (
    <article className={`${styles.medicalEntryCard} ${canDelete ? styles.medicalEntryCardWithActions : ""}`}>
      {entry.type === "vaccine"
        ? <span className={styles.vaccineIcon}><Image alt="" aria-hidden="true" height={27} src="/icons/vaccine-syringe.svg" width={41} /></span>
        : <span className={styles.medicalIcon}><Image alt="" aria-hidden="true" height={34} src="/icons/medical-briefcase.svg" width={34} /></span>}
      <div className={styles.medicalEntryContent}>
        {entry.type === "medical" && <span>KHÁM BỆNH</span>}
        <h3>{title}</h3>
        <p>{formatDate(entry.eventDate)}{entry.clinicName ? ` • ${entry.clinicName}` : ""}</p>
        {entry.type === "medical" && visitNumber && <span>{`Lần ${visitNumber}`}</span>}
        {entry.description && <span>{entry.description}</span>}
        {entry.type === "medical" && entry.addedByCurrentUser && <span>Thêm bởi bạn</span>}
        {entry.type === "medical" && entry.attachments && entry.attachments.length > 0 && (
          <div className={styles.medicalAttachmentList}>
            {entry.attachments.map((attachment) => (
              <MedicalAttachmentRow attachment={attachment} key={attachment.attachment_id} recordId={entry.id} />
            ))}
          </div>
        )}
      </div>
      {canDelete && onDelete && (
        <div className={styles.medicalEntryActions}>
          <button
            aria-label={entry.type === "vaccine" ? "Xóa bản ghi tiêm phòng" : "Xóa hồ sơ khám bệnh"}
            className={styles.deleteRecordButton}
            onClick={(event) => onDelete(entry, event.currentTarget)}
            type="button"
          >
            Xóa
          </button>
        </div>
      )}
    </article>
  );
}

function MedicalAttachmentRow({
  attachment,
  recordId,
}: {
  attachment: MedicalHistoryAttachment;
  recordId: string;
}) {
  const runtime = useAppRuntime();
  const request = useRuntimeRequest();
  const [isOpening, setIsOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const openingGuard = useRef(false);

  async function openAttachment() {
    if (openingGuard.current) return;
    openingGuard.current = true;
    setIsOpening(true);
    setOpenError(null);

    const fileTab = window.open("about:blank", "_blank");
    if (fileTab) {
      fileTab.opener = null;
      fileTab.document.title = "Đang mở file…";
    }

    try {
      if (runtime) {
        const localUrl = runtime.attachmentUrl(attachment.attachment_id);
        if (!localUrl || !fileTab) throw new Error("Không thể mở file trong trải nghiệm thử.");
        fileTab.location.replace(localUrl);
        return;
      }
      const response = await request(
        `/api/medical-records/${encodeURIComponent(recordId)}/attachments?attachmentId=${encodeURIComponent(attachment.attachment_id)}`,
      );
      const payload = (await response.json()) as SignedUrlResponse;
      if (!response.ok || !payload.signed_url) {
        throw new Error(payload.error || "Không thể mở file khám bệnh lúc này.");
      }

      const signedUrl = new URL(payload.signed_url);
      if (signedUrl.protocol !== "https:" && signedUrl.protocol !== "http:") {
        throw new Error("Đường dẫn file không hợp lệ.");
      }
      if (!fileTab) throw new Error("Trình duyệt đang chặn tab mới.");
      fileTab.location.replace(signedUrl.toString());
    } catch (requestError) {
      fileTab?.close();
      setOpenError(requestError instanceof Error ? requestError.message : "Không thể mở file khám bệnh lúc này.");
    } finally {
      openingGuard.current = false;
      setIsOpening(false);
    }
  }

  return (
    <div className={styles.medicalAttachmentItem}>
      <div className={styles.medicalAttachmentRow}>
        <Image alt="" aria-hidden="true" height={16} src="/file.svg" width={16} />
        <span className={styles.medicalAttachmentName} title={attachment.file_name}>{attachment.file_name}</span>
        <button disabled={isOpening} onClick={openAttachment} type="button">
          {isOpening ? "Đang mở…" : "Xem file"}
        </button>
      </div>
      {openError && <p className={styles.medicalAttachmentError} role="alert">{openError}</p>}
    </div>
  );
}
