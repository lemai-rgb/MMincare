import Image from "next/image";

import { isManagedPetPhotoReference } from "@/lib/petImage";
import { getPetAvatarSource, type PetSpecies } from "@/lib/pets";
type PetAvatarProps = {
  petId?: string;
  species: PetSpecies;
  pictureUrl?: string | null;
  className?: string;
};

export function PetAvatar({ petId, species, pictureUrl, className }: PetAvatarProps) {
  if (pictureUrl) {
    const source = petId && isManagedPetPhotoReference(pictureUrl)
      ? "/api/pets/" + encodeURIComponent(petId) + "?photo=1"
      : pictureUrl;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={source} alt="" />
    );
  }

  return (
    <Image
      className={className}
      src={getPetAvatarSource(species)}
      alt=""
      width={species === "Cat" ? 666 : 474}
      height={species === "Cat" ? 375 : 421}
    />
  );
}
