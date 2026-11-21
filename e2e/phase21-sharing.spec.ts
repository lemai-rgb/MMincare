import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const serviceKey = process.env.LOCAL_TEST_SERVICE_ROLE_KEY ?? "";
const ownerEmail = "phase21-owner@example.test";
const caretakerEmail = "phase21-caretaker@example.test";
const password = "Local-Only-Test-Password-218!";
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

test("Owner invite, Caretaker accept, isolation, and revoke", async ({ browser }) => {
  test.setTimeout(120_000);
  // Refuse to run even fixture setup against a hosted or nonstandard project.
  expect(supabaseUrl).toBe("http://127.0.0.1:54321");
  expect(anonKey && serviceKey).toBeTruthy();
  const admin = createClient(supabaseUrl, serviceKey, clientOptions);
  const ownerClient = createClient(supabaseUrl, anonKey, clientOptions);
  const caretakerClient = createClient(supabaseUrl, anonKey, clientOptions);

  const owner = await admin.auth.admin.createUser({ email: ownerEmail, password, email_confirm: true });
  const caretaker = await admin.auth.admin.createUser({ email: caretakerEmail, password, email_confirm: true });
  expect(owner.error?.message ?? null).toBeNull();
  expect(caretaker.error?.message ?? null).toBeNull();
  expect(owner.data.user).toBeTruthy();
  const profile = await admin.from("users").update({ name: "Mai" }).eq("user_id", owner.data.user!.id);
  expect(profile.error?.message ?? null).toBeNull();
  const signInOwner = await ownerClient.auth.signInWithPassword({ email: ownerEmail, password });
  const signInCaretaker = await caretakerClient.auth.signInWithPassword({ email: caretakerEmail, password });
  expect(signInOwner.error?.message ?? null).toBeNull();
  expect(signInCaretaker.error?.message ?? null).toBeNull();
  const token = signInCaretaker.data.session?.access_token;
  expect(token).toBeTruthy();
  const pet = await ownerClient.from("pets").insert({
    owner_id: owner.data.user!.id, name: "Meo CI", species: "Cat", gender: "Unknown",
  }).select("pet_id").single();
  expect(pet.error?.message ?? null).toBeNull();
  const petId = pet.data!.pet_id as string;
  const expiredInvitation = await admin.from("pet_access").insert({
    pet_id: petId, granted_by: owner.data.user!.id, caretaker_email: caretakerEmail,
    status: "Pending", valid_until: "2000-01-01",
  });
  expect(expiredInvitation.error?.message ?? null).toBeNull();

  const ownerContext = await browser.newContext();
  const caretakerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const caretakerPage = await caretakerContext.newPage();
  async function login(page: typeof ownerPage, email: string) {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await page.waitForURL("**/dashboard");
  }

  const linkedReminderIds: string[] = [];

  try {
    await test.step("Owner invites Caretaker", async () => {
      await login(ownerPage, ownerEmail);
      await ownerPage.getByRole("button", { name: "Chia sẻ hồ sơ Meo CI" }).click();
      await expect(ownerPage.getByText(/Đã hết hạn/)).toBeVisible();
      await ownerPage.getByLabel("Email Caretaker").fill(caretakerEmail);
      await ownerPage.getByLabel("Xem đến hết ngày").fill("2099-12-31");
      const response = ownerPage.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/access"));
      await ownerPage.getByRole("button", { name: "Gửi lời mời" }).click();
      expect((await response).status()).toBe(201);
      await expect(ownerPage.getByText(/Đã gửi lời mời chia sẻ/)).toBeVisible();
    });
    await test.step("Caretaker sees inviter and accepts", async () => {
      await login(caretakerPage, caretakerEmail);
      await expect(caretakerPage.getByText("Mai mời bạn xem hồ sơ của Meo CI.")).toBeVisible();
      const response = caretakerPage.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/accept"));
      await caretakerPage.getByRole("button", { name: "Chấp nhận" }).click();
      expect((await response).status()).toBe(200);
      await expect(caretakerPage.getByRole("heading", { name: "Meo CI" })).toBeVisible();
    });
    await test.step("Caretaker Data API cannot read granted_by", async () => {
      for (const select of ["*", "granted_by"]) {
        const response = await fetch(`${supabaseUrl}/rest/v1/pet_access?select=${encodeURIComponent(select)}`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
      }
    });
    await test.step("Caretaker sees only the shared profile and record controls", async () => {
      await caretakerPage.goto(`/pets/${petId}`);
      await expect(caretakerPage.getByRole("heading", { name: "Meo CI" })).toBeVisible();
      await expect(caretakerPage.getByText("Xem và thêm hồ sơ")).toBeVisible();
      await expect(caretakerPage.getByRole("link", { name: "Chỉnh sửa" })).toHaveCount(0);
      await expect(caretakerPage.getByRole("button", { name: "Quản lý chia sẻ" })).toHaveCount(0);
      await caretakerPage.getByRole("button", { name: "Tài khoản" }).click();
      await expect(caretakerPage.getByRole("menuitemradio", { name: /Caretaker/ })).toBeVisible();
    });
    await test.step("Caretaker adds text records, Owner sees them, direct writes remain denied", async () => {
      await caretakerPage.goto(`/pets/${petId}?tab=medical`);
      await caretakerPage.getByRole("button", { name: "Thêm bản ghi" }).click();
      await caretakerPage.getByRole("menuitem", { name: "Thêm lần khám" }).click();
      await expect(caretakerPage.getByRole("heading", { name: "THÊM LẦN KHÁM" })).toBeVisible();
      await expect(caretakerPage.getByText("Tải ảnh hoặc PDF")).toHaveCount(0);
      const payload = { visit_date: "2026-01-01", diagnosis: "Caretaker visit" };
      await caretakerPage.waitForURL(/form=medical-record/);
      await caretakerPage.getByLabel("Ngày khám").fill(payload.visit_date);
      await caretakerPage.getByLabel("Chẩn đoán").fill(payload.diagnosis);
      const medicalResponse = caretakerPage.waitForResponse(r =>
        r.request().method() === "POST" && r.url().endsWith(`/api/shared-pets/${petId}/medical-records`));
      await caretakerPage.getByRole("button", { name: "Lưu lần khám" }).click();
      const added = await medicalResponse;
      expect(added.status()).toBe(201);
      const saved = await added.json();
      expect(saved.medical_record.created_by).toBeUndefined();
      await expect(caretakerPage.getByRole("heading", { name: payload.diagnosis })).toBeVisible();

      await caretakerPage.getByRole("button", { name: "Thêm bản ghi" }).click();
      await caretakerPage.getByRole("menuitem", { name: "Thêm mũi tiêm" }).click();
      await caretakerPage.waitForURL(/form=vaccine/);
      await caretakerPage.getByRole("combobox", { name: "Tên vaccine", exact: true }).selectOption({ label: "Khác – nhập tên vaccine" });
      await caretakerPage.getByLabel("Tên vaccine khác").fill("Caretaker vaccine");
      await caretakerPage.getByLabel("Ngày tiêm").fill(payload.visit_date);
      const vaccineResponse = caretakerPage.waitForResponse(r =>
        r.request().method() === "POST" && r.url().endsWith(`/api/shared-pets/${petId}/vaccines`));
      await caretakerPage.getByRole("button", { name: "Lưu mũi tiêm" }).click();
      const vaccine = await vaccineResponse;
      expect(vaccine.status()).toBe(201);
      const vaccineId = (await vaccine.json()).vaccine_record.vaccine_record_id as string;

      const sourceReminders = [
        { type: "Recheck", source_medical_record_id: saved.medical_record.record_id },
        { type: "Vaccine", source_vaccine_record_id: vaccineId },
      ];
      for (const source of sourceReminders) {
        const response = await ownerPage.request.post(`/api/pets/${petId}/reminders`, {
          data: { ...source, due_date: "2099-12-01" },
        });
        expect(response.status()).toBe(201);
        linkedReminderIds.push((await response.json()).reminder.reminder_id);
      }
      const completed = await ownerPage.request.patch(`/api/reminders/${linkedReminderIds[0]}/complete`);
      expect(completed.status()).toBe(200);
      const reminderList = await ownerPage.request.get("/api/reminders");
      expect(reminderList.status()).toBe(200);
      expect((await reminderList.json()).reminders).toEqual(expect.arrayContaining([
        expect.objectContaining({ reminder_id: linkedReminderIds[0], source_medical_visit_date: payload.visit_date }),
      ]));

      const ownerRecords = await ownerClient.from("medical_records").select("record_id,created_by").eq("record_id", saved.medical_record.record_id);
      expect(ownerRecords.data?.[0]?.created_by).toBe(caretaker.data.user!.id);
      const direct = await caretakerClient.from("medical_records").insert({ pet_id: petId, created_by: caretaker.data.user!.id, visit_date: "2026-01-01" });
      expect(direct.error).toBeTruthy();
      const deleted = await caretakerClient.from("medical_records").delete().eq("record_id", saved.medical_record.record_id).select();
      expect(deleted.data ?? []).toEqual([]);
      const forged = await caretakerClient.rpc("add_shared_pet_record", { p_pet_id: petId, p_kind: "medical-records", p_body: { ...payload, created_by: owner.data.user!.id } });
      expect(forged.error?.code).toBe("22023");
      const unrelated = await caretakerClient.rpc("add_shared_pet_record", { p_pet_id: "00000000-0000-4000-8000-000000000999", p_kind: "medical-records", p_body: payload });
      expect(unrelated.error?.code).toBe("42501");
      await caretakerPage.goto(`/pets/${petId}?tab=medical`);
      await expect(caretakerPage.getByRole("heading", { name: "Caretaker visit" })).toBeVisible();
      await expect(caretakerPage.getByRole("button", { name: /Xóa/ })).toHaveCount(0);
    });
    await test.step("Owner deletes Caretaker records using the visible UI buttons", async () => {
      await ownerPage.goto(`/pets/${petId}?tab=medical`);
      for (const title of ["Caretaker visit", "Caretaker vaccine"]) {
        const card = ownerPage.getByRole("article").filter({ has: ownerPage.getByRole("heading", { name: title, exact: true }) });
        await expect(card).toBeVisible();
        await card.getByRole("button", { name: /Xóa/ }).click();
        const response = ownerPage.waitForResponse(r => r.request().method() === "DELETE" && r.url().includes(`/api/pets/${petId}/`));
        await ownerPage.getByRole("dialog").getByRole("button", { name: "Xóa bản ghi", exact: true }).click();
        const removed = await response;
        expect(removed.status()).toBe(200);
        expect((await removed.json()).detached_reminders).toBe(1);
        await expect(ownerPage.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
      }
      const medical = await admin.from("medical_records").select("record_id").eq("pet_id", petId);
      const vaccines = await admin.from("vaccine_records").select("vaccine_record_id").eq("pet_id", petId);
      expect(medical.error).toBeNull(); expect(vaccines.error).toBeNull();
      expect(medical.data).toEqual([]); expect(vaccines.data).toEqual([]);
      const reminders = await ownerClient.from("reminders")
        .select("reminder_id,status,source_medical_record_id,source_vaccine_record_id")
        .in("reminder_id", linkedReminderIds);
      expect(reminders.error?.message ?? null).toBeNull();
      expect(reminders.data).toEqual(expect.arrayContaining([
        { reminder_id: linkedReminderIds[0], status: "Completed", source_medical_record_id: null, source_vaccine_record_id: null },
        { reminder_id: linkedReminderIds[1], status: "Upcoming", source_medical_record_id: null, source_vaccine_record_id: null },
      ]));
      await caretakerPage.reload();
      await expect(caretakerPage.getByRole("heading", { name: "Caretaker visit", exact: true })).toHaveCount(0);
    });
    await test.step("Owner deletes an attachment from the private bucket", async () => {
      const created = await ownerPage.request.post(`/api/pets/${petId}/medical-records`, {
        data: { visit_date: "2026-01-01", diagnosis: "Owner attachment cleanup" },
      });
      expect(created.status()).toBe(201);
      const recordId = (await created.json()).medical_record.record_id;
      const uploaded = await ownerPage.request.post(`/api/medical-records/${recordId}/attachments`, {
        multipart: { file: { name: "fixture.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") } },
      });
      expect(uploaded.status()).toBe(201);
      const attachment = (await uploaded.json()).attachment;
      const prefix = `${owner.data.user!.id}/${recordId}`;
      const bucket = admin.storage.from("medical-record-attachments");
      const before = await bucket.list(prefix);
      expect(before.error?.message ?? null).toBeNull();
      expect(before.data).toHaveLength(1);
      const signed = await ownerPage.request.get(`/api/medical-records/${recordId}/attachments?attachmentId=${attachment.attachment_id}`);
      expect(signed.status()).toBe(200);

      const removed = await ownerPage.request.delete(`/api/pets/${petId}/medical-records/${recordId}`);
      expect(removed.status()).toBe(200);
      expect(await removed.json()).toMatchObject({ deleted_attachments: 1, attachment_cleanup: "complete" });
      const after = await bucket.list(prefix);
      expect(after.error?.message ?? null).toBeNull();
      expect(after.data).toEqual([]);
    });
    await test.step("Owner revokes; old link no longer grants access", async () => {
      await ownerPage.goto("/dashboard");
      await ownerPage.getByRole("button", { name: "Chia sẻ hồ sơ Meo CI" }).click();
      await expect(ownerPage.getByText("Đang hoạt động", { exact: false })).toBeVisible();
      const response = ownerPage.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/revoke"));
      await ownerPage.getByRole("button", { name: "Thu hồi" }).click();
      expect((await response).status()).toBe(200);
      await expect(ownerPage.getByText("Đã thu hồi quyền chia sẻ.")).toBeVisible();
      const denied = await caretakerClient.rpc("add_shared_pet_record", { p_pet_id: petId, p_kind: "medical-records", p_body: { visit_date: "2026-01-01" } });
      expect(denied.error?.code).toBe("42501");
      await caretakerPage.goto(`/pets/${petId}`);
      await caretakerPage.waitForURL("**/dashboard");
      await expect(caretakerPage.getByRole("heading", { name: "Meo CI" })).toHaveCount(0);
    });
  } finally {
    await ownerContext.close();
    await caretakerContext.close();
  }
});
