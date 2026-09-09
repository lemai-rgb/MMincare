export type MedicalRecordType = "vaccine" | "medical";

export type MedicalHistoryAttachment = {
  attachment_id: string;
  file_name: string;
  file_type: "jpg" | "jpeg" | "png" | "pdf";
};

export type MedicalHistoryEntry = {
  id: string;
  type: MedicalRecordType;
  eventDate: string;
  title: string;
  description: string;
  clinicName: string | null;
  doseNumber: number | null;
  addedByCurrentUser?: boolean;
  attachments?: MedicalHistoryAttachment[];
};

export type LatestMedicalRecordSummary = {
  id: string;
  visitDate: string;
  diagnosis: string | null;
  symptoms: string | null;
  clinicName: string | null;
};

export type VaccineSuggestion = {
  suggested_next_due_date: string | null;
};
