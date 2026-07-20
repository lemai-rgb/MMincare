import type { ReactNode } from "react";

import styles from "@/styles/auth.module.css";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className={styles.authPage}>
      <section className={styles.authShell} aria-label="MMinCare">
        <div className={styles.authDecorations} aria-hidden="true">
          <svg className={styles.authLeaf} viewBox="0 0 32 32">
            <path d="M27 4C16 4 7 10 6 24c7 1 18-5 21-20Z" />
          </svg>
          <svg className={styles.authBone} viewBox="0 0 36 18">
            <path d="M9 6.5c-1.3 0-2-1-2-2.2C7 1.5 4 .2 2 2.1-.1 4 1 7 3.2 8.1 1 9.2-.1 12.2 2 14.1c2 1.9 5 .6 5-2.2 0-1.2.7-2.2 2-2.2h18c1.3 0 2 1 2 2.2 0 2.8 3 4.1 5 2.2 2.1-1.9 1-4.9-1.2-6C35 7 36.1 4 34 2.1c-2-1.9-5-.6-5 2.2 0 1.2-.7 2.2-2 2.2H9Z" />
          </svg>
          <svg className={styles.authStar} viewBox="0 0 32 32">
            <path d="m16 1 3.2 7 5.8-3-1 7 7 2.5-6 4.2 4 5.8-8-1.1L16 31l-4.8-8.6-8 1.1 4-5.8-6-4.2 7-2.5-1-7 5.8 3L16 1Z" />
          </svg>
        </div>

        <div className={styles.formCard}>{children}</div>

        {/* Local decorative asset; native img avoids next/image state during dev HMR. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.petIllustration}
          src="/images/auth/auth-pets.png"
          alt=""
          width={447}
          height={447}
        />
      </section>
    </main>
  );
}
