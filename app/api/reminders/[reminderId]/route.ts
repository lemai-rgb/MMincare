import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ reminderId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Bạn cần đăng nhập để sửa nhắc hẹn." }, { status: 401 });

  const { reminderId } = await params;
  if (!UUID.test(reminderId)) return NextResponse.json({ error: "Mã nhắc hẹn không hợp lệ." }, { status: 400 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  const body = payload as Record<string, unknown>;
  const allowed = new Set(["due_date", "note"]);
  if (Object.keys(body).some((key) => !allowed.has(key)) || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Yêu cầu chứa trường không được phép cập nhật." }, { status: 400 });
  }
  if (body.due_date !== undefined && !validDate(body.due_date)) return NextResponse.json({ error: "Ngày hẹn không hợp lệ." }, { status: 400 });
  if (body.note !== undefined && body.note !== null && typeof body.note !== "string") return NextResponse.json({ error: "Ghi chú không hợp lệ." }, { status: 400 });

  const { data: reminder, error: findError } = await supabase.from("reminders")
    .select("reminder_id,pet_id,status").eq("reminder_id", reminderId).eq("user_id", userId).maybeSingle();
  if (findError) return NextResponse.json({ error: "Không thể kiểm tra nhắc hẹn lúc này." }, { status: 500 });
  if (!reminder) return NextResponse.json({ error: "Không tìm thấy nhắc hẹn." }, { status: 404 });
  const { data: pet, error: petError } = await supabase.from("pets").select("pet_id").eq("pet_id", reminder.pet_id).eq("owner_id", userId).maybeSingle();
  if (petError) return NextResponse.json({ error: "Không thể kiểm tra quyền sở hữu lúc này." }, { status: 500 });
  if (!pet) return NextResponse.json({ error: "Không tìm thấy nhắc hẹn." }, { status: 404 });
  if (reminder.status !== "Upcoming") return NextResponse.json({ error: "Chỉ có thể sửa nhắc hẹn đang sắp tới." }, { status: 409 });

  const updates: { due_date?: string; note?: string | null; updated_at: string } = { updated_at: new Date().toISOString() };
  if (body.due_date !== undefined) updates.due_date = body.due_date as string;
  if (body.note !== undefined) updates.note = typeof body.note === "string" ? body.note.trim() || null : null;
  const { data, error } = await supabase.from("reminders").update(updates)
    .eq("reminder_id", reminderId).eq("user_id", userId).eq("status", "Upcoming")
    .select("reminder_id,pet_id,due_date,type,status,note,source_vaccine_record_id,source_medical_record_id,completed_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Không thể lưu thay đổi nhắc hẹn." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Nhắc hẹn đã thay đổi và không còn có thể sửa." }, { status: 409 });
  return NextResponse.json({ reminder: data });
}
