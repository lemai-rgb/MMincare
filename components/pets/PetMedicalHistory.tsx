"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { MedicalRecordCreateForm } from "@/components/pets/MedicalRecordCreateForm";
import { VaccineCreateForm, type VaccineSavedResult } from "@/components/pets/VaccineCreateForm";
import type { MedicalHistoryAttachment, MedicalHistoryEntry } from "@/lib/medicalHistory";
import { parseMedicalHistoryRecords } from "@/lib/medicalHistoryValidation";
import type { PetSpecies } from "@/lib/pets";
import { invalidateNotificationCenter } from "@/lib/notifications/events";
import { fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
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
  { id: "all", label: "Táº¥t cáº£" },
  { id: "vaccines", label: "TiÃªm phÃ²ng" },
  { id: "visits", label: "KhÃ¡m bá»‡nh" },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function groupLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Lá»‹ch sá»­";
  return new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function PetMedicalHistory({ form, isOwner = false, petId, species }: { form?: string; isOwner?: boolean; petId: string; species: PetSpecies }) {
  const router = useRouter();
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

    void fetchJsonWithTimeout(`/api/pets/${encodeURIComponent(petId)}/${endpoint}`, { signal: controller.signal })
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
        setError("KhÃ´ng thá»ƒ táº£i há»“ sÆ¡ y táº¿ lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.");
      })
      .finally(() => {
        if (!isCurrent()) return;
        setIsLoading(false);
        historyRequestController.current = null;
      });

    return controller;
  }, [form, petId]);

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
    const response = await fetch(
      `/api/pets/${encodeURIComponent(petId)}/${resource}/${encodeURIComponent(entry.id)}`,
      { method: "DELETE" },
    ).catch(() => null);

    try {
      const payload = response ? await response.json() as DeleteResponse : null;
      if (!response || !response.ok) {
        const message = response?.status === 401
          ? "PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i."
          : response?.status === 403 || response?.status === 404
            ? "KhÃ´ng tÃ¬m tháº¥y báº£n ghi hoáº·c báº¡n khÃ´ng cÃ³ quyá»n xÃ³a."
            : response?.status === 409
              ? "Báº£n ghi cÃ²n dá»¯ liá»‡u liÃªn quan chÆ°a thá»ƒ xÃ³a."
              : payload?.error || "KhÃ´ng thá»ƒ xÃ³a báº£n ghi lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.";
        throw new Error(message);
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setDeleteTarget(null);
      setNotice(payload?.attachment_cleanup === "pending"
        ? "Há»“ sÆ¡ Ä‘Ã£ Ä‘Æ°á»£c xÃ³a. Má»™t sá»‘ tá»‡p Ä‘ang chá» há»‡ thá»‘ng dá»n dáº¹p."
        : entry.type === "vaccine" ? "ÄÃ£ xÃ³a báº£n ghi tiÃªm phÃ²ng." : "ÄÃ£ xÃ³a há»“ sÆ¡ khÃ¡m bá»‡nh.");
      router.refresh();
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ xÃ³a báº£n ghi lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.");
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
      setError("HÃ£y chá»n ngÃ y nháº¯c háº¹n trÆ°á»›c khi tiáº¿p tá»¥c.");
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
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/reminders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      const payload = (await response.json()) as { reminder?: { reminder_id: string }; error?: string };
      if (!response.ok || !payload.reminder?.reminder_id) throw new Error(payload.error || "KhÃ´ng thá»ƒ táº¡o nháº¯c háº¹n.");
      invalidateNotificationCenter();
      goToHistory(isMedicalSource ? "ÄÃ£ táº¡o nháº¯c tÃ¡i khÃ¡m." : "ÄÃ£ táº¡o nháº¯c háº¹n thÃ nh cÃ´ng", payload.reminder.reminder_id);
    } catch {
      if (!controller.signal.aborted) {
        setError(isMedicalSource
          ? "Láº§n khÃ¡m Ä‘Ã£ Ä‘Æ°á»£c lÆ°u nhÆ°ng chÆ°a thá»ƒ táº¡o nháº¯c háº¹n."
          : "MÅ©i tiÃªm Ä‘Ã£ Ä‘Æ°á»£c lÆ°u nhÆ°ng chÆ°a thá»ƒ táº¡o nháº¯c háº¹n.");
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
    goToHistory(view.kind === "medical-reminder" ? "ÄÃ£ lÆ°u láº§n khÃ¡m." : "ÄÃ£ lÆ°u mÅ©i tiÃªm.");
  }

  return (
    <section className={`${styles.medicalHistory} ${view.kind === "add-medical-record" || view.kind === "medical-reminder" ? styles.medicalRecordMode : ""}`} aria-labelledby="medical-history-title">
      {view.kind === "history" && (
        <>
          <div className={styles.medicalToolbar}>
            <div className={styles.filterChips} role="group" aria-label="Lá»c há»“ sÆ¡ y táº¿">
              {filters.map((item) => (
                <button className={filter === item.id ? styles.activeFilterChip : styles.filterChip} key={item.id} onClick={() => setFilter(item.id)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
            {isOwner && <div className={styles.addRecordMenu}>
              <button aria-expanded={isAddMenuOpen} aria-haspopup="menu" className={styles.addRecordButton} onClick={() => setIsAddMenuOpen((open) => !open)} type="button">
                <span aria-hidden="true">+</span>ThÃªm báº£n ghi
              </button>
              {isAddMenuOpen && (
                <div className={styles.addRecordPopover} role="menu">
                  <button onClick={openAddVaccine} role="menuitem" type="button">ThÃªm mÅ©i tiÃªm</button>
                  <button onClick={openAddMedicalRecord} role="menuitem" type="button">ThÃªm láº§n khÃ¡m</button>
                </div>
              )}
            </div>}
          </div>

          {notice && (
            <p className={styles.medicalNotice} role="status">
              {notice}
              {createdReminderId && <Link className={styles.medicalNoticeLink} href={`/reminders?highlight=${encodeURIComponent(createdReminderId)}`}>Xem nháº¯c háº¹n</Link>}
            </p>
          )}
          {historyError && (
            <div className={styles.medicalError} role="alert">
              <p>{historyError}</p>
              <button className={styles.medicalRetryButton} disabled={historyLoading} onClick={retryHistory} type="button">Thá»­ láº¡i</button>
            </div>
          )}
          {historyLoading && <p className={styles.medicalLoading}>Äang táº£i há»“ sÆ¡ y táº¿â€¦</p>}
          {!historyLoading && !historyError && groupedEntries.length === 0 && (
            <section className={styles.medicalEmptyState}>
              <span className={styles.medicalEmptyMark} aria-hidden="true" />
              <h2 id="medical-history-title">ChÆ°a cÃ³ há»“ sÆ¡ y táº¿</h2>
              <p>ThÃ´ng tin tiÃªm phÃ²ng vÃ  cÃ¡c láº§n khÃ¡m cá»§a bÃ© sáº½ xuáº¥t hiá»‡n táº¡i Ä‘Ã¢y.</p>
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
                {deleteTarget.entry.type === "vaccine" ? "XÃ³a báº£n ghi tiÃªm phÃ²ng?" : "XÃ³a há»“ sÆ¡ khÃ¡m bá»‡nh?"}
              </h2>
              <button aria-label="ÄÃ³ng" className={styles.dialogClose} disabled={isDeleting} onClick={closeDeleteDialog} type="button">Ã—</button>
            </div>
            <div className={styles.deleteDialogBody}>
              <p>
                Báº¡n sáº¯p xÃ³a vÄ©nh viá»…n {deleteTarget.entry.type === "vaccine" ? "báº£n ghi" : "há»“ sÆ¡"} â€œ{deleteTarget.entry.title}â€ ngÃ y {formatDate(deleteTarget.entry.eventDate)}.
              </p>
              <p>
                {deleteTarget.entry.type === "medical"
                  ? "CÃ¡c tá»‡p Ä‘Ã­nh kÃ¨m cÅ©ng sáº½ bá»‹ xÃ³a. Nháº¯c háº¹n liÃªn quan sáº½ Ä‘Æ°á»£c giá»¯ láº¡i nhÆ°ng khÃ´ng cÃ²n liÃªn káº¿t vá»›i há»“ sÆ¡."
                  : "Nháº¯c háº¹n Ä‘Æ°á»£c táº¡o tá»« báº£n ghi nÃ y sáº½ Ä‘Æ°á»£c giá»¯ láº¡i nhÆ°ng khÃ´ng cÃ²n liÃªn káº¿t vá»›i báº£n ghi tiÃªm phÃ²ng."}
              </p>
              <p className={styles.deleteDialogWarning}>Thao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.</p>
              {deleteError && <p className={styles.medicalError} role="alert">{deleteError}</p>}
              <div className={styles.dialogActions}>
                <button disabled={isDeleting} onClick={closeDeleteDialog} type="button">Há»§y</button>
                <button className={styles.deleteRecordConfirm} disabled={isDeleting} onClick={() => void deleteEntry()} type="button">
                  {isDeleting ? "Äang xÃ³aâ€¦" : "XÃ³a báº£n ghi"}
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
      <h2>{isMedical ? "Táº¡o nháº¯c tÃ¡i khÃ¡m" : "ÄÃ£ lÆ°u mÅ©i tiÃªm"}</h2>
      {isMedical ? (
        <>
          <p>ÄÃ£ lÆ°u láº§n khÃ¡m.</p>
          <p className={styles.suggestionMuted}>Táº¡o tá»« láº§n khÃ¡m ngÃ y {formatDate(entry.eventDate)}</p>
          {entry.title !== "Láº§n khÃ¡m bá»‡nh" && <p className={styles.suggestionWarning}>{entry.title}</p>}
        </>
      ) : (
        <p>Há»‡ thá»‘ng chá»‰ gá»£i Ã½ ngÃ y khi cÃ³ Ä‘á»§ thÃ´ng tin vÃ  quy táº¯c phÃ¹ há»£p. Báº¡n cÃ³ thá»ƒ chá»‰nh sá»­a ngÃ y trÆ°á»›c khi táº¡o nháº¯c háº¹n.</p>
      )}
      {!isMedical && noSuggestion && <p className={styles.suggestionMuted}>ChÆ°a thá»ƒ gá»£i Ã½ lá»‹ch tiÃªm tiáº¿p theo. Báº¡n cÃ³ thá»ƒ tá»± nháº­p ngÃ y nháº¯c.</p>}
      <label>
        {isMedical ? "NgÃ y tÃ¡i khÃ¡m" : "NgÃ y nháº¯c háº¹n"}
        <input onChange={(event) => onDateChange(event.target.value)} required type="date" value={reminderDate} />
      </label>
      {isMedical && onNoteChange && (
        <label className={styles.reminderNoteField}>
          Ghi chÃº
          <textarea maxLength={500} onChange={(event) => onNoteChange(event.target.value)} placeholder="Ghi chÃº cho láº§n tÃ¡i khÃ¡m" value={reminderNote} />
        </label>
      )}
      {!isMedical && warning && <p className={styles.suggestionWarning}>{warning}</p>}
      {error && <p className={styles.medicalError} role="alert">{error}</p>}
      <div className={styles.suggestionActions}>
        <button disabled={isSaving} onClick={onDefer} type="button">Äá»ƒ sau</button>
        <button disabled={isSaving || !reminderDate} onClick={onSubmit} type="button">
          {isSaving ? "Äang lÆ°uâ€¦" : "Táº¡o nháº¯c háº¹n"}
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
    <section className={styles.medicalRecordPreview} aria-label="Lá»‹ch sá»­ gáº§n Ä‘Ã¢y">
      <h2>{medicalOnly ? "Lá»‹ch sá»­ khÃ¡m bá»‡nh" : "Lá»‹ch sá»­ gáº§n Ä‘Ã¢y"}</h2>
      {recentEntries.length > 0
        ? recentEntries.map((entry) => <MedicalEntryCard entry={entry} key={entry.id} visitNumber={visitNumbers.get(entry.id)} />)
        : <p>{medicalOnly ? "ChÆ°a cÃ³ láº§n khÃ¡m nÃ o" : "ChÆ°a cÃ³ há»“ sÆ¡ y táº¿"}</p>}
    </section>
  );
}

function MedicalEntryCard({ canDelete = false, entry, onDelete, visitNumber }: { canDelete?: boolean; entry: MedicalHistoryEntry; onDelete?: (entry: MedicalHistoryEntry, trigger: HTMLButtonElement | null) => void; visitNumber?: number }) {
  const title = entry.type === "medical" && entry.title === "Láº§n khÃ¡m bá»‡nh"
    ? `Láº§n khÃ¡m ngÃ y ${formatDate(entry.eventDate)}`
    : entry.title;
  return (
    <article className={`${styles.medicalEntryCard} ${canDelete ? styles.medicalEntryCardWithActions : ""}`}>
      {entry.type === "vaccine"
        ? <span className={styles.vaccineIcon}><Image alt="" aria-hidden="true" height={27} src="/icons/vaccine-syringe.svg" width={41} /></span>
        : <span className={styles.medicalIcon}><Image alt="" aria-hidden="true" height={34} src="/icons/medical-briefcase.svg" width={34} /></span>}
      <div className={styles.medicalEntryContent}>
        {entry.type === "medical" && <span>KHÃM Bá»†NH</span>}
        <h3>{title}</h3>
        <p>{formatDate(entry.eventDate)}{entry.clinicName ? ` â€¢ ${entry.clinicName}` : ""}</p>
        {entry.type === "medical" && visitNumber && <span>{`Láº§n ${visitNumber}`}</span>}
        {entry.description && <span>{entry.description}</span>}
        {entry.type === "medical" && entry.addedByCurrentUser && <span>ThÃªm bá»Ÿi báº¡n</span>}
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
            aria-label={entry.type === "vaccine" ? "XÃ³a báº£n ghi tiÃªm phÃ²ng" : "XÃ³a há»“ sÆ¡ khÃ¡m bá»‡nh"}
            className={styles.deleteRecordButton}
            onClick={(event) => onDelete(entry, event.currentTarget)}
            type="button"
          >
            XÃ³a
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
      fileTab.document.title = "Äang má»Ÿ fileâ€¦";
    }

    try {
      const response = await fetch(
        `/api/medical-records/${encodeURIComponent(recordId)}/attachments?attachmentId=${encodeURIComponent(attachment.attachment_id)}`,
      );
      const payload = (await response.json()) as SignedUrlResponse;
      if (!response.ok || !payload.signed_url) {
        throw new Error(payload.error || "KhÃ´ng thá»ƒ má»Ÿ file khÃ¡m bá»‡nh lÃºc nÃ y.");
      }

      const signedUrl = new URL(payload.signed_url);
      if (signedUrl.protocol !== "https:" && signedUrl.protocol !== "http:") {
        throw new Error("ÄÆ°á»ng dáº«n file khÃ´ng há»£p lá»‡.");
      }
      if (!fileTab) throw new Error("TrÃ¬nh duyá»‡t Ä‘ang cháº·n tab má»›i.");
      fileTab.location.replace(signedUrl.toString());
    } catch (requestError) {
      fileTab?.close();
      setOpenError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ má»Ÿ file khÃ¡m bá»‡nh lÃºc nÃ y.");
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
          {isOpening ? "Äang má»Ÿâ€¦" : "Xem file"}
        </button>
      </div>
      {openError && <p className={styles.medicalAttachmentError} role="alert">{openError}</p>}
    </div>
  );
}

