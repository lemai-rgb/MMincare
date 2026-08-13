import Image from "next/image";

import { getPetAvatarSource, type PetSpecies } from "@/lib/pets";
import styles from "@/styles/dashboard.module.css";

type PetAvatarProps = {
  species: PetSpecies;
  pictureUrl?: string | null;
};

export function PetAvatar({ species, pictureUrl }: PetAvatarProps) {
  if (pictureUrl) {
    return (
      // picture_url is an existing stored URL/path; upload configuration is outside this checkpoint.
      // eslint-disable-next-line @next/next/no-img-element
      <img className={styles.petAvatar} src={pictureUrl} alt="" />
    );
  }

  return (
    <Image
      className={styles.petAvatar}
      src={getPetAvatarSource(species)}
      alt=""
      width={species === "Cat" ? 666 : 474}
      height={species === "Cat" ? 375 : 421}
    />
  );
}
