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

  try {
    await test.step("Owner invites Caretaker", async () => {
      await login(ownerPage, ownerEmail);
      await ownerPage.getByRole("button", { name: "Chia sẻ hồ sơ Meo CI" }).click();
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
    await test.step("Caretaker sees only the shared read-only profile", async () => {
      await caretakerPage.goto(`/pets/${petId}`);
      await expect(caretakerPage.getByRole("heading", { name: "Meo CI" })).toBeVisible();
      await expect(caretakerPage.getByText("Chỉ xem")).toBeVisible();
      await expect(caretakerPage.getByRole("link", { name: "Chỉnh sửa" })).toHaveCount(0);
      await expect(caretakerPage.getByRole("button", { name: "Quản lý chia sẻ" })).toHaveCount(0);
      await caretakerPage.getByRole("button", { name: "Tài khoản" }).click();
      await expect(caretakerPage.getByRole("menuitemradio", { name: /Caretaker/ })).toBeVisible();
    });
    await test.step("Owner revokes; old link no longer grants access", async () => {
      await ownerPage.reload();
      await ownerPage.getByRole("button", { name: "Chia sẻ hồ sơ Meo CI" }).click();
      await expect(ownerPage.getByText(caretakerEmail)).toBeVisible();
      const response = ownerPage.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/revoke"));
      await ownerPage.getByRole("button", { name: "Thu hồi" }).click();
      expect((await response).status()).toBe(200);
      await expect(ownerPage.getByText("Đã thu hồi quyền chia sẻ.")).toBeVisible();
      await caretakerPage.goto(`/pets/${petId}`);
      await caretakerPage.waitForURL("**/dashboard");
      await expect(caretakerPage.getByRole("heading", { name: "Meo CI" })).toHaveCount(0);
    });
  } finally {
    await ownerContext.close();
    await caretakerContext.close();
  }
});
