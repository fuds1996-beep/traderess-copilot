/**
 * Shared date utilities — avoids timezone bugs from new Date("YYYY-MM-DD").
 * Always parses date strings as local dates, not UTC.
 */

/** Parse "YYYY-MM-DD" as a local Date (no timezone offset issues). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Get the Monday (ISO week start) for a given "YYYY-MM-DD" date string. */
export function getWeekStart(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return "unknown";
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return "unknown";
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return formatDate(monday);
}

/** Format a Date as "YYYY-MM-DD". */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Format a week range: "Mar 9 – Mar 15, 2026" */
export function formatWeekRange(weekStart: string): string {
  if (weekStart === "unknown") return "Unknown dates";
  const start = parseLocalDate(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}, ${start.getFullYear()}`;
}

/** Get month key: "2026-03" */
export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Get quarter key: "2026-Q1" */
export function getQuarterKey(dateStr: string): string {
  const month = parseInt(dateStr.slice(5, 7));
  const q = Math.ceil(month / 3);
  return `${dateStr.slice(0, 4)}-Q${q}`;
}

/** Format month: "March 2026" */
export function formatMonthLabel(key: string): string {
  const d = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Format quarter: "Q1 2026" */
export function formatQuarterLabel(key: string): string {
  const [year, q] = key.split("-");
  return `${q} ${year}`;
}

/** Format week: "Mar 9 – Mar 13" (Mon–Fri) */
export function formatWeekLabel(weekStart: string): string {
  const start = parseLocalDate(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}
