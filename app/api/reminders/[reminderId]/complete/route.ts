import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ reminderId: string }> };

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để cập nhật nhắc hẹn." }, { status: 401 });
  }

  const { reminderId } = await params;
  if (!validUuid(reminderId)) {
    return NextResponse.json({ error: "Mã nhắc hẹn không hợp lệ." }, { status: 400 });
  }

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("reminder_id, user_id, pet_id, status")
    .eq("reminder_id", reminderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (reminderError) {
    return NextResponse.json({ error: "Không thể kiểm tra nhắc hẹn lúc này." }, { status: 500 });
  }
  if (!reminder) {
    return NextResponse.json({ error: "Không tìm thấy nhắc hẹn." }, { status: 404 });
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", reminder.pet_id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (petError) {
    return NextResponse.json({ error: "Không thể kiểm tra quyền sở hữu thú cưng lúc này." }, { status: 500 });
  }
  if (!pet) {
    return NextResponse.json({ error: "Bạn không có quyền cập nhật nhắc hẹn này." }, { status: 403 });
  }

  if (reminder.status === "Completed") {
    return NextResponse.json({ reminder: { ...reminder, completed_at: null } });
  }

  const completedAt = new Date().toISOString();
  const { data: updatedReminder, error: updateError } = await supabase
    .from("reminders")
    .update({ status: "Completed", completed_at: completedAt })
    .eq("reminder_id", reminderId)
    .eq("user_id", userId)
    .eq("status", "Upcoming")
    .select("reminder_id, pet_id, status, completed_at")
    .maybeSingle();

  if (updateError || !updatedReminder) {
    return NextResponse.json({ error: "Không thể hoàn thành nhắc hẹn lúc này." }, { status: 500 });
  }

  return NextResponse.json({ reminder: updatedReminder });
}
