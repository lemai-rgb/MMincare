import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ recordId: string }> };

const BUCKET = "medical-record-attachments";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ValidatedFile = { extension: "jpg" | "png" | "pdf"; contentType: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function validateFile(file: File): Promise<ValidatedFile | null> {
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return null;

  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d];
  const isPdf = bytes.some((byte, index) => byte === pdfHeader[0]
    && pdfHeader.every((expected, offset) => bytes[index + offset] === expected));

  if (file.type === "image/jpeg" && isJpeg) return { extension: "jpg", contentType: "image/jpeg" };
  if (file.type === "image/png" && isPng) return { extension: "png", contentType: "image/png" };
  if (file.type === "application/pdf" && isPdf) return { extension: "pdf", contentType: "application/pdf" };
  return null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return jsonError("Bạn cần đăng nhập để xem file khám bệnh.", 401);

  const { recordId } = await params;
  const attachmentId = new URL(request.url).searchParams.get("attachmentId");
  if (!UUID_PATTERN.test(recordId) || !attachmentId || !UUID_PATTERN.test(attachmentId)) {
    return jsonError("Thông tin file khám bệnh không hợp lệ.", 400);
  }

  const { data: medicalRecord, error: recordError } = await supabase
    .from("medical_records")
    .select("record_id, pet_id")
    .eq("record_id", recordId)
    .eq("created_by", userId)
    .maybeSingle();
  if (recordError) return jsonError("Không thể kiểm tra lần khám lúc này.", 500);
  if (!medicalRecord) return jsonError("Không tìm thấy lần khám.", 404);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", medicalRecord.pet_id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError) return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  if (!pet) return jsonError("Bạn không có quyền xem file khám bệnh này.", 403);

  const { data: attachment, error: attachmentError } = await supabase
    .from("medical_attachments")
    .select("attachment_id, file_url")
    .eq("attachment_id", attachmentId)
    .eq("record_id", recordId)
    .maybeSingle();
  if (attachmentError) return jsonError("Không thể kiểm tra file khám bệnh lúc này.", 500);
  if (!attachment) return jsonError("Không tìm thấy file khám bệnh.", 404);

  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(attachment.file_url, 60);
  if (signedUrlError || !signedData?.signedUrl) {
    return jsonError("Không thể mở file khám bệnh lúc này.", 500);
  }

  return NextResponse.json({ signed_url: signedData.signedUrl, expires_in: 60 });
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return jsonError("Bạn cần đăng nhập để tải file khám bệnh.", 401);

  const { recordId } = await params;
  if (!UUID_PATTERN.test(recordId)) return jsonError("Mã lần khám không hợp lệ.", 400);

  const { data: medicalRecord, error: recordError } = await supabase
    .from("medical_records")
    .select("record_id, pet_id")
    .eq("record_id", recordId)
    .eq("created_by", userId)
    .maybeSingle();

  if (recordError) {
    return jsonError("Không thể kiểm tra lần khám lúc này.", 500);
  }
  if (!medicalRecord) return jsonError("Không tìm thấy lần khám.", 404);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", medicalRecord.pet_id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError) {
    return jsonError("Không thể kiểm tra thú cưng lúc này.", 500);
  }
  if (!pet) return jsonError("Bạn không có quyền tải file cho lần khám này.", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("File khám bệnh không hợp lệ.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("Vui lòng chọn file khám bệnh.", 400);
  if (file.size > MAX_FILE_SIZE) return jsonError("File khám bệnh không được vượt quá 5MB.", 400);

  const validatedFile = await validateFile(file);
  if (!validatedFile) return jsonError("Chỉ hỗ trợ file JPG, JPEG, PNG hoặc PDF hợp lệ.", 400);

  const objectPath = `${userId}/${recordId}/${crypto.randomUUID()}.${validatedFile.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, { contentType: validatedFile.contentType, upsert: false });
  if (uploadError) {
    return jsonError("Không thể tải file khám bệnh lúc này.", 500);
  }

  const { data: attachment, error: metadataError } = await supabase
    .from("medical_attachments")
    .insert({
      record_id: recordId,
      uploaded_by: userId,
      file_url: objectPath,
      file_type: validatedFile.extension,
      file_size: file.size,
    })
    .select("attachment_id, record_id, file_url, file_type, file_size, uploaded_at")
    .single();

  if (metadataError || !attachment) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return jsonError("Không thể lưu thông tin file khám bệnh lúc này.", 500);
  }

  return NextResponse.json({ attachment }, { status: 201 });
}
