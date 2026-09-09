import Link from "next/link";
import type { ReactNode } from "react";

import styles from "@/styles/auth.module.css";

type AuthFormCardProps = {
  title: string;
  children: ReactNode;
};

export function AuthFormCard({ title, children }: AuthFormCardProps) {
  return (
    <div className={styles.formContent}>
      <div className={styles.formHeader}>
        <Link
          className={styles.formBackButton}
          href="/"
          aria-label="Quay về trang chủ"
        >
          <svg viewBox="0 0 26 26" aria-hidden="true">
            <path d="M21 13H5m0 0 7-7m-7 7 7 7" />
          </svg>
        </Link>
        <Link className={styles.authBrand} href="/">
          MMinCare
        </Link>
      </div>
      <h1 className={styles.authTitle}>{title}</h1>
      {children}
    </div>
  );
}
