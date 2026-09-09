import styles from "@/styles/auth.module.css";

type GoogleAuthButtonProps = {
  variant: "login" | "register";
};

export function GoogleAuthButton({ variant }: GoogleAuthButtonProps) {
  return (
    <button
      className={`${styles.googleButton} ${styles[`${variant}GoogleButton`]}`}
      type="button"
      aria-label={`${variant === "login" ? "Đăng nhập" : "Đăng ký"} với Google — chưa khả dụng`}
    >
      {/* Local SVG is already optimized and does not need next/image state. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/auth/icon-google.svg" alt="" width={18} height={18} />
    </button>
  );
}
