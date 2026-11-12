import Image from "next/image";
import Link from "next/link";

import styles from "@/styles/home.module.css";

type SpeciesCardProps = {
  species: "cat" | "dog";
  label: string;
  imageSrc: string;
  ariaLabel: string;
  demoEnter?: () => void;
};

export function SpeciesCard({
  species,
  label,
  imageSrc,
  ariaLabel,
  demoEnter,
}: SpeciesCardProps) {
  return (
    <Link
      className={`${styles.speciesCard} ${styles[`${species}Card`]}`}
      href={demoEnter ? "/demo?screen=%2Fdashboard" : `/register?species=${species}`}
      onClick={demoEnter ? (event) => { event.preventDefault(); demoEnter(); } : undefined}
      aria-label={ariaLabel}
    >
      <span className={styles.petImageFrame} aria-hidden="true">
        <Image
          className={styles[`${species}Image`]}
          src={imageSrc}
          alt=""
          width={species === "cat" ? 666 : 474}
          height={species === "cat" ? 375 : 421}
          priority
        />
      </span>
      <span className={styles.speciesLabel}>{label}</span>
      <svg
        className={styles.speciesArrow}
        viewBox="0 0 50 7"
        aria-hidden="true"
      >
        <path d="M1 3.5h45.5M41.5 1l6 2.5-6 2.5" />
      </svg>
    </Link>
  );
}
