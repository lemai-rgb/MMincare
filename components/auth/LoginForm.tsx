"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { AuthFieldErrors } from "@/lib/authValidation";
import { normalizeEmail, validateEmail, validateLogin } from "@/lib/authValidation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";

type LoginFormProps = { next?: string };

export function LoginForm({ next = "/dashboard" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const frameId = requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [errors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || isResetLoading) return;

    const normalizedEmail = normalizeEmail(email);
    const nextErrors = validateLogin({ email: normalizedEmail, password });
    setEmail(normalizedEmail);
    setErrors(nextErrors);
    setFormError("");
    setResetMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setFormError("Email hoặc mật khẩu không đúng");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setFormError("Email hoặc mật khẩu không đúng");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (isLoading || isResetLoading) return;

    const normalizedEmail = normalizeEmail(email);
    const emailError = validateEmail(normalizedEmail);
    setEmail(normalizedEmail);
    setFormError("");
    setResetMessage("");
    setErrors(emailError ? { email: emailError } : {});
    if (emailError) return;

    setIsResetLoading(true);
    try {
      const redirectUrl = new URL("/auth/confirm", window.location.origin);
      redirectUrl.searchParams.set("next", "/reset-password");
      const { error } = await createClient().auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl.toString(),
      });

      if (error) {
        setFormError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại.");
      } else {
        setResetMessage("Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.");
      }
    } catch {
      setFormError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại.");
    } finally {
      setIsResetLoading(false);
    }
  }

  return (
    <AuthFormCard title="Đăng nhập">
      <form ref={formRef} className={styles.authForm} noValidate onSubmit={handleSubmit}>
        <AuthInput
          id="login-email"
          name="email"
          label="Email"
          type="email"
          value={email}
          placeholder="username@gmail.com"
          autoComplete="email"
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFormError("");
            setResetMessage("");
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
          onBlur={() => setEmail((current) => normalizeEmail(current))}
        />
        <PasswordInput
          id="login-password"
          name="password"
          label="Mật khẩu"
          value={password}
          placeholder="Mật khẩu"
          autoComplete="current-password"
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFormError("");
            setResetMessage("");
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        <button
          className={styles.forgotPassword}
          type="button"
          disabled={isLoading || isResetLoading}
          onClick={handleForgotPassword}
        >
          {isResetLoading ? "Đang gửi…" : "Quên mật khẩu?"}
        </button>
        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        {resetMessage && <p className={styles.formSuccess} role="status">{resetMessage}</p>}
        <button className={styles.primaryButton} type="submit" disabled={isLoading || isResetLoading}>
          {isLoading ? "Đang đăng nhập…" : "Tiếp tục"}
        </button>

        <p className={styles.switchPrompt}>
          Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
