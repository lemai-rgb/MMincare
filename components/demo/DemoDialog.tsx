"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "@/styles/demo.module.css";

export function DemoDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current;
    if (!dialog) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')];
    (controls()[0] ?? dialog).focus();
    function keydown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = controls();
      const first = elements[0]; const last = elements.at(-1);
      if (!first || !last) { event.preventDefault(); dialog?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    dialog.addEventListener("keydown", keydown);
    return () => {
      dialog.removeEventListener("keydown", keydown);
      document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus();
      else document.getElementById("demo-content-title")?.focus();
    };
  }, [onClose]);
  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="demo-dialog-title" ref={ref} tabIndex={-1}>
        <div className={styles.dialogHeader}>
          <h2 id="demo-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại">Đóng</button>
        </div>
        {children}
      </div>
    </div>
  );
}
