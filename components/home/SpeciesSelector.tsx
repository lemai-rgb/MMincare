import { SpeciesCard } from "./SpeciesCard";
import styles from "@/styles/home.module.css";

export function SpeciesSelector({ demoEnter }: { demoEnter?: () => void }) {
  return (
    <div className={styles.speciesSelector}>
      <SpeciesCard
        species="cat"
        label="Dành cho bé Mèo"
        imageSrc="/images/pets/cat-avatar.png"
        ariaLabel="Tạo hồ sơ cho bé mèo"
        demoEnter={demoEnter}
      />

      <span className={styles.orDivider} aria-hidden="true">
        hoặc
      </span>

      <SpeciesCard
        species="dog"
        label="Dành cho bé Chó"
        imageSrc="/images/pets/dog-avatar.png"
        ariaLabel="Tạo hồ sơ cho bé chó"
        demoEnter={demoEnter}
      />
    </div>
  );
}
