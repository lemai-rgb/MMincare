import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ petId: string; medicalRecordId: string }>;
};

type DeleteError = { code?: string; message?: string } | null;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ATTACHMENT_BUCKET = "medical-record-attachments";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function logDeleteError(operation: string, error: DeleteError) {
  if (process.env.NODE_ENV !== "production" && error) {
    console.error(`[medical-record-delete] ${operation}`, {
      code: error.code,
      message: error.message,
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { petId, medicalRecordId } = await params;
  if (!isUuid(petId) || !isUuid(medicalRecordId)) {
    return errorResponse("Mã bản ghi không hợp lệ.", 400);
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Bạn cần đăng nhập để xóa bản ghi.", 401);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError) {
    logDeleteError("pet ownership lookup", petError);
    return errorResponse("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) return errorResponse("Không tìm thấy bản ghi.", 404);

  const { data: record, error: recordError } = await supabase
    .from("medical_records")
    .select("record_id")
    .eq("record_id", medicalRecordId)
    .eq("pet_id", petId)
    .eq("created_by", userId)
    .maybeSingle();
  if (recordError) {
    logDeleteError("record lookup", recordError);
    return errorResponse("Không thể kiểm tra bản ghi lúc này.", 500);
  }
  if (!record) return errorResponse("Không tìm thấy bản ghi.", 404);

  const { data: attachments, error: attachmentsError } = await supabase
    .from("medical_attachments")
    .select("attachment_id, file_url")
    .eq("record_id", medicalRecordId);
  if (attachmentsError) {
    logDeleteError("attachment lookup", attachmentsError);
    return errorResponse("Không thể kiểm tra tệp đính kèm lúc này.", 500);
  }

  const { count: detachedReminders, error: reminderError } = await supabase
    .from("reminders")
    .select("reminder_id", { count: "exact", head: true })
    .eq("pet_id", petId)
    .eq("source_medical_record_id", medicalRecordId);
  if (reminderError) {
    logDeleteError("related reminder lookup", reminderError);
    return errorResponse("Không thể kiểm tra nhắc hẹn liên quan lúc này.", 500);
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from("medical_records")
    .delete()
    .eq("record_id", medicalRecordId)
    .eq("pet_id", petId)
    .eq("created_by", userId)
    .select("record_id");
  if (deleteError) {
    logDeleteError("record delete", deleteError);
    if (deleteError.code === "23503") return errorResponse("Bản ghi còn dữ liệu liên quan chưa thể xóa.", 409);
    if (deleteError.code === "42501") return errorResponse("Bạn không có quyền xóa bản ghi này.", 403);
    return errorResponse("Không thể xóa bản ghi lúc này.", 500);
  }
  if (!deletedRows || deletedRows.length !== 1) {
    return errorResponse("Không tìm thấy bản ghi.", 404);
  }

  const paths = [...new Set((attachments ?? []).map((attachment) => attachment.file_url).filter(Boolean))];
  let attachmentCleanup: "complete" | "pending" = "complete";
  const warnings: string[] = [];
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
    if (storageError) {
      attachmentCleanup = "pending";
      warnings.push("Medical record was deleted, but one or more private attachment objects require cleanup.");
      logDeleteError("storage cleanup", storageError);
    }
  }

  return NextResponse.json({
    success: true,
    deleted_record_id: record.record_id,
    detached_reminders: detachedReminders ?? 0,
    deleted_attachments: attachments?.length ?? 0,
    attachment_cleanup: attachmentCleanup,
    warnings,
  });
}
