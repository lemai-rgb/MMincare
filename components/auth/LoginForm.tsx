"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { normalizeEmail, validateLogin } from "@/lib/authValidation";
import type { AuthFieldErrors } from "@/lib/authValidation";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { AuthInput } from "./AuthInput";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;

    const frameId = requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
        ?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [errors]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const nextErrors = validateLogin({ email: normalizedEmail, password });

    setEmail(normalizedEmail);
    setErrors(nextErrors);

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
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        <button className={styles.forgotPassword} type="button">
          Quên mật khẩu?
        </button>

        <button className={styles.primaryButton} type="submit">
          Tiếp tục
        </button>

        <div className={styles.alternativeAuth}>
          <p>Hoặc đăng nhập với</p>
          <GoogleAuthButton variant="login" />
        </div>

        <p className={styles.switchPrompt}>
          Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
