export const PET_ACCESS_STATUSES = ["Pending", "Active", "Revoked"] as const;
export type PetAccessStatus = (typeof PET_ACCESS_STATUSES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized && EMAIL_PATTERN.test(normalized) ? normalized : null;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getTodayInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isAccessCurrentlyActive(validUntil: string, status: PetAccessStatus, today = getTodayInVietnam()) {
  return status === "Active" && validUntil >= today;
}

export function mapPetAccessError(error: { code?: string; message?: string } | null) {
  if (error?.code === "23505") return "Lá»i má»i Ä‘ang tá»“n táº¡i hoáº·c quyá»n nÃ y Ä‘Ã£ Ä‘Æ°á»£c cáº¥p.";
  if (error?.code === "42501") return "Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c nÃ y.";
  return "KhÃ´ng thá»ƒ xá»­ lÃ½ quyá»n chia sáº» lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.";
}

