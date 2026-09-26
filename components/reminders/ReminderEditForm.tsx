"use client";

import { FormEvent, useRef, useState } from "react";
import type { ReminderListItem, ReminderUpdate } from "@/lib/reminders";
import styles from "@/styles/petDetail.module.css";

export function ReminderEditForm({ reminder, titleId, onCancel, onSaved, onSavingChange }: {
  reminder: ReminderListItem;
  titleId?: string;
  onCancel: () => void;
  onSaved: (reminder: ReminderUpdate) => void | Promise<void>;
  onSavingChange?: (saving: boolean) => void;
}) {
  const [dueDate, setDueDate] = useState(reminder.due_date);
  const [note, setNote] = useState(reminder.note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const guard = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.current) return;
    if (!dueDate) { setError("Vui lòng chọn ngày hẹn."); return; }
    guard.current = true; setSaving(true); onSavingChange?.(true); setError("");
    try {
      const response = await fetch(`/api/reminders/${encodeURIComponent(reminder.reminder_id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: dueDate, note: note.trim() || null }),
      });
      const payload = await response.json() as { reminder?: ReminderUpdate; error?: string };
      if (!response.ok || !payload.reminder) throw new Error(payload.error || "Không thể lưu thay đổi.");
      await onSaved(payload.reminder);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu thay đổi."); }
    finally { guard.current = false; setSaving(false); onSavingChange?.(false); }
  }
  return <form aria-busy={saving} className={styles.petReminderForm} onSubmit={submit}>
    <header className={styles.petReminderFormHeader}><h2 id={titleId}>Chỉnh sửa nhắc hẹn</h2><p>Cập nhật ngày hẹn hoặc ghi chú</p></header>
    <label className={styles.petReminderField}><span>Ngày hẹn <b aria-hidden="true">*</b></span><input autoFocus disabled={saving} type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setError(""); }} /></label>
    <label className={`${styles.petReminderField} ${styles.petReminderNoteField}`}><span>Ghi chú</span><textarea disabled={saving} value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} /></label>
    <p className={styles.petReminderSubmitError} role={error ? "alert" : undefined}>{error || "\u00a0"}</p>
    <div className={styles.petReminderFormActions}><button disabled={saving} onClick={onCancel} type="button">Hủy</button><button disabled={saving} type="submit">{saving ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
  </form>;
}
