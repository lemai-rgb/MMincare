"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  aggregateOtherStatusBreakdown,
  type HealthDashboardData,
  type HealthDashboardPeriod,
  type OtherStatusBreakdownEntry,
  type StatusCount,
  type WeightTrendPoint,
} from "@/lib/healthLogs/dashboard";
import { getReminderTypeLabel, type ReminderType } from "@/lib/reminders";
import styles from "@/styles/petDetail.module.css";

type DashboardPayload = HealthDashboardData & { error?: string };
type HealthLogsPayload = {
  health_logs?: Array<{
    health_log_id: string;
    recorded_on: string;
    weight: number | null;
    status: string | null;
    logged_at: string;
  }>;
  error?: string;
};

const WEIGHT_CHART_DIMENSIONS = { width: 600, height: 240, left: 56, right: 26, top: 20, bottom: 44 };
const STATUS_CHART_DIMENSIONS = { width: 600, height: 252, left: 48, right: 24, top: 20, bottom: 58 };

function formatDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00+07:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/----";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/----";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatWeight(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)} kg`;
}

function formatReminderDays(dueDate: string) {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const today = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const current = Date.parse(`${today.year}-${today.month}-${today.day}T00:00:00.000Z`);
  const due = Date.parse(`${dueDate}T00:00:00.000Z`);
  if (!Number.isFinite(current) || !Number.isFinite(due)) return "";

  const remaining = Math.max(0, Math.ceil((due - current) / 86_400_000));
  return remaining === 0 ? "Hôm nay" : `Còn ${remaining} ngày`;
}

async function getDashboard(petId: string, period: HealthDashboardPeriod, signal: AbortSignal) {
  const response = await fetch(
    `/api/pets/${encodeURIComponent(petId)}/dashboard?period=${encodeURIComponent(period)}`,
    { cache: "no-store", signal },
  );
  const payload = await response.json() as DashboardPayload;
  if (!response.ok || !payload.summary || !Array.isArray(payload.weight_trend) || !Array.isArray(payload.status_counts)) {
    throw new Error("Health dashboard request failed");
  }

  return payload;
}

async function getHealthLogs(petId: string, signal: AbortSignal) {
  const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/health-logs`, {
    cache: "no-store",
    signal,
  });
  const payload = await response.json() as HealthLogsPayload;
  if (!response.ok || !Array.isArray(payload.health_logs)) {
    throw new Error("Health log history request failed");
  }

  return payload.health_logs;
}

