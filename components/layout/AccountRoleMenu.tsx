"use client";

import { useEffect, useRef, useState } from "react";

import styles from "@/styles/dashboard.module.css";

type Role = "owner" | "caretaker";
type RolePayload = {
  profile?: { name?: string | null; email?: string | null };
  roles?: { owner?: boolean; caretaker?: boolean };
  error?: string;
};

function roleLabel(role: Role) {
  return role === "owner" ? "Owner â€” Chá»§ thÃº cÆ°ng" : "Caretaker â€” NgÆ°á»i chÄƒm sÃ³c";
}

export function AccountRoleMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<RolePayload | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || payload) return;
    const controller = new AbortController();
    void fetch("/api/account/roles", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const nextPayload = await response.json() as RolePayload;
        if (!response.ok) throw new Error(nextPayload.error || "KhÃ´ng thá»ƒ táº£i thÃ´ng tin tÃ i khoáº£n.");
        setPayload(nextPayload);
        const roles = nextPayload.roles;
        setSelectedRole(roles?.owner ? "owner" : roles?.caretaker ? "caretaker" : null);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") setPayload({ error: "KhÃ´ng thá»ƒ táº£i thÃ´ng tin tÃ i khoáº£n." });
      });
    return () => controller.abort();
  }, [open, payload]);

  const hasOwner = payload?.roles?.owner === true;
  const hasCaretaker = payload?.roles?.caretaker === true;
  const roleOptions = (["owner", "caretaker"] as Role[]).filter((role) => role === "owner" ? hasOwner : hasCaretaker);
  const displayName = payload?.profile?.name || "ChÆ°a thiáº¿t láº­p";

  return (
    <div className={styles.accountRoleMenu} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={active ? styles.activeNavItem : styles.navItem}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        TÃ i khoáº£n
        <span aria-hidden="true" className={styles.navChevron} />
      </button>
      {open && (
        <div className={styles.accountRolePopover} role="menu">
          <div className={styles.accountRoleOptions}>
            {roleOptions.length > 0 ? roleOptions.map((role) => (
              <button
                aria-checked={selectedRole === role}
                className={selectedRole === role ? styles.accountRoleOptionActive : styles.accountRoleOption}
                key={role}
                onClick={() => setSelectedRole(role)}
                role="menuitemradio"
                type="button"
              >
                {roleLabel(role)}
              </button>
            )) : <p className={styles.accountNoRole}>ChÆ°a cÃ³ vai trÃ²</p>}
          </div>
          <section aria-live="polite" className={styles.accountRolePanel}>
            {payload?.error ? <p role="alert">{payload.error}</p> : payload === null ? <p role="status">Äang táº£i thÃ´ng tin tÃ i khoáº£nâ€¦</p> : (
              <>
                <p className={styles.accountRolePanelLabel}>ThÃ´ng tin tÃ i khoáº£n</p>
                <strong>{displayName}</strong>
                <span>{payload.profile?.email || "ChÆ°a thiáº¿t láº­p"}</span>
                <span>{selectedRole ? roleLabel(selectedRole) : "ChÆ°a cÃ³ vai trÃ²"}</span>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

