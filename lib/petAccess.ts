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
  if (error?.code === "23505") return "LÃ¡Â»Âi mÃ¡Â»Âi Ã„â€˜ang tÃ¡Â»â€œn tÃ¡ÂºÂ¡i hoÃ¡ÂºÂ·c quyÃ¡Â»Ân nÃƒÂ y Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c cÃ¡ÂºÂ¥p.";
  if (error?.code === "42501") return "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân thÃ¡Â»Â±c hiÃ¡Â»â€¡n thao tÃƒÂ¡c nÃƒÂ y.";
  return "KhÃƒÂ´ng thÃ¡Â»Æ’ xÃ¡Â»Â­ lÃƒÂ½ quyÃ¡Â»Ân chia sÃ¡ÂºÂ» lÃƒÂºc nÃƒÂ y. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.";
}



