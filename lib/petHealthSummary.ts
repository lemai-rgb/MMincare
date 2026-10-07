export type PetListHealthLog = {
  pet_id: string;
  health_log_id: string;
  recorded_on: string;
  logged_at: string;
  weight: number | null;
  status: string | null;
};

export type PetHealthSummary = {
  date: string | null;
  status: string;
  weight: string;
};

export function formatRecordedOn(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function getPetHealthSummary(log: PetListHealthLog | undefined): PetHealthSummary | null {
  if (!log) return null;

  return {
    date: formatRecordedOn(log.recorded_on) ?? null,
    status: log.status?.trim() || "Chưa ghi nhận",
    weight: log.weight === null ? "Chưa ghi nhận" : `${log.weight} kg`,
  };
}

export function getPetHealthHref(petId: string) {
  return `/pets/${encodeURIComponent(petId)}?tab=health`;
}
