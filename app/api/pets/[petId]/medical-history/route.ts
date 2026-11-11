import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function attachmentLabel(fileType: string) {
  return fileType === "pdf" ? "File khám bệnh (PDF)" : "Ảnh khám bệnh";
}

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return jsonError("Bạn cần đăng nhập để xem hồ sơ y tế.", 401);

  const { petId } = await params;
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, owner_id")
    .eq("pet_id", petId)
    .maybeSingle();

  if (petError || !pet) return jsonError("Không tìm thấy thú cưng.", 404);

  const [vaccinesResult, medicalResult] = await Promise.all([
    supabase
      .from("vaccine_records")
      .select("vaccine_record_id, vaccine_name, vaccine_date, dose_number, clinic_name, note")
      .eq("pet_id", petId)
      .order("vaccine_date", { ascending: false }),
    supabase
      .from("medical_records")
      .select("record_id, created_by, visit_date, diagnosis, symptoms, medication, clinic_name, note")
      .eq("pet_id", petId)
      .order("visit_date", { ascending: false })
      .order("record_id", { ascending: false }),
  ]);

  if (vaccinesResult.error || medicalResult.error) {
    return jsonError("Không thể tải hồ sơ y tế lúc này.", 500);
  }

  const isOwner = pet.owner_id === userId;
  const medicalRecordIds = isOwner ? (medicalResult.data ?? []).map((record) => record.record_id) : [];
  const attachmentsByRecord = new Map<string, Array<{
    attachment_id: string;
    file_name: string;
    file_type: "jpg" | "jpeg" | "png" | "pdf";
  }>>();

  if (medicalRecordIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from("medical_attachments")
      .select("attachment_id, record_id, file_type")
      .in("record_id", medicalRecordIds)
      .order("uploaded_at", { ascending: true });

    if (attachmentsError) {
      return jsonError("Không thể tải hồ sơ y tế lúc này.", 500);
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

  const vaccines = (vaccinesResult.data ?? []).map((record) => ({
    id: record.vaccine_record_id,
    type: "vaccine" as const,
    eventDate: record.vaccine_date,
    title: record.vaccine_name,
    description: [
      record.dose_number ? `Mũi số ${record.dose_number}` : null,
      record.note,
    ].filter(Boolean).join(" • "),
    clinicName: record.clinic_name,
    doseNumber: record.dose_number,
  }));

  const medical = (medicalResult.data ?? []).map((record) => ({
    id: record.record_id,
    type: "medical" as const,
    eventDate: record.visit_date,
    title: record.diagnosis || "Lần khám bệnh",
    description: [record.symptoms, record.medication, record.note].filter(Boolean).join(" • "),
    clinicName: record.clinic_name,
    doseNumber: null,
    addedByCurrentUser: isOwner && record.created_by === userId,
    attachments: attachmentsByRecord.get(record.record_id) ?? [],
  }));

  const latestMedicalRow = medicalResult.data?.[0];
  const latestMedicalRecord = latestMedicalRow
    ? {
        id: latestMedicalRow.record_id,
        visitDate: latestMedicalRow.visit_date,
        diagnosis: latestMedicalRow.diagnosis,
        symptoms: latestMedicalRow.symptoms,
        clinicName: latestMedicalRow.clinic_name,
      }
    : null;
  const records = [...vaccines, ...medical].sort(
    (a, b) => b.eventDate.localeCompare(a.eventDate) || b.id.localeCompare(a.id),
  );
  return NextResponse.json({ records, latestMedicalRecord });
}

