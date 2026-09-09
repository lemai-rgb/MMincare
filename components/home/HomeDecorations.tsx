import styles from "@/styles/home.module.css";

export function HomeDecorations() {
  return (
    <div
      className={styles.decorations}
      aria-hidden="true"
      role="presentation"
    >
      <svg className={styles.threadLine} viewBox="0 0 580 250">
        <path d="M-8 62c58 63 121 104 183 108 56 4 88-20 76-57-10-30-63-39-82-5-25 44 59 112 153 120 79 7 154-8 239-66" />
      </svg>
      <svg className={styles.bottomWave} viewBox="0 0 1335 220" preserveAspectRatio="none">
        <path d="M0 154C165 83 298 90 430 139c151 56 279 48 419-18 151-72 306-82 486-22" />
        <path d="M0 184c196-50 345-36 486 12 146 50 298 34 441-30 132-59 263-57 408-10" />
      </svg>

      <svg className={`${styles.decorIcon} ${styles.mapleOne}`} viewBox="0 0 32 32">
        <path d="m16 1 3.2 7 5.8-3-1 7 7 2.5-6 4.2 4 5.8-8-1.1L16 31l-4.8-8.6-8 1.1 4-5.8-6-4.2 7-2.5-1-7 5.8 3L16 1Z" />
      </svg>
      <svg className={`${styles.decorIcon} ${styles.mapleTwo}`} viewBox="0 0 32 32">
        <path d="m16 1 3.2 7 5.8-3-1 7 7 2.5-6 4.2 4 5.8-8-1.1L16 31l-4.8-8.6-8 1.1 4-5.8-6-4.2 7-2.5-1-7 5.8 3L16 1Z" />
      </svg>

      <svg className={`${styles.decorIcon} ${styles.leafOne}`} viewBox="0 0 32 32">
        <path d="M27 4C16 4 7 10 6 24c7 1 18-5 21-20Z" />
        <path className={styles.decorStroke} d="M7 25c5-7 10-11 17-16" />
      </svg>
      <svg className={`${styles.decorIcon} ${styles.leafTwo}`} viewBox="0 0 32 32">
        <path d="M27 4C16 4 7 10 6 24c7 1 18-5 21-20Z" />
        <path className={styles.decorStroke} d="M7 25c5-7 10-11 17-16" />
      </svg>

      <svg className={`${styles.decorIcon} ${styles.bone}`} viewBox="0 0 36 18">
        <path
          className={styles.boneShape}
          d="M9 6.5c-1.3 0-2-1-2-2.2C7 1.5 4 .2 2 2.1-.1 4 1 7 3.2 8.1 1 9.2-.1 12.2 2 14.1c2 1.9 5 .6 5-2.2 0-1.2.7-2.2 2-2.2h18c1.3 0 2 1 2 2.2 0 2.8 3 4.1 5 2.2 2.1-1.9 1-4.9-1.2-6C35 7 36.1 4 34 2.1c-2-1.9-5-.6-5 2.2 0 1.2-.7 2.2-2 2.2H9Z"
        />
      </svg>

      <svg className={`${styles.decorIcon} ${styles.fishbone}`} viewBox="0 0 34 24">
        <path className={styles.decorStroke} d="M5 12h24M9 6l5 6-5 6M17 5l5 7-5 7" />
        <path d="m29 7 5 5-5 5Z" />
      </svg>

      <span className={`${styles.dot} ${styles.dotBeigeOne}`} />
      <span className={`${styles.dot} ${styles.dotBeigeTwo}`} />
      <span className={`${styles.dot} ${styles.dotGreenOne}`} />
      <span className={`${styles.dot} ${styles.dotGreenTwo}`} />
    </div>
  );
}
