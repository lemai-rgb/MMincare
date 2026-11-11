import { NextResponse } from "next/server";

import { getTodayInVietnam } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lòng đăng nhập để xem hồ sơ y tế." }, { status: 401 });

  const { data: access, error: accessError } = await supabase
    .from("pet_access")
    .select("access_id")
    .eq("pet_id", petId)
    .eq("caretaker_id", userId)
    .eq("status", "Active")
    .gte("valid_until", getTodayInVietnam())
    .maybeSingle();
  if (accessError || !access) return NextResponse.json({ error: "Không tìm thấy hồ sơ được chia sẻ." }, { status: 404 });

  const [vaccinesResult, medicalResult] = await Promise.all([
    supabase
      .from("vaccine_records")
      .select("vaccine_record_id, vaccine_name, vaccine_date, dose_number, clinic_name, note")
      .eq("pet_id", petId)
      .order("vaccine_date", { ascending: false })
      .order("vaccine_record_id", { ascending: false }),
    supabase
      .from("medical_records")
      .select("record_id, visit_date, diagnosis, symptoms, medication, clinic_name, note")
      .eq("pet_id", petId)
      .order("visit_date", { ascending: false })
      .order("record_id", { ascending: false }),
  ]);
  if (vaccinesResult.error || medicalResult.error) return NextResponse.json({ error: "Không thể tải hồ sơ y tế lúc này." }, { status: 500 });

  const records = [
    ...(vaccinesResult.data ?? []).map((record) => ({
      id: record.vaccine_record_id,
      type: "vaccine" as const,
      eventDate: record.vaccine_date,
      title: record.vaccine_name,
      description: [record.dose_number ? `Mũi số ${record.dose_number}` : null, record.note].filter(Boolean).join(" • "),
      clinicName: record.clinic_name,
      doseNumber: record.dose_number,
    })),
    ...(medicalResult.data ?? []).map((record) => ({
      id: record.record_id,
      type: "medical" as const,
      eventDate: record.visit_date,
      title: record.diagnosis || "Lần khám bệnh",
      description: [record.symptoms, record.medication, record.note].filter(Boolean).join(" • "),
      clinicName: record.clinic_name,
      doseNumber: null,
    })),
  ].sort((left, right) => right.eventDate.localeCompare(left.eventDate) || right.id.localeCompare(left.id));

  return NextResponse.json({ records, read_only: true });
}

