import type { MedicalHistoryAttachment, MedicalHistoryEntry } from "@/lib/medicalHistory";

const MEDICAL_RECORD_TYPES = new Set(["vaccine", "medical"]);
const ATTACHMENT_TYPES = new Set(["jpg", "jpeg", "png", "pdf"]);

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isMedicalHistoryAttachment(value: unknown): value is MedicalHistoryAttachment {
  if (!value || typeof value !== "object") return false;
  const attachment = value as Record<string, unknown>;
  return nonEmptyString(attachment.attachment_id)
    && typeof attachment.file_name === "string"
    && typeof attachment.file_type === "string"
    && ATTACHMENT_TYPES.has(attachment.file_type);
}

export function isMedicalHistoryEntry(value: unknown): value is MedicalHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  if (!nonEmptyString(entry.id) || typeof entry.type !== "string" || !MEDICAL_RECORD_TYPES.has(entry.type)) return false;
  if (!validDate(entry.eventDate) || !nonEmptyString(entry.title) || typeof entry.description !== "string") return false;
  if (!nullableString(entry.clinicName) || !(entry.doseNumber === null || Number.isInteger(entry.doseNumber))) return false;
  if (entry.addedByCurrentUser !== undefined && typeof entry.addedByCurrentUser !== "boolean") return false;
  return entry.attachments === undefined
    || (Array.isArray(entry.attachments) && entry.attachments.every(isMedicalHistoryAttachment));
}

export function parseMedicalHistoryRecords(payload: unknown): MedicalHistoryEntry[] | null {
  if (!payload || typeof payload !== "object") return null;
  const records = (payload as Record<string, unknown>).records;
  return Array.isArray(records) && records.every(isMedicalHistoryEntry) ? records : null;
}
