import Image from "next/image";

import { getPetAvatarSource, type PetSpecies } from "@/lib/pets";
type PetAvatarProps = {
  species: PetSpecies;
  pictureUrl?: string | null;
  className?: string;
};

export function PetAvatar({ species, pictureUrl, className }: PetAvatarProps) {
  if (pictureUrl) {
    return (
      // picture_url is an existing stored URL/path; upload configuration is outside this checkpoint.
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={pictureUrl} alt="" />
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
