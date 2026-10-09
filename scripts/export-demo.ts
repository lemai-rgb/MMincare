import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDemoState, getDemoNotifications, isDemoDate } from "../lib/demo/data";
import { getVietnamToday } from "../lib/healthLogs/dashboard";

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--date" || !isDemoDate(args[1]))) {
  throw new Error("Usage: npm run demo:export -- [--date YYYY-MM-DD]");
}
async function main() {
const date = args[1] ?? getVietnamToday();
const state = createDemoState(date);
const data = { ...state, notification_events: getDemoNotifications(state, date) };
const directory = path.resolve("demo/generated");
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "dataset.json"), `${JSON.stringify(data, null, 2)}\n`);

function cell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Do not let a future edited fixture execute spreadsheet formulas.
  if (/^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
for (const [name, rows] of Object.entries({ pets: data.pets, vaccine_records: data.vaccine_records,
  medical_records: data.medical_records, health_logs: data.health_logs, reminders: data.reminders,
  notification_events: data.notification_events })) {
  const columns = Object.keys(rows[0] ?? {});
  const csv = [columns.map(cell).join(","), ...rows.map((row) => columns.map((column) => cell((row as unknown as Record<string, unknown>)[column])).join(","))].join("\n");
  await writeFile(path.join(directory, `${name}.csv`), `\uFEFF${csv}\n`);
}
await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify({
  format_version: 1, anchor_day: date, synthetic: true, target: "browser-only portfolio demo",
  production_import_allowed: false,
  counts: { pets: data.pets.length, vaccine_records: data.vaccine_records.length,
    medical_records: data.medical_records.length, health_logs: data.health_logs.length,
    reminders: data.reminders.length, notification_events: data.notification_events.length },
  note: "No Auth users, passwords, storage objects or vaccine schedule rules. Notification IDs are demo snapshot keys, not database UUIDs.",
}, null, 2)}\n`);
console.log(`Exported synthetic dataset for ${date} to demo/generated (no network/database access).`);
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
