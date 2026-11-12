import type { PetGender, PetSpecies } from "@/lib/pets";
import type { MedicalHistoryEntry } from "@/lib/medicalHistory";
import { createClient } from "@/lib/supabase/server";

export type SharedPet = {
  pet_id: string;
  name: string;
  species: PetSpecies;
  gender: PetGender;
  breed: string | null;
  date_of_birth: string | null;
  valid_until: string;
  records: MedicalHistoryEntry[];
};

export function sharedPetProfile(pet: SharedPet) {
  return {
    pet_id: pet.pet_id, name: pet.name, species: pet.species, gender: pet.gender,
    breed: pet.breed, date_of_birth: pet.date_of_birth, valid_until: pet.valid_until,
  };
}

export async function readSharedPets(supabase: Awaited<ReturnType<typeof createClient>>, petId?: string) {
  const { data, error } = await supabase.rpc("read_shared_pets", { p_pet_id: petId ?? null });
  if (error || !Array.isArray(data)) throw new Error("Shared pets unavailable");
  return data as SharedPet[];
}
