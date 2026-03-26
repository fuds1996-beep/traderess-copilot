/**
 * Shared Google Sheets fetching and parsing logic.
 * Used by both the preview API route and the sync route
 * (avoids self-fetch which fails on Vercel).
 */

/** Fetch rows from a Google Sheet. */
export async function fetchSheetRows(
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Google Sheets API ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    return json.values || [];
  }

  // Fallback: CSV export (works for public/link-shared sheets)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(range)}`;
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      "Failed to fetch sheet. Make sure the sheet is shared with 'Anyone with the link'.",
    );
  }
  return parseCsv(await res.text());
}

/**
 * Auto-detect the header row in a messy spreadsheet.
 * Looks for the row with the most recognized trading column names.
 */
const KNOWN_HEADERS = [
  "date", "day", "pair", "major pair", "symbol", "instrument",
  "direction", "dir", "side", "type",
  "entry", "open", "entry price", "entry strategy",
  "sl", "stop", "stop loss", "sl strategy",
  "tp", "take profit", "target", "tp strategy", "tp rate",
  "result", "outcome", "win/loss", "win",
  "pips", "pip", "r:r", "rr", "r2r", "risk reward", "r/r",
  "session", "notes", "note", "comment", "summary",
  "scenario", "time of entry", "fundamental",
  // Performance headers
  "week", "pnl", "p/l", "profit", "trades", "win rate", "r value",
];

export function findHeaderRow(rows: string[][]): {
  headerIdx: number;
  headers: string[];
} {
  let bestIdx = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row) continue;

    let score = 0;
    for (const cell of row) {
      const lower = cell.toLowerCase().trim();
      if (lower === "") continue;
      for (const kw of KNOWN_HEADERS) {
        if (lower === kw || lower.includes(kw)) {
          score++;
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return {
    headerIdx: bestIdx,
    headers: (rows[bestIdx] || []).map((h) => h.toLowerCase().trim()),
  };
}

/**
 * Check if a row looks like actual trade data (not a label/section header).
 * Must have a parseable date and at least one numeric price-like value.
 */
export function isTradeRow(row: string[], iDate: number, iEntry: number): boolean {
  const dateVal = cellStr(row, iDate);
  const entryVal = cellStr(row, iEntry);

  // Must have a date-like value
  if (!dateVal || dateVal.length < 2) return false;

  // Skip section labels like "Account 1", "10K", "50K Funded", "Monday" alone
  if (/^(account|summary|daily|trades taken|overall|pips)/i.test(dateVal)) return false;

  // Must have a numeric entry price or at least some number in the entry column
  if (iEntry >= 0 && entryVal) {
    const num = parseFloat(entryVal.replace(/[^0-9.\-]/g, ""));
    if (!isNaN(num) && num > 0) return true;
  }

  // If no entry column mapped, check if date looks like a real date
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) return true;

  // Check for date patterns like "23/3/26", "Mar 10"
  if (/\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(dateVal)) return true;

  return false;
}

/** Find column index by trying multiple aliases. */
export function col(headers: string[], ...aliases: string[]): number {
  for (const alias of aliases) {
    // Exact match first
    const exact = headers.findIndex((h) => h === alias);
    if (exact >= 0) return exact;
  }
  for (const alias of aliases) {
    // Then includes match
    const partial = headers.findIndex((h) => h.includes(alias));
    if (partial >= 0) return partial;
  }
  return -1;
}

export function cellStr(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? row[idx].trim() : "";
}

export function cellNum(row: string[], idx: number): number {
  const raw = cellStr(row, idx).replace(/[^0-9.\-]/g, "");
  return parseFloat(raw) || 0;
}

/** Best-effort date parser — handles "Mar 10", "23/3/26", "2026-03-10", etc. */
export function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().split("T")[0];

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  // DD/MM/YY or DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Try native Date ("Mar 10", "March 23, 2026", etc.)
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return new Date().toISOString().split("T")[0];
}

/** Simple CSV parser that handles quoted fields. */
function parseCsv(csv: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        current.push(field.trim());
        field = "";
        if (current.some((c) => c !== "")) lines.push(current);
        current = [];
        if (ch === "\r") i++;
      } else {
        field += ch;
      }
    }
  }

  current.push(field.trim());
  if (current.some((c) => c !== "")) lines.push(current);

  return lines;
}
