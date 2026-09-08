"use client";

import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PetListHeaderDecorations } from "@/components/pets/PetListDecorations";
import styles from "@/styles/dashboard.module.css";

export type AppHeaderActiveNav = "pets" | "reminders" | "account";

type AppHeaderProps = {
  activeNav: AppHeaderActiveNav;
};

export function AppHeader({ activeNav }: AppHeaderProps) {
  return (
    <header className={styles.populatedHeader}>
      <PetListHeaderDecorations />
      <Link className={styles.populatedBrand} href="/">
        <span>MMinCare</span>
        <span>Care more, worry less</span>
      </Link>

      <div className={styles.headerActions}>
        <nav className={styles.primaryNav} aria-label="Điều hướng chính">
          <Link
            aria-current={activeNav === "pets" ? "page" : undefined}
            className={activeNav === "pets" ? styles.activeNavItem : styles.navItem}
            href="/dashboard"
          >
            Thú cưng
            <span className={styles.navChevron} aria-hidden="true" />
          </Link>
          <Link
            aria-current={activeNav === "reminders" ? "page" : undefined}
            className={activeNav === "reminders" ? styles.activeNavItem : styles.navItem}
            href="/reminders"
          >
            Nhắc hẹn
            <span className={styles.navChevron} aria-hidden="true" />
          </Link>
          <span className={activeNav === "account" ? styles.activeNavItem : styles.navItem}>
            Tài khoản
            <span className={styles.navChevron} aria-hidden="true" />
          </span>
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
