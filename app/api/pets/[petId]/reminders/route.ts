import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

function response(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return response("Bạn cần đăng nhập để tạo nhắc hẹn.", 401);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return response("Dữ liệu gửi lên không hợp lệ.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return response("Dữ liệu gửi lên không hợp lệ.", 400);
  }

  const body = payload as Record<string, unknown>;
  const isVaccineReminder = body.type === "Vaccine";
  const isRecheckReminder = body.type === "Recheck";
  const hasVaccineSource = body.source_vaccine_record_id !== undefined
    && body.source_vaccine_record_id !== null;
  const hasMedicalSource = body.source_medical_record_id !== undefined
    && body.source_medical_record_id !== null;

  if (
    (!isVaccineReminder && !isRecheckReminder)
    || !validDate(body.due_date)
    || hasVaccineSource === hasMedicalSource
    || (hasVaccineSource && !validUuid(body.source_vaccine_record_id))
    || (hasMedicalSource && !validUuid(body.source_medical_record_id))
    || (isVaccineReminder && !hasVaccineSource)
    || (isRecheckReminder && !hasMedicalSource)
    || (body.note !== undefined && body.note !== null && typeof body.note !== "string")
  ) {
    return response("Thông tin nhắc hẹn chưa đầy đủ.", 400);
  }

  const { petId } = await params;
  if (!validUuid(petId)) return response("Mã thú cưng không hợp lệ.", 400);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError) return response("Không thể kiểm tra quyền sở hữu thú cưng lúc này.", 500);
  if (!pet) return response("Bạn không có quyền tạo nhắc hẹn cho thú cưng này.", 403);

  if (isVaccineReminder) {
    const { data: vaccine, error: vaccineError } = await supabase
      .from("vaccine_records")
      .select("vaccine_record_id")
      .eq("vaccine_record_id", body.source_vaccine_record_id)
      .eq("pet_id", petId)
      .maybeSingle();
    if (vaccineError) return response("Không thể kiểm tra mũi tiêm lúc này.", 500);
    if (!vaccine) return response("Không tìm thấy mũi tiêm thuộc thú cưng này.", 404);
  } else {
    const { data: medicalRecord, error: medicalRecordError } = await supabase
      .from("medical_records")
      .select("record_id")
      .eq("record_id", body.source_medical_record_id)
      .eq("pet_id", petId)
      .eq("created_by", userId)
      .maybeSingle();
    if (medicalRecordError) return response("Không thể kiểm tra lần khám lúc này.", 500);
    if (!medicalRecord) return response("Không tìm thấy lần khám thuộc thú cưng này.", 404);
  }

  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  const reminderInput = {
    user_id: userId,
    pet_id: petId,
    type: isVaccineReminder ? "Vaccine" : "Recheck",
    due_date: body.due_date,
    note,
    source_vaccine_record_id: isVaccineReminder ? body.source_vaccine_record_id as string : null,
    source_medical_record_id: isRecheckReminder ? body.source_medical_record_id as string : null,
    status: "Upcoming",
  };

  const { data: reminder, error: insertError } = await supabase
    .from("reminders")
    .insert(reminderInput)
    .select("reminder_id, due_date, type, status, note, source_vaccine_record_id, source_medical_record_id")
    .single();

  if (insertError || !reminder) return response("Không thể tạo nhắc hẹn lúc này.", 500);

  return NextResponse.json({ reminder }, { status: 201 });
}
