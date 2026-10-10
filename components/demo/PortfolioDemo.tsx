"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { aggregateStatusCounts, buildWeightTrend, getPeriodRange, getVietnamToday } from "@/lib/healthLogs/dashboard";
import { HEALTH_STATUS_OPTIONS } from "@/lib/healthLogs/statusOptions";
import { formatRecordedOn } from "@/lib/petHealthSummary";
import { getPetGenderLabel, getPetSpeciesLabel } from "@/lib/pets";
import { getReminderDisplayStatus, getReminderTypeLabel } from "@/lib/reminders";
import { getDemoNotifications, sortDemoHealthLogs, validateDemoHealth } from "@/lib/demo/data";
import { createDemoStore, type DemoAction } from "@/lib/demo/store";
import type { DemoHealthLog, DemoState } from "@/lib/demo/types";
import { DemoDialog } from "./DemoDialog";
import styles from "@/styles/demo.module.css";

type Modal = { type: "health"; log?: DemoHealthLog } | { type: "delete"; log: DemoHealthLog }
  | { type: "reminder"; id: string } | { type: "reset" } | { type: "notifications" } | null;
type PetTab = "overview" | "medical" | "reminders" | "health";
const serverSnapshot = () => null;
const show = (value: string | null) => value || "Chưa ghi nhận";
const displayDate = (day: string) => formatRecordedOn(day) ?? day;
const weightLabel = (weight: number | null) => weight === null ? "Chưa ghi nhận" : `${new Intl.NumberFormat("vi-VN").format(weight)} kg`;

function preventImplicitSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
  if (event.target instanceof HTMLInputElement && ["text", "number"].includes(event.target.type)) event.preventDefault();
}

function HealthForm({ log, today, onSave, onCancel }: {
  log?: DemoHealthLog; today: string; onSave: (input: Parameters<typeof validateDemoHealth>[0]) => string | null; onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "").trim() || null;
    const rawWeight = text("weight");
    const input = { recorded_on: String(data.get("recorded_on")), weight: rawWeight === null ? null : Number(rawWeight.replace(",", ".")),
      food_amount: text("food_amount"), food_type: text("food_type"), status: text("status"), note: text("note") };
    setError(validateDemoHealth(input, today) ?? onSave(input));
  }
  return (
    <form onSubmit={submit} onKeyDown={preventImplicitSubmit} className={styles.form}>
      <p className={styles.muted}>Nhật ký mẫu chỉ lưu trong tab trình duyệt này.</p>
      <div className={styles.formGrid}>
        <label>Ngày ghi nhận *<input name="recorded_on" type="date" max={today} defaultValue={log?.recorded_on ?? today} required /></label>
        <label>Cân nặng (kg)<input name="weight" type="text" inputMode="decimal" defaultValue={log?.weight ?? ""} placeholder="VD: 2,2" /></label>
        <label>Thức ăn<input name="food_type" type="text" defaultValue={log?.food_type ?? ""} maxLength={200} placeholder="VD: Hạt và pate" /></label>
        <label>Lượng ăn<input name="food_amount" type="text" defaultValue={log?.food_amount ?? ""} maxLength={200} placeholder="VD: 80 g/ngày" /></label>
      </div>
      <label>Tình trạng<select name="status" defaultValue={log?.status ?? ""}>
        <option value="">Chưa ghi nhận</option>
        {HEALTH_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
        {log?.status && !(HEALTH_STATUS_OPTIONS as readonly string[]).includes(log.status) && <option>{log.status}</option>}
      </select></label>
      <label>Ghi chú<textarea name="note" rows={3} maxLength={1000} defaultValue={log?.note ?? ""} /></label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}><button type="button" onClick={onCancel}>Hủy</button><button type="submit" className={styles.primary}>{log ? "Lưu thay đổi" : "Lưu nhật ký"}</button></div>
    </form>
  );
}

