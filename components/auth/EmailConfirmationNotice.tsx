"use client";

import { useEffect, useState } from "react";

import { getAuthEmailConfirmationUrl } from "@/lib/authEmailRedirect";
import { getCooldownLabel } from "@/lib/auth/cooldown";
import { mapAuthError } from "@/lib/auth/errors";
import { normalizeEmail, validateEmail } from "@/lib/authValidation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";

type EmailConfirmationNoticeProps = {
  email: string;
  next: string;
  initialCooldownSeconds?: number;
};

export function EmailConfirmationNotice({ email, next, initialCooldownSeconds = 0 }: EmailConfirmationNoticeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timerId = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [cooldown]);

  async function handleResend() {
    if (isLoading || cooldown > 0) return;

    const normalizedEmail = normalizeEmail(email);
    const validationError = validateEmail(normalizedEmail);
    setMessage("");
    setError(validationError);
    if (validationError) return;

    setIsLoading(true);
    try {
      const { error: resendError } = await createClient().auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthEmailConfirmationUrl(window.location.origin, next),
        },
      });

      if (resendError) {
        const result = mapAuthError(resendError, { operation: "resend" });
        setError(result.message);
        if (result.cooldownSeconds) setCooldown(result.cooldownSeconds);
        return;
      }

      setMessage("Đã gửi lại email xác nhận. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.");
      setCooldown(60);
    } catch (resendError) {
      const result = mapAuthError(resendError, { operation: "resend" });
      setError(result.message);
      if (result.cooldownSeconds) setCooldown(result.cooldownSeconds);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.emailConfirmationNotice}>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      {message && <p className={styles.formSuccess} role="status">{message}</p>}
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={isLoading || cooldown > 0}
        onClick={handleResend}
      >
        {isLoading ? "Đang gửi…" : cooldown > 0 ? getCooldownLabel(cooldown) : "Gửi lại email xác nhận"}
      </button>
    </div>
  );
}
