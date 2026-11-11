"use client";

import { AppLink as Link } from "@/lib/appRuntime";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AccountRoleMenu } from "@/components/layout/AccountRoleMenu";
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
        <nav className={styles.primaryNav} aria-label="Äiá»u hÆ°á»›ng chÃ­nh">
          <Link
            aria-current={activeNav === "pets" ? "page" : undefined}
            className={activeNav === "pets" ? styles.activeNavItem : styles.navItem}
            href="/dashboard"
          >
            ThÃº cÆ°ng
          </Link>
          <Link
            aria-current={activeNav === "reminders" ? "page" : undefined}
            className={activeNav === "reminders" ? styles.activeNavItem : styles.navItem}
            href="/reminders"
          >
            Nháº¯c háº¹n
          </Link>
          <AccountRoleMenu active={activeNav === "account"} />
        </nav>
        <button
          aria-controls="mobile-navigation-menu"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "ÄÃ³ng menu Ä‘iá»u hÆ°á»›ng" : "Má»Ÿ menu Ä‘iá»u hÆ°á»›ng"}
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
        <nav aria-label="Äiá»u hÆ°á»›ng trÃªn thiáº¿t bá»‹ di Ä‘á»™ng" className={styles.mobileMenu} id="mobile-navigation-menu">
          <Link aria-current={activeNav === "pets" ? "page" : undefined} className={styles.mobileMenuLink} href="/dashboard" onClick={closeMobileMenu}>ThÃº cÆ°ng</Link>
          <Link aria-current={activeNav === "reminders" ? "page" : undefined} className={styles.mobileMenuLink} href="/reminders" onClick={closeMobileMenu}>Nháº¯c háº¹n</Link>
          <div className={styles.mobileMenuAccount}><AccountRoleMenu active={activeNav === "account"} /></div>
          <div className={styles.mobileMenuLogout}><LogoutButton /></div>
        </nav>
      )}
    </header>
  );
}

