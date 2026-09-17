import { NextResponse } from "next/server";

import {
  aggregateStatusCounts,
  buildWeightTrend,
  getLatestWeight,
  getPeriodRange,
  getVietnamToday,
  isHealthDashboardPeriod,
  type HealthDashboardData,
  type HealthLogDashboardRow,
} from "@/lib/healthLogs/dashboard";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

type QueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function logDashboardError(stage: string, error: QueryError) {
  console.error("[PET-HEALTH-DASHBOARD] Query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function GET(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return jsonError("Bạn cần đăng nhập để xem thống kê sức khỏe.", 401);
  }

  const { petId } = await params;
  if (!UUID_PATTERN.test(petId)) return jsonError("Mã thú cưng không hợp lệ.", 400);

  const requestedPeriod = new URL(request.url).searchParams.get("period");
  if (requestedPeriod !== null && !isHealthDashboardPeriod(requestedPeriod)) {
    return jsonError("Khoảng thời gian không hợp lệ.", 400);
  }

  const range = getPeriodRange(requestedPeriod ?? "week");
  const today = getVietnamToday();
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (petError) {
    logDashboardError("pet ownership", petError);
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) return jsonError("Không tìm thấy thú cưng.", 404);

  const [periodHealthLogsResult, latestWeightResult, upcomingReminderResult, latestMedicalRecordResult] = await Promise.all([
    supabase
      .from("health_logs")
      .select("health_log_id, recorded_on, weight, status, logged_at", { count: "exact" })
      .eq("pet_id", petId)
      .gte("recorded_on", range.period_start.slice(0, 10))
      .lte("recorded_on", range.period_end.slice(0, 10))
      .order("recorded_on", { ascending: true })
      .order("logged_at", { ascending: true })
      .order("health_log_id", { ascending: true }),
    supabase
      .from("health_logs")
      .select("health_log_id, recorded_on, weight, status, logged_at")
      .eq("pet_id", petId)
      .not("weight", "is", null)
      .lte("recorded_on", range.period_end.slice(0, 10))
      .order("recorded_on", { ascending: false })
      .order("logged_at", { ascending: false })
      .order("health_log_id", { ascending: false })
      .limit(1),
    supabase
      .from("reminders")
      .select("reminder_id, type, due_date, note")
      .eq("user_id", userId)
      .eq("pet_id", petId)
      .eq("status", "Upcoming")
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("medical_records")
      .select("record_id, visit_date, diagnosis, symptoms, note")
      .eq("pet_id", petId)
      .order("visit_date", { ascending: false })
      .order("record_id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const queryResults = [
    ["health_logs", periodHealthLogsResult.error],
    ["latest weight", latestWeightResult.error],
    ["upcoming reminder", upcomingReminderResult.error],
    ["latest medical record", latestMedicalRecordResult.error],
  ] as const;
  const failedQuery = queryResults.find(([, error]) => error);
  if (failedQuery) {
    logDashboardError(failedQuery[0], failedQuery[1] as QueryError);
    return jsonError("Không thể tải thống kê sức khỏe lúc này.", 500);
  }

  const periodRows = (periodHealthLogsResult.data ?? []) as HealthLogDashboardRow[];
  const latestWeightRows = (latestWeightResult.data ?? []) as HealthLogDashboardRow[];
  const response: HealthDashboardData = {
    period: range.period,
    period_start: range.period_start,
    period_end: range.period_end,
    summary: {
      health_log_count: periodHealthLogsResult.count ?? 0,
      latest_health_log_at: periodRows.at(-1)?.recorded_on ?? null,
      latest_weight: getLatestWeight(latestWeightRows, range.period_end),
      upcoming_reminder: upcomingReminderResult.data ?? null,
      latest_medical_record: latestMedicalRecordResult.data ?? null,
    },
    weight_trend: buildWeightTrend(periodRows, range),
    status_counts: aggregateStatusCounts(periodRows, range),
  };

  return NextResponse.json(response);
}
