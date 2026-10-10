"use client";
import { useRuntimeRequest } from "@/lib/appRuntime";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  REMINDER_TYPES,
  getReminderTypeLabel,
  type ReminderPetOption,
  type ReminderType,
} from "@/lib/reminders";
import { invalidateNotificationCenter } from "@/lib/notifications/events";
import styles from "@/styles/petDetail.module.css";

export type ManualReminderCreatedResult = {
  petId: string;
  reminderId: string;
};

type SharedFormProps = {
  focusOnMount?: boolean;
  formId?: string;
  onCancel?: () => void;
  onCreated: (result: ManualReminderCreatedResult) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

type ReminderCreateFormProps = SharedFormProps & (
  | {
      mode: "pet";
      petId: string;
      petName: string;
    }
  | {
      mode: "global";
      pets: ReminderPetOption[];
    }
);

type FormErrors = {
  petId?: string;
  type?: string;
  dueDate?: string;
  submit?: string;
};

type CreateReminderResponse = {
  reminder?: { reminder_id?: string };
  error?: string;
};

const reminderTypeOptions: Array<{ value: ReminderType; label: string }> = REMINDER_TYPES.map((type) => ({
  value: type,
  label: getReminderTypeLabel(type),
}));

function getTodayInVietnam() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function ReminderCreateForm(props: ReminderCreateFormProps) {
  const request = useRuntimeRequest();
  const [selectedPetId, setSelectedPetId] = useState("");
  const [type, setType] = useState<ReminderType | "">("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const submissionGuard = useRef(false);
  const today = getTodayInVietnam();
  const isGlobal = props.mode === "global";
  const effectivePetId = isGlobal ? selectedPetId : props.petId;

  useEffect(() => {
    if (!props.focusOnMount) return;

    const frame = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      firstFieldRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [props.focusOnMount]);

  function resetForm() {
    setSelectedPetId("");
    setType("");
    setDueDate("");
    setNote("");
    setErrors({});
  }

  function handleCancel() {
    if (isSubmitting) return;
    resetForm();
    props.onCancel?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionGuard.current) return;

    const nextErrors: FormErrors = {};
    if (isGlobal && !effectivePetId) nextErrors.petId = "Vui lòng chọn thú cưng.";
    if (!type) nextErrors.type = "Vui lòng chọn loại nhắc hẹn.";
    if (!dueDate) nextErrors.dueDate = "Vui lòng chọn ngày hẹn.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submissionGuard.current = true;
    setIsSubmitting(true);
    props.onSubmittingChange?.(true);
    setErrors({});
    let createdResult: ManualReminderCreatedResult | undefined;
    let failureMessage = "Không thể tạo nhắc hẹn. Vui lòng thử lại.";

    try {
      const response = await request(`/api/pets/${encodeURIComponent(effectivePetId)}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          due_date: dueDate,
          note: note.trim() || undefined,
        }),
      });
      let payload: CreateReminderResponse = {};
      try {
        payload = await response.json() as CreateReminderResponse;
      } catch {
        // Keep the browser-facing error generic when the response is not JSON.
      }

      if (!response.ok || !payload.reminder?.reminder_id) {
        failureMessage = payload.error || failureMessage;
        throw new Error("Reminder creation failed");
      }

      createdResult = {
        petId: effectivePetId,
        reminderId: payload.reminder.reminder_id,
      };
      resetForm();
    } catch {
      setErrors((current) => ({
        ...current,
        submit: failureMessage,
      }));
    } finally {
      submissionGuard.current = false;
      setIsSubmitting(false);
      props.onSubmittingChange?.(false);
    }

    if (createdResult) {
      invalidateNotificationCenter();
      props.onCreated(createdResult);
    }
  }

  return (
    <form
      aria-busy={isSubmitting}
      className={styles.petReminderForm}
      id={props.formId}
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <header className={styles.petReminderFormHeader}>
        <h2>Thêm nhắc hẹn</h2>
        <p>
          {isGlobal
            ? "Đặt lịch chăm sóc tiếp theo cho thú cưng của bạn"
            : `Đặt lịch chăm sóc tiếp theo cho ${props.petName}`}
        </p>
      </header>

      {isGlobal && (
        <label className={styles.petReminderField}>
          <span>Thú cưng <b aria-hidden="true">*</b></span>
          <select
            aria-invalid={Boolean(errors.petId)}
            disabled={isSubmitting}
            onChange={(event) => {
              setSelectedPetId(event.target.value);
              setErrors((current) => ({ ...current, petId: undefined, submit: undefined }));
            }}
            ref={firstFieldRef}
            value={selectedPetId}
          >
            <option value="">Chọn thú cưng</option>
            {props.pets.map((pet) => (
              <option key={pet.pet_id} value={pet.pet_id}>{pet.name}</option>
            ))}
          </select>
          <span className={styles.petReminderFieldMessage}>{errors.petId}</span>
        </label>
      )}

      <label className={styles.petReminderField}>
        <span>Loại nhắc hẹn <b aria-hidden="true">*</b></span>
        <select
          aria-invalid={Boolean(errors.type)}
          disabled={isSubmitting}
          onChange={(event) => {
            setType(event.target.value as ReminderType | "");
            setErrors((current) => ({ ...current, type: undefined, submit: undefined }));
          }}
          ref={isGlobal ? undefined : firstFieldRef}
          value={type}
        >
          <option value="">Chọn loại nhắc hẹn</option>
          {reminderTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className={styles.petReminderFieldMessage}>{errors.type}</span>
      </label>

      <label className={styles.petReminderField}>
        <span>Ngày hẹn <b aria-hidden="true">*</b></span>
        <input
          aria-invalid={Boolean(errors.dueDate)}
          disabled={isSubmitting}
          onChange={(event) => {
            setDueDate(event.target.value);
            setErrors((current) => ({ ...current, dueDate: undefined, submit: undefined }));
          }}
          type="date"
          value={dueDate}
        />
        <span className={styles.petReminderFieldMessage}>{errors.dueDate}</span>
      </label>

      <label className={`${styles.petReminderField} ${styles.petReminderNoteField}`}>
        <span>Ghi chú</span>
        <textarea
          disabled={isSubmitting}
          onChange={(event) => {
            setNote(event.target.value);
            setErrors((current) => ({ ...current, submit: undefined }));
          }}
          placeholder="VD: Tái khám sau đợt điều trị"
          value={note}
        />
      </label>

      <p className={styles.petReminderSubmitError} aria-live="polite">{errors.submit || "\u00a0"}</p>

      <div className={styles.petReminderFooter}>
        <p className={styles.petReminderPastWarning} aria-live="polite">
          {dueDate && dueDate < today
            ? "Ngày đã chọn đã qua. Nhắc hẹn sẽ được hiển thị là Quá hạn."
            : "\u00a0"}
        </p>
        <div className={styles.petReminderFormActions}>
          <button disabled={isSubmitting} onClick={handleCancel} type="button">Hủy</button>
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang tạo…" : "Tạo nhắc hẹn"}
          </button>
        </div>
      </div>
    </form>
  );
}
