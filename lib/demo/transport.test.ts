import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoStore } from "./store";
import { createDemoTransport } from "./transport";
import { parseHealthDashboardData } from "@/lib/healthLogs/dashboardValidation";
import { parseMedicalHistoryRecords } from "@/lib/medicalHistoryValidation";
import { parseNotificationRows } from "@/lib/notifications/current";
import { getVietnamToday } from "@/lib/healthLogs/dashboard";

describe("scoped demo API adapter",() => {
  beforeEach(() => {sessionStorage.clear();vi.stubGlobal("fetch",vi.fn(() => {throw new Error("No production requests");}));});
  afterEach(() => vi.unstubAllGlobals());
  function setup() {const store=createDemoStore();store.start();const transport=createDemoTransport(store);return {store,...transport};}
  const post = (body:unknown,method="POST") => ({method,body:JSON.stringify(body)});
  it("simulates sharing for the selected pet without network requests",async () => {
    const {request,store}=setup(); const [pet,other]=store.getSnapshot()!.data.pets;
    const accessUrl=`/api/pets/${pet.pet_id}/access`;
    expect((await (await request(accessUrl)).json()).access_list[0].caretaker_email).toBe("caregiver@example.com");
    const created=await (await request(accessUrl,post({caretaker_email:"demo@example.com",valid_until:"2099-12-31"}))).json();
    expect(created.access.status).toBe("Pending");
    expect((await (await request(accessUrl)).json()).access_list).toHaveLength(2);
    expect((await (await request(`/api/pets/${other.pet_id}/access`)).json()).access_list).toHaveLength(0);
    const revoked=await (await request(`/api/pet-access/${created.access.access_id}/revoke`,{method:"PATCH"})).json();
    expect(revoked.access.status).toBe("Revoked");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("returns the real medical, statistics and notification contracts; fails closed for unknown/external routes",async () => {
    const {request,store}=setup();const pet=store.getSnapshot()!.data.pets[0];
    for (const period of ["week","month"] as const) expect(parseHealthDashboardData(await (await request(`/api/pets/${pet.pet_id}/dashboard?period=${period}`)).json(),period)).not.toBeNull();
    expect(parseMedicalHistoryRecords(await (await request(`/api/pets/${pet.pet_id}/medical-history`)).json())).not.toBeNull();
    expect(parseNotificationRows((await (await request("/api/notifications")).json()).notifications)).not.toBeNull();
    for (const url of ["/api/unknown","https://m-mincare.vercel.app/api/pets","/api/pets/unknown/health-logs"]) expect((await request(url)).status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("supports vaccine/medical creation and deletion, detaches reminder sources and retains the manual reminder",async () => {
    const {request,store}=setup();const pet=store.getSnapshot()!.data.pets[2];const today=getVietnamToday();
    const vaccine=await (await request(`/api/pets/${pet.pet_id}/vaccines`,post({vaccine_name:"Vaccine mẫu",vaccine_date:today,dose_number:"1"}))).json();
    expect(vaccine.suggestion_status).toBe("unavailable");expect(vaccine.suggested_next_due_date).toBeNull();
    const reminder=await (await request(`/api/pets/${pet.pet_id}/reminders`,post({type:"Vaccine",due_date:today,source_vaccine_record_id:vaccine.vaccine_record.vaccine_record_id}))).json();
    expect(reminder.reminder.reminder_id).toBeTruthy();
    expect((await request(`/api/pets/${pet.pet_id}/vaccines/${vaccine.vaccine_record.vaccine_record_id}`,{method:"DELETE"})).ok).toBe(true);
    expect(store.getSnapshot()!.data.reminders.find((r) => r.reminder_id===reminder.reminder.reminder_id)?.source_vaccine_record_id).toBeNull();
    const medical=await (await request(`/api/pets/${pet.pet_id}/medical-records`,post({visit_date:today,symptoms:"Kiểm tra mẫu"}))).json();
    expect(medical.medical_record.record_id).toBeTruthy();
    expect((await request(`/api/pets/${pet.pet_id}/medical-records/${medical.medical_record.record_id}`,{method:"DELETE"})).ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("keeps Health Log retry canonical, edit timestamps immutable and cross-Pet IDs unavailable",async () => {
    const {request,store}=setup();const [a,b]=store.getSnapshot()!.data.pets;const url=`/api/pets/${a.pet_id}/health-logs`;
    const body={recorded_on:getVietnamToday(),weight:2.5,status:"invalid",idempotency_key:crypto.randomUUID()};
    const first=await (await request(url,post(body))).json();
    const retry=await (await request(url,post(body))).json();expect(retry.health_log.health_log_id).toBe(first.health_log.health_log_id);
    const conflict=await request(url,post({...body,weight:2.7}));expect(conflict.status).toBe(409);expect((await conflict.json()).recovery).toBe("canonical");
    expect((await request(`/api/pets/${b.pet_id}/health-logs/${first.health_log.health_log_id}`,post(body,"PATCH"))).status).toBe(404);
    const edited=await (await request(`${url}/${first.health_log.health_log_id}`,post({...body,weight:2.8},"PATCH"))).json();
    expect(edited.health_log.logged_at).toBe(first.health_log.logged_at);
    expect((await request(`${url}/${first.health_log.health_log_id}`,{method:"DELETE"})).ok).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("preserves optional photo removal through reload and never reaches Auth/Storage",async () => {
    const {request,store}=setup();const pet=store.getSnapshot()!.data.pets[0];
    const form=new FormData();form.set("name",pet.name);form.set("species",pet.species);form.set("gender",pet.gender);form.set("remove_picture","true");
    expect((await request(`/api/pets/${pet.pet_id}`,{method:"PATCH",body:form})).ok).toBe(true);
    const restored=createDemoStore();restored.start();expect(restored.getSnapshot()!.data.pets.find((p) => p.pet_id===pet.pet_id)?.picture_url).toBeNull();
    const controller=new AbortController();controller.abort();await expect(request("/api/notifications",{signal:controller.signal})).rejects.toMatchObject({name:"AbortError"});
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
