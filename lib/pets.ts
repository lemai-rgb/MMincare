export const PET_SPECIES = ["Cat", "Dog"] as const;
export const PET_GENDERS = ["Male", "Female", "Unknown"] as const;

export type PetSpecies = (typeof PET_SPECIES)[number];
export type PetGender = (typeof PET_GENDERS)[number];

export type Pet = {
  pet_id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  gender: PetGender;
  breed: string | null;
  date_of_birth: string | null;
  picture_url: string | null;
  created_at: string;
  updated_at: string;
};

export function getPetSpeciesFromQuery(value: string | undefined): PetSpecies | undefined {
  if (value === "cat") return "Cat";
  if (value === "dog") return "Dog";
  return undefined;
}

export function getPetAvatarSource(species: PetSpecies) {
  return species === "Cat" ? "/images/pets/cat-avatar.png" : "/images/pets/dog-avatar.png";
}

export function getPetSpeciesLabel(species: PetSpecies) {
  return species === "Cat" ? "Mèo" : "Chó";
}

export function getPetGenderLabel(gender: PetGender) {
  if (gender === "Male") return "Đực";
  if (gender === "Female") return "Cái";
  return "Chưa rõ";
}
