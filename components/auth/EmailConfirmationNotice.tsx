"use client";

import { useEffect, useRef, useState } from "react";

import { getAuthEmailConfirmationUrl } from "@/lib/authEmailRedirect";
import { getCooldownLabel } from "@/lib/auth/cooldown";
import { normalizeEmail, validateEmail } from "@/lib/authValidation";
import { createResendController, type ResendState } from "@/lib/auth/resend";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";

type EmailConfirmationNoticeProps = {
  email: string;
  next: string;
  initialCooldownSeconds?: number;
};

export function EmailConfirmationNotice({ email, next, initialCooldownSeconds = 0 }: EmailConfirmationNoticeProps) {
  const [validationError, setValidationError] = useState("");
  const controllerRef = useRef<ReturnType<typeof createResendController> | null>(null);
  const [state, setState] = useState<ResendState>({
    status: "idle",
    message: "",
    error: "",
    cooldownSeconds: 0,
  });

  useEffect(() => {
    const controller = createResendController({
      cooldownSeconds: 60,
      send: async () => createClient().auth.resend({
        type: "signup",
        email: normalizeEmail(email),
        options: {
          emailRedirectTo: getAuthEmailConfirmationUrl(window.location.origin, next),
        },
      }),
    });
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(setState);
    controller.start(initialCooldownSeconds);
    return () => {
      unsubscribe();
      controller.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [email, initialCooldownSeconds, next]);

  async function handleResend() {
    const controller = controllerRef.current;
    if (!controller || state.status === "loading" || state.cooldownSeconds > 0) return;

    const normalizedEmail = normalizeEmail(email);
    const validationError = validateEmail(normalizedEmail);
    setValidationError(validationError);
    if (validationError) return;

    setValidationError("");
    await controller.resend();
  }

  return (
    <div className={styles.emailConfirmationNotice}>
      {(validationError || state.error) && <p className={styles.formError} role="alert">{validationError || state.error}</p>}
      {state.message && <p className={styles.formSuccess} role="status">{state.message}</p>}
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={state.status === "loading" || state.cooldownSeconds > 0}
        onClick={handleResend}
      >
        {state.status === "loading" ? "Đang gửi…" : state.cooldownSeconds > 0 ? getCooldownLabel(state.cooldownSeconds) : "Gửi lại email xác nhận"}
      </button>
    </div>
  );
}
