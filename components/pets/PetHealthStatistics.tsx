"use client";
import { useRuntimeJson } from "@/lib/appRuntime";

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  aggregateOtherStatusBreakdown,
  type HealthDashboardData,
  type HealthDashboardPeriod,
  type HealthStatusRecord,
  type OtherStatusBreakdownEntry,
  type StatusCount,
  type WeightTrendPoint,
} from "@/lib/healthLogs/dashboard";
import { parseHealthDashboardData } from "@/lib/healthLogs/dashboardValidation";
import { fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
import { getReminderTypeLabel, type ReminderType } from "@/lib/reminders";
import styles from "@/styles/petDetail.module.css";

// Reserve separate rows for the unit, date ticks, and horizontal-axis title.
const WEIGHT_CHART_DIMENSIONS = { width: 600, height: 288, left: 56, right: 24, top: 24, bottom: 64 };
const STATUS_CHART_DIMENSIONS = { width: 600, height: 288, left: 40, right: 20, top: 24, bottom: 64 };

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

function formatLoggedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/---- --:--";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

async function getDashboard(petId: string, period: HealthDashboardPeriod, signal: AbortSignal, requestJson: typeof fetchJsonWithTimeout) {
  const { response, payload: rawPayload } = await requestJson(
    `/api/pets/${encodeURIComponent(petId)}/dashboard?period=${encodeURIComponent(period)}`,
    { cache: "no-store", signal },
  );
  const payload = parseHealthDashboardData(rawPayload, period);
  if (!response.ok || !payload) {
    throw new Error("Health dashboard request failed");
  }

  return payload;
}

function getWeightChartPeriodEnd(period: HealthDashboardPeriod, periodStart: string) {
  const [year, month, day] = periodStart.slice(0, 10).split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return periodStart.slice(0, 10);

  const end = new Date(Date.UTC(year, period === "week" ? month - 1 : month, period === "week" ? day + 6 : 0));
  return [end.getUTCFullYear(), String(end.getUTCMonth() + 1).padStart(2, "0"), String(end.getUTCDate()).padStart(2, "0")].join("-");
}

function WeightTrendChart({
  period,
  periodStart,
  points,
  titleId,
}: {
  period: HealthDashboardPeriod;
  periodStart: string;
  points: WeightTrendPoint[];
  titleId: string;
}) {
  const descriptionId = useId();
  const tooltipId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isTooltipPinned, setIsTooltipPinned] = useState(false);
  const dimensions = WEIGHT_CHART_DIMENSIONS;
  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  const periodStartDate = periodStart.slice(0, 10);
  const periodEndDate = getWeightChartPeriodEnd(period, periodStartDate);
  const { polyline, pointsWithCoordinates, yTicks } = useMemo(() => {
    const weights = points.map((point) => point.weight);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const padding = rawMax === rawMin ? Math.max(rawMax * 0.1, 0.5) : Math.max((rawMax - rawMin) * 0.12, 0.1);
    const min = Math.max(0, rawMin - padding);
    const max = rawMax + padding;
    const range = max - min || 1;
    const start = Date.parse(`${periodStartDate}T00:00:00+07:00`);
    const end = Date.parse(`${periodEndDate}T00:00:00+07:00`);
    const duration = Math.max(1, end - start);
    const coordinates = points.map((point, index) => {
      const timestamp = Date.parse(`${point.recorded_on}T00:00:00+07:00`);
      const x = dimensions.left + ((timestamp - start) / duration) * plotWidth;
      const y = dimensions.top + (1 - (point.weight - min) / range) * plotHeight;
      return { ...point, x, y, index };
    });

    return {
      polyline: coordinates.map((point) => `${point.x},${point.y}`).join(" "),
      pointsWithCoordinates: coordinates,
      yTicks: Array.from({ length: 5 }, (_, index) => min + (range / 4) * index).reverse(),
    };
  }, [dimensions.left, dimensions.top, periodEndDate, periodStartDate, plotHeight, plotWidth, points]);

  const activePoint = activeIndex === null ? null : pointsWithCoordinates[activeIndex] ?? null;
  const tooltipWidth = 238;
  const tooltipHeight = 112;
  const tooltipX = activePoint
    ? Math.min(Math.max(activePoint.x - tooltipWidth / 2, 8), dimensions.width - tooltipWidth - 8)
    : 0;
  const preferredTooltipY = activePoint ? activePoint.y - tooltipHeight - 12 : 0;
  const tooltipY = activePoint
    ? Math.min(
      Math.max(preferredTooltipY < dimensions.top ? activePoint.y + 12 : preferredTooltipY, 8),
      dimensions.height - tooltipHeight - 8,
    )
    : 0;

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setActiveIndex(null);
      setIsTooltipPinned(false);
    }

    function handleOutsidePointerDown(event: PointerEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setActiveIndex(null);
        setIsTooltipPinned(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, []);

  function openPoint(index: number) {
    setActiveIndex(index);
    if (activeIndex !== index) setIsTooltipPinned(false);
  }

  function closeUnpinnedPoint() {
    if (!isTooltipPinned) setActiveIndex(null);
  }

  function togglePinnedPoint(index: number) {
    if (activeIndex === index && isTooltipPinned) {
      setActiveIndex(null);
      setIsTooltipPinned(false);
      return;
    }

    setActiveIndex(index);
    setIsTooltipPinned(true);
  }

  function handlePointKeyDown(event: KeyboardEvent<SVGGElement>, index: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    togglePinnedPoint(index);
  }

  return (
    <div className={styles.healthChartGraphic} ref={chartRef}>
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-label={points.map((point) => `\u004e\u0067\u00e0\u0079 nh\u1eadt k\u00fd ${formatDate(point.recorded_on)}, ${formatWeight(point.weight)}, \u0111\u01b0\u1ee3c nh\u1eadp l\u00fac ${formatLoggedAt(point.logged_at)}`).join("; ")}
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
              {tick !== yTicks.at(-1) && <line className={styles.healthChartGridline} x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={y} y2={y} />}
              <line className={styles.healthChartTick} x1={dimensions.left - 7} x2={dimensions.left} y1={y} y2={y} />
              <text className={styles.healthChartText} textAnchor="end" x={dimensions.left - 12} y={y + 5}>
                {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(tick)}
              </text>
            </g>
          );
        })}
        <text className={styles.healthChartLabel} x={dimensions.left} y={dimensions.top - 22}>kg</text>
        {Array.from({ length: 4 }, (_, index) => {
          const start = Date.parse(`${periodStartDate}T00:00:00Z`);
          const days = Math.round((Date.parse(`${periodEndDate}T00:00:00Z`) - start) / 86_400_000);
          const offset = Math.round(days * index / 3);
          const day = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
          return <text className={styles.healthChartText} key={day} textAnchor={index === 0 ? "start" : index === 3 ? "end" : "middle"}
            x={dimensions.left + offset / Math.max(1, days) * plotWidth} y={dimensions.height - dimensions.bottom + 25}>
            {formatDate(day).slice(0, 5)}
          </text>;
        })}
        <text className={styles.healthChartLabel} textAnchor="middle" x={dimensions.left + plotWidth / 2} y={dimensions.height - 12}>Ngày ghi nhận</text>
        <polyline className={styles.healthTrendLine} fill="none" points={polyline} />
        {pointsWithCoordinates.map((point) => (
          <g
            aria-describedby={activeIndex === point.index ? tooltipId : undefined}
            aria-label={`Cân nặng: ${formatWeight(point.weight)}; Ngày nhật ký: ${formatDate(point.recorded_on)}; Được nhập lúc: ${formatLoggedAt(point.logged_at)}`}
            aria-pressed={activeIndex === point.index && isTooltipPinned}
            className={styles.healthTrendPointTarget}
            key={`${point.health_log_id}-${point.index}`}
            onBlur={closeUnpinnedPoint}
            onClick={() => togglePinnedPoint(point.index)}
            onFocus={() => openPoint(point.index)}
            onKeyDown={(event) => handlePointKeyDown(event, point.index)}
            onPointerEnter={() => openPoint(point.index)}
            onPointerLeave={closeUnpinnedPoint}
            role="button"
            tabIndex={0}
          >
            <circle className={styles.healthTrendPointHitArea} cx={point.x} cy={point.y} r={12} />
            <circle
              className={`${styles.healthTrendPoint} ${activeIndex === point.index ? styles.healthTrendPointActive : ""}`}
              cx={point.x}
              cy={point.y}
              r={4}
            />
          </g>
        ))}
        {activePoint && (
          <foreignObject height={tooltipHeight} width={tooltipWidth} x={tooltipX} y={tooltipY}>
            <div className={styles.healthWeightTooltip} id={tooltipId} role="tooltip">
              <strong>Cân nặng: {formatWeight(activePoint.weight)}</strong>
              <span>Ngày nhật ký: {formatDate(activePoint.recorded_on)}</span>
              <span>Được nhập lúc: {formatLoggedAt(activePoint.logged_at)}</span>
            </div>
          </foreignObject>
        )}
      </svg>
      <p className={styles.healthVisuallyHidden} id={descriptionId}>
        {points.map((point) => `Ngày nhật ký ${formatDate(point.recorded_on)}, ${formatWeight(point.weight)}, được nhập lúc ${formatLoggedAt(point.logged_at)}`).join("; ")}
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
  const tooltipId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [isTooltipPinned, setIsTooltipPinned] = useState(false);
  const dimensions = STATUS_CHART_DIMENSIONS;
  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  const maxCount = Math.max(...counts.map((count) => count.count), 1);
  const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
  const barWidth = Math.min(56, (plotWidth / counts.length) * 0.56);
  const activeCount = counts.find((count) => count.status === activeStatus) ?? null;
  const activeIndex = activeCount ? counts.findIndex((count) => count.status === activeCount.status) : -1;
  const activeCenter = activeIndex >= 0
    ? dimensions.left + ((activeIndex + 0.5) / counts.length) * plotWidth
    : 0;
  const tooltipWidth = 238;
  const tooltipCenterX = Math.min(
    Math.max(activeCenter, tooltipWidth / 2 + 8),
    dimensions.width - tooltipWidth / 2 - 8,
  );

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setActiveStatus(null);
      setIsTooltipPinned(false);
    }

    function handleOutsidePointerDown(event: PointerEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setActiveStatus(null);
        setIsTooltipPinned(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, []);

  function showTooltip(status: string) {
    if (activeStatus !== status) setIsTooltipPinned(false);
    setActiveStatus(status);
  }

  function hideTooltip() {
    if (!isTooltipPinned) setActiveStatus(null);
  }

  function toggleTooltip(status: string) {
    if (activeStatus === status && isTooltipPinned) {
      setActiveStatus(null);
      setIsTooltipPinned(false);
      return;
    }

    setActiveStatus(status);
    setIsTooltipPinned(true);
  }

  function handleBarKeyDown(event: KeyboardEvent<SVGGElement>, count: StatusCount) {
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveStatus(null);
      setIsTooltipPinned(false);
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    toggleTooltip(count.status);
    if (count.status === counts.at(-1)?.status && count.count > 0) onOpenOther();
  }

  function handleBarClick(count: StatusCount) {
    toggleTooltip(count.status);
    if (count.status === counts.at(-1)?.status && count.count > 0) onOpenOther();
  }

  return (
    <div className={styles.healthStatusChartViewport}>
      <div className={styles.healthStatusChartStage} ref={chartRef}>
        <div className={styles.healthChartGraphic}>
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
              {tick !== 0 && <line className={styles.healthChartGridline} x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={y} y2={y} />}
              <line className={styles.healthChartTick} x1={dimensions.left - 7} x2={dimensions.left} y1={y} y2={y} />
              <text className={styles.healthChartText} textAnchor="end" x={dimensions.left - 12} y={y + 5}>{tick}</text>
            </g>
          );
        })}
        {counts.map((count, index) => {
          const center = dimensions.left + ((index + 0.5) / counts.length) * plotWidth;
          const height = (count.count / yMax) * plotHeight;
          const y = dimensions.height - dimensions.bottom - height;
          const canOpenOther = count.status === counts.at(-1)?.status && count.count > 0;
          const labelLines = count.label.includes("/") ? count.label.split("/") : [count.label];
          const isActive = count.status === activeStatus;

          return (
            <g
              aria-describedby={isActive ? tooltipId : undefined}
              aria-label={`${count.label}: ${count.count} lần ghi nhận`}
              className={styles.healthStatusBarGroup}
              key={count.status}
              onBlur={hideTooltip}
              onClick={() => handleBarClick(count)}
              onFocus={() => showTooltip(count.status)}
              onKeyDown={(event) => handleBarKeyDown(event, count)}
              onMouseEnter={() => showTooltip(count.status)}
              onMouseLeave={hideTooltip}
              role="button"
              tabIndex={0}
            >
              <rect
                className={`${styles.healthStatusBar} ${canOpenOther ? styles.healthStatusBarInteractive : ""} ${isActive ? styles.healthStatusBarActive : ""}`}
                height={height}
                rx={5}
                width={barWidth}
                x={center - barWidth / 2}
                y={y}
              >
                <title>{`${count.label}: ${count.count} lần`}</title>
              </rect>
              <text
                className={`${styles.healthChartText} ${canOpenOther ? styles.healthStatusLabelInteractive : ""} ${isActive ? styles.healthStatusLabelActive : ""}`}
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
        {activeCount && (
        <div
          className={styles.healthStatusTooltip}
          id={tooltipId}
          role="tooltip"
          style={{ left: `${(tooltipCenterX / dimensions.width) * 100}%` }}
        >
          <strong>{activeCount.label}</strong>
          <span>{activeCount.count} lần ghi nhận</span>
          {activeCount.records.slice(0, 3).map((record: HealthStatusRecord) => (
            <div className={styles.healthStatusTooltipRecord} key={record.health_log_id}>
              <b>{record.status}</b>
              <span>Ngày nhật ký: {formatDate(record.recorded_on)}</span>
              <span>Được nhập lúc: {formatLoggedAt(record.logged_at)}</span>
            </div>
          ))}
          {activeCount.count > activeCount.records.slice(0, 3).length && (
            <span>Và {activeCount.count - activeCount.records.slice(0, 3).length} lần ghi nhận khác</span>
          )}
          </div>
        )}
      </div>
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
  onClose,
}: {
  entries: OtherStatusBreakdownEntry[];
  onClose: () => void;
}) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className={styles.healthOtherBreakdown} aria-labelledby="other-status-breakdown-title">
      <div className={styles.healthOtherBreakdownHeader}>
        <div>
          <h4 id="other-status-breakdown-title">Chi tiết tình trạng khác</h4>
          <span>{total} lần</span>
        </div>
        <button aria-label="Đóng chi tiết tình trạng khác" onClick={onClose} type="button">Đóng</button>
      </div>

      <ul className={styles.healthOtherBreakdownList}>
        {entries.map((entry) => (
          <li key={entry.label}>
            <div className={styles.healthOtherBreakdownEntryHeader}>
              <span>{entry.label}</span>
              <strong>{entry.count} lần</strong>
            </div>
            <ul className={styles.healthOtherBreakdownDates}>
              {entry.records.map((record) => (
                <li key={record.health_log_id}>
                  <span>Ngày nhật ký: {formatDate(record.recorded_on)}</span>
                  <span>Được nhập lúc: {formatLoggedAt(record.logged_at)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
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
  const requestJson = useRuntimeJson();
  const [data, setData] = useState<HealthDashboardData | null>(null);
  const [failedPeriod, setFailedPeriod] = useState<HealthDashboardPeriod | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [otherPanelRange, setOtherPanelRange] = useState<{
    period: HealthDashboardPeriod;
    periodEnd: string;
  } | null>(null);
  const [otherBreakdown, setOtherBreakdown] = useState<OtherStatusBreakdownEntry[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    const activeRequestId = ++requestId.current;
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active || controller.signal.aborted || activeRequestId !== requestId.current) return;
      setIsRetrying(true);
    });

    void getDashboard(petId, period, controller.signal, requestJson)
      .then((nextData) => {
        if (!active || activeRequestId !== requestId.current || controller.signal.aborted) return;
        setData(nextData);
        setFailedPeriod(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!active || activeRequestId !== requestId.current || controller.signal.aborted) return;
        setFailedPeriod(period);
      })
      .finally(() => {
        if (active && activeRequestId === requestId.current && !controller.signal.aborted) setIsRetrying(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [period, petId, retryToken, requestJson]);

  function retry() {
    setIsRetrying(true);
    setFailedPeriod(null);
    setRetryToken((current) => current + 1);
  }

  function closeOtherBreakdown() {
    setOtherPanelRange(null);
  }

  function openOtherBreakdown() {
    const activeData = data;
    const otherCount = activeData?.status_counts.at(-1);
    if (!activeData || !otherCount || otherCount.count === 0) return;

    setOtherPanelRange({ period: activeData.period, periodEnd: activeData.period_end });
    setOtherBreakdown(aggregateOtherStatusBreakdown(
      otherCount.records.map((record) => ({
        health_log_id: record.health_log_id,
        recorded_on: record.recorded_on,
        weight: null,
        status: record.status,
        logged_at: record.logged_at,
      })),
      activeData,
    ));
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
              <h3 id="weight-trend-title">Xu hướng cân nặng</h3>
              <p className={styles.healthChartSubtitle}>Cân nặng theo ngày ghi nhận</p>
              {data.weight_trend.length >= 2 ? (
                <WeightTrendChart
                  period={data.period}
                  periodStart={data.period_start}
                  points={data.weight_trend}
                  titleId="weight-trend-title"
                />
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
                      onClose={closeOtherBreakdown}
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
