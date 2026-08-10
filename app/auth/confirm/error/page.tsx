import Link from "next/link";

import styles from "@/styles/authStatus.module.css";

export default function ConfirmationErrorPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="confirmation-error-title">
        <p className={styles.brand}>MMinCare</p>
        <h1 id="confirmation-error-title">Không thể xác nhận email</h1>
        <p>Liên kết có thể đã hết hạn hoặc không hợp lệ. Bạn có thể đăng nhập hoặc đăng ký lại.</p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} href="/login">Đăng nhập</Link>
          <Link className={styles.secondaryLink} href="/register">Đăng ký lại</Link>
        </div>
      </section>
    </main>
  );
}
