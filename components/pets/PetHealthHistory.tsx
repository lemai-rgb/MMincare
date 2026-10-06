"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HealthLogCreateForm } from "@/components/pets/HealthLogCreateForm";
import { PetHealthStatistics } from "@/components/pets/PetHealthStatistics";
import type { HealthDashboardPeriod } from "@/lib/healthLogs/dashboard";
import { fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
import styles from "@/styles/petDetail.module.css";

export type HealthLog = {
  health_log_id: string;
  pet_id: string;
  created_by: string;
  recorded_on: string;
  weight: number | null;
  food_amount: string | null;
  food_type: string | null;
  status: string | null;
  note: string | null;
  logged_at: string;
};

type HealthLogsPayload = {
  health_logs?: HealthLog[];
};

function formatRecordedOn(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "--/--/----";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatWeight(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)} kg`;
}

function getLatestHealthLog(logs: HealthLog[]) {
  return logs[0];
}

function getLatestWeight(logs: HealthLog[]) {
  return logs.find((log) => log.weight !== null)?.weight ?? null;
}

function getLatestStatus(logs: HealthLog[]) {
  return logs.find((log) => Boolean(log.status?.trim()))?.status ?? null;
}

function compareHealthLogs(left: HealthLog, right: HealthLog) {
  return right.recorded_on.localeCompare(left.recorded_on)
    || Date.parse(right.logged_at) - Date.parse(left.logged_at)
    || right.health_log_id.localeCompare(left.health_log_id);
}

function sortHealthLogs(logs: HealthLog[]) {
  return [...logs].sort(compareHealthLogs);
}

async function getHealthLogs(petId: string, signal: AbortSignal) {
  const { response, payload: rawPayload } = await fetchJsonWithTimeout(`/api/pets/${encodeURIComponent(petId)}/health-logs`, {
    cache: "no-store",
    signal,
  });
  const payload = (rawPayload && typeof rawPayload === "object" ? rawPayload : {}) as HealthLogsPayload;

  if (!response.ok || !Array.isArray(payload.health_logs) || !payload.health_logs.every((log) => {
    if (!log || typeof log !== "object") return false;
    const row = log as Partial<HealthLog>;
    return typeof row.health_log_id === "string" && typeof row.pet_id === "string"
      && typeof row.created_by === "string" && typeof row.recorded_on === "string"
      && typeof row.logged_at === "string" && Number.isFinite(Date.parse(row.logged_at))
      && (row.weight === null || (typeof row.weight === "number" && Number.isFinite(row.weight)))
      && [row.food_amount, row.food_type, row.status, row.note].every((value) => value === null || typeof value === "string");
  })) {
    throw new Error("Health log request failed");
  }

  return payload.health_logs;
}

function HealthLogCard({ log, currentUserId }: { log: HealthLog; currentUserId: string }) {
  const fields = useMemo(() => [
    log.weight !== null ? <span className={styles.healthLogMetric} key="weight">{formatWeight(log.weight)}</span> : null,
    log.food_amount ? <span className={styles.healthLogMetric} key="food-amount">{log.food_amount}</span> : null,
    log.food_type ? <span className={styles.healthLogMetric} key="food-type">{log.food_type}</span> : null,
    log.status ? <span className={styles.healthLogWide} key="status">Tình trạng: {log.status}</span> : null,
    log.note ? <span className={`${styles.healthLogWide} ${styles.healthLogNote}`} key="note">Ghi chú: {log.note}</span> : null,
  ].filter(Boolean), [log]);

  return (
    <article className={styles.healthLogCard}>
      <div className={styles.healthLogHeader}>
        <span>{formatRecordedOn(log.recorded_on)}</span>
        <span aria-hidden="true">•</span>
        <span>{formatTime(log.logged_at)}</span>
      </div>

      <div className={styles.healthLogDetails}>{fields}</div>

      {log.created_by === currentUserId && (
        <p className={styles.healthLogCreator}>Thêm bởi bạn</p>
      )}
    </article>
  );
}

function LatestHealthSummary({
  healthLogs,
  isLoading,
  loadError,
}: {
  healthLogs: HealthLog[];
  isLoading: boolean;
  loadError: boolean;
}) {
  const latestLog = getLatestHealthLog(healthLogs);
  const latestWeight = getLatestWeight(healthLogs);
  const latestStatus = getLatestStatus(healthLogs);

  return (
    <section className={styles.healthLatestSummary} aria-labelledby="health-latest-summary-title">
      <h3 id="health-latest-summary-title">Tóm tắt gần nhất</h3>
      {isLoading ? (
        <p className={styles.healthSummaryMuted}>Đang tải dữ liệu…</p>
      ) : loadError ? (
        <p className={styles.healthSummaryMuted}>Chưa thể tải dữ liệu sức khỏe.</p>
      ) : (
        <>
          <p>Cân nặng: {latestWeight === null ? "Chưa có dữ liệu" : formatWeight(latestWeight)}</p>
          <p>Tình trạng gần nhất: {latestStatus || "Chưa có dữ liệu"}</p>
          <span>
            {latestLog
              ? `Cập nhật gần nhất: ${formatRecordedOn(latestLog.recorded_on)} • ${formatTime(latestLog.logged_at)}`
              : "Chưa có cập nhật"}
          </span>
        </>
      )}
    </section>
  );
}

export function PetHealthHistory({
  activeView,
  currentUserId,
  formOpen,
  initialPeriod,
  petId,
  petName,
}: {
  activeView: "history" | "statistics";
  currentUserId: string;
  formOpen: boolean;
  initialPeriod: HealthDashboardPeriod;
  petId: string;
  petName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [notice, setNotice] = useState("");
  const requestId = useRef(0);

  const retry = useCallback(() => {
    setLoadError(false);
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    if (activeView !== "history") return undefined;

    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
      setIsLoading(true);
      setLoadError(false);
      setHealthLogs([]);
    });

    void getHealthLogs(petId, controller.signal)
      .then((nextLogs) => {
        if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
        setHealthLogs(nextLogs);
        setLoadError(false);
      })
      .catch(() => {
        if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
        setLoadError(true);
      })
      .finally(() => {
        if (active && !controller.signal.aborted && activeRequestId === requestId.current) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [activeView, petId, reloadToken]);

  const upperPetName = petName.toLocaleUpperCase("vi-VN");

  function setFormState(nextOpen: boolean) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "health");
    nextParams.delete("view");
    nextParams.delete("period");
    if (nextOpen) nextParams.set("form", "health-log");
    else nextParams.delete("form");
    const query = nextParams.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function openForm() {
    setNotice("");
    setFormState(true);
  }

  function closeForm() {
    setFormState(false);
  }

  function handleCreated(healthLog: HealthLog) {
    setHealthLogs((current) => sortHealthLogs([
      ...current.filter((item) => item.health_log_id !== healthLog.health_log_id),
      healthLog,
    ]));
    setNotice("Đã lưu chỉ số sức khỏe.");
    setFormState(false);
    router.refresh();
  }

  function handleHealthTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentView: "history" | "statistics") {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextView = currentView === "history" ? "statistics" : "history";
    const nextTabId = nextView === "history" ? "health-history-tab" : "health-statistics-tab";
    setHealthView(nextView);
    document.getElementById(nextTabId)?.focus();
  }

  function setHealthView(nextView: "history" | "statistics") {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "health");
    nextParams.delete("form");
    if (nextView === "statistics") nextParams.set("view", "statistics");
    else {
      nextParams.delete("view");
      nextParams.delete("period");
    }
    const query = nextParams.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function changeStatisticsPeriod(nextPeriod: HealthDashboardPeriod) {
    if (nextPeriod === initialPeriod) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "health");
    nextParams.set("view", "statistics");
    nextParams.set("period", nextPeriod);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  return (
    <section aria-labelledby={activeView === "history" ? "health-history-title" : undefined} className={styles.healthHistory}>
      {activeView === "history" && (
        <h2 className={styles.healthHeading} id="health-history-title">
          SỨC KHỎE CỦA {upperPetName}: Theo dõi cân nặng, chế độ ăn và tình trạng sức khỏe theo thời gian.
        </h2>
      )}

      <div className={styles.healthToolbar}>
        <div className={styles.healthSubnav} role="tablist" aria-label="Nội dung sức khỏe">
          <button
            aria-selected={activeView === "history"}
            aria-controls="health-history-panel"
            className={activeView === "history" ? styles.healthSubnavActive : styles.healthSubnavInactive}
            id="health-history-tab"
            onClick={() => setHealthView("history")}
            onKeyDown={(event) => handleHealthTabKeyDown(event, "history")}
            role="tab"
            tabIndex={activeView === "history" ? 0 : -1}
            type="button"
          >
            Nhật ký sức khỏe
          </button>
          <button
            aria-selected={activeView === "statistics"}
            aria-controls="health-statistics-panel"
            className={activeView === "statistics" ? styles.healthSubnavActive : styles.healthSubnavInactive}
            id="health-statistics-tab"
            onClick={() => setHealthView("statistics")}
            onKeyDown={(event) => handleHealthTabKeyDown(event, "statistics")}
            role="tab"
            tabIndex={activeView === "statistics" ? 0 : -1}
            type="button"
          >
            Thống kê
          </button>
        </div>
        {activeView === "history" && (
          <button className={styles.healthAddButton} onClick={openForm} type="button">
            <span aria-hidden="true">＋</span>
            Thêm chỉ số
          </button>
        )}
        {activeView === "statistics" && (
          <div className={styles.healthPeriodControls} aria-label="Khoảng thời gian thống kê" role="group">
            <button
              aria-pressed={initialPeriod === "week"}
              className={initialPeriod === "week" ? styles.healthPeriodActive : ""}
              onClick={() => changeStatisticsPeriod("week")}
              type="button"
            >
              Theo tuần
            </button>
            <button
              aria-pressed={initialPeriod === "month"}
              className={initialPeriod === "month" ? styles.healthPeriodActive : ""}
              onClick={() => changeStatisticsPeriod("month")}
              type="button"
            >
              Theo tháng
            </button>
          </div>
        )}
      </div>

      {activeView === "statistics" ? (
        <div aria-labelledby="health-statistics-tab" className={styles.healthTabPanel} id="health-statistics-panel" role="tabpanel" tabIndex={0}>
          <PetHealthStatistics period={initialPeriod} petId={petId} />
        </div>
      ) : formOpen ? (
        <div aria-labelledby="health-history-tab" className={styles.healthTabPanel} id="health-history-panel" role="tabpanel" tabIndex={0}>
          <div className={styles.healthCreateWorkspace}>
            <LatestHealthSummary healthLogs={healthLogs} isLoading={isLoading} loadError={loadError} />
            <HealthLogCreateForm onCancel={closeForm} onCreated={handleCreated} petId={petId} />
          </div>
        </div>
      ) : (
        <div aria-labelledby="health-history-tab" className={styles.healthTabPanel} id="health-history-panel" role="tabpanel" tabIndex={0}>
          <p className={styles.healthSuccessNotice} aria-live="polite">{notice || "\u00a0"}</p>
          <h3 className={styles.healthRecentTitle}>Nhật ký gần đây</h3>

          {isLoading && (
            <div aria-busy="true" className={styles.healthLogList}>
              <div className={styles.healthLogSkeleton} />
              <div className={styles.healthLogSkeleton} />
            </div>
          )}

          {!isLoading && loadError && (
            <div className={styles.healthLoadError} role="alert">
              <p>Không thể tải nhật ký sức khỏe.</p>
              <button onClick={retry} type="button">Thử lại</button>
            </div>
          )}

          {!isLoading && !loadError && healthLogs.length === 0 && (
            <div className={styles.healthEmptyState}>
              <p>Chưa có dữ liệu sức khỏe</p>
              <p>Thêm chỉ số đầu tiên để bắt đầu theo dõi sức khỏe của {petName}.</p>
              <button className={styles.healthEmptyAction} onClick={openForm} type="button">
                <span aria-hidden="true">＋</span>
                Thêm chỉ số đầu tiên
              </button>
            </div>
          )}

          {!isLoading && !loadError && healthLogs.length > 0 && (
            <div className={styles.healthLogList}>
              {healthLogs.map((log) => (
                <HealthLogCard currentUserId={currentUserId} key={log.health_log_id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
