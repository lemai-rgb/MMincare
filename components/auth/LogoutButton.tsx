"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/dashboard.module.css";
import Link from "next/link";
import { useAppRuntime } from "@/lib/appRuntime";
import demoStyles from "@/styles/demo.module.css";

export function LogoutButton() {
  const runtime = useAppRuntime();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage("");
    const { error } = await createClient().auth.signOut();

    if (error) {
      setErrorMessage("Không thể đăng xuất lúc này. Vui lòng thử lại.");
      setIsLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (runtime) return <div className={demoStyles.exit}><button type="button" aria-label="Trải nghiệm thử — khôi phục dữ liệu mẫu" title="Khôi phục dữ liệu mẫu" onClick={runtime.reset}>Trải nghiệm thử</button><Link className={styles.logoutButton} href="/">Về trang chủ</Link></div>;

  return (
    <div className={styles.logoutArea}>
      <button className={styles.logoutButton} type="button" disabled={isLoading} onClick={handleLogout}>
        {isLoading ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
