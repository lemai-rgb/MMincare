import Link from "next/link";

import { getAvailableAuthDestination, getSafeAuthNext, parseSpecies } from "@/lib/authRedirect";
import styles from "@/styles/authStatus.module.css";

type ConfirmationErrorPageProps = {
  searchParams: Promise<{ error_code?: string | string[]; next?: string | string[] }>;
};

export default async function ConfirmationErrorPage({ searchParams }: ConfirmationErrorPageProps) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error_code) ? params.error_code[0] : params.error_code;
  const next = getSafeAuthNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const destination = getAvailableAuthDestination(next);
  const destinationUrl = new URL(destination, "http://mmincare.internal");
  const species = destinationUrl.pathname === "/dashboard"
    ? parseSpecies(destinationUrl.searchParams.get("species"))
    : undefined;
  const loginHref = species ? `/login?species=${species}` : "/login";
  const isExpiredOtp = errorCode === "otp_expired";
  const isRecoveryError = next === "/reset-password";
  const title = isRecoveryError
    ? "Không thể đặt lại mật khẩu"
    : isExpiredOtp
      ? "Email có thể đã được xác nhận"
      : "Không thể xác nhận email";
  const message = isRecoveryError
    ? "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới."
    : isExpiredOtp
      ? "Liên kết này đã được sử dụng hoặc không còn hiệu lực. Hãy đăng nhập để tiếp tục."
      : "Liên kết có thể đã hết hạn hoặc không hợp lệ. Bạn có thể đăng nhập để tiếp tục.";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="confirmation-error-title">
        <p className={styles.brand}>MMinCare</p>
        <h1 id="confirmation-error-title">{title}</h1>
        <p>{message}</p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} href={loginHref}>Đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}
