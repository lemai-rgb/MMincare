"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import {
  ReminderCreateForm,
  type ManualReminderCreatedResult,
} from "@/components/reminders/ReminderCreateForm";
import { ReminderEditForm } from "@/components/reminders/ReminderEditForm";
import {
  getDaysOverdue,
  getReminderDisplayStatus,
  getReminderTypeLabel,
  sortReminders,
  type ReminderDisplayStatus,
  type ReminderListItem,
  type ReminderPetOption,
  type ReminderUpdate,
} from "@/lib/reminders";
import { invalidateNotificationCenter } from "@/lib/notifications/events";
import styles from "@/styles/reminders.module.css";

type ReminderFilter = "all" | ReminderDisplayStatus;
type ReminderResponse = { reminders?: ReminderListItem[]; pets?: ReminderPetOption[]; error?: string };
type ToastState = { kind: "success" | "error"; message: string } | null;

const statusFilters: Array<{ id: ReminderFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "Upcoming", label: "Sắp tới" },
  { id: "Overdue", label: "Quá hạn" },
  { id: "Completed", label: "Hoàn thành" },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatCompletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function getReminderContent(reminder: ReminderListItem) {
  if (reminder.note) return reminder.note;
  return `${getReminderTypeLabel(reminder.type)} cho ${reminder.pet_name}`;
}

function getSourceLabel(reminder: ReminderListItem) {
  if (reminder.source_medical_record_id) {
    return reminder.source_medical_visit_date
      ? `Tạo từ lần khám ngày ${formatDate(reminder.source_medical_visit_date)}`
      : "Tạo từ lần khám";
  }
  if (reminder.source_vaccine_record_id) {
    return reminder.source_vaccine_date
      ? `Tạo từ mũi tiêm ngày ${formatDate(reminder.source_vaccine_date)}`
      : "Tạo từ mũi tiêm";
  }
  return "Nhắc hẹn tạo thủ công";
}

function getConfirmationText(reminder: ReminderListItem) {
  if (reminder.note) return `Xác nhận ${reminder.pet_name} đã hoàn thành “${reminder.note}”.`;
  return `Xác nhận ${reminder.pet_name} đã hoàn thành nhắc hẹn ${getReminderTypeLabel(reminder.type).toLowerCase()} theo lịch.`;
}

async function requestReminderData(signal?: AbortSignal) {
  const response = await fetch("/api/reminders", { cache: "no-store", signal });
  const payload = await response.json() as ReminderResponse;
  if (!response.ok) throw new Error(payload.error || "Không thể tải danh sách nhắc hẹn.");
  return payload;
}

