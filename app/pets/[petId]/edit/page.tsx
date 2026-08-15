import { redirect } from "next/navigation";

import { CreatePetForm } from "@/components/pets/CreatePetForm";
import { type Pet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const { petId } = await params;
  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("pet_id", petId)
    .eq("owner_id", claimsData.claims.sub)
    .maybeSingle();

  if (petError || !petRow) redirect("/dashboard");
  const pet = petRow as Pet;

  return (
    <CreatePetForm
      initialPet={pet}
      mode="edit"
      petId={pet.pet_id}
    />
  );
}
