"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "@/styles/petDetail.module.css";

type AccessRow = {
  access_id: string;
  caretaker_email: string;
  valid_until: string;
  status: "Pending" | "Active" | "Revoked";
  pet_name_snapshot?: string | null;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export function PetAccessManager({ petId, petName }: { petId: string; petName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/access`, { cache: "no-store" });
      const payload = await response.json() as { access_list?: AccessRow[]; error?: string };
      if (!response.ok || !Array.isArray(payload.access_list)) throw new Error(payload.error || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch chia sáº».");
      setRows(payload.access_list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch chia sáº».");
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => { void loadRows(); }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadRows]);

  async function submitInvite() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caretaker_email: email, valid_until: validUntil }),
      });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "KhÃ´ng thá»ƒ gá»­i lá»i má»i.");
      setRows((current) => [payload.access as AccessRow, ...current]);
      setEmail("");
      setValidUntil("");
      setNotice("ÄÃ£ gá»­i lá»i má»i chia sáº». NgÆ°á»i nháº­n cáº§n Ä‘Äƒng nháº­p báº±ng Ä‘Ãºng email Ä‘á»ƒ cháº¥p nháº­n.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ gá»­i lá»i má»i.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revoke(accessId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/pet-access/${encodeURIComponent(accessId)}/revoke`, { method: "PATCH" });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "KhÃ´ng thá»ƒ thu há»“i quyá»n.");
      setRows((current) => current.map((row) => row.access_id === accessId ? { ...row, ...payload.access } : row));
      setNotice("ÄÃ£ thu há»“i quyá»n chia sáº».");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ thu há»“i quyá»n.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.petAccessPanel} aria-labelledby="pet-access-title">
      <div className={styles.petAccessHeader}>
        <div>
          <h2 id="pet-access-title">Chia sáº» há»“ sÆ¡</h2>
          <p>Chia sáº» <strong>{petName}</strong> á»Ÿ cháº¿ Ä‘á»™ chá»‰ xem.</p>
        </div>
        <button className={styles.petAccessToggle} onClick={() => setIsOpen((current) => !current)} type="button" aria-expanded={isOpen}>
          {isOpen ? "ÄÃ³ng" : "Quáº£n lÃ½ chia sáº»"}
        </button>
      </div>
      {isOpen && (
        <div className={styles.petAccessBody}>
          <div className={styles.petAccessForm}>
            <label>
              Email Caretaker
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="caretaker@example.com" type="email" value={email} />
            </label>
            <label>
              Xem Ä‘áº¿n háº¿t ngÃ y
              <input onChange={(event) => setValidUntil(event.target.value)} type="date" value={validUntil} />
            </label>
            <button className={styles.petAccessSubmit} disabled={isSubmitting || !email || !validUntil} onClick={() => void submitInvite()} type="button">
              {isSubmitting ? "Äang gá»­iâ€¦" : "Gá»­i lá»i má»i"}
            </button>
          </div>
          {notice && <p className={styles.petAccessNotice} role="status">{notice}</p>}
          {error && <p className={styles.petAccessError} role="alert">{error}</p>}
          <div className={styles.petAccessList}>
            <h3>Lá»i má»i vÃ  quyá»n hiá»‡n táº¡i</h3>
            {isLoading ? <p>Äang táº£iâ€¦</p> : rows.length === 0 ? <p>ChÆ°a cÃ³ lá»i má»i nÃ o.</p> : rows.map((row) => (
              <div className={styles.petAccessRow} key={row.access_id}>
                <div>
                  <strong>{row.caretaker_email}</strong>
                  <span>{row.status === "Pending" ? "Äang chá»" : row.status === "Active" ? "Äang hoáº¡t Ä‘á»™ng" : "ÄÃ£ thu há»“i"} Â· Ä‘áº¿n {formatDate(row.valid_until)}</span>
                </div>
                {row.status !== "Revoked" && <button disabled={isSubmitting} onClick={() => void revoke(row.access_id)} type="button">Thu há»“i</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}



