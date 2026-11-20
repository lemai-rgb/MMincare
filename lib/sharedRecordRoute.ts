import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function createSharedRecord(request: Request, petId: string, kind: "vaccines" | "medical-records") {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  const { data, error } = await supabase.rpc("add_shared_pet_record", { p_pet_id: petId, p_kind: kind, p_body: body });
  if (error) {
    const forbidden = error.code === "42501";
    const invalid = ["22023", "22007", "22008", "22P02", "23514"].includes(error.code);
    return NextResponse.json({ error: forbidden ? "Quyền truy cập đã hết hạn hoặc bị thu hồi." : invalid ? "Dữ liệu hồ sơ không hợp lệ." : "Không thể lưu hồ sơ lúc này." }, { status: forbidden ? 403 : invalid ? 400 : 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
