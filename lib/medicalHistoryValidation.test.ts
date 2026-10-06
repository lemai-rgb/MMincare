import { describe, expect, it } from "vitest";

import { parseMedicalHistoryRecords } from "@/lib/medicalHistoryValidation";

const validRecord = {
  id: "medical-1",
  type: "medical",
  eventDate: "2026-09-12",
  title: "Khám bệnh",
  description: "Ho nhẹ",
  clinicName: null,
  doseNumber: null,
  addedByCurrentUser: true,
  attachments: [{ attachment_id: "attachment-1", file_name: "Ảnh khám bệnh", file_type: "jpg" }],
};

describe("medical history response validation", () => {
  it("accepts records and nested attachment fields used by the renderer", () => {
    expect(parseMedicalHistoryRecords({ records: [validRecord] })).toEqual([validRecord]);
  });

  it.each([
    { ...validRecord, eventDate: "not-a-date" },
    { ...validRecord, attachments: [{ ...validRecord.attachments[0], file_type: "exe" }] },
    { ...validRecord, addedByCurrentUser: "yes" },
    { ...validRecord, id: null },
  ])("rejects malformed records safely", (record) => {
    expect(parseMedicalHistoryRecords({ records: [record] })).toBeNull();
  });

  it("rejects a missing records array", () => {
    expect(parseMedicalHistoryRecords({ records: null })).toBeNull();
  });
});