function WeightTrendChart({ points, titleId }: { points: WeightTrendPoint[]; titleId: string }) {
  const descriptionId = useId();
  const dimensions = WEIGHT_CHART_DIMENSIONS;
  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const { polyline, pointsWithCoordinates, yTicks } = useMemo(() => {
    const weights = points.map((point) => point.weight);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const padding = rawMax === rawMin ? Math.max(rawMax * 0.1, 0.5) : Math.max((rawMax - rawMin) * 0.12, 0.1);
    const min = Math.max(0, rawMin - padding);
    const max = rawMax + padding;
    const range = max - min || 1;
    const start = Date.parse(`${points[0].recorded_on}T00:00:00+07:00`);
    const end = Date.parse(`${points.at(-1)?.recorded_on ?? points[0].recorded_on}T00:00:00+07:00`);
    const duration = Math.max(1, end - start);
    const coordinates = points.map((point, index) => {
      const timestamp = Date.parse(`${point.recorded_on}T00:00:00+07:00`);
      const x = points.length === 1
        ? dimensions.left + plotWidth / 2
        : dimensions.left + ((timestamp - start) / duration) * plotWidth;
      const y = dimensions.top + (1 - (point.weight - min) / range) * plotHeight;
      return { ...point, x, y, index };
    });

    return {
      polyline: coordinates.map((point) => `${point.x},${point.y}`).join(" "),
      pointsWithCoordinates: coordinates,
      yTicks: Array.from({ length: 5 }, (_, index) => min + (range / 4) * index).reverse(),
    };
  }, [dimensions.left, dimensions.top, plotHeight, plotWidth, points]);

  return (
    <div className={styles.healthChartGraphic}>
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className={styles.healthChartSvg}
        role="img"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <line className={styles.healthChartAxis} x1={dimensions.left} x2={dimensions.left} y1={dimensions.top} y2={dimensions.height - dimensions.bottom} />
        <line className={styles.healthChartAxis} x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={dimensions.height - dimensions.bottom} y2={dimensions.height - dimensions.bottom} />
        {yTicks.map((tick) => {
          const range = yTicks[0] - yTicks.at(-1)! || 1;
          const y = dimensions.top + ((yTicks[0] - tick) / range) * plotHeight;
          return (
            <g key={tick}>
              <line className={styles.healthChartTick} x1={dimensions.left - 7} x2={dimensions.left} y1={y} y2={y} />
              <text className={styles.healthChartText} textAnchor="end" x={dimensions.left - 12} y={y + 5}>
                {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(tick)}
              </text>
            </g>
          );
        })}
        <text className={styles.healthChartLabel} x={12} y={dimensions.top + 12}>kg</text>
        <text className={styles.healthChartLabel} textAnchor="end" x={dimensions.width - dimensions.right} y={dimensions.height - 8}>Thời gian</text>
        <polyline className={styles.healthTrendLine} fill="none" points={polyline} />
        {pointsWithCoordinates.map((point) => (
          <g key={`${point.logged_at}-${point.index}`}>
            <circle
              aria-label={`${formatDateTime(point.logged_at)}: ${formatWeight(point.weight)}`}
              className={styles.healthTrendPoint}
              cx={point.x}
              cy={point.y}
              r={4}
              tabIndex={0}
            >
              <title>{`${formatDateTime(point.logged_at)}: ${formatWeight(point.weight)}`}</title>
            </circle>
            {(point.index % labelEvery === 0 || point.index === points.length - 1) && (
              <text className={styles.healthChartText} textAnchor="middle" x={point.x} y={dimensions.height - dimensions.bottom + 25}>
                {formatDate(point.recorded_on).slice(0, 5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className={styles.healthVisuallyHidden} id={descriptionId}>
        {points.map((point) => `${formatDate(point.recorded_on)}: ${formatWeight(point.weight)}`).join("; ")}
      </p>
    </div>
  );
}

function StatusFrequencyChart({
  counts,
  onOpenOther,
}: {
  counts: StatusCount[];
  onOpenOther: () => void;
}) {
  const descriptionId = useId();
  const dimensions = STATUS_CHART_DIMENSIONS;
  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  const maxCount = Math.max(...counts.map((count) => count.count), 1);
  const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
  const barWidth = Math.min(118, (plotWidth / counts.length) * 0.72);

  return (
    <div className={`${styles.healthChartGraphic} ${styles.healthStatusChartGraphic}`}>
      <svg
        aria-describedby={descriptionId}
        aria-label="Biểu đồ tần suất trạng thái"
        className={styles.healthChartSvg}
        role="group"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <line className={styles.healthChartAxis} x1={dimensions.left} x2={dimensions.left} y1={dimensions.top} y2={dimensions.height - dimensions.bottom} />
        <line className={styles.healthChartAxis} x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={dimensions.height - dimensions.bottom} y2={dimensions.height - dimensions.bottom} />
        {Array.from({ length: 5 }, (_, index) => yMax - (yMax / 4) * index).map((tick) => {
          const y = dimensions.top + ((yMax - tick) / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line className={styles.healthChartTick} x1={dimensions.left - 7} x2={dimensions.left} y1={y} y2={y} />
              <text className={styles.healthChartText} textAnchor="end" x={dimensions.left - 12} y={y + 5}>{tick}</text>
            </g>
          );
        })}
        {counts.map((count, index) => {
          const center = dimensions.left + ((index + 0.5) / counts.length) * plotWidth;
          const height = (count.count / yMax) * plotHeight;
          const y = dimensions.height - dimensions.bottom - height;
          const isOther = count.status === "Khác";
          const canOpenOther = isOther && count.count > 0;
          const labelLines = count.label === "Ăn kém/Bỏ ăn" ? ["Ăn kém/", "Bỏ ăn"] : [count.label];

          function handleOtherKeyDown(event: KeyboardEvent<SVGElement>) {
            if (!canOpenOther || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            onOpenOther();
          }

          return (
            <g key={count.status}>
              <rect
                aria-label={`${count.label}: ${count.count} lần`}
                className={`${styles.healthStatusBar} ${canOpenOther ? styles.healthStatusBarInteractive : ""}`}
                height={height}
                rx={2}
                onClick={canOpenOther ? onOpenOther : undefined}
                onKeyDown={handleOtherKeyDown}
                role={canOpenOther ? "button" : undefined}
                tabIndex={canOpenOther ? 0 : undefined}
                width={barWidth}
                x={center - barWidth / 2}
                y={y}
              >
                <title>{`${count.label}: ${count.count} lần`}</title>
              </rect>
              <text
                aria-label={canOpenOther ? `Xem chi tiết ${count.label}` : undefined}
                className={`${styles.healthChartText} ${canOpenOther ? styles.healthStatusLabelInteractive : ""}`}
                onClick={canOpenOther ? onOpenOther : undefined}
                onKeyDown={handleOtherKeyDown}
                role={canOpenOther ? "button" : undefined}
                tabIndex={canOpenOther ? 0 : undefined}
                textAnchor="middle"
                x={center}
                y={dimensions.height - dimensions.bottom + 25}
              >
                {labelLines.map((line, lineIndex) => (
                  <tspan dy={lineIndex === 0 ? 0 : 14} key={line} x={center}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.healthVisuallyHidden} id={descriptionId}>
        {counts.map((count) => `${count.label}: ${count.count} lần`).join("; ")}
      </p>
    </div>
  );
}

function SummaryCards({ data }: { data: HealthDashboardData }) {
  const reminder = data.summary.upcoming_reminder;
  const medicalRecord = data.summary.latest_medical_record;

  return (
    <div className={styles.healthStatsCards}>
      <article className={styles.healthStatsCard}>
        <h3>Cân nặng gần nhất</h3>
        {data.summary.latest_weight ? (
          <>
            <p className={styles.healthStatsMetric}>{formatWeight(data.summary.latest_weight.weight)}</p>
            <span>{formatDate(data.summary.latest_weight.recorded_on)}</span>
          </>
        ) : <p className={styles.healthStatsEmpty}>Chưa có dữ liệu</p>}
      </article>

      <article className={styles.healthStatsCard}>
        <h3>Nhắc hẹn sắp tới</h3>
        {reminder ? (
          <>
            <p className={styles.healthStatsMetric}>{getReminderTypeLabel(reminder.type as ReminderType)}</p>
            <span>{formatReminderDays(reminder.due_date)}</span>
          </>
        ) : <p className={styles.healthStatsEmpty}>Không có nhắc hẹn sắp tới</p>}
      </article>

      <article className={styles.healthStatsCard}>
        <h3>Lần khám gần nhất</h3>
        {medicalRecord ? (
          <>
            <p className={styles.healthStatsMetric}>{formatDate(medicalRecord.visit_date)}</p>
            <span>{medicalRecord.diagnosis || medicalRecord.symptoms || medicalRecord.note || "Lần khám bệnh"}</span>
          </>
        ) : <p className={styles.healthStatsEmpty}>Chưa có lần khám</p>}
      </article>
    </div>
  );
}

function OtherStatusBreakdown({
  entries,
  isLoading,
  error,
  onClose,
  onRetry,
}: {
  entries: OtherStatusBreakdownEntry[];
  isLoading: boolean;
  error: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className={styles.healthOtherBreakdown} aria-labelledby="other-status-breakdown-title">
      <div className={styles.healthOtherBreakdownHeader}>
        <div>
          <h4 id="other-status-breakdown-title">Chi tiết tình trạng khác</h4>
          {!isLoading && !error && <span>{total} lần</span>}
        </div>
        <button aria-label="Đóng chi tiết tình trạng khác" onClick={onClose} type="button">Đóng</button>
      </div>

      {isLoading && <p className={styles.healthOtherBreakdownMessage}>Đang tải chi tiết tình trạng khác…</p>}
      {error && (
        <div className={styles.healthOtherBreakdownError} role="alert">
          <p>Không thể tải chi tiết tình trạng khác lúc này.</p>
          <button onClick={onRetry} type="button">Thử lại</button>
        </div>
      )}
      {!isLoading && !error && (
        <ul className={styles.healthOtherBreakdownList}>
          {entries.map((entry) => (
            <li key={entry.label}>
              <span>{entry.label}</span>
              <strong>{entry.count} lần</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PetHealthStatistics({
  petId,
  period,
}: {
  petId: string;
  period: HealthDashboardPeriod;
}) {
  const [data, setData] = useState<HealthDashboardData | null>(null);
  const [failedPeriod, setFailedPeriod] = useState<HealthDashboardPeriod | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [otherPanelRange, setOtherPanelRange] = useState<{
    period: HealthDashboardPeriod;
    periodEnd: string;
  } | null>(null);
  const [otherBreakdown, setOtherBreakdown] = useState<OtherStatusBreakdownEntry[]>([]);
  const [isOtherBreakdownLoading, setIsOtherBreakdownLoading] = useState(false);
  const [otherBreakdownError, setOtherBreakdownError] = useState(false);
  const requestId = useRef(0);
  const otherBreakdownRequestId = useRef(0);
  const otherBreakdownController = useRef<AbortController | null>(null);

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    const controller = new AbortController();

    void getDashboard(petId, period, controller.signal)
      .then((nextData) => {
        if (activeRequestId !== requestId.current || controller.signal.aborted) return;
        setData(nextData);
        setFailedPeriod(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (activeRequestId !== requestId.current || controller.signal.aborted) return;
        setFailedPeriod(period);
      })
      .finally(() => {
        if (activeRequestId === requestId.current && !controller.signal.aborted) setIsRetrying(false);
      });

    return () => controller.abort();
  }, [period, petId, retryToken]);

  function retry() {
    setIsRetrying(true);
    setFailedPeriod(null);
    setRetryToken((current) => current + 1);
  }

  function closeOtherBreakdown() {
    otherBreakdownController.current?.abort();
    setOtherPanelRange(null);
    setIsOtherBreakdownLoading(false);
  }

  function openOtherBreakdown() {
    const activeData = data;
    const otherCount = activeData?.status_counts.find((count) => count.status === "Khác")?.count ?? 0;
    if (!activeData || otherCount === 0) return;

    otherBreakdownController.current?.abort();
    const controller = new AbortController();
    const activeRequestId = ++otherBreakdownRequestId.current;
    otherBreakdownController.current = controller;
    setOtherPanelRange({ period: activeData.period, periodEnd: activeData.period_end });
    setOtherBreakdown([]);
    setOtherBreakdownError(false);
    setIsOtherBreakdownLoading(true);

    void getHealthLogs(petId, controller.signal)
      .then((healthLogs) => {
        if (activeRequestId !== otherBreakdownRequestId.current || controller.signal.aborted) return;
        setOtherBreakdown(aggregateOtherStatusBreakdown(healthLogs, {
          period: activeData.period,
          period_start: activeData.period_start,
          period_end: activeData.period_end,
        }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (activeRequestId !== otherBreakdownRequestId.current || controller.signal.aborted) return;
        setOtherBreakdownError(true);
      })
      .finally(() => {
        if (activeRequestId === otherBreakdownRequestId.current && !controller.signal.aborted) {
          setIsOtherBreakdownLoading(false);
        }
      });
  }

  const loadError = failedPeriod === period;
  const isLoading = isRetrying || (!loadError && data?.period !== period);
  const statusTotal = data?.status_counts.reduce((total, item) => total + item.count, 0) ?? 0;
  const isOtherBreakdownOpen = otherPanelRange?.period === period
    && otherPanelRange.periodEnd === data?.period_end;

  return (
    <section aria-busy={isLoading} className={styles.healthStatistics} aria-labelledby="health-statistics-title">
      <h2 className={styles.healthVisuallyHidden} id="health-statistics-title">Thống kê sức khỏe</h2>

      {isLoading && (
        <div className={styles.healthStatsLoading} aria-live="polite">
          <span>Đang tải thống kê sức khỏe…</span>
          <div className={styles.healthStatsCards}>
            <div className={styles.healthStatsSkeleton} />
            <div className={styles.healthStatsSkeleton} />
            <div className={styles.healthStatsSkeleton} />
          </div>
          <div className={styles.healthChartGrid}>
            <div className={styles.healthChartSkeleton} />
            <div className={styles.healthChartSkeleton} />
          </div>
        </div>
      )}

      {!isLoading && loadError && (
        <div className={styles.healthStatsError} role="alert">
          <p>Không thể tải thống kê sức khỏe lúc này.</p>
          <button onClick={retry} type="button">Thử lại</button>
        </div>
      )}

      {!isLoading && !loadError && data && (
        <>
          <SummaryCards data={data} />

          <div className={styles.healthChartGrid}>
            <section className={styles.healthChartPanel} aria-labelledby="weight-trend-title">
              <h3 id="weight-trend-title">XU HƯỚNG CÂN NẶNG</h3>
              {data.weight_trend.length >= 2 ? (
                <WeightTrendChart points={data.weight_trend} titleId="weight-trend-title" />
              ) : (
                <div className={styles.healthChartEmpty}>
                  <p>Chưa đủ dữ liệu để hiển thị biểu đồ.</p>
                  <span>Hãy thêm ít nhất 2 lần ghi nhận cân nặng.</span>
                </div>
              )}
            </section>

            <section className={styles.healthChartPanel} aria-labelledby="status-frequency-title">
              <h3 id="status-frequency-title">Tần suất trạng thái</h3>
              <p className={styles.healthChartSubtitle}>Số lần ghi nhận</p>
              {statusTotal > 0 ? (
                <>
                  <StatusFrequencyChart
                    counts={data.status_counts}
                    onOpenOther={openOtherBreakdown}
                  />
                  {isOtherBreakdownOpen && (
                    <OtherStatusBreakdown
                      entries={otherBreakdown}
                      error={otherBreakdownError}
                      isLoading={isOtherBreakdownLoading}
                      onClose={closeOtherBreakdown}
                      onRetry={openOtherBreakdown}
                    />
                  )}
                </>
              ) : (
                <div className={styles.healthChartEmpty}>
                  <p>Chưa có dữ liệu tình trạng trong khoảng thời gian này.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
