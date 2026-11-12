import { aggregateStatusCounts, buildWeightTrend, getLatestWeight, getPeriodRange, getVietnamToday } from "@/lib/healthLogs/dashboard";
import { getReminderDisplayStatus, REMINDER_TYPES } from "@/lib/reminders";
import { validatePetImage } from "@/lib/petImage";
import { DEMO_OWNER_ID, getDemoNotifications, isDemoDate, sortDemoHealthLogs } from "./data";
import { createDemoStore } from "./store";
import type { DemoHealthInput, DemoState } from "./types";

type Store = ReturnType<typeof createDemoStore>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const nullable = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const invalid = (message: string, status = 400) => json({ error: message }, status);
const uuid = () => crypto.randomUUID();

function medicalHistory(state: DemoState, petId: string, medicalOnly = false) {
  const vaccines = state.vaccine_records.filter((r) => r.pet_id === petId).map((r) => ({
    id: r.vaccine_record_id, type: "vaccine", eventDate: r.vaccine_date, title: r.vaccine_name,
    description: [r.dose_number ? `Mũi số ${r.dose_number}` : null, r.note].filter(Boolean).join(" • "), clinicName: r.clinic_name, doseNumber: r.dose_number,
  }));
  const medical = state.medical_records.filter((r) => r.pet_id === petId).sort((a,b) => b.visit_date.localeCompare(a.visit_date) || b.record_id.localeCompare(a.record_id));
  const records = medical.map((r) => ({ id: r.record_id, type: "medical", eventDate: r.visit_date,
    title: r.diagnosis || "Lần khám bệnh", description: [r.symptoms, r.medication, r.note].filter(Boolean).join(" • "),
    clinicName: r.clinic_name, doseNumber: null, addedByCurrentUser: true,
    attachments: (state.attachments ?? []).filter((a) => a.record_id === r.record_id).map(({attachment_id,file_name,file_type}) => ({attachment_id,file_name,file_type})),
  }));
  const latest = medical[0];
  return { records: [...(medicalOnly ? [] : vaccines), ...records].sort((a,b) => b.eventDate.localeCompare(a.eventDate) || b.id.localeCompare(a.id)),
    latestMedicalRecord: latest ? { id: latest.record_id, visitDate: latest.visit_date, diagnosis: latest.diagnosis, symptoms: latest.symptoms, clinicName: latest.clinic_name } : null };
}

function reminders(state: DemoState, petId?: string) {
  return state.reminders.filter((r) => !petId || r.pet_id === petId).map((r) => ({ ...r,
    pet_name: state.pets.find((p) => p.pet_id === r.pet_id)!.name,
    source_vaccine_date: state.vaccine_records.find((v) => v.vaccine_record_id === r.source_vaccine_record_id)?.vaccine_date ?? null,
    source_medical_visit_date: state.medical_records.find((m) => m.record_id === r.source_medical_record_id)?.visit_date ?? null,
    display_status: getReminderDisplayStatus(r.status, r.due_date, getVietnamToday()),
    is_overdue: getReminderDisplayStatus(r.status, r.due_date, getVietnamToday()) === "Overdue",
  }));
}

async function fileData(file: File) {
  return new Promise<string>((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc file đã chọn."));
    reader.readAsDataURL(file);
  });
}

/** An explicit per-demo transport. Unknown URLs fail closed and never call
 * network fetch. Protected server routes, Auth, RLS and Storage are untouched. */
