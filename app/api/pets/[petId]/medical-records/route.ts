import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServerTiming } from "@/lib/performance/serverTiming";

type RouteContext = { params: Promise<{ petId: string }> };

const MAX_LENGTHS = {
  symptoms: 2000,
  diagnosis: 2000,
  clinic_name: 200,
  medication: 2000,
  note: 500,
} as const;

const FIELD_LABELS: Record<keyof typeof MAX_LENGTHS, string> = {
  symptoms: "Triệu chứng",
  diagnosis: "Chẩn đoán",
  clinic_name: "Phòng khám",
  medication: "Thuốc kê",
  note: "Ghi chú",
};

type OptionalField = keyof typeof MAX_LENGTHS;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function attachmentLabel(fileType: string) {
  return fileType === "pdf" ? "File khám bệnh (PDF)" : "Ảnh khám bệnh";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeOptionalField(body: Record<string, unknown>, field: OptionalField) {
  const value = body[field];
  if (value === undefined || value === null) return { value: null as string | null };
  if (typeof value !== "string") return { error: `${FIELD_LABELS[field]} không hợp lệ.` };

  const normalized = value.trim();
  if (normalized.length > MAX_LENGTHS[field]) {
    return { error: `${FIELD_LABELS[field]} vượt quá độ dài cho phép.` };
  }
  return { value: normalized || null };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const timing = createServerTiming("api.pet.medical-records");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await timing.measure("auth", () => supabase.auth.getClaims());
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    timing.finish("error");
    return jsonError("Bạn cần đăng nhập để xem các lần khám.", 401);
  }

  const { petId } = await params;
  const { data: pet, error: petError } = await timing.measure("pet_ownership", () => supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle());
  if (petError) {
    timing.finish("error");
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) {
    timing.finish("error");
    return jsonError("Không tìm thấy thú cưng.", 404);
  }

  const { data, error } = await timing.measure("medical_records", () => supabase
    .from("medical_records")
    .select("record_id, created_by, visit_date, symptoms, diagnosis, clinic_name, medication, note")
    .eq("pet_id", petId)
    .order("visit_date", { ascending: false }));
  if (error) {
    timing.finish("error");
    return jsonError("Không thể tải lịch sử khám bệnh lúc này.", 500);
  }

  const recordIds = (data ?? []).map((record) => record.record_id);
  const attachmentsByRecord = new Map<string, Array<{
    attachment_id: string;
    file_name: string;
    file_type: "jpg" | "jpeg" | "png" | "pdf";
  }>>();

  if (recordIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from("medical_attachments")
      .select("attachment_id, record_id, file_type")
      .in("record_id", recordIds)
      .order("uploaded_at", { ascending: true });

    if (attachmentsError) {
      timing.finish("error");
      return jsonError("Không thể tải lịch sử khám bệnh lúc này.", 500);
    }

    for (const attachment of attachments ?? []) {
      const current = attachmentsByRecord.get(attachment.record_id) ?? [];
      current.push({
        attachment_id: attachment.attachment_id,
        file_name: attachmentLabel(attachment.file_type),
        file_type: attachment.file_type,
      });
      attachmentsByRecord.set(attachment.record_id, current);
    }
  }

  const records = (data ?? []).map((record) => ({
    id: record.record_id,
    type: "medical" as const,
    eventDate: record.visit_date,
    title: record.diagnosis || "Lần khám bệnh",
    description: [record.symptoms, record.medication, record.note].filter(Boolean).join(" • "),
    clinicName: record.clinic_name,
    doseNumber: null,
    addedByCurrentUser: record.created_by === userId,
    attachments: attachmentsByRecord.get(record.record_id) ?? [],
  }));
  timing.finish("ok");
  return NextResponse.json({ records });
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return jsonError("Bạn cần đăng nhập để thêm lần khám.", 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonError("Dữ liệu lần khám không hợp lệ.", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonError("Dữ liệu lần khám không hợp lệ.", 400);
  }

  const visitDate = body.visit_date;
  const today = new Date().toISOString().slice(0, 10);
  if (typeof visitDate !== "string" || !isValidDate(visitDate)) {
    return jsonError("Vui lòng chọn ngày khám hợp lệ.", 400);
  }
  if (visitDate > today) return jsonError("Ngày khám không được ở tương lai.", 400);

  const normalized: Record<OptionalField, string | null> = {
    symptoms: null,
    diagnosis: null,
    clinic_name: null,
    medication: null,
    note: null,
  };
  for (const field of Object.keys(MAX_LENGTHS) as OptionalField[]) {
    const result = normalizeOptionalField(body, field);
    if (result.error) return jsonError(result.error, 400);
    normalized[field] = result.value ?? null;
  }

  const { petId } = await params;
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (petError) return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  // Owner-scoped Pet RLS intentionally does not reveal another Owner's Pet.
  if (!pet) return jsonError("Không tìm thấy thú cưng.", 404);

  const { data: medicalRecord, error: insertError } = await supabase
    .from("medical_records")
    .insert({
      pet_id: petId,
      created_by: userId,
      visit_date: visitDate,
      ...normalized,
    })
    .select("record_id, pet_id, created_by, visit_date, symptoms, diagnosis, clinic_name, medication, note")
    .single();

  if (insertError || !medicalRecord) {
    return jsonError("Không thể lưu lần khám lúc này.", 500);
  }

  return NextResponse.json({ medical_record: medicalRecord }, { status: 201 });
}
