"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { HealthLog } from "@/components/pets/PetHealthHistory";
import {
  HEALTH_STATUS_OPTIONS,
  type HealthStatusOption,
} from "@/lib/healthLogs/statusOptions";
import styles from "@/styles/petDetail.module.css";

type HealthLogCreateFormProps = {
  petId: string;
  onCancel: () => void;
  onCreated: (healthLog: HealthLog) => void;
};

type HealthLogFormErrors = {
  recorded_on?: string;
  weight?: string;
  status?: string;
  form?: string;
};

type HealthLogCreatePayload = {
  health_log?: HealthLog;
  error?: string;
};

function normalizeText(value: string) {
  return value.trim() || null;
}

function parseWeight(value: string) {
  const normalized = value.trim();
  if (!normalized) return { value: null as number | null };

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return { error: "Cân nặng chỉ được có tối đa hai chữ số thập phân." };
  }

  const weight = Number(normalized);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 9999.99) {
    return { error: "Cân nặng phải lớn hơn 0 và không vượt quá 9999.99 kg." };
  }

  return { value: weight };
}

function getVietnamToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidRecordedOn(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && value <= getVietnamToday();
}

export function HealthLogCreateForm({ petId, onCancel, onCreated }: HealthLogCreateFormProps) {
  const [recordedOn, setRecordedOn] = useState(() => getVietnamToday());
  const [weight, setWeight] = useState("");
  const [foodType, setFoodType] = useState("");
  const [foodAmount, setFoodAmount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<HealthStatusOption | "">("");
  const [customStatus, setCustomStatus] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<HealthLogFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const submissionGuard = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function clearError(field?: keyof HealthLogFormErrors) {
    setErrors((current) => field
      ? { ...current, [field]: undefined, form: undefined }
      : { ...current, form: undefined });
  }

  function resetForm() {
    setRecordedOn(getVietnamToday());
    setWeight("");
    setFoodType("");
    setFoodAmount("");
    setSelectedStatus("");
    setCustomStatus("");
    setNote("");
    setErrors({});
  }

  function cancel() {
    if (submissionGuard.current) return;
    resetForm();
    onCancel();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionGuard.current) return;

    const parsedWeight = parseWeight(weight);
    if (parsedWeight.error) {
      setErrors({ weight: parsedWeight.error });
      return;
    }

    if (!isValidRecordedOn(recordedOn)) {
      setErrors({ recorded_on: "Ngày ghi nhận phải hợp lệ và không ở tương lai." });
      return;
    }

    const normalizedStatus = normalizeText(selectedStatus === "Khác" ? customStatus : selectedStatus);
    if (selectedStatus === "Khác" && !normalizedStatus) {
      setErrors({ status: "Vui lòng nhập tình trạng khác." });
      return;
    }

    const normalized = {
      recorded_on: recordedOn,
      weight: parsedWeight.value ?? null,
      food_amount: normalizeText(foodAmount),
      food_type: normalizeText(foodType),
      status: normalizedStatus,
      note: normalizeText(note),
    };

    const hasBusinessValue = normalized.weight !== null
      || normalized.food_amount !== null
      || normalized.food_type !== null
      || normalized.status !== null
      || normalized.note !== null;
    if (!hasBusinessValue) {
      setErrors({ form: "Vui lòng nhập ít nhất một thông tin sức khỏe." });
      return;
    }

    submissionGuard.current = true;
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/health-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });

      let payload: HealthLogCreatePayload = {};
      try {
        payload = await response.json() as HealthLogCreatePayload;
      } catch {
        // Keep the browser-facing error generic when the response is not JSON.
      }

      if (!response.ok || !payload.health_log) {
        throw new Error(response.status === 400 && payload.error
          ? payload.error
          : "Không thể lưu chỉ số sức khỏe lúc này. Vui lòng thử lại.");
      }

      resetForm();
      onCreated(payload.health_log);
    } catch (requestError: unknown) {
      setErrors({
        form: requestError instanceof TypeError
          ? "Không thể kết nối máy chủ. Vui lòng thử lại."
          : requestError instanceof Error
            ? requestError.message
            : "Không thể lưu chỉ số sức khỏe lúc này. Vui lòng thử lại.",
      });
    } finally {
      submissionGuard.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form aria-busy={isSubmitting} className={styles.healthCreateForm} noValidate onSubmit={submit}>
      <h3>CẬP NHẬT CHỈ SỐ SỨC KHỎE</h3>

      <div className={styles.healthCreateGrid}>
        <label className={`${styles.healthCreateField} ${styles.healthRecordedOnField}`}>
          <span>Ngày ghi nhận</span>
          <input
            aria-invalid={Boolean(errors.recorded_on)}
            disabled={isSubmitting}
            max={getVietnamToday()}
            onChange={(event) => {
              setRecordedOn(event.target.value);
              clearError("recorded_on");
            }}
            required
            type="date"
            value={recordedOn}
          />
          <span className={styles.healthFieldError} aria-live="polite">{errors.recorded_on || "\u00a0"}</span>
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthWeightField}`}>
          <span>Cân nặng</span>
          <span className={styles.healthWeightControl}>
            <input
              aria-invalid={Boolean(errors.weight)}
              disabled={isSubmitting}
              inputMode="decimal"
              onChange={(event) => {
                setWeight(event.target.value);
                clearError("weight");
              }}
              placeholder="VD: 2.00"
              ref={firstFieldRef}
              type="text"
              value={weight}
            />
            <span aria-hidden="true">kg</span>
          </span>
          <span className={styles.healthFieldError} aria-live="polite">{errors.weight || "\u00a0"}</span>
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthFoodTypeField}`}>
          <span>Loại thức ăn</span>
          <input
            disabled={isSubmitting}
            onChange={(event) => {
              setFoodType(event.target.value);
              clearError();
            }}
            placeholder="VD: Hạt Royal Canin, pate"
            type="text"
            value={foodType}
          />
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthFoodAmountField}`}>
          <span>Lượng thức ăn</span>
          <input
            disabled={isSubmitting}
            onChange={(event) => {
              setFoodAmount(event.target.value);
              clearError();
            }}
            placeholder="VD: 80g/ngày"
            type="text"
            value={foodAmount}
          />
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthStatusField}`}>
          <span>Tình trạng</span>
          <select
            aria-label="Tình trạng"
            className={selectedStatus ? undefined : styles.healthSelectPlaceholder}
            disabled={isSubmitting}
            onChange={(event) => {
              const nextStatus = event.target.value as HealthStatusOption | "";
              setSelectedStatus(nextStatus);
              if (nextStatus !== "Khác") setCustomStatus("");
              clearError("status");
            }}
            value={selectedStatus}
          >
            <option value="">Chọn tình trạng</option>
            {HEALTH_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {selectedStatus === "Khác" ? (
            <>
              <span>Tình trạng khác</span>
              <input
                aria-invalid={Boolean(errors.status)}
                disabled={isSubmitting}
                onChange={(event) => {
                  setCustomStatus(event.target.value);
                  clearError("status");
                }}
                placeholder="VD: Ho nhẹ, đi khập khiễng..."
                type="text"
                value={customStatus}
              />
              <span className={styles.healthFieldError} aria-live="polite">{errors.status || "\u00a0"}</span>
            </>
          ) : null}
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthCreateNote}`}>
          <span>Ghi chú</span>
          <textarea
            disabled={isSubmitting}
            onChange={(event) => {
              setNote(event.target.value);
              clearError();
            }}
            placeholder="VD: Tái khám sau đợt điều trị"
            value={note}
          />
        </label>
      </div>

      <p className={styles.healthSubmitError} aria-live="polite">{errors.form || "\u00a0"}</p>

      <div className={styles.healthCreateActions}>
        <button disabled={isSubmitting} onClick={cancel} type="button">Hủy</button>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang lưu…" : "Lưu chỉ số"}
        </button>
      </div>
    </form>
  );
}
