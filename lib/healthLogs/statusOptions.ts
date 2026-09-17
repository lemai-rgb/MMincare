export const HEALTH_STATUS_OPTIONS = [
  "Bình thường",
  "Mệt mỏi",
  "Ăn kém/Bỏ ăn",
  "Nôn",
  "Tiêu chảy",
  "Khác",
] as const;

export type HealthStatusOption = (typeof HEALTH_STATUS_OPTIONS)[number];

export type HealthStatusGroup = HealthStatusOption;

function normalizeStatus(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z]/g, "");
}

export function getHealthStatusGroup(value: string | null | undefined): HealthStatusGroup | null {
  if (!value?.trim()) return null;

  const normalized = normalizeStatus(value);
  if (normalized === "normal" || normalized === "binhthuong") return "Bình thường";
  if (normalized === "tired" || normalized === "met" || normalized === "metmoi") return "Mệt mỏi";
  if (
    normalized === "lossofappetite"
    || normalized === "boan"
    || normalized === "ankem"
    || normalized === "ankemboan"
  ) return "Ăn kém/Bỏ ăn";
  if (normalized === "vomiting" || normalized === "non") return "Nôn";
  if (normalized === "diarrhea" || normalized === "tieuchay") return "Tiêu chảy";
  return "Khác";
}
