import Link from "next/link";

import { getSafeAuthNext } from "@/lib/authRedirect";
import styles from "@/styles/authStatus.module.css";

type ConfirmationErrorPageProps = {
  searchParams: Promise<{ error_code?: string | string[]; next?: string | string[] }>;
};

export default async function ConfirmationErrorPage({ searchParams }: ConfirmationErrorPageProps) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error_code) ? params.error_code[0] : params.error_code;
  const next = getSafeAuthNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const loginHref = next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  const isExpiredOtp = errorCode === "otp_expired";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="confirmation-error-title">
        <p className={styles.brand}>MMinCare</p>
        <h1 id="confirmation-error-title">{isExpiredOtp ? "Email có thể đã được xác nhận" : "Không thể xác nhận email"}</h1>
        <p>{isExpiredOtp ? "Liên kết này đã được sử dụng hoặc không còn hiệu lực. Hãy đăng nhập để tiếp tục." : "Liên kết có thể đã hết hạn hoặc không hợp lệ. Bạn có thể đăng nhập để tiếp tục."}</p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} href={loginHref}>Đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}
