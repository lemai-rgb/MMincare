"use client";

import { AppLink as Link } from "@/lib/appRuntime";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { PetListHeaderDecorations } from "@/components/pets/PetListDecorations";
import styles from "@/styles/dashboard.module.css";

export type AppHeaderActiveNav = "pets" | "reminders" | "account";

type AppHeaderProps = {
  activeNav: AppHeaderActiveNav;
};

export function AppHeader({ activeNav }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(`.${styles.mobileMenu}`) && !target?.closest(`.${styles.mobileMenuTrigger}`)) setIsMobileMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        mobileMenuTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  function toggleMobileMenu() {
    const nextOpen = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextOpen);
    if (nextOpen) setIsNotificationOpen(false);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

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
          </Link>
          <Link
            aria-current={activeNav === "reminders" ? "page" : undefined}
            className={activeNav === "reminders" ? styles.activeNavItem : styles.navItem}
            href="/reminders"
          >
            Nhắc hẹn
          </Link>
          <span className={activeNav === "account" ? styles.activeNavItem : styles.navItem}>
            Tài khoản
            <span className={styles.navChevron} aria-hidden="true" />
          </span>
        </nav>
        <button
          aria-controls="mobile-navigation-menu"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
          className={styles.mobileMenuTrigger}
          onClick={toggleMobileMenu}
          ref={mobileMenuTriggerRef}
          type="button"
        >
          <span aria-hidden="true" className={styles.mobileMenuIcon}><i /><i /><i /></span>
        </button>
        <NotificationCenter isOpen={isNotificationOpen} onOpenChange={(open) => { setIsNotificationOpen(open); if (open) setIsMobileMenuOpen(false); }} />
        <LogoutButton />
      </div>
      {isMobileMenuOpen && (
        <nav aria-label="Điều hướng trên thiết bị di động" className={styles.mobileMenu} id="mobile-navigation-menu">
          <Link aria-current={activeNav === "pets" ? "page" : undefined} className={styles.mobileMenuLink} href="/dashboard" onClick={closeMobileMenu}>Thú cưng</Link>
          <Link aria-current={activeNav === "reminders" ? "page" : undefined} className={styles.mobileMenuLink} href="/reminders" onClick={closeMobileMenu}>Nhắc hẹn</Link>
          <div className={styles.mobileMenuLogout}><LogoutButton /></div>
        </nav>
      )}
    </header>
  );
}