function DemoStatistics({ state, petId }: { state: DemoState; petId: string }) {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const rows = state.health_logs.filter((r) => r.pet_id === petId);
  const range = getPeriodRange(period);
  const points = buildWeightTrend(rows, range);
  const counts = aggregateStatusCounts(rows, range);
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights); const max = Math.max(...weights);
  const coordinates = points.map((p, i) => `${30 + (points.length === 1 ? 270 : i * 540 / (points.length - 1))},${160 - (p.weight - min) / (max - min || 1) * 120}`);
  return <section className={styles.stack} aria-label="Thống kê sức khỏe mẫu">
    <div className={styles.segment} aria-label="Khoảng thời gian">
      <button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")}>Tuần này</button>
      <button type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")}>Tháng này</button>
    </div>
    <div className={styles.panel}><h3>Diễn biến cân nặng</h3>
      {points.length < 2 ? <p className={styles.muted}>{points.length ? "Cần ít nhất hai lần cân để xem diễn biến." : "Chưa có cân nặng trong khoảng thời gian này."}</p> : <>
        <svg viewBox="0 0 600 190" className={styles.chart} role="img" aria-labelledby="demo-chart-title demo-chart-description">
          <title id="demo-chart-title">Cân nặng qua {points.length} lần ghi nhận</title>
          <desc id="demo-chart-description">Dữ liệu chi tiết nằm trong bảng bên dưới. Mỗi điểm tương ứng một lần cân, khoảng cách điểm không biểu thị số ngày.</desc>
          <line x1="30" x2="570" y1="165" y2="165" stroke="#d6dfd3" />
          <polyline points={coordinates.join(" ")} fill="none" stroke="#4f6f52" strokeWidth="3" />
          {coordinates.map((coordinate, i) => { const [cx, cy] = coordinate.split(","); return <circle key={points[i].health_log_id} cx={cx} cy={cy} r="4" fill="#4f6f52" />; })}
        </svg>
      </>}
      {!!points.length && <div className={styles.tableScroll}><table><caption>Các lần cân trong kỳ</caption><thead><tr><th scope="col">Ngày ghi nhận</th><th scope="col">Cân nặng</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.health_log_id}><td>{displayDate(p.recorded_on)}</td><td>{weightLabel(p.weight)}</td></tr>)}</tbody></table></div>}
    </div>
    <div className={styles.panel}><h3>Tình trạng trong kỳ</h3><dl className={styles.metrics}>{counts.map((c) => <div key={c.status}><dt>{c.label}</dt><dd>{c.count} bản ghi</dd></div>)}</dl></div>
  </section>;
}