export function createDemoTransport(store: Store) {
  type DemoAccess = { access_id: string; pet_id: string; caretaker_email: string; valid_until: string; status: "Pending" | "Active" | "Revoked" };
  const demoAccess: DemoAccess[] = [];
  let sharingSeeded = false;
  const creationKeys = new Map<string, { id: string; payload: string }>();
  const attachmentBlobs = new Map<string, string>();
  const aborted = (signal?: AbortSignal | null) => { if (signal?.aborted) throw new DOMException("Aborted", "AbortError"); };
  const request: typeof fetch = async (input, init = {}) => {
    aborted(init.signal);
    const url = new URL(String(input), "https://demo.invalid");
    // Caller components only issue relative API requests. Reject other origins
    // instead of accidentally interpreting them as demo endpoints.
    if (url.origin !== "https://demo.invalid" || !url.pathname.startsWith("/api/")) return invalid("Đường dẫn không thuộc trải nghiệm thử.",404);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const method = init.method ?? "GET";
    const state = store.getSnapshot()?.data;
    if (!state) return invalid("Dữ liệu trải nghiệm chưa sẵn sàng.",503);
    if (!sharingSeeded) {
      sharingSeeded = true;
      const firstPet = state.pets[0];
      if (firstPet) demoAccess.push({ access_id: "00000000-0000-4000-8000-000000000901", pet_id: firstPet.pet_id, caretaker_email: "caregiver@example.com", valid_until: "2099-12-31", status: "Active" });
    }
    const stamp = new Date().toISOString();
    const today = getVietnamToday();
    let body: Record<string, unknown> = {};
    if (typeof init.body === "string") {
      try { body = JSON.parse(init.body); } catch { return invalid("Dữ liệu không hợp lệ."); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("Dữ liệu không hợp lệ.");
    }
    const update = (fn: (data: DemoState) => DemoState) => { aborted(init.signal); store.update(fn); };
    try {
      if (parts[1] === "pets" && parts[2] && parts[3] === "access" && parts.length === 4) {
        const pet = state.pets.find((item) => item.pet_id === parts[2]);
        if (!pet) return invalid("Không tìm thấy thú cưng.", 404);
        if (method === "GET") return json({ access_list: demoAccess.filter((row) => row.pet_id === pet.pet_id) });
        if (method === "POST") {
          const email = typeof body.caretaker_email === "string" ? body.caretaker_email.trim().toLowerCase() : "";
          const validUntil = typeof body.valid_until === "string" ? body.valid_until : "";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isDemoDate(validUntil) || validUntil < today) return invalid("Email hoặc ngày hết hạn không hợp lệ.");
          if (demoAccess.some((row) => row.pet_id === pet.pet_id && row.caretaker_email === email && row.status !== "Revoked")) return invalid("Email này đã có lời mời còn hiệu lực.", 409);
          const access: DemoAccess = { access_id: uuid(), pet_id: pet.pet_id, caretaker_email: email, valid_until: validUntil, status: "Pending" };
          demoAccess.unshift(access);
          return json({ access }, 201);
        }
      }
      if (parts[1] === "pet-access" && parts[2] && parts[3] === "revoke" && parts.length === 4 && method === "PATCH") {
        const row = demoAccess.find((entry) => entry.access_id === parts[2] && entry.status !== "Revoked");
        if (!row) return invalid("Không tìm thấy lời mời.", 404);
        row.status = "Revoked";
        return json({ access: row });
      }
      if (parts[1] === "notifications") {
        const events = getDemoNotifications(state,today);
        if (method === "GET" && parts.length === 2) return json({ notifications: events.map((e) => ({...e,
          reminders: { ...state.reminders.find((r) => r.reminder_id === e.reminder_id)!, pet: state.pets.find((p) => p.pet_id === e.pet_id)! },
        })) });
        const event = events.find((e) => e.notification_event_id === parts[2]);
        if (method !== "PATCH" || parts[3] !== "read" || !event) return invalid("Thông báo không còn hiệu lực.",404);
        store.dispatch({type:"notification-read",id:event.notification_event_id});
        return json({notification:{...event,read_at:stamp}});
      }
      if (parts[1] === "reminders") {
        if (method === "GET" && parts.length === 2) return json({ reminders: reminders(state), pets: state.pets.map(({pet_id,name}) => ({pet_id,name})) });
        const reminder = state.reminders.find((r) => r.reminder_id === parts[2]);
        if (!reminder) return invalid("Không tìm thấy nhắc hẹn.",404);
        if (method !== "PATCH" || (parts.length !== 3 && !(parts.length === 4 && parts[3] === "complete"))) return invalid("Thao tác không hợp lệ.",405);
        store.dispatch(parts[3] === "complete" ? {type:"reminder-complete",id:reminder.reminder_id} : {type:"reminder-edit",id:reminder.reminder_id,due_date:String(body.due_date),note:nullable(body.note)});
        return json({reminder:reminders(store.getSnapshot()!.data).find((r) => r.reminder_id === reminder.reminder_id)});
      }
      if (parts[1] === "medical-records" && parts[3] === "attachments") {
        if (!state.medical_records.some((r) => r.record_id === parts[2])) return invalid("Không tìm thấy hồ sơ.",404);
        if (method === "GET") return invalid("File trải nghiệm được mở trong trình duyệt.",400);
        const file = init.body instanceof FormData ? init.body.get("file") : null;
        if (!(file instanceof File) || !file.size || file.size > 5*1024*1024 || !["image/jpeg","image/png","application/pdf"].includes(file.type)) return invalid("Chỉ nhận JPG, PNG, PDF tối đa 5 MB.");
        const attachment = {attachment_id:uuid(),record_id:parts[2],file_name:file.name,file_type:(file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg") as "pdf" | "png" | "jpg", data:await fileData(file)};
        const decoded = atob(attachment.data.split(",")[1]);
        if (file.type === "application/pdf" ? !decoded.startsWith("%PDF-") : !await validatePetImage(file)) return invalid("Nội dung file không khớp định dạng đã chọn.");
        update((s) => ({...s,attachments:[...(s.attachments ?? []),attachment]}));
        return json({attachment},201);
      }
      if (parts[1] !== "pets") return invalid("Thao tác không có trong hệ thống.",404);
      const pet = state.pets.find((p) => p.pet_id === parts[2]);
      if (parts[2] && !pet) return invalid("Không tìm thấy thú cưng.",404);
      if ((parts.length === 2 && method === "POST") || (parts.length === 3 && method === "PATCH")) {
        if (!(init.body instanceof FormData)) return invalid("Thông tin hồ sơ không hợp lệ.");
        const form = init.body;
        const name = nullable(form.get("name")); const species = String(form.get("species")); const gender = String(form.get("gender"));
        const birth = nullable(form.get("date_of_birth"));
        if (!name || !["Cat","Dog"].includes(species) || !["Male","Female","Unknown"].includes(gender) || (birth && (!isDemoDate(birth) || birth > today))) return invalid("Vui lòng kiểm tra thông tin hồ sơ.");
        let picture = form.get("remove_picture") === "true" ? null : pet?.picture_url ?? null;
        const image = form.get("image");
        if (image instanceof File) {
          if (!await validatePetImage(image)) return json({error:"Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MB.",field:"image"},400);
          picture = await fileData(image);
        }
        const payload = JSON.stringify([name,species,gender,birth,nullable(form.get("breed")),picture]);
        const key = String(form.get("idempotency_key") ?? "");
        const previous = method === "POST" && key ? creationKeys.get("pet:"+key) : undefined;
        if (previous) return previous.payload === payload ? json({pet:state.pets.find((p) => p.pet_id === previous.id)}) : invalid("Thao tác tạo hồ sơ đã thay đổi.",409);
        const row = { pet_id:pet?.pet_id ?? uuid(),owner_id:DEMO_OWNER_ID,name,species:species as "Cat"|"Dog",gender:gender as "Male"|"Female"|"Unknown",breed:nullable(form.get("breed")),date_of_birth:birth,picture_url:picture,created_at:pet?.created_at ?? stamp,updated_at:stamp };
        update((s) => ({...s,pets:[...s.pets.filter((p) => p.pet_id !== row.pet_id),row]}));
        if (key) creationKeys.set("pet:"+key,{id:row.pet_id,payload});
        return json({pet:row},method === "POST" ? 201 : 200);
      }
      const petId = pet?.pet_id;
      if (!petId) return invalid("Không tìm thấy thú cưng.",404);
      if (method === "GET") {
        if (parts.length !== 4) return invalid("Không tìm thấy dữ liệu.",404);
        if (parts[3] === "health-logs") return json({health_logs:sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === petId))});
        if (parts[3] === "reminders") return json({reminders:reminders(state,petId)});
        if (["medical-history","medical-records"].includes(parts[3])) return json(medicalHistory(state,petId,parts[3] === "medical-records"));
        if (parts[3] === "dashboard") {
          const range = getPeriodRange(url.searchParams.get("period") === "month" ? "month" : "week");
          const all = sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === petId));
          const logs = [...all].reverse().filter((l) => l.recorded_on >= range.period_start.slice(0,10) && l.recorded_on <= range.period_end.slice(0,10));
          return json({...range,summary:{health_log_count:logs.length,latest_health_log_at:logs.at(-1)?.recorded_on ?? null,
            latest_weight:getLatestWeight(all.filter((l) => l.weight !== null && l.recorded_on <= range.period_end.slice(0,10)),range.period_end),
            upcoming_reminder:state.reminders.filter((r) => r.pet_id === petId && r.status === "Upcoming" && r.due_date >= today).sort((a,b) => a.due_date.localeCompare(b.due_date))[0] ?? null,
            latest_medical_record:state.medical_records.filter((r) => r.pet_id === petId).sort((a,b) => b.visit_date.localeCompare(a.visit_date))[0] ?? null},
            weight_trend:buildWeightTrend(logs,range),status_counts:aggregateStatusCounts(logs,range)});
        }
        return invalid("Không tìm thấy dữ liệu.",404);
      }
      if (parts[3] === "health-logs") {
        if ((method === "POST" && parts.length !== 4) || (["PATCH","DELETE"].includes(method) && parts.length !== 5)) return invalid("Thao tác không hợp lệ.",405);
        const existing = state.health_logs.find((l) => l.health_log_id === parts[4] && l.pet_id === petId);
        if (method !== "POST" && !existing) return invalid("Không tìm thấy nhật ký.",404);
        if (method === "DELETE") { store.dispatch({type:"health-delete",id:existing!.health_log_id}); return json({success:true}); }
        if (!["POST","PATCH"].includes(method)) return invalid("Thao tác không hợp lệ.",405);
        const input: DemoHealthInput = {recorded_on:String(body.recorded_on),weight:body.weight == null ? null : Number(body.weight),food_amount:nullable(body.food_amount),food_type:nullable(body.food_type),status:nullable(body.status),note:nullable(body.note)};
        const payload = JSON.stringify(input); const key = `health:${petId}:${String(body.idempotency_key ?? "")}`;
        const previous = method === "POST" ? creationKeys.get(key) : undefined;
        if (previous) { const row = state.health_logs.find((l) => l.health_log_id === previous.id); return json({health_log:row,...(previous.payload !== payload ? {recovery:"canonical"} : {})},previous.payload !== payload ? 409 : 200); }
        const id = existing?.health_log_id ?? uuid();
        store.dispatch({type:"health-save",petId,id,input});
        if (method === "POST" && body.idempotency_key) creationKeys.set(key,{id,payload});
        return json({health_log:store.getSnapshot()!.data.health_logs.find((l) => l.health_log_id === id)},method === "POST" ? 201 : 200);
      }
      if (parts[3] === "reminders" && method === "POST") {
        const sourceVaccine = nullable(body.source_vaccine_record_id); const sourceMedical = nullable(body.source_medical_record_id);
        const vaccine = state.vaccine_records.find((v) => v.vaccine_record_id === sourceVaccine && v.pet_id === petId);
        const medical = state.medical_records.find((m) => m.record_id === sourceMedical && m.pet_id === petId);
        const sourceDate = vaccine?.vaccine_date ?? medical?.visit_date;
        if (!REMINDER_TYPES.includes(body.type as typeof REMINDER_TYPES[number]) || !isDemoDate(body.due_date) || body.due_date < today
          || (sourceDate && body.due_date < sourceDate) || (sourceVaccine && !vaccine) || (sourceMedical && !medical) || (sourceVaccine && sourceMedical)) return invalid("Thông tin nhắc hẹn không hợp lệ.");
        const reminder = {reminder_id:uuid(),pet_id:petId,user_id:DEMO_OWNER_ID,type:body.type as typeof REMINDER_TYPES[number],due_date:body.due_date,status:"Upcoming" as const,note:nullable(body.note),source_vaccine_record_id:sourceVaccine,source_medical_record_id:sourceMedical,completed_at:null,created_at:stamp,updated_at:stamp};
        update((s) => ({...s,reminders:[...s.reminders,reminder]}));return json({reminder},201);
      }
      if (parts[3] === "vaccines") {
        if (method === "DELETE") {
          if (!state.vaccine_records.some((v) => v.vaccine_record_id === parts[4] && v.pet_id === petId)) return invalid("Không tìm thấy mũi tiêm.",404);
          update((s) => ({...s,vaccine_records:s.vaccine_records.filter((v) => v.vaccine_record_id !== parts[4]),reminders:s.reminders.map((r) => r.source_vaccine_record_id === parts[4] ? {...r,source_vaccine_record_id:null} : r)}));return json({success:true});
        }
        if (method !== "POST" || !nullable(body.vaccine_name) || !isDemoDate(body.vaccine_date) || body.vaccine_date > today) return invalid("Thông tin mũi tiêm không hợp lệ.");
        const dose = nullable(body.dose_number) ? Number(body.dose_number) : null;
        if (dose !== null && (!Number.isInteger(dose) || dose <= 0)) return invalid("Số mũi phải là số nguyên dương.");
        const row = {vaccine_record_id:uuid(),pet_id:petId,created_by:DEMO_OWNER_ID,vaccine_name:String(body.vaccine_name).trim(),vaccine_date:body.vaccine_date,dose_number:dose,clinic_name:nullable(body.clinic_name),note:nullable(body.note),created_at:stamp};
        update((s) => ({...s,vaccine_records:[...s.vaccine_records,row]}));
        // The real rule dataset is unavailable. Do not invent clinical advice.
        return json({vaccine_record:row,suggested_next_due_date:null,suggestion_status:"unavailable"},201);
      }
      if (parts[3] === "medical-records") {
        if (method === "DELETE") {
          if (!state.medical_records.some((m) => m.record_id === parts[4] && m.pet_id === petId)) return invalid("Không tìm thấy lần khám.",404);
          update((s) => ({...s,medical_records:s.medical_records.filter((m) => m.record_id !== parts[4]),attachments:(s.attachments ?? []).filter((a) => a.record_id !== parts[4]),reminders:s.reminders.map((r) => r.source_medical_record_id === parts[4] ? {...r,source_medical_record_id:null} : r)}));return json({success:true,attachment_cleanup:"complete"});
        }
        if (method !== "POST" || !isDemoDate(body.visit_date) || body.visit_date > today) return invalid("Ngày khám không hợp lệ.");
        const row = {record_id:uuid(),pet_id:petId,created_by:DEMO_OWNER_ID,visit_date:body.visit_date,diagnosis:nullable(body.diagnosis),symptoms:nullable(body.symptoms),medication:nullable(body.medication),clinic_name:nullable(body.clinic_name),note:nullable(body.note),created_at:stamp};
        update((s) => ({...s,medical_records:[...s.medical_records,row]}));return json({medical_record:row},201);
      }
      return invalid("Thao tác không hợp lệ.",405);
    } catch (error) { if (init.signal?.aborted) throw error; return invalid(error instanceof Error ? error.message : "Không thể hoàn tất thao tác."); }
  };
  return {request,
    attachmentUrl(id: string) {
      const row = store.getSnapshot()?.data.attachments?.find((a) => a.attachment_id === id);
      if (!row) return null;
      if (!attachmentBlobs.has(id)) {
        const [header,base64] = row.data.split(",");
        const bytes = Uint8Array.from(atob(base64),(c) => c.charCodeAt(0));
        attachmentBlobs.set(id,URL.createObjectURL(new Blob([bytes],{type:header.slice(5,header.indexOf(";"))})));
      }
      return attachmentBlobs.get(id)!;
    },
    cleanup() { attachmentBlobs.forEach((url) => URL.revokeObjectURL(url)); attachmentBlobs.clear(); creationKeys.clear(); },
  };
}
