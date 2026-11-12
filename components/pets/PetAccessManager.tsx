"use client";

import { useCallback, useEffect, useState } from "react";
import { useRuntimeRequest } from "@/lib/appRuntime";

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

export function PetAccessManager({ petId, petName, inDialog = false }: { petId: string; petName: string; inDialog?: boolean }) {
  const request = useRuntimeRequest();
  const [isOpen, setIsOpen] = useState(inDialog);
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
      const response = await request(`/api/pets/${encodeURIComponent(petId)}/access`, { cache: "no-store" });
      const payload = await response.json() as { access_list?: AccessRow[]; error?: string };
      if (!response.ok || !Array.isArray(payload.access_list)) throw new Error(payload.error || "Không thể tải danh sách chia sẻ.");
      setRows(payload.access_list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách chia sẻ.");
    } finally {
      setIsLoading(false);
    }
  }, [petId, request]);

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
      const response = await request(`/api/pets/${encodeURIComponent(petId)}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caretaker_email: email, valid_until: validUntil }),
      });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "Không thể gửi lời mời.");
      setRows((current) => [payload.access as AccessRow, ...current]);
      setEmail("");
      setValidUntil("");
      setNotice("Đã gửi lời mời chia sẻ. Người nhận cần đăng nhập bằng đúng email để chấp nhận.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi lời mời.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revoke(accessId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await request(`/api/pet-access/${encodeURIComponent(accessId)}/revoke`, { method: "PATCH" });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "Không thể thu hồi quyền.");
      setRows((current) => current.map((row) => row.access_id === accessId ? { ...row, ...payload.access } : row));
      setNotice("Đã thu hồi quyền chia sẻ.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể thu hồi quyền.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.petAccessPanel} aria-labelledby="pet-access-title">
      <div className={styles.petAccessHeader}>
        <div>
          <h2 id="pet-access-title">Chia sẻ hồ sơ</h2>
          <p>Chia sẻ <strong>{petName}</strong> ở chế độ chỉ xem.</p>
        </div>
        {!inDialog && <button className={styles.petAccessToggle} onClick={() => setIsOpen((current) => !current)} type="button" aria-expanded={isOpen}>
          {isOpen ? "Đóng" : "Quản lý chia sẻ"}
        </button>}
      </div>
      {isOpen && (
        <div className={styles.petAccessBody}>
          <div className={styles.petAccessForm}>
            <label>
              Email Caretaker
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="caretaker@example.com" type="email" value={email} />
            </label>
            <label>
              Xem đến hết ngày
              <input onChange={(event) => setValidUntil(event.target.value)} type="date" value={validUntil} />
            </label>
            <button className={styles.petAccessSubmit} disabled={isSubmitting || !email || !validUntil} onClick={() => void submitInvite()} type="button">
              {isSubmitting ? "Đang gửi…" : "Gửi lời mời"}
            </button>
          </div>
          {notice && <p className={styles.petAccessNotice} role="status">{notice}</p>}
          {error && <p className={styles.petAccessError} role="alert">{error}</p>}
          <div className={styles.petAccessList}>
            <h3>Lời mời và quyền hiện tại</h3>
            {isLoading ? <p>Đang tải…</p> : rows.length === 0 ? <p>Chưa có lời mời nào.</p> : rows.map((row) => (
              <div className={styles.petAccessRow} key={row.access_id}>
                <div>
                  <strong>{row.caretaker_email}</strong>
                  <span>{row.status === "Pending" ? "Đang chờ" : row.status === "Active" ? "Đang hoạt động" : "Đã thu hồi"} · đến {formatDate(row.valid_until)}</span>
                </div>
                {row.status !== "Revoked" && <button disabled={isSubmitting} onClick={() => void revoke(row.access_id)} type="button">Thu hồi</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}



