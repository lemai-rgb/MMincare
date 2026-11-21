import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: mocks.from,
    auth: { getClaims: async () => ({ data: { claims: { sub: owner } }, error: null }) },
    storage: { from: () => ({ list: mocks.list, remove: mocks.remove }) },
  }),
}));

import { DELETE } from "./route";

const owner = "00000000-0000-4000-8000-000000000001";
const petId = "00000000-0000-4000-8000-000000000002";
const medicalRecordId = "00000000-0000-4000-8000-000000000003";
const name = "00000000-0000-4000-8000-000000000004.pdf";
const prefix = `${owner}/${medicalRecordId}`;

function query(result: Record<string, unknown>) {
  const builder = { select: vi.fn(), eq: vi.fn(), delete: vi.fn(), maybeSingle: async () => result };
  return Object.assign(Promise.resolve(result), {
    ...builder,
    select: builder.select.mockReturnThis(),
    eq: builder.eq.mockReturnThis(),
    delete: builder.delete.mockReturnThis(),
  });
}

function deleteMedical() {
  return DELETE(new Request("https://example.test"), { params: Promise.resolve({ petId, medicalRecordId }) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockImplementation((table: string) => {
    if (table === "pets") return query({ data: { pet_id: petId }, error: null });
    if (table === "medical_records") return query({ data: null, error: null });
    throw new Error("Unexpected database operation");
  });
});

it("retries Storage cleanup for an already deleted medical record", async () => {
  mocks.list.mockResolvedValueOnce({ data: [{ name }], error: null })
    .mockResolvedValueOnce({ data: [], error: null });
  mocks.remove.mockResolvedValue({ data: [{ name }], error: null });

  const response = await deleteMedical();

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ attachment_cleanup: "complete", deleted_record_id: medicalRecordId });
  expect(mocks.remove).toHaveBeenCalledWith([`${prefix}/${name}`]);
});

it("lets the Owner retry if Storage did not remove the remaining file", async () => {
  mocks.list.mockResolvedValue({ data: [{ name }], error: null });
  mocks.remove.mockResolvedValue({ data: [], error: null });

  const response = await deleteMedical();

  expect(response.status).toBe(503);
});

it("keeps 404 for an absent record with no files to clean", async () => {
  mocks.list.mockResolvedValue({ data: [], error: null });

  expect((await deleteMedical()).status).toBe(404);
  expect(mocks.remove).not.toHaveBeenCalled();
});
