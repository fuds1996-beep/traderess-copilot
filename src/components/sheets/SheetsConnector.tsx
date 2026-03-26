"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
} from "lucide-react";

type SyncMode = "trades_only" | "comprehensive";

interface SyncResult {
  synced: Record<string, number> | number;
  confidence: "high" | "medium" | "low";
  message: string;
}

export default function SheetsConnector() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [range, setRange] = useState("Sheet1");
  const [syncMode, setSyncMode] = useState<SyncMode>("comprehensive");
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
    return null;
  }

  function reset() {
    setPreview(null);
    setSyncResult(null);
    setError(null);
  }

  async function handlePreview() {
    reset();
    const id = extractSpreadsheetId(sheetUrl);
    if (!id) {
      setError("Invalid Google Sheets URL. Paste the full URL or spreadsheet ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sheets?spreadsheetId=${id}&range=${encodeURIComponent(range)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch sheet"); return; }
      if (!data.rows || data.rows.length === 0) { setError("Sheet is empty or inaccessible"); return; }
      const headerIdx = data.headerIdx ?? 0;
      setPreview(data.rows.slice(headerIdx, headerIdx + 6));
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

    setSyncing(true);
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: id,
          range,
          mode: syncMode,
          weekStart: weekStart || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Sync failed"); return; }
      setSyncResult(data);
    } catch {
      setError("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

  const confidenceColors = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Google Sheet URL or ID</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => { setSheetUrl(e.target.value); reset(); }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !sheetUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm rounded-lg transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Preview
          </button>
        </div>
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Sheet Name / Range</label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="March 2-6"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Week Start Date</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Sync Mode</label>
          <div className="flex gap-1">
            <button
              onClick={() => setSyncMode("comprehensive")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                syncMode === "comprehensive"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <Zap size={12} /> Full Sync
            </button>
            <button
              onClick={() => setSyncMode("trades_only")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                syncMode === "trades_only"
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              <Sparkles size={12} /> Trades Only
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
            <span className="text-xs text-slate-400">Data preview (auto-detected headers)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {preview[0]?.map((h, i) => (
                    <th key={i} className="text-left py-1.5 px-2 text-slate-400 font-medium whitespace-nowrap">
                      {h || <span className="text-slate-600">—</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800 last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-1.5 px-2 text-slate-300 truncate max-w-[120px]">
                        {cell || <span className="text-slate-700">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync button */}
          <div className="px-3 py-3 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Brain size={14} className="text-indigo-400" />
                <span>
                  {syncMode === "comprehensive"
                    ? "AI will extract trades, journals, chart time, balances, goals & more"
                    : "AI will extract trade entries only"}
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {syncing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {syncMode === "comprehensive" ? "Full sync..." : "Parsing..."}
                  </>
                ) : (
                  <>
                    {syncMode === "comprehensive" ? <Zap size={14} /> : <Sparkles size={14} />}
                    {syncMode === "comprehensive" ? "Full Sync with AI" : "Sync Trades"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {syncResult && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400 font-medium">Sync complete</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-800 ${confidenceColors[syncResult.confidence]}`}>
              {syncResult.confidence} confidence
            </span>
          </div>
          {typeof syncResult.synced === "object" && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(syncResult.synced).map(([key, val]) => (
                <span key={key} className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                  {val} {key.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
          {syncResult.message && (
            <p className="text-xs text-slate-400">{syncResult.message}</p>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="text-[10px] text-slate-600 space-y-1">
        <p>Your Google Sheet must be shared with &quot;Anyone with the link&quot; (Viewer access).</p>
        <p>
          <strong>Full Sync</strong> extracts trades, daily journals (emotions, market mood, summaries), chart time tracking, account balances, missed trades, goals, and weekly summaries.
        </p>
        <p>
          <strong>Trades Only</strong> extracts just the trade entries (faster, lower API cost).
        </p>
      </div>
    </div>
  );
}
