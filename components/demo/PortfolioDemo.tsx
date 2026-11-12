"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppRuntimeContext, type AppRuntime } from "@/lib/appRuntime";
import { HomeContent } from "@/components/home/HomeContent";
import { PetListView } from "@/components/pets/PetListView";
import { PetDetailView, type PetDetailViewProps } from "@/components/pets/PetDetailView";
import { CreatePetForm } from "@/components/pets/CreatePetForm";
import { ReminderPage } from "@/components/reminders/ReminderPage";
import { createDemoStore } from "@/lib/demo/store";
import { createDemoTransport } from "@/lib/demo/transport";
import { DEMO_OWNER_ID, sortDemoHealthLogs } from "@/lib/demo/data";
import { getVietnamToday } from "@/lib/healthLogs/dashboard";
import styles from "@/styles/demo.module.css";

const emptySnapshot = () => null;
const demoHref = (href: string) => `/demo?screen=${encodeURIComponent(href)}`;
function readScreen() {
  const value = new URLSearchParams(window.location.search).get("screen") ?? "/";
  try {
    const route = new URL(value,"https://demo.invalid");
    return route.origin === "https://demo.invalid" && (route.pathname === "/" || /^\/(?:dashboard|reminders|pets(?:\/[^/]+(?:\/edit)?)?)$/.test(route.pathname)) ? value : "/dashboard";
  } catch { return "/dashboard"; }
}

export function PortfolioDemo() {
  const [store] = useState(createDemoStore);
  const [transport] = useState(() => createDemoTransport(store));
  const snapshot = useSyncExternalStore(store.subscribe,store.getSnapshot,emptySnapshot);
  const [screen,setScreen] = useState("/");
  const [resetVersion,setResetVersion] = useState(0);
  useEffect(() => {
    store.start();
    let active = true;
    queueMicrotask(() => { if (active) setScreen(readScreen()); });
    const pop = () => setScreen(readScreen());
    window.addEventListener("popstate",pop);
    return () => { active = false; window.removeEventListener("popstate",pop); transport.cleanup(); };
  },[store,transport]);
  const route = useMemo(() => new URL(screen,"https://demo.invalid"),[screen]);
  const runtime = useMemo<AppRuntime>(() => ({
    request:transport.request, pathname:route.pathname,searchParams:route.searchParams,href:demoHref,
    refresh:() => {}, attachmentUrl:transport.attachmentUrl,
    reset:() => {
      if (!window.confirm("Khôi phục dữ liệu mẫu? Các thay đổi trong trải nghiệm thử sẽ bị xóa.")) return;
      transport.cleanup(); store.reset(); setScreen("/dashboard"); setResetVersion((v) => v+1);
      window.history.replaceState(null,"",demoHref("/dashboard"));
    },
    navigate:(href,replace = false) => {
      if (href === "/") return;
      const next = new URL(href,"https://demo.invalid");
      if (next.origin !== "https://demo.invalid" || !/^\/(?:dashboard|reminders|pets(?:\/[^/]+(?:\/edit)?)?)$/.test(next.pathname)) return;
      window.history[replace ? "replaceState" : "pushState"](null,"",demoHref(href));
      setScreen(href);
    },
  }),[route,transport,store]);
  if (!snapshot) return <p role="status">Đang tải trải nghiệm thử…</p>;
  const state = snapshot.data;
  const parts = route.pathname.split("/").filter(Boolean);
  const pet = state.pets.find((p) => p.pet_id === parts[1]);
  const query = route.searchParams;
  let content;
  if (route.pathname === "/") content = <HomeContent demoEnter={() => runtime.navigate("/dashboard")} />;
  else if (route.pathname === "/reminders") content = <ReminderPage highlightedReminderId={query.get("highlight") ?? undefined} />;
  else if (route.pathname === "/pets/new") content = <CreatePetForm key="new" initialSpecies={query.get("species") === "cat" ? "Cat" : query.get("species") === "dog" ? "Dog" : undefined} />;
  else if (pet && parts[2] === "edit") content = <CreatePetForm key={pet.pet_id} mode="edit" petId={pet.pet_id} initialPet={pet} />;
  else if (pet) {
    const activeTab: PetDetailViewProps["activeTab"] = ["medical","reminders","health"].includes(query.get("tab") ?? "") ? query.get("tab") as PetDetailViewProps["activeTab"] : "overview";
    const logs = sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === pet.pet_id));
    const medical = [...state.medical_records.filter((r) => r.pet_id === pet.pet_id),...state.vaccine_records.filter((r) => r.pet_id === pet.pet_id)].sort((a,b) => b.created_at.localeCompare(a.created_at));
    const latest = activeTab === "health" ? logs[0]?.recorded_on : medical[0]?.created_at;
    const form = query.get("form") ?? undefined;
    const healthQuery = new URLSearchParams(query); ["form","view","period"].forEach((key) => healthQuery.delete(key));
    content = <PetDetailView pet={pet} activeTab={activeTab} form={form} currentUserId={DEMO_OWNER_ID} isOwner
      healthView={query.get("view") === "statistics" ? "statistics" : "history"} healthPeriod={query.get("period") === "month" ? "month" : "week"}
      isHealthSubpage={activeTab === "health" && form === "health-log"} healthHistoryHref={`/pets/${pet.pet_id}?${healthQuery}`}
      profileSummaryError={false} profileRecordCount={activeTab === "health" ? logs.length : medical.length}
      latestHealthUpdate={latest ? new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(latest.length === 10 ? `${latest}T12:00:00+07:00` : latest)) : undefined}
      upcomingReminder={state.reminders.filter((r) => r.pet_id === pet.pet_id && r.status === "Upcoming" && r.due_date >= getVietnamToday()).sort((a,b) => a.due_date.localeCompare(b.due_date))[0] ?? null}
      reminderLoadError={false} />;
  } else {
    const latestHealthLogs = new Map<string, typeof state.health_logs[number]>();
    for (const p of state.pets) { const log = sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === p.pet_id))[0]; if (log) latestHealthLogs.set(p.pet_id,log); }
    content = <PetListView pets={state.pets} latestHealthLogs={latestHealthLogs} />;
  }
  return <AppRuntimeContext.Provider value={runtime}>
    {snapshot.persistenceWarning && <p role="status" className={styles.warning}>{snapshot.persistenceWarning}</p>}
    <div key={resetVersion}>{content}</div>
  </AppRuntimeContext.Provider>;
}
