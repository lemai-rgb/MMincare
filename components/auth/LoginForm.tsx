"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { AuthFieldErrors } from "@/lib/authValidation";
import { normalizeEmail, validateLogin } from "@/lib/authValidation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
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
    if (isLoading) return;

    const normalizedEmail = normalizeEmail(email);
    const nextErrors = validateLogin({ email: normalizedEmail, password });
    setEmail(normalizedEmail);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setFormError("Email hoặc mật khẩu không đúng");
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
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
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        <button className={styles.forgotPassword} type="button">Quên mật khẩu?</button>
        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        <button className={styles.primaryButton} type="submit" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập…" : "Tiếp tục"}
        </button>

        <p className={styles.switchPrompt}>
          Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
