import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

function response(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return response("Bạn cần đăng nhập để tạo nhắc hẹn.", 401);

  let body: { type?: unknown; due_date?: unknown; source_vaccine_record_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return response("Dữ liệu gửi lên không hợp lệ.", 400);
  }
  if (body.type !== "Vaccine" || !validDate(body.due_date) || typeof body.source_vaccine_record_id !== "string") {
    return response("Thông tin nhắc hẹn chưa đầy đủ.", 400);
  }

  const { petId } = await params;
  const { data: pet } = await supabase.from("pets").select("pet_id").eq("pet_id", petId).eq("owner_id", userId).maybeSingle();
  if (!pet) return response("Không tìm thấy thú cưng.", 404);

  const { data: vaccine } = await supabase
    .from("vaccine_records")
    .select("vaccine_record_id")
    .eq("vaccine_record_id", body.source_vaccine_record_id)
    .eq("pet_id", petId)
    .maybeSingle();
  if (!vaccine) return response("Mũi tiêm không thuộc thú cưng này.", 400);

  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      pet_id: petId,
      type: "Vaccine",
      due_date: body.due_date,
      source_vaccine_record_id: body.source_vaccine_record_id,
      status: "Upcoming",
    })
    .select("reminder_id, due_date, type, status, source_vaccine_record_id")
    .single();

  if (error || !reminder) return response("Không thể tạo nhắc hẹn lúc này.", 500);
  return NextResponse.json({ reminder }, { status: 201 });
}
