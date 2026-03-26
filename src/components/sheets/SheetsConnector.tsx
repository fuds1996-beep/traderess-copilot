"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Table,
  TrendingUp,
} from "lucide-react";

type SheetType = "trades" | "performance";

interface SyncResult {
  synced: number;
  message: string;
}

export default function SheetsConnector() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [range, setRange] = useState("Sheet1");
  const [sheetType, setSheetType] = useState<SheetType>("trades");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function extractSpreadsheetId(url: string): string | null {
    // Handle full URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    // Handle raw ID
    if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
    return null;
  }

  async function handlePreview() {
    setError(null);
    setPreview(null);
    setSyncResult(null);

    const id = extractSpreadsheetId(sheetUrl);
    if (!id) {
      setError(
        "Invalid Google Sheets URL. Paste the full URL or the spreadsheet ID.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/sheets?spreadsheetId=${id}&range=${encodeURIComponent(range)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch sheet");
        return;
      }

      if (!data.rows || data.rows.length === 0) {
        setError("Sheet is empty or inaccessible");
        return;
      }

      setPreview(data.rows.slice(0, 6)); // Show header + 5 rows
    } catch {
      setError("Failed to connect to Google Sheets");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setError(null);
    setSyncResult(null);

    const id = extractSpreadsheetId(sheetUrl);
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: id,
          range,
          sheetType,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sync failed");
        return;
      }

      setSyncResult(data);
    } catch {
      setError("Sync request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          Google Sheet URL or ID
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                setPreview(null);
                setSyncResult(null);
                setError(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !sheetUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm rounded-lg transition-colors shrink-0"
          >
            {loading && !syncResult ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={14} />
            )}
            Preview
          </button>
        </div>
      </div>

      {/* Options row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1.5">
            Sheet / Range
          </label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Sheet1 or Sheet1!A1:K"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Data Type
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setSheetType("trades")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                sheetType === "trades"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <Table size={12} /> Trades
            </button>
            <button
              onClick={() => setSheetType("performance")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                sheetType === "performance"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <TrendingUp size={12} /> Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <span className="text-xs text-slate-400">
              Preview ({preview.length - 1} data rows shown)
            </span>
            <span className="text-[10px] text-slate-500">
              Headers: {preview[0]?.join(", ")}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {preview[0]?.map((h, i) => (
                    <th
                      key={i}
                      className="text-left py-1.5 px-2 text-slate-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-slate-800 last:border-0"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="py-1.5 px-2 text-slate-300 truncate max-w-[120px]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync button */}
          <div className="px-3 py-2.5 border-t border-slate-700">
            <button
              onClick={handleSync}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Sync {sheetType === "trades" ? "Trades" : "Performance"} to
              Copilot
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {syncResult && (
        <div className="flex items-center gap-2 p-3 bg-emerald-900/30 border border-emerald-800/50 rounded-lg">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">{syncResult.message}</p>
        </div>
      )}

      {/* Help text */}
      <div className="text-[10px] text-slate-600 space-y-1">
        <p>
          Your Google Sheet must be shared with &quot;Anyone with the
          link&quot; (Viewer access).
        </p>
        <p>
          <strong>Trade log columns:</strong> Date, Pair, Direction, Entry, SL,
          TP, Result, Pips, R:R, Session, Notes
        </p>
        <p>
          <strong>Performance columns:</strong> Week, PnL, Trades, Win Rate, R
          Value
        </p>
      </div>
    </div>
  );
}
