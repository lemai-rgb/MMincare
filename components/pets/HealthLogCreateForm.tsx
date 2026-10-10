"use client";
import { useRuntimeJson } from "@/lib/appRuntime";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import type { HealthLog } from "@/components/pets/PetHealthHistory";
import { InvalidJsonResponseError, RequestTimeoutError } from "@/lib/http/fetchJsonWithTimeout";
import {
  HEALTH_STATUS_OPTIONS,
  type HealthStatusOption,
} from "@/lib/healthLogs/statusOptions";
import styles from "@/styles/petDetail.module.css";

type HealthLogCreateFormProps = {
  healthLog?: HealthLog;
  petId: string;
  onCancel: () => void;
  onCreated: (healthLog: HealthLog) => void;
  onUpdated?: (healthLog: HealthLog) => void;
  onMutationStart?: () => void;
  onMutationCancel?: () => void;
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

type HealthLogCreateSnapshot = {
  idempotency_key: string;
  payload: {
    recorded_on: string;
    weight: number | null;
    food_amount: string | null;
    food_type: string | null;
    status: string | null;
    note: string | null;
  };
};

class HealthLogResponseError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly resultUncertain: boolean,
  ) {
    super(message);
    this.name = "HealthLogResponseError";
  }
}

function normalizeText(value: string) {
  return value.trim() || null;
}

