export type MedicalRecordType = "vaccine" | "medical";

export type MedicalHistoryEntry = {
  id: string;
  type: MedicalRecordType;
  eventDate: string;
  title: string;
  description: string;
  clinicName: string | null;
  doseNumber: number | null;
};

export type VaccineSuggestion = {
  suggested_next_due_date: string | null;
};
