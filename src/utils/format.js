const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const DAY = 86400000;

export function dueAt(assignment) {
  return new Date(`${assignment.dueDate}T${assignment.dueTime || "23:59"}`);
}

/** "5 Oct 2026" or "5 Oct 2026, 23:59" */
export function formatDate(value, { time = false } = {}) {
  if (!value) return "-";
  const d = new Date(value);
  const s = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return time ? `${s}, ${pad(d.getHours())}:${pad(d.getMinutes())}` : s;
}

/** "5 Oct" or "5 Oct, 23:59" */
export function formatShort(value, { time = false } = {}) {
  if (!value) return "-";
  const d = new Date(value);
  const s = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return time ? `${s}, ${pad(d.getHours())}:${pad(d.getMinutes())}` : s;
}

export function daysUntil(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY);
}

export function dueLabel(assignment) {
  const n = daysUntil(dueAt(assignment));
  if (n < 0) return "Closed";
  if (n === 0) return "Due today";
  if (n <= 7) return `Due in ${n} day${n === 1 ? "" : "s"}`;
  return `Due ${formatShort(dueAt(assignment))}`;
}

export function relative(value) {
  const d = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - new Date(d).setHours(0, 0, 0, 0)) / DAY);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days <= 0) return `today, ${time}`;
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatShort(d);
}

export function fileSize(bytes) {
  if (bytes == null) return "";
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Semester number as a Roman numeral: 2 -> "II". */
export function roman(n) {
  const i = Number(n);
  return ROMAN[i - 1] ?? String(n ?? "");
}

export const firstName = (name = "") => name.split(" ")[0];
export const shortTitle = (title = "") => title.split(":")[0];

/** Triggers a browser download of text content (CSV, JSON). */
export function download(filename, text, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  return rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