export function ReminderPage({ highlightedReminderId }: { highlightedReminderId?: string }) {
  const [reminders, setReminders] = useState<ReminderListItem[]>([]);
  const [pets, setPets] = useState<ReminderPetOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReminderFilter>("all");
  const [petFilter, setPetFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedReminder, setSelectedReminder] = useState<ReminderListItem | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderListItem | null>(null);
  const [isEditingSaving, setIsEditingSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const completionGuard = useRef(false);
  const createTrigger = useRef<HTMLButtonElement | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const lastProcessedHighlight = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!editingReminder) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = document.getElementById("edit-reminder-dialog");
      if (event.key === "Escape" && !isEditingSaving) { event.preventDefault(); setEditingReminder(null); editTrigger.current?.focus(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea:not(:disabled)")];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editingReminder, isEditingSaving]);

  useEffect(() => {
    if (!isEditingSaving) return;
    const preventDialogDismiss = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("#edit-reminder-dialog > button")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", preventDialogDismiss, true);
    return () => document.removeEventListener("click", preventDialogDismiss, true);
  }, [isEditingSaving]);

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const payload = await requestReminderData();
      setReminders(Array.isArray(payload.reminders) ? payload.reminders : []);
      setPets(Array.isArray(payload.pets) ? payload.pets : []);
    } catch (requestError: unknown) {
      setLoadError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách nhắc hẹn.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    requestReminderData(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setReminders(Array.isArray(payload.reminders) ? payload.reminders : []);
        setPets(Array.isArray(payload.pets) ? payload.pets : []);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách nhắc hẹn.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleReminders = useMemo(() => reminders.filter((reminder) => {
    const currentDisplayStatus = getReminderDisplayStatus(reminder.status, reminder.due_date);
    const matchesStatus = statusFilter === "all" || currentDisplayStatus === statusFilter;
    const matchesPet = petFilter === "all" || reminder.pet_id === petFilter;
    return matchesStatus && matchesPet;
  }), [petFilter, reminders, statusFilter]);

  const hasFilters = statusFilter !== "all" || petFilter !== "all";

  useEffect(() => {
    if (!highlightedReminderId || isLoading || lastProcessedHighlight.current === highlightedReminderId) return;
    const targetReminder = reminders.find((reminder) => reminder.reminder_id === highlightedReminderId);
    if (!targetReminder) {
      lastProcessedHighlight.current = highlightedReminderId;
      return;
    }

    const targetStatus = getReminderDisplayStatus(targetReminder.status, targetReminder.due_date);
    if ((statusFilter !== "all" && statusFilter !== targetStatus) || (petFilter !== "all" && petFilter !== targetReminder.pet_id)) {
      const frame = window.requestAnimationFrame(() => {
        setStatusFilter("all");
        setPetFilter("all");
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const target = document.getElementById(`reminder-${highlightedReminderId}`);
    if (!target) return;
    lastProcessedHighlight.current = highlightedReminderId;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightedReminderId, isLoading, petFilter, reminders, statusFilter, visibleReminders]);

  function openComplete(reminder: ReminderListItem, trigger: HTMLButtonElement) {
    lastTrigger.current = trigger;
    setCompleteError("");
    setSelectedReminder(reminder);
  }

  function closeComplete() {
    if (isCompleting) return;
    setSelectedReminder(null);
    setCompleteError("");
    window.setTimeout(() => lastTrigger.current?.focus(), 0);
  }

  async function completeReminder() {
    if (!selectedReminder || completionGuard.current) return;
    completionGuard.current = true;
    setIsCompleting(true);
    setCompleteError("");

    try {
      const response = await fetch(`/api/reminders/${encodeURIComponent(selectedReminder.reminder_id)}/complete`, { method: "PATCH" });
      const payload = await response.json() as { reminder?: { reminder_id: string; completed_at?: string | null }; error?: string };
      if (!response.ok || !payload.reminder) throw new Error(payload.error || "Không thể hoàn thành nhắc hẹn lúc này.");

      setReminders((current) => current.map((reminder) => reminder.reminder_id === selectedReminder.reminder_id
        ? {
            ...reminder,
            status: "Completed",
            display_status: "Completed",
            is_overdue: false,
            completed_at: payload.reminder?.completed_at ?? reminder.completed_at,
          }
        : reminder));
      invalidateNotificationCenter();
      setSelectedReminder(null);
      setToast({ kind: "success", message: "Đã đánh dấu nhắc hẹn hoàn thành." });
      window.setTimeout(() => lastTrigger.current?.focus(), 0);
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Không thể hoàn thành nhắc hẹn lúc này.";
      setCompleteError(message);
      setToast({ kind: "error", message });
    } finally {
      completionGuard.current = false;
      setIsCompleting(false);
    }
  }

  function resetFilters() {
    setStatusFilter("all");
    setPetFilter("all");
  }

  function openCreate(trigger: HTMLButtonElement) {
    createTrigger.current = trigger;
    setIsCreateOpen(true);
  }

  function closeCreate() {
    if (isCreating) return;
    setIsCreateOpen(false);
    window.setTimeout(() => createTrigger.current?.focus(), 0);
  }

  function handleManualReminderCreated() {
    setIsCreateOpen(false);
    setToast({ kind: "success", message: "Đã tạo nhắc hẹn." });
    void loadReminders();
    window.setTimeout(() => createTrigger.current?.focus(), 0);
  }

  async function handleReminderSaved(updated: ReminderUpdate) {
    const payload = await requestReminderData();
    const nextReminders = Array.isArray(payload.reminders) ? payload.reminders : [];
    const canonical = nextReminders.find((item) => item.reminder_id === updated.reminder_id);
    if (!canonical || (updated.due_date !== undefined && canonical.due_date !== updated.due_date) || (updated.note !== undefined && canonical.note !== updated.note)) {
      throw new Error("Không thể đồng bộ nhắc hẹn sau khi lưu. Vui lòng thử lại.");
    }

    setReminders(sortReminders(nextReminders));
    setPets(Array.isArray(payload.pets) ? payload.pets : []);
    setEditingReminder(null);
    window.setTimeout(() => editTrigger.current?.focus(), 0);
    setToast({ kind: "success", message: "Đã cập nhật nhắc hẹn." });
  }

  return (
    <main className={styles.page}>
      <AppHeader activeNav="reminders" />

      <section className={styles.shell} aria-labelledby="reminders-title">
        <PetListPanelDecorations />
        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <h1 id="reminders-title">Nhắc hẹn chăm sóc</h1>
              <p>Theo dõi lịch tiêm, tái khám và chăm sóc của tất cả thú cưng.</p>
            </div>
          </div>

          <div className={styles.contentRail}>
            <div className={styles.filters}>
              <div className={styles.statusFilters} role="tablist" aria-label="Lọc theo trạng thái nhắc hẹn">
                {statusFilters.map((filter) => (
                  <button
                    aria-selected={statusFilter === filter.id}
                    className={statusFilter === filter.id ? styles.activeFilter : styles.filterButton}
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    role="tab"
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className={styles.toolbarActions}>
                <label className={styles.petFilter}>
                  <span className={styles.srOnly}>Lọc theo thú cưng</span>
                  <select onChange={(event) => setPetFilter(event.target.value)} value={petFilter}>
                    <option value="all">Tất cả thú cưng</option>
                    {pets.map((pet) => <option key={pet.pet_id} value={pet.pet_id}>{pet.name}</option>)}
                  </select>
                </label>
                <button className={styles.createButton} onClick={(event) => openCreate(event.currentTarget)} type="button">+ Tạo nhắc hẹn</button>
              </div>
            </div>

          {isLoading && <ReminderListSkeleton />}

          {!isLoading && loadError && (
            <section className={styles.stateCard} role="alert">
              <span className={styles.stateIcon} aria-hidden="true">!</span>
              <h2>Không thể tải danh sách nhắc hẹn.</h2>
              <button className={styles.secondaryButton} onClick={() => void loadReminders()} type="button">Thử lại</button>
            </section>
          )}

          {!isLoading && !loadError && reminders.length === 0 && (
            <section className={styles.stateCard}>
              <span className={styles.stateIcon} aria-hidden="true">♡</span>
              <h2>Chưa có nhắc hẹn nào</h2>
              <p>Tạo nhắc hẹn để không bỏ lỡ lịch tiêm hoặc tái khám của bé.</p>
              <button className={styles.createButton} onClick={(event) => openCreate(event.currentTarget)} type="button">Tạo nhắc hẹn đầu tiên</button>
            </section>
          )}

          {!isLoading && !loadError && reminders.length > 0 && visibleReminders.length === 0 && (
            <section className={styles.stateCard}>
              <span className={styles.stateIcon} aria-hidden="true">⌕</span>
              <h2>Không có nhắc hẹn phù hợp với bộ lọc này.</h2>
              {hasFilters && <button className={styles.secondaryButton} onClick={resetFilters} type="button">Xóa bộ lọc</button>}
            </section>
          )}

          {!isLoading && !loadError && visibleReminders.length > 0 && (
            <section className={styles.reminderList} aria-label="Danh sách nhắc hẹn">
              {visibleReminders.map((reminder) => (
                <ReminderCard
                  highlighted={reminder.reminder_id === highlightedReminderId}
                  key={reminder.reminder_id}
                  onComplete={openComplete}
                  onEdit={(reminder, trigger) => { editTrigger.current = trigger; setIsEditingSaving(false); setEditingReminder(reminder); }}
                  reminder={reminder}
                />
              ))}
            </section>
          )}
          </div>
        </div>
      </section>

      {selectedReminder && (
        <CompleteReminderModal
          error={completeError}
          isCompleting={isCompleting}
          onCancel={closeComplete}
          onConfirm={() => void completeReminder()}
          reminder={selectedReminder}
        />
      )}

      {isCreateOpen && (
        <CreateReminderModal
          isCreating={isCreating}
          onCancel={closeCreate}
          onCreated={handleManualReminderCreated}
          onSubmittingChange={setIsCreating}
          pets={pets}
        />
      )}
      {editingReminder && (
        <div className={styles.createReminderBackdrop} onMouseDown={(event) => { if (!isEditingSaving && event.target === event.currentTarget) { setEditingReminder(null); editTrigger.current?.focus(); } }}>
          <div aria-labelledby="edit-reminder-title" aria-modal="true" className={styles.createReminderDialog} id="edit-reminder-dialog" role="dialog">
            <button aria-label="Đóng form chỉnh sửa nhắc hẹn" className={styles.createReminderClose} onClick={() => { setEditingReminder(null); editTrigger.current?.focus(); }} type="button">×</button>
            <ReminderEditForm reminder={editingReminder} titleId="edit-reminder-title" onCancel={() => { if (!isEditingSaving) { setEditingReminder(null); editTrigger.current?.focus(); } }} onSavingChange={setIsEditingSaving} onSaved={handleReminderSaved} />
          </div>
        </div>
      )}

      {toast && <div className={`${styles.toast} ${toast.kind === "error" ? styles.errorToast : ""}`} role={toast.kind === "error" ? "alert" : "status"}>{toast.message}</div>}
    </main>
  );
}

function CreateReminderModal({
  isCreating,
  onCancel,
  onCreated,
  onSubmittingChange,
  pets,
}: {
  isCreating: boolean;
  onCancel: () => void;
  onCreated: (result: ManualReminderCreatedResult) => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
  pets: ReminderPetOption[];
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isCreating) onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not(:disabled), select:not(:disabled), input:not(:disabled), textarea:not(:disabled)",
      )];
      if (focusable.length === 0) return;
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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCreating, onCancel]);

  return (
    <div
      className={styles.createReminderBackdrop}
      onMouseDown={(event) => {
        if (!isCreating && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-label="Tạo nhắc hẹn thủ công"
        aria-modal="true"
        className={styles.createReminderDialog}
        ref={dialogRef}
        role="dialog"
      >
        <button
          aria-label="Đóng form tạo nhắc hẹn"
          className={styles.createReminderClose}
          disabled={isCreating}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
        <ReminderCreateForm
          focusOnMount
          mode="global"
          onCancel={onCancel}
          onCreated={onCreated}
          onSubmittingChange={onSubmittingChange}
          pets={pets}
        />
      </div>
    </div>
  );
}

function ReminderCard({ reminder, highlighted, onComplete, onEdit }: {
  reminder: ReminderListItem;
  highlighted: boolean;
  onComplete: (reminder: ReminderListItem, trigger: HTMLButtonElement) => void;
  onEdit: (reminder: ReminderListItem, trigger: HTMLButtonElement) => void;
}) {
  const displayStatus = getReminderDisplayStatus(reminder.status, reminder.due_date);
  const overdueDays = getDaysOverdue(reminder.due_date);
  const statusLabel = displayStatus === "Upcoming" ? "Sắp tới" : displayStatus === "Overdue" ? "Quá hạn" : "Hoàn thành";

  return (
    <article aria-label={`Nhắc hẹn ${reminder.pet_name}`} className={`${styles.reminderCard} ${styles[`card${displayStatus}`]} ${highlighted ? styles.highlightedCard : ""}`} id={`reminder-${reminder.reminder_id}`} tabIndex={highlighted ? -1 : undefined}>
      <div className={styles.dateBlock}>
        <span aria-hidden="true">{displayStatus === "Completed" ? "✓" : "◷"}</span>
        <time dateTime={reminder.due_date}>{formatDate(reminder.due_date)}</time>
      </div>
      <div className={styles.reminderDetails}>
        <div className={styles.cardTitleRow}>
          <p className={styles.typeLabel}>{getReminderTypeLabel(reminder.type)}</p>
          <span className={`${styles.statusChip} ${styles[`chip${displayStatus}`]}`}>{statusLabel}</span>
        </div>
        <h2>{getReminderContent(reminder)}</h2>
        <div className={styles.reminderMeta}>
          <p className={styles.petName}>{reminder.pet_name}</p>
          <p className={styles.sourceLabel}>{getSourceLabel(reminder)}</p>
        </div>
        {displayStatus === "Overdue" && <p className={styles.overdueText}>Đã quá hạn {overdueDays} ngày</p>}
        {displayStatus === "Completed" && reminder.completed_at && <p className={styles.completedText}>Hoàn thành ngày {formatCompletedAt(reminder.completed_at)}</p>}
      </div>
      {displayStatus !== "Completed" && (
        <div className={styles.reminderCardActions}>
          <button aria-label={`Chỉnh sửa nhắc hẹn cho ${reminder.pet_name}`} className={styles.editButton} onClick={(event) => onEdit(reminder, event.currentTarget)} type="button">Chỉnh sửa</button>
          <button className={styles.completeButton} onClick={(event) => onComplete(reminder, event.currentTarget)} type="button">Hoàn thành</button>
        </div>
      )}
    </article>
  );
}

function CompleteReminderModal({ reminder, isCompleting, error, onCancel, onConfirm }: {
  reminder: ReminderListItem;
  isCompleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isCompleting) onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      if (focusable.length === 0) return;
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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCompleting, onCancel]);

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => {
      if (!isCompleting && event.target === event.currentTarget) onCancel();
    }}>
      <div aria-labelledby="complete-reminder-title" aria-modal="true" className={styles.modal} ref={dialogRef} role="dialog">
        <span className={styles.modalIcon} aria-hidden="true">✓</span>
        <h2 id="complete-reminder-title">Hoàn thành nhắc hẹn?</h2>
        <p>{getConfirmationText(reminder)}</p>
        {error && <p className={styles.modalError} role="alert">{error}</p>}
        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} disabled={isCompleting} onClick={onCancel} type="button">Hủy</button>
          <button className={styles.confirmButton} disabled={isCompleting} onClick={onConfirm} ref={confirmRef} type="button">
            {isCompleting ? "Đang cập nhật…" : "Xác nhận hoàn thành"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReminderListSkeleton() {
  return (
    <div aria-label="Đang tải danh sách nhắc hẹn" aria-live="polite" className={styles.skeletonList} role="status">
      <span className={styles.srOnly}>Đang tải danh sách nhắc hẹn…</span>
      {[0, 1, 2].map((item) => <div className={styles.skeletonCard} key={item}><span /><div><span /><span /><span /></div></div>)}
    </div>
  );
}
