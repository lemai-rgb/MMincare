import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };
type VaccineBody = {
  vaccine_name?: unknown;
  vaccine_date?: unknown;
  dose_number?: unknown;
  clinic_name?: unknown;
  note?: unknown;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Bạn cần đăng nhập để thêm mũi tiêm.", 401);

  let body: VaccineBody;
  try {
    body = (await request.json()) as VaccineBody;
  } catch {
    return errorResponse("Dữ liệu gửi lên không hợp lệ.");
  }

  const vaccineName = typeof body.vaccine_name === "string" ? body.vaccine_name.trim() : "";
  const vaccineDate = body.vaccine_date;
  const clinicName = typeof body.clinic_name === "string" ? body.clinic_name.trim() : null;
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const doseNumber = body.dose_number === "" || body.dose_number === null || body.dose_number === undefined
    ? null
    : Number(body.dose_number);

  if (!vaccineName || vaccineName.length > 100) return errorResponse("Vui lòng nhập tên vaccine hợp lệ.");
  if (!isIsoDate(vaccineDate)) return errorResponse("Vui lòng chọn ngày tiêm hợp lệ.");
  if (vaccineDate > new Date().toISOString().slice(0, 10)) return errorResponse("Ngày tiêm không được ở tương lai.");
  if (doseNumber !== null && (!Number.isInteger(doseNumber) || doseNumber < 1)) {
    return errorResponse("Số mũi phải là số nguyên lớn hơn hoặc bằng 1.");
  }

  const { petId } = await params;
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, species, date_of_birth")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("Không tìm thấy thú cưng.", 404);

  const { data: vaccineRecord, error: insertError } = await supabase
    .from("vaccine_records")
    .insert({
      created_by: userId,
      pet_id: pet.pet_id,
      vaccine_name: vaccineName,
      vaccine_date: vaccineDate,
      dose_number: doseNumber,
      clinic_name: clinicName || null,
      note: note || null,
    })
    .select("vaccine_record_id, vaccine_name, vaccine_date, dose_number, clinic_name, note")
    .single();

  if (insertError || !vaccineRecord) return errorResponse("Không thể lưu mũi tiêm lúc này.", 500);

  let suggestedNextDueDate: string | null = null;
  if (pet.date_of_birth) {
    const birth = new Date(`${pet.date_of_birth}T00:00:00Z`);
    const vaccination = new Date(`${vaccineDate}T00:00:00Z`);
    const ageAtVaccination = Math.floor((vaccination.getTime() - birth.getTime()) / 86_400_000);
    if (ageAtVaccination >= 0) {
      const { data: rules, error: rulesError } = await supabase
        .from("vaccine_schedule_rules")
        .select("vaccine_name, min_age_days, max_age_days, standard_interval_days")
        .eq("species", pet.species)
        .eq("is_active", true);

      if (!rulesError) {
        const matchingRule = (rules ?? [])
          .filter((rule) => rule.vaccine_name.trim().toLowerCase() === vaccineName.toLowerCase())
          .filter((rule) => ageAtVaccination >= rule.min_age_days)
          .filter((rule) => rule.max_age_days === null || ageAtVaccination <= rule.max_age_days)
          .sort((a, b) => b.min_age_days - a.min_age_days)[0];
        if (matchingRule) suggestedNextDueDate = addDays(vaccineDate, matchingRule.standard_interval_days);
      }
    }
  }

  return NextResponse.json({
    vaccine_record: vaccineRecord,
    suggested_next_due_date: suggestedNextDueDate,
    warning: vaccineDate > new Date().toISOString().slice(0, 10) ? "Ngày tiêm chưa đến." : null,
  }, { status: 201 });
}
