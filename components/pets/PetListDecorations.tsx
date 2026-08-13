import Image from "next/image";

import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/dashboard.module.css";

export function PetListHeaderDecorations() {
  return (
    <div className={styles.petListHeaderDecorations} aria-hidden="true" role="presentation">
      <svg className={styles.petListHeaderMaple} viewBox="0 0 32 32">
        <path d="m16 1 3.2 7 5.8-3-1 7 7 2.5-6 4.2 4 5.8-8-1.1L16 31l-4.8-8.6-8 1.1 4-5.8-6-4.2 7-2.5-1-7 5.8 3L16 1Z" />
      </svg>
      <svg className={styles.petListHeaderLeaf} viewBox="0 0 32 32">
        <path d="M27 4C16 4 7 10 6 24c7 1 18-5 21-20Z" />
        <path d="M7 25c5-7 10-11 17-16" />
      </svg>
    </div>
  );
}

export function PetListPanelDecorations() {
  return (
    <div className={styles.petListPanelDecorations} aria-hidden="true" role="presentation">
      <span className={`${styles.petListDot} ${styles.petListDotGreen}`} />
      <span className={`${styles.petListDot} ${styles.petListDotBeige}`} />
      <span className={`${styles.petListDot} ${styles.petListDotLower}`} />
      <svg className={styles.petListBone} viewBox="0 0 36 18">
        <path d="M9 6.5c-1.3 0-2-1-2-2.2C7 1.5 4 .2 2 2.1-.1 4 1 7 3.2 8.1 1 9.2-.1 12.2 2 14.1c2 1.9 5 .6 5-2.2 0-1.2.7-2.2 2-2.2h18c1.3 0 2 1 2 2.2 0 2.8 3 4.1 5 2.2 2.1-1.9 1-4.9-1.2-6C35 7 36.1 4 34 2.1c-2-1.9-5-.6-5 2.2 0 1.2-.7 2.2-2 2.2H9Z" />
      </svg>
      <svg className={styles.petListFishbone} viewBox="0 0 34 24">
        <path d="M5 12h24M9 6l5 6-5 6M17 5l5 7-5 7" />
        <path d="m29 7 5 5-5 5Z" />
      </svg>
      <svg className={styles.petListBottomLeaf} viewBox="0 0 32 32">
        <path d="M27 4C16 4 7 10 6 24c7 1 18-5 21-20Z" />
        <path d="M7 25c5-7 10-11 17-16" />
      </svg>
      <svg className={styles.petListCurve} viewBox="0 0 510 96" preserveAspectRatio="none">
        <path d="M1 72C83 29 150 31 220 55c82 28 149 20 222-19 24-13 46-19 67-18" />
      </svg>
    </div>
  );
}

export function PetListCardDecorations({ species }: { species: PetSpecies }) {
  const icon = species === "Cat" ? "/images/pets/cat-card-mark.svg" : "/images/pets/dog-card-mark.svg";

  return (
    <div className={styles.petListCardDecorations} aria-hidden="true" role="presentation">
      <span className={styles.petListCardMenu}><i /><i /><i /></span>
      <Image className={styles.petListSpeciesMark} src={icon} alt="" width={52} height={52} />
    </div>
  );
}
