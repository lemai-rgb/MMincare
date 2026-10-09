import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServerTiming } from "@/lib/performance/serverTiming";

type RouteContext = { params: Promise<{ petId: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUSINESS_FIELDS = ["weight", "food_amount", "food_type", "status", "note"] as const;
const ALLOWED_FIELDS = ["recorded_on", ...BUSINESS_FIELDS] as const;
const POST_ALLOWED_FIELDS = [...ALLOWED_FIELDS, "idempotency_key"] as const;
const TEXT_FIELDS = ["food_amount", "food_type", "status", "note"] as const;
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

type TextField = (typeof TEXT_FIELDS)[number];

type HealthLogRecord = {
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

type IdempotentHealthLog = HealthLogRecord & {
  creation_payload_hash?: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function hashHealthLogPayload(payload: {
  recorded_on: string;
  weight: number | null;
  food_amount: string | null;
  food_type: string | null;
  status: string | null;
  note: string | null;
}) {
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

type NormalizedText = { ok: true; value: string | null } | { ok: false };

function normalizeText(value: unknown): NormalizedText {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };
  return { ok: true, value: value.trim() || null };
}

function hasAtMostTwoDecimalPlaces(value: number) {
  const normalized = value.toString().toLowerCase();
  const [coefficient, exponentText] = normalized.split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  const exponent = exponentText === undefined ? 0 : Number(exponentText);
  const decimalPlaces = Math.max(0, fractionLength - exponent);
  return decimalPlaces <= 2;
}

function validWeight(value: unknown) {
  return (
    typeof value === "number"
    && Number.isFinite(value)
    && value > 0
    && value <= 9999.99
    && hasAtMostTwoDecimalPlaces(value)
  );
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

export async function GET(_request: Request, { params }: RouteContext) {
  const timing = createServerTiming("api.pet.health-logs");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await timing.measure("auth", () => supabase.auth.getClaims());
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    timing.finish("error");
    return jsonError("Bạn cần đăng nhập để xem nhật ký sức khỏe.", 401);
  }

  const { petId } = await params;
  if (!validUuid(petId)) {
    timing.finish("error");
    return jsonError("Mã thú cưng không hợp lệ.", 400);
  }

  const { data: pet, error: petError } = await timing.measure("pet_ownership", () => getOwnedPet(supabase, petId, userId));
  if (petError) {
    timing.finish("error");
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) {
    timing.finish("error");
    return jsonError("Không tìm thấy thú cưng.", 404);
  }

  const { data: healthLogs, error: healthLogsError } = await timing.measure("health_logs", () => supabase
    .from("health_logs")
    .select("health_log_id, pet_id, created_by, recorded_on, weight, food_amount, food_type, status, note, logged_at")
    .eq("pet_id", petId)
    .order("recorded_on", { ascending: false })
    .order("logged_at", { ascending: false })
    .order("health_log_id", { ascending: false }));

  if (healthLogsError) {
    timing.finish("error");
    return jsonError("Không thể tải nhật ký sức khỏe lúc này.", 500);
  }

  timing.finish("ok");
  return NextResponse.json({ health_logs: healthLogs ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return jsonError("Bạn cần đăng nhập để thêm nhật ký sức khỏe.", 401);
  }

  const { petId } = await params;
  if (!validUuid(petId)) return jsonError("Mã thú cưng không hợp lệ.", 400);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }

  const body = payload as Record<string, unknown>;
  const bodyKeys = Object.keys(body);
  if (bodyKeys.some((key) => !POST_ALLOWED_FIELDS.includes(key as (typeof POST_ALLOWED_FIELDS)[number]))) {
    return jsonError("Dữ liệu nhật ký sức khỏe không hợp lệ.", 400);
  }

  const rawIdempotencyKey = body.idempotency_key;
  if (typeof rawIdempotencyKey !== "string"
    || !rawIdempotencyKey.trim()
    || rawIdempotencyKey.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    return jsonError("Yêu cầu tạo nhật ký không hợp lệ. Vui lòng thử lại.", 400);
  }
  const idempotencyKey = rawIdempotencyKey.trim();

  if (!validRecordedOn(body.recorded_on)) {
    return jsonError("Ngày ghi nhận phải có định dạng YYYY-MM-DD, là ngày hợp lệ và không ở tương lai.", 400);
  }

  for (const field of TEXT_FIELDS as readonly TextField[]) {
    const normalized = normalizeText(body[field]);
    if (!normalized.ok) return jsonError("Thông tin nhật ký sức khỏe không hợp lệ.", 400);
  }

  const weight = body.weight;
  if (weight !== undefined && weight !== null && !validWeight(weight)) {
    return jsonError("Cân nặng phải là số lớn hơn 0, tối đa 4 chữ số nguyên và 2 chữ số thập phân.", 400);
  }

  const normalizedText = Object.fromEntries(
    TEXT_FIELDS.map((field) => {
      const normalized = normalizeText(body[field]);
      return [field, normalized.ok ? normalized.value : null];
    }),
  ) as Record<TextField, string | null>;
  const normalizedWeight: number | null = weight === undefined || weight === null ? null : weight as number;
  const hasBusinessValue = normalizedWeight !== null
    || TEXT_FIELDS.some((field) => normalizedText[field] !== null);
  if (!hasBusinessValue) {
    return jsonError("Vui lòng nhập ít nhất một thông tin sức khỏe.", 400);
  }

  const { data: pet, error: petError } = await getOwnedPet(supabase, petId, userId);
  if (petError) return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  if (!pet) return jsonError("Không tìm thấy thú cưng.", 404);

  const canonicalPayload = {
    recorded_on: body.recorded_on as string,
    weight: normalizedWeight,
    ...normalizedText,
  };
  const payloadHash = hashHealthLogPayload(canonicalPayload);
  const selectFields = "health_log_id, pet_id, created_by, recorded_on, weight, food_amount, food_type, status, note, logged_at";
  const existingResult = await supabase
    .from("health_logs")
    .select(`${selectFields}, creation_payload_hash`)
    .eq("created_by", userId)
    .eq("pet_id", petId)
    .eq("creation_key", idempotencyKey)
    .maybeSingle();
  const existing = existingResult.data as IdempotentHealthLog | null;
  const existingError = existingResult.error;
  if (existingError) return jsonError("Không thể kiểm tra trạng thái nhật ký lúc này.", 500);
  if (existing) {
    if (existing.creation_payload_hash !== payloadHash) {
      const canonical = { ...existing };
      delete canonical.creation_payload_hash;
      return NextResponse.json({
        error: "Mã tạo đã được dùng cho dữ liệu khác.",
        recovery: "canonical",
        health_log: canonical,
      }, { status: 409 });
    }
    const healthLog = { ...existing };
    delete healthLog.creation_payload_hash;
    return NextResponse.json({ health_log: healthLog }, { status: 200 });
  }

  const { data: healthLog, error: insertError } = await supabase
    .from("health_logs")
    .insert({
      pet_id: petId,
      created_by: userId,
      ...canonicalPayload,
      creation_key: idempotencyKey,
      creation_payload_hash: payloadHash,
    })
    .select(selectFields)
    .single();

  if (insertError || !healthLog) {
    if (insertError?.code === "23505") {
      const concurrentResult = await supabase
        .from("health_logs")
        .select(`${selectFields}, creation_payload_hash`)
        .eq("created_by", userId)
        .eq("pet_id", petId)
        .eq("creation_key", idempotencyKey)
        .maybeSingle();
      const concurrent = concurrentResult.data as IdempotentHealthLog | null;
      const concurrentError = concurrentResult.error;
      if (!concurrentError && concurrent) {
        if (concurrent.creation_payload_hash !== payloadHash) {
          const canonical = { ...concurrent };
          delete canonical.creation_payload_hash;
          return NextResponse.json({
            error: "Mã tạo đã được dùng cho dữ liệu khác.",
            recovery: "canonical",
            health_log: canonical,
          }, { status: 409 });
        }
        const canonical = { ...concurrent };
        delete canonical.creation_payload_hash;
        return NextResponse.json({ health_log: canonical }, { status: 200 });
      }
    }
    return jsonError("Không thể lưu nhật ký sức khỏe lúc này.", 500);
  }

  return NextResponse.json({ health_log: healthLog }, { status: 201 });
}
