import { NextResponse } from "next/server";

import { getTodayInVietnam } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ xem hÃ¡Â»â€œ sÃ†Â¡ Ã„â€˜Ã†Â°Ã¡Â»Â£c chia sÃ¡ÂºÂ»." }, { status: 401 });

  const { data: accessRows, error: accessError } = await supabase
    .from("pet_access")
    .select("access_id, pet_id, valid_until")
    .eq("caretaker_id", userId)
    .eq("status", "Active")
    .gte("valid_until", getTodayInVietnam());
  if (accessError) return NextResponse.json({ error: "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i hÃ¡Â»â€œ sÃ†Â¡ Ã„â€˜Ã†Â°Ã¡Â»Â£c chia sÃ¡ÂºÂ» lÃƒÂºc nÃƒÂ y." }, { status: 500 });
  const petIds = [...new Set((accessRows ?? []).map((row) => row.pet_id))];
  if (petIds.length === 0) return NextResponse.json({ pets: [] });

  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("pet_id, name, species, gender, breed, date_of_birth, created_at, updated_at")
    .in("pet_id", petIds)
    .order("created_at", { ascending: false });
  if (petsError) return NextResponse.json({ error: "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i hÃ¡Â»â€œ sÃ†Â¡ Ã„â€˜Ã†Â°Ã¡Â»Â£c chia sÃ¡ÂºÂ» lÃƒÂºc nÃƒÂ y." }, { status: 500 });

  const expiryByPet = new Map((accessRows ?? []).map((row) => [row.pet_id, row.valid_until]));
  return NextResponse.json({
    pets: (pets ?? []).map((pet) => ({
      ...pet,
      picture_url: null,
      access_id: (accessRows ?? []).find((row) => row.pet_id === pet.pet_id)?.access_id ?? null,
      valid_until: expiryByPet.get(pet.pet_id) ?? null,
      read_only: true,
    })),
  });
}



