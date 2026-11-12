import { NextResponse } from "next/server";

import { getTodayInVietnam } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem tài khoản." }, { status: 401 });
  }

  const [profile, pets, access] = await Promise.all([
    supabase.from("users").select("name, email").eq("user_id", userId).maybeSingle(),
    supabase.from("pets").select("pet_id").eq("owner_id", userId).limit(1),
    supabase.from("pet_access").select("access_id").eq("caretaker_id", userId)
      .eq("status", "Active").gte("valid_until", getTodayInVietnam()).limit(1),
  ]);
  if (profile.error || pets.error || access.error) {
    return NextResponse.json({ error: "Không thể tải thông tin vai trò lúc này." }, { status: 500 });
  }

  return NextResponse.json({
    profile: { name: profile.data?.name?.trim() || null, email: profile.data?.email || null },
    roles: { owner: (pets.data?.length ?? 0) > 0, caretaker: (access.data?.length ?? 0) > 0 },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
