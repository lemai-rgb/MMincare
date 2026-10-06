import { NextResponse } from "next/server";

import { createServerTiming } from "@/lib/performance/serverTiming";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string; healthLogId: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUSINESS_FIELDS = ["weight", "food_amount", "food_type", "status", "note"] as const;
const ALLOWED_FIELDS = ["recorded_on", ...BUSINESS_FIELDS] as const;
const TEXT_FIELDS = ["food_amount", "food_type", "status", "note"] as const;
const SELECT_FIELDS = "health_log_id, pet_id, created_by, recorded_on, weight, food_amount, food_type, status, note, logged_at";

type AllowedField = (typeof ALLOWED_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validUuid(value: string) {
  return UUID_PATTERN.test(value);
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

function validRecordedOn(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && value <= getVietnamToday();
}

function hasAtMostTwoDecimalPlaces(value: number) {
  const normalized = value.toString().toLowerCase();
  const [coefficient, exponentText] = normalized.split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  const exponent = exponentText === undefined ? 0 : Number(exponentText);
  return Math.max(0, fractionLength - exponent) <= 2;
}

function validWeight(value: unknown) {
  return typeof value === "number"
    && Number.isFinite(value)
    && value > 0
    && value <= 9999.99
    && hasAtMostTwoDecimalPlaces(value);
}

function normalizeText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return "invalid" as const;
  return value.trim() || null;
}

async function getOwnedPet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  petId: string,
  userId: string,
) {
  return supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
}

async function authenticate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  timing: ReturnType<typeof createServerTiming>,
  message: string,
) {
  const { data, error } = await timing.measure("auth", () => supabase.auth.getClaims());
  const userId = data?.claims?.sub;
  return { error: error || !userId ? jsonError(message, 401) : null, userId };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const timing = createServerTiming("api.pet.health-log.patch");
  const supabase = await createClient();
  const auth = await authenticate(supabase, timing, "Bạn cần đăng nhập để sửa nhật ký sức khỏe.");
  if (auth.error) {
    timing.finish("error");
    return auth.error;
  }
  if (!auth.userId) {
    timing.finish("error");
    return jsonError("Bạn cần đăng nhập để sửa nhật ký sức khỏe.", 401);
  }

  const { petId, healthLogId } = await params;
  if (!validUuid(petId) || !validUuid(healthLogId)) {
    timing.finish("error");
    return jsonError("Mã nhật ký sức khỏe không hợp lệ.", 400);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    timing.finish("error");
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    timing.finish("error");
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }

  const body = payload as Record<string, unknown>;
  const bodyKeys = Object.keys(body);
  if (bodyKeys.length === 0 || bodyKeys.some((key) => !ALLOWED_FIELDS.includes(key as AllowedField))) {
    timing.finish("error");
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }
  if (Object.prototype.hasOwnProperty.call(body, "recorded_on") && !validRecordedOn(body.recorded_on)) {
    timing.finish("error");
    return jsonError("Ngày ghi nhận phải có định dạng YYYY-MM-DD, là ngày hợp lệ và không ở tương lai.", 400);
  }

  const normalizedText: Partial<Record<TextField, string | null>> = {};
  for (const field of TEXT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const normalized = normalizeText(body[field]);
    if (normalized === "invalid") {
      timing.finish("error");
      return jsonError("Thông tin nhật ký sức khỏe không hợp lệ.", 400);
    }
    normalizedText[field] = normalized;
  }
  if (Object.prototype.hasOwnProperty.call(body, "weight")
    && body.weight !== null
    && !validWeight(body.weight)) {
    timing.finish("error");
    return jsonError("Cân nặng phải là số lớn hơn 0, tối đa 4 chữ số nguyên và 2 chữ số thập phân.", 400);
  }

  const { data: pet, error: petError } = await timing.measure("pet_ownership", () => getOwnedPet(supabase, petId, auth.userId as string));
  if (petError) {
    timing.finish("error");
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) {
    timing.finish("error");
    return jsonError("Không tìm thấy thú cưng.", 404);
  }

  const { data: current, error: currentError } = await timing.measure("health_log_read", () => supabase
    .from("health_logs")
    .select(SELECT_FIELDS)
    .eq("health_log_id", healthLogId)
    .eq("pet_id", petId)
    .maybeSingle());
  if (currentError) {
    timing.finish("error");
    return jsonError("Không thể tải nhật ký sức khỏe lúc này.", 500);
  }
  if (!current) {
    timing.finish("error");
    return jsonError("Không tìm thấy nhật ký sức khỏe.", 404);
  }

  const candidate = {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(body, "recorded_on") ? { recorded_on: body.recorded_on } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, "weight") ? { weight: body.weight } : {}),
    ...normalizedText,
  };
  const hasBusinessValue = candidate.weight !== null
    || TEXT_FIELDS.some((field) => typeof candidate[field] === "string" && candidate[field].trim() !== "");
  if (!hasBusinessValue) {
    timing.finish("error");
    return jsonError("Vui lòng giữ lại ít nhất một thông tin sức khỏe.", 400);
  }

  const updateData: Record<string, unknown> = {};
  for (const key of bodyKeys) {
    if (key === "recorded_on") updateData.recorded_on = body.recorded_on;
    else if (key === "weight") updateData.weight = body.weight;
    else updateData[key] = normalizedText[key as TextField];
  }

  const { data: healthLog, error: updateError } = await timing.measure("health_log_update", () => supabase
    .from("health_logs")
    .update(updateData)
    .eq("health_log_id", healthLogId)
    .eq("pet_id", petId)
    .select(SELECT_FIELDS)
    .maybeSingle());
  if (updateError) {
    timing.finish("error");
    return jsonError("Không thể lưu thay đổi nhật ký sức khỏe lúc này.", 500);
  }
  if (!healthLog) {
    timing.finish("error");
    return jsonError("Không tìm thấy nhật ký sức khỏe.", 404);
  }

  timing.finish("ok");
  return NextResponse.json({ health_log: healthLog });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const timing = createServerTiming("api.pet.health-log.delete");
  const supabase = await createClient();
  const auth = await authenticate(supabase, timing, "Bạn cần đăng nhập để xóa nhật ký sức khỏe.");
  if (auth.error) {
    timing.finish("error");
    return auth.error;
  }
  if (!auth.userId) {
    timing.finish("error");
    return jsonError("Bạn cần đăng nhập để xóa nhật ký sức khỏe.", 401);
  }

  const { petId, healthLogId } = await params;
  if (!validUuid(petId) || !validUuid(healthLogId)) {
    timing.finish("error");
    return jsonError("Mã nhật ký sức khỏe không hợp lệ.", 400);
  }

  const { data: pet, error: petError } = await timing.measure("pet_ownership", () => getOwnedPet(supabase, petId, auth.userId as string));
  if (petError) {
    timing.finish("error");
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) {
    timing.finish("error");
    return jsonError("Không tìm thấy thú cưng.", 404);
  }

  const { data: deleted, error: deleteError } = await timing.measure("health_log_delete", () => supabase
    .from("health_logs")
    .delete()
    .eq("health_log_id", healthLogId)
    .eq("pet_id", petId)
    .select("health_log_id")
    .maybeSingle());
  if (deleteError) {
    timing.finish("error");
    return jsonError("Không thể xóa nhật ký sức khỏe lúc này.", 500);
  }
  if (!deleted) {
    timing.finish("error");
    return jsonError("Không tìm thấy nhật ký sức khỏe.", 404);
  }

  timing.finish("ok");
  return NextResponse.json({ deleted_health_log_id: healthLogId });
}
