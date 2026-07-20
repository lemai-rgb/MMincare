import styles from "@/styles/home.module.css";

export function MMinCareBrand() {
  return (
    <div className={styles.brand} aria-label="MMinCare — Care more, worry less">
      <span className={styles.brandName}>MMinCare</span>
      <span className={styles.tagline}>Care more, worry less</span>
    </div>
  );
}
