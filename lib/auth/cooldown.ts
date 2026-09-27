import { AUTH_RESEND_COOLDOWN_SECONDS } from "./errors";

export { AUTH_RESEND_COOLDOWN_SECONDS };

export function getCooldownLabel(seconds: number) {
  return `Gửi lại sau ${seconds} giây`;
}