export function PortfolioDemo() {
  const [store] = useState(createDemoStore);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, serverSnapshot);
  const [petId, setPetId] = useState<string | null>(null);
  const [area, setArea] = useState<"pets" | "reminders">("pets");
  const [tab, setTab] = useState<PetTab>("overview");
  const [healthView, setHealthView] = useState<"history" | "stats">("history");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<Modal>(null);
  const [message, setMessage] = useState("");
  const close = useCallback(() => setModal(null), []);
  useEffect(() => { store.start(); }, [store]);

  if (!snapshot) return <main className={styles.page}><p role="status">Đang chuẩn bị bộ dữ liệu mẫu…</p></main>;
  const state = snapshot.data;
  const today = getVietnamToday();
  const pet = state.pets.find((p) => p.pet_id === petId);
  const logs = sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === petId));
  const notifications = getDemoNotifications(state, today);
  const unread = notifications.filter((n) => !n.read_at).length;

  function act(action: DemoAction, success: string) {
    try { store.dispatch(action); setMessage(success); return null; }
    catch (error) { return error instanceof Error ? error.message : "Không thể cập nhật dữ liệu demo."; }
  }
  function openPet(id: string, nextTab: PetTab = "overview") {
    setPetId(id); setArea("pets"); setTab(nextTab); setHealthView("history");
  }
  function reset() { store.reset(); setPetId(null); setArea("pets"); setFilter("All"); setHealthView("history"); setMessage("Đã khôi phục dữ liệu mẫu."); close(); }
  function download() {
    const data = { ...state, notification_events: getDemoNotifications(state, today) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `mmincare-demo-${state.anchor_day}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  function reminders(forPet?: string) {
    const rows = [...state.reminders].filter((r) => (!forPet || r.pet_id === forPet)
      && (filter === "All" || getReminderDisplayStatus(r.status, r.due_date, today) === filter))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    return <section className={styles.stack} aria-label="Nhắc hẹn mẫu">
      <label className={styles.filter}>Trạng thái<select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="All">Tất cả</option><option value="Upcoming">Sắp đến hạn</option><option value="Overdue">Quá hạn</option><option value="Completed">Đã hoàn thành</option>
      </select></label>
      {!rows.length && <p className={styles.empty}>Chưa có nhắc hẹn trong mục này.</p>}
      {rows.map((r) => { const status = getReminderDisplayStatus(r.status, r.due_date, today); return <article className={styles.panel} key={r.reminder_id}>
        <div className={styles.row}><h3>{getReminderTypeLabel(r.type)} · {state.pets.find((p) => p.pet_id === r.pet_id)?.name}</h3><span className={status === "Overdue" ? styles.overdue : styles.badge}>{status === "Overdue" ? "Quá hạn" : status === "Completed" ? "Đã hoàn thành" : "Sắp đến hạn"}</span></div>
        <p>Đến hạn: <strong>{displayDate(r.due_date)}</strong></p><p className={styles.muted}>{show(r.note)}</p>
        <p className={styles.small}>Nguồn: {r.source_vaccine_record_id ? "Hồ sơ tiêm phòng" : r.source_medical_record_id ? "Hồ sơ y tế" : "Thủ công"}</p>
        {r.status === "Upcoming" && <div className={styles.actions}><button type="button" onClick={() => setModal({ type: "reminder", id: r.reminder_id })}>Chỉnh sửa ngày nhắc</button>
          <button type="button" className={styles.primary} onClick={() => { const error = act({ type: "reminder-complete", id: r.reminder_id }, "Đã hoàn thành nhắc hẹn mẫu."); if (error) setMessage(error); }}>Hoàn thành</button></div>}
      </article>; })}
    </section>;
  }

  return <div className={styles.page}>
    <a href="#demo-main" className={styles.skip}>Đến nội dung demo</a>
    <header className={styles.header}>
      <Link href="/" prefetch={false} className={styles.brand}>MMinCare<span>Care more, worry less</span></Link>
      <div className={styles.headerActions}><span className={styles.badge}>Live Demo</span>
        <button type="button" className={styles.bell} aria-label={`Thông báo demo, ${unread} chưa đọc`} onClick={() => setModal({ type: "notifications" })}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3zm5 3h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
        </button><Link href="/login" prefetch={false}>Dùng website thật →</Link>
      </div>
    </header>
    <main id="demo-main" className={styles.main}>
      <section className={styles.intro} aria-labelledby="demo-title"><div><p className={styles.eyebrow}>Trải nghiệm không cần đăng ký</p>
        <h1 id="demo-title">Một nơi để chăm sóc Meo, Min và Sushi</h1>
        <p>Dữ liệu giả lập. Thay đổi chỉ lưu trong tab này; bạn có thể khôi phục mẫu bất cứ lúc nào.</p></div>
        <div className={styles.actions}><button type="button" onClick={download}>Tải dữ liệu mẫu JSON</button><button type="button" onClick={() => setModal({ type: "reset" })}>Khôi phục dữ liệu mẫu</button></div>
      </section>
      {snapshot.persistenceWarning && <p role="status" className={styles.notice}>{snapshot.persistenceWarning}</p>}
      <p role="status" aria-live="polite" className={styles.feedback}>{message}</p>
      <nav className={styles.topnav} aria-label="Nội dung demo">
        <button type="button" aria-pressed={area === "pets"} onClick={() => { setArea("pets"); setPetId(null); }}>Thú cưng</button>
        <button type="button" aria-pressed={area === "reminders"} onClick={() => { setArea("reminders"); setPetId(null); }}>Nhắc hẹn</button>
      </nav>
      <h2 id="demo-content-title" tabIndex={-1} className={styles.contentTitle}>{area === "reminders" ? "Lịch chăm sóc mẫu" : pet ? `Hồ sơ của ${pet.name}` : "Thú cưng của bạn"}</h2>
      {area === "reminders" ? reminders() : !pet ? <div className={styles.petGrid}>
        {state.pets.map((p) => { const latest = sortDemoHealthLogs(state.health_logs.filter((l) => l.pet_id === p.pet_id))[0]; return <article className={styles.petCard} key={p.pet_id}>
          <div className={styles.avatarWrap}><PetAvatar species={p.species} pictureUrl={p.picture_url} className={styles.avatar} /></div>
          <h3>{p.name}</h3><p className={styles.muted}>{getPetSpeciesLabel(p.species)} · {p.breed ?? "Chưa rõ giống"} · {getPetGenderLabel(p.gender)}</p>
          {latest ? <div className={styles.summary}><strong>Nhật ký gần nhất · {displayDate(latest.recorded_on)}</strong><p>Tình trạng: {show(latest.status)}</p><p>Cân nặng: {weightLabel(latest.weight)}</p><button type="button" className={styles.textButton} onClick={() => openPet(p.pet_id, "health")}>Xem nhật ký →</button></div> : <p className={styles.summary}>Chưa có nhật ký sức khỏe</p>}
          <button type="button" className={styles.primary} onClick={() => openPet(p.pet_id)}>Xem hồ sơ {p.name} →</button>
        </article>; })}
      </div> : <section className={styles.stack}>
        <button type="button" className={styles.back} onClick={() => setPetId(null)}>← Danh sách thú cưng</button>
        <div className={styles.profile}><div className={styles.avatarWrap}><PetAvatar species={pet.species} pictureUrl={pet.picture_url} className={styles.avatar} /></div>
          <div><h3>{pet.name}</h3><p>{getPetSpeciesLabel(pet.species)} · {pet.breed ?? "Chưa rõ giống"} · {getPetGenderLabel(pet.gender)}</p><span className={styles.badge}>{logs.length} nhật ký sức khỏe</span></div></div>
        <nav className={styles.petTabs} aria-label="Các mục hồ sơ mẫu">
          {([["overview", "Tổng quan"], ["medical", "Hồ sơ y tế"], ["reminders", "Nhắc hẹn"], ["health", "Sức khỏe"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setFilter("All"); }}>{label}</button>)}
        </nav>
        {tab === "overview" && <div className={styles.overview}><article className={styles.panel}><h3>Nhật ký gần nhất</h3><p>{logs[0] ? displayDate(logs[0].recorded_on) : "Chưa có nhật ký sức khỏe"}</p><p>Tình trạng: {show(logs[0]?.status ?? null)}</p><button type="button" onClick={() => setTab("health")}>Xem sức khỏe →</button></article>
          <article className={styles.panel}><h3>Lịch chăm sóc</h3><p>{state.reminders.filter((r) => r.pet_id === petId && r.status === "Upcoming").length} nhắc hẹn chưa hoàn thành</p><button type="button" onClick={() => setTab("reminders")}>Xem nhắc hẹn →</button></article></div>}
        {tab === "medical" && <section className={styles.stack} aria-label="Hồ sơ y tế mẫu"><p className={styles.notice}>Hồ sơ tiêm phòng và khám trong demo chỉ để xem. Tạo/xóa hồ sơ và upload tệp có trên website thật sau đăng nhập.</p>
          <h3>Lịch sử tiêm phòng</h3>{!state.vaccine_records.some((r) => r.pet_id === petId) && <p className={styles.empty}>Chưa có lịch sử tiêm phòng.</p>}
          {state.vaccine_records.filter((r) => r.pet_id === petId).sort((a, b) => b.vaccine_date.localeCompare(a.vaccine_date)).map((r) => <article className={styles.panel} key={r.vaccine_record_id}><h4>{r.vaccine_name}</h4><p>Ngày tiêm: {displayDate(r.vaccine_date)}</p><p>Mũi: {r.dose_number ?? "Chưa ghi nhận"}</p><p>Cơ sở: {show(r.clinic_name)}</p></article>)}
          <h3>Lịch sử khám</h3>{!state.medical_records.some((r) => r.pet_id === petId) && <p className={styles.empty}>Chưa có hồ sơ khám.</p>}
          {state.medical_records.filter((r) => r.pet_id === petId).map((r) => <article className={styles.panel} key={r.record_id}><h4>Khám ngày {displayDate(r.visit_date)}</h4><dl className={styles.metrics}><div><dt>Triệu chứng</dt><dd>{show(r.symptoms)}</dd></div><div><dt>Ghi nhận</dt><dd>{show(r.diagnosis)}</dd></div><div><dt>Cơ sở</dt><dd>{show(r.clinic_name)}</dd></div></dl><p className={styles.muted}>{show(r.note)}</p></article>)}
        </section>}
        {tab === "reminders" && reminders(pet.pet_id)}
        {tab === "health" && <section className={styles.stack} aria-labelledby="demo-health-title"><div><h3 id="demo-health-title">Sức khỏe của {pet.name}</h3><p className={styles.muted}>Theo dõi cân nặng, chế độ ăn và tình trạng theo thời gian.</p></div>
          <div className={styles.row}><div className={styles.segment}><button type="button" aria-pressed={healthView === "history"} onClick={() => setHealthView("history")}>Nhật ký sức khỏe</button><button type="button" aria-pressed={healthView === "stats"} onClick={() => setHealthView("stats")}>Thống kê</button></div><button type="button" className={styles.primary} onClick={() => setModal({ type: "health" })}>+ Thêm nhật ký</button></div>
          {healthView === "stats" ? <DemoStatistics state={state} petId={pet.pet_id} key={pet.pet_id} /> : <>
            {!logs.length && <p className={styles.empty}>Chưa có nhật ký sức khỏe. Thử thêm nhật ký đầu tiên cho {pet.name}.</p>}
            {logs.map((log) => <article className={styles.logCard} key={log.health_log_id}><h4>Ngày ghi nhận · {displayDate(log.recorded_on)}</h4>
              <dl className={styles.metrics}><div><dt>Cân nặng</dt><dd>{weightLabel(log.weight)}</dd></div><div><dt>Thức ăn</dt><dd>{show(log.food_type)}</dd></div><div><dt>Lượng ăn</dt><dd>{show(log.food_amount)}</dd></div><div><dt>Tình trạng</dt><dd>{show(log.status)}</dd></div></dl>
              {log.note && <p className={styles.note}>Ghi chú: {log.note}</p>}
              <footer className={styles.row}><span className={styles.small}>Thêm bởi chủ nuôi mẫu</span><div className={styles.actions}><button type="button" aria-label={`Chỉnh sửa nhật ký ngày ${displayDate(log.recorded_on)}`} onClick={() => setModal({ type: "health", log })}>Chỉnh sửa</button><button type="button" className={styles.danger} aria-label={`Xóa nhật ký ngày ${displayDate(log.recorded_on)}`} onClick={() => setModal({ type: "delete", log })}>Xóa</button></div></footer>
            </article>)}
          </>}
        </section>}
      </section>}
      <aside className={styles.guide}><h2>Thử trong 3 phút</h2><ol><li>Mở Meo → Sức khỏe → xem Thống kê.</li><li>Mở Sushi → thêm nhật ký đầu tiên → chỉnh sửa → xóa.</li><li>Mở Nhắc hẹn → đổi ngày một lịch quá hạn → hoàn thành.</li><li>Mở chuông → đọc thông báo → khôi phục dữ liệu mẫu.</li></ol>
        <p className={styles.small}>Bản demo minh họa nghiệp vụ bằng dữ liệu giả lập. Đăng nhập, phân quyền Owner, upload ảnh/tệp và gửi email không được thực hiện trong demo.</p></aside>
    </main>
    {modal && <DemoDialog title={modal.type === "health" ? modal.log ? "Chỉnh sửa nhật ký mẫu" : "Thêm nhật ký mẫu" : modal.type === "delete" ? "Xóa nhật ký mẫu?" : modal.type === "reset" ? "Khôi phục dữ liệu mẫu?" : modal.type === "notifications" ? "Thông báo mẫu" : "Chỉnh sửa ngày nhắc"} onClose={close}>
      {modal.type === "health" && pet && <HealthForm log={modal.log} today={today} onCancel={close} onSave={(input) => { const error = act({ type: "health-save", petId: pet.pet_id, id: modal.log?.health_log_id ?? crypto.randomUUID(), input }, "Đã lưu nhật ký mẫu."); if (!error) close(); return error; }} />}
      {modal.type === "delete" && <><p>Xóa nhật ký ngày {displayDate(modal.log.recorded_on)}? Thao tác chỉ áp dụng cho dữ liệu demo của tab này.</p><div className={styles.actions}><button type="button" onClick={close}>Hủy</button><button type="button" className={styles.danger} onClick={() => { act({ type: "health-delete", id: modal.log.health_log_id }, "Đã xóa nhật ký mẫu."); close(); }}>Xóa nhật ký</button></div></>}
      {modal.type === "reset" && <><p>Các thay đổi mẫu của bạn sẽ bị xóa. Bộ dữ liệu ban đầu được tạo lại theo ngày hiện tại.</p><div className={styles.actions}><button type="button" onClick={close}>Hủy</button><button type="button" className={styles.primary} onClick={reset}>Khôi phục</button></div></>}
      {modal.type === "notifications" && <div className={styles.stack}>{!notifications.length && <p>Chưa có thông báo.</p>}{notifications.map((n) => <button type="button" key={n.notification_event_id} className={`${styles.notification} ${!n.read_at ? styles.unread : ""}`} onClick={() => { act({ type: "notification-read", id: n.notification_event_id }, "Đã đọc thông báo mẫu."); openPet(n.pet_id, "reminders"); setFilter("All"); close(); }}>
        <strong>{n.event_type === "overdue" ? "Quá hạn" : "Sắp đến hạn"} · {state.pets.find((p) => p.pet_id === n.pet_id)?.name}</strong><span>Đến hạn ngày {displayDate(n.due_date_snapshot)}</span><span className={styles.small}>{n.read_at ? "Đã đọc" : "Chưa đọc"}</span>
      </button>)}</div>}
      {modal.type === "reminder" && <ReminderForm state={state} id={modal.id} onCancel={close} onSave={(due_date, note) => { const error = act({ type: "reminder-edit", id: modal.id, due_date, note }, "Đã cập nhật ngày nhắc mẫu."); if (!error) close(); return error; }} />}
    </DemoDialog>}
  </div>;
}

function ReminderForm({ state, id, onSave, onCancel }: { state: DemoState; id: string; onSave: (day: string, note: string | null) => string | null; onCancel: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const reminder = state.reminders.find((r) => r.reminder_id === id)!;
  return <form className={styles.form} onKeyDown={preventImplicitSubmit} onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setError(onSave(String(data.get("due_date")), String(data.get("note") ?? "").trim() || null)); }}>
    <label>Ngày đến hạn *<input name="due_date" type="date" defaultValue={reminder.due_date} required /></label>
    <label>Ghi chú<textarea name="note" rows={3} maxLength={1000} defaultValue={reminder.note ?? ""} /></label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><button type="button" onClick={onCancel}>Hủy</button><button type="submit" className={styles.primary}>Lưu ngày nhắc</button></div>
  </form>;
}