function isHealthLog(value: unknown): value is HealthLog {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<HealthLog>;
  return typeof row.health_log_id === "string"
    && typeof row.pet_id === "string"
    && typeof row.created_by === "string"
    && typeof row.recorded_on === "string"
    && typeof row.logged_at === "string"
    && Number.isFinite(Date.parse(row.logged_at))
    && (row.weight === null || (typeof row.weight === "number" && Number.isFinite(row.weight)))
    && [row.food_amount, row.food_type, row.status, row.note].every((field) => field === null || typeof field === "string");
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

export function HealthLogCreateForm({ healthLog, petId, onCancel, onCreated, onUpdated, onMutationStart, onMutationCancel }: HealthLogCreateFormProps) {
  const requestJson = useRuntimeJson();
  const isEditing = Boolean(healthLog);
  const [recordedOn, setRecordedOn] = useState(() => healthLog?.recorded_on ?? getVietnamToday());
  const [weight, setWeight] = useState(() => healthLog?.weight === null || healthLog?.weight === undefined ? "" : String(healthLog.weight));
  const [foodType, setFoodType] = useState(() => healthLog?.food_type ?? "");
  const [foodAmount, setFoodAmount] = useState(() => healthLog?.food_amount ?? "");
  const [selectedStatus, setSelectedStatus] = useState<HealthStatusOption | "">(() => {
    const value = healthLog?.status ?? "";
    return HEALTH_STATUS_OPTIONS.includes(value as HealthStatusOption) ? value as HealthStatusOption : value ? "Khác" : "";
  });
  const [customStatus, setCustomStatus] = useState(() => {
    const value = healthLog?.status ?? "";
    return HEALTH_STATUS_OPTIONS.includes(value as HealthStatusOption) ? "" : value;
  });
  const [note, setNote] = useState(() => healthLog?.note ?? "");
  const [errors, setErrors] = useState<HealthLogFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultUncertain, setResultUncertain] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const submissionGuard = useRef(false);
  const mountedRef = useRef(true);
  const mutationControllerRef = useRef<AbortController | null>(null);
  const mutationSequenceRef = useRef(0);
  const creationKeyRef = useRef<string | null>(null);
  const createSnapshotRef = useRef<HealthLogCreateSnapshot | null>(null);
  const mutationAttemptedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const frame = window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    return () => {
      mountedRef.current = false;
      window.cancelAnimationFrame(frame);
    };
  }, [healthLog?.health_log_id]);

  useEffect(() => () => {
    mutationSequenceRef.current += 1;
    mutationControllerRef.current?.abort();
    mutationControllerRef.current = null;
  }, []);

  function clearError(field?: keyof HealthLogFormErrors) {
    setErrors((current) => field
      ? { ...current, [field]: undefined, form: undefined }
      : { ...current, form: undefined });
  }

  function preventImplicitSubmit(event: KeyboardEvent<HTMLInputElement>) {
    const composing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
    if (event.key === "Enter" && !composing) event.preventDefault();
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
    if (mutationAttemptedRef.current) {
      mutationAttemptedRef.current = false;
      onMutationCancel?.();
    }
    resetForm();
    setResultUncertain(false);
    onCancel();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionGuard.current) return;

    const retrySnapshot = !isEditing && resultUncertain ? createSnapshotRef.current : null;
    let normalized: HealthLogCreateSnapshot["payload"];
    if (retrySnapshot) {
      normalized = retrySnapshot.payload;
    } else {
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

      normalized = {
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
    }

    submissionGuard.current = true;
    mutationAttemptedRef.current = true;
    setIsSubmitting(true);
    setErrors({});
    onMutationStart?.();
    const operation = ++mutationSequenceRef.current;
    mutationControllerRef.current?.abort();
    const controller = new AbortController();
    mutationControllerRef.current = controller;
    if (!isEditing && !createSnapshotRef.current) {
      const idempotencyKey = creationKeyRef.current ?? crypto.randomUUID();
      createSnapshotRef.current = { idempotency_key: idempotencyKey, payload: normalized };
      creationKeyRef.current = idempotencyKey;
    }
    const requestBody = isEditing
      ? normalized
      : {
        ...createSnapshotRef.current?.payload,
        idempotency_key: createSnapshotRef.current?.idempotency_key,
      };

    try {
      const { response, payload: rawPayload } = await requestJson(
        isEditing
          ? `/api/pets/${encodeURIComponent(petId)}/health-logs/${encodeURIComponent(healthLog?.health_log_id ?? "")}`
          : `/api/pets/${encodeURIComponent(petId)}/health-logs`,
        {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        },
      );

      const payload = rawPayload && typeof rawPayload === "object"
        ? rawPayload as HealthLogCreatePayload
        : {};

      if (!response.ok) {
        if (!isEditing && response.status === 409 && isHealthLog(payload.health_log)) {
          if (!mountedRef.current || operation !== mutationSequenceRef.current || controller.signal.aborted) return;
          createSnapshotRef.current = null;
          creationKeyRef.current = null;
          mutationAttemptedRef.current = false;
          setResultUncertain(false);
          resetForm();
          onCreated(payload.health_log);
          return;
        }
        throw new HealthLogResponseError(
          response.status,
          response.status === 400 && payload.error
            ? payload.error
            : response.status === 409
            ? "Yêu cầu tạo nhật ký không thể khôi phục. Hãy kiểm tra nhật ký trước khi thử lại."
            : "Không thể lưu chỉ số sức khỏe lúc này. Vui lòng thử lại.",
          response.status >= 500,
        );
      }

      if (!isHealthLog(payload.health_log)) {
        throw new HealthLogResponseError(
          response.status,
          "Chưa đọc được kết quả lưu. Hãy kiểm tra nhật ký trước khi thử lại.",
          true,
        );
      }

      if (!mountedRef.current || operation !== mutationSequenceRef.current || controller.signal.aborted) return;
      createSnapshotRef.current = null;
      creationKeyRef.current = null;
      mutationAttemptedRef.current = false;
      setResultUncertain(false);
      if (isEditing) onUpdated?.(payload.health_log);
      else {
        resetForm();
        onCreated(payload.health_log);
      }
    } catch (requestError: unknown) {
      if (!mountedRef.current || operation !== mutationSequenceRef.current || controller.signal.aborted) return;
      const uncertain = requestError instanceof RequestTimeoutError
        || requestError instanceof InvalidJsonResponseError
        || requestError instanceof TypeError
        || requestError instanceof HealthLogResponseError && requestError.resultUncertain;
      if (!uncertain) {
        createSnapshotRef.current = null;
        creationKeyRef.current = null;
      }
      setResultUncertain(uncertain);
      setErrors({
        form: requestError instanceof RequestTimeoutError
          ? "Chưa xác nhận được kết quả lưu. Hãy kiểm tra nhật ký trước khi thử lại."
          : requestError instanceof InvalidJsonResponseError
          ? "Chưa đọc được kết quả lưu. Hãy kiểm tra nhật ký trước khi thử lại."
          : requestError instanceof TypeError
          ? "Mất kết nối khi lưu. Hãy kiểm tra nhật ký trước khi thử lại."
          : requestError instanceof HealthLogResponseError && requestError.resultUncertain
          ? requestError.message
          : requestError instanceof Error
            ? requestError.message
            : "Không thể lưu chỉ số sức khỏe lúc này. Vui lòng thử lại.",
      });
    } finally {
      if (operation !== mutationSequenceRef.current) return;
      submissionGuard.current = false;
      if (mutationControllerRef.current === controller) mutationControllerRef.current = null;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form aria-busy={isSubmitting} className={styles.healthCreateForm} noValidate onSubmit={submit}>
      <h3>{isEditing ? "CHỈNH SỬA CHỈ SỐ SỨC KHỎE" : "CẬP NHẬT CHỈ SỐ SỨC KHỎE"}</h3>

      <div className={styles.healthCreateGrid}>
        <label className={`${styles.healthCreateField} ${styles.healthRecordedOnField}`}>
          <span>Ngày ghi nhận</span>
          <input
            aria-invalid={Boolean(errors.recorded_on)}
            disabled={isSubmitting || resultUncertain}
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
              disabled={isSubmitting || resultUncertain}
              inputMode="decimal"
              onChange={(event) => {
                setWeight(event.target.value);
                clearError("weight");
              }}
              onKeyDown={preventImplicitSubmit}
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
            disabled={isSubmitting || resultUncertain}
            onChange={(event) => {
              setFoodType(event.target.value);
              clearError();
            }}
            onKeyDown={preventImplicitSubmit}
            placeholder="VD: Hạt Royal Canin, pate"
            type="text"
            value={foodType}
          />
        </label>

        <label className={`${styles.healthCreateField} ${styles.healthFoodAmountField}`}>
          <span>Lượng thức ăn</span>
          <input
            disabled={isSubmitting || resultUncertain}
            onChange={(event) => {
              setFoodAmount(event.target.value);
              clearError();
            }}
            onKeyDown={preventImplicitSubmit}
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
            disabled={isSubmitting || resultUncertain}
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
                disabled={isSubmitting || resultUncertain}
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
            disabled={isSubmitting || resultUncertain}
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
          {isSubmitting ? "Đang lưu…" : resultUncertain ? "Thử lại an toàn" : isEditing ? "Lưu thay đổi" : "Lưu chỉ số"}
        </button>
      </div>
    </form>
  );
}
