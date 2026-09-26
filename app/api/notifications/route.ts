import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Bạn cần đăng nhập để xem thông báo." }, { status: 401 });
  const { data, error } = await supabase.from("notification_events")
    .select("notification_event_id,event_type,scheduled_for,read_at,reminders!inner(reminder_id,note,due_date,status,pet:pets!inner(pet_id,name))")
    .eq("user_id", userId).is("cancelled_at", null).lte("scheduled_for", new Date().toISOString())
    .eq("reminders.status", "Upcoming").order("scheduled_for", { ascending: false });
  if (error) return NextResponse.json({ error: "Không thể tải thông báo lúc này." }, { status: 500 });
  const rows = (data ?? []) as unknown as Array<{ notification_event_id: string; event_type: string; scheduled_for: string; read_at: string | null; reminders: Array<{ reminder_id: string; status: string }> }>;
  const current = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const reminder = row.reminders?.[0];
    if (!reminder || reminder.status !== "Upcoming") continue;
    const previous = current.get(reminder.reminder_id);
    if (!previous || (row.event_type === "overdue" && previous.event_type !== "overdue") || (row.event_type === previous.event_type && row.scheduled_for > previous.scheduled_for)) {
      current.set(reminder.reminder_id, row);
    }
  }
  return NextResponse.json({ notifications: [...current.values()] });
}
