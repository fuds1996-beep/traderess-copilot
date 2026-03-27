"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
  Database,
  BookOpen,
  Clock,
  Target,
  BarChart3,
  Shield,
} from "lucide-react";

type SyncMode = "trades_only" | "comprehensive";

interface SyncResult {
  synced: Record<string, number> | number;
  confidence: "high" | "medium" | "low";
  message: string;
}

export default function SheetsConnector({ onSyncComplete }: { onSyncComplete?: () => void } = {}) {
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

    const startTime = Date.now();
    setSyncing(true);
    try {
      // 5 minute timeout for AI parsing
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: id,
          range,
          mode: syncMode,
          weekStart: weekStart || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      const durationSec = Math.round((Date.now() - startTime) / 1000);

      if (!res.ok) {
        const errorMsg = data.error || "Sync failed";
        setError(errorMsg);
        await saveHistory("failed", "", errorMsg, {}, durationSec);
        onSyncComplete?.();
        return;
      }

      setSyncResult(data);
      await saveHistory("success", data.confidence || "", data.message || "", data.synced || {}, durationSec);
      onSyncComplete?.();
    } catch (err) {
      const durationSec = Math.round((Date.now() - startTime) / 1000);
      let errorMsg: string;
      if (err instanceof DOMException && err.name === "AbortError") {
        errorMsg = "Sync timed out after 5 minutes. Try syncing a smaller sheet range or use 'Trades Only' mode.";
      } else {
        errorMsg = "Sync request failed. This may be a timeout issue — try 'Trades Only' mode for faster syncing, or check that the sheet is shared publicly.";
      }
      setError(errorMsg);
      await saveHistory("failed", "", errorMsg, {}, durationSec);
      onSyncComplete?.();
    } finally {
      setSyncing(false);
    }

    async function saveHistory(status: string, confidence: string, message: string, synced: Record<string, unknown>, durationSec: number) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("sync_history").insert({
            user_id: user.id,
            sync_mode: syncMode,
            sheet_name: range || "Sheet1",
            week_start: weekStart || "",
            status,
            confidence,
            message,
            synced,
            duration_seconds: durationSec,
          });
        }
      } catch { /* non-critical */ }
    }
  }

  const confidenceColors = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Syncing overlay — shown on top, does NOT unmount the rest */}
      {syncing && <SyncProgressOverlay mode={syncMode} />}

      {/* URL Input — hidden while syncing */}
      {syncing ? null : (<>
      {/* URL Input */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Google Sheet URL or ID</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => { setSheetUrl(e.target.value); reset(); }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-white/60 border border-brand-light/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !sheetUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-light/60 hover:bg-slate-600 disabled:opacity-40 text-gray-900 text-sm rounded-lg transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Preview
          </button>
        </div>
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Sheet Name / Range</label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="March 2-6"
            className="w-full bg-white/60 border border-brand-light/40 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Week Start Date</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full bg-white/60 border border-brand-light/40 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Sync Mode</label>
          <div className="flex gap-1">
            <button
              onClick={() => setSyncMode("comprehensive")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                syncMode === "comprehensive"
                  ? "bg-brand/10 border-brand text-brand"
                  : "bg-white/60 border-brand-light/40 text-gray-500 hover:border-brand-light/50"
              }`}
            >
              <Zap size={12} /> Full Sync
            </button>
            <button
              onClick={() => setSyncMode("trades_only")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
                syncMode === "trades_only"
                  ? "bg-brand/10 border-brand text-brand"
                  : "bg-white/60 border-brand-light/40 text-gray-500 hover:border-brand-light/50"
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
        <div className="bg-white/60 border border-brand-light/40 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-brand-light/40">
            <span className="text-xs text-gray-500">Data preview (auto-detected headers)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-brand-light/40">
                  {preview[0]?.map((h, i) => (
                    <th key={i} className="text-left py-1.5 px-2 text-gray-500 font-medium whitespace-nowrap">
                      {h || <span className="text-gray-300">—</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-brand-light/30 last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-1.5 px-2 text-gray-600 truncate max-w-[120px]">
                        {cell || <span className="text-slate-700">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync button */}
          <div className="px-3 py-3 border-t border-brand-light/40 bg-white/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Brain size={14} className="text-brand" />
                <span>
                  {syncMode === "comprehensive"
                    ? "AI will extract trades, journals, chart time, balances, goals & more"
                    : "AI will extract trade entries only"}
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
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
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/50 ${confidenceColors[syncResult.confidence]}`}>
              {syncResult.confidence} confidence
            </span>
          </div>
          {typeof syncResult.synced === "object" && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(syncResult.synced).map(([key, val]) => (
                <span key={key} className="text-[10px] px-2 py-0.5 bg-white/50 rounded text-gray-600">
                  {val} {key.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
          {syncResult.message && (
            <p className="text-xs text-gray-500">{syncResult.message}</p>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="text-[10px] text-gray-300 space-y-1">
        <p>Your Google Sheet must be shared with &quot;Anyone with the link&quot; (Viewer access).</p>
        <p>
          <strong>Full Sync</strong> extracts trades, daily journals (emotions, market mood, summaries), chart time tracking, account balances, missed trades, goals, and weekly summaries.
        </p>
        <p>
          <strong>Trades Only</strong> extracts just the trade entries (faster, lower API cost).
        </p>
      </div>
      </>)}
    </div>
  );
}

// ─── Sync Progress Overlay ──────────────────────────────────────────────────

const SYNC_STEPS_FULL = [
  { icon: FileSpreadsheet, label: "Reading spreadsheet data", detail: "Fetching rows from Google Sheets..." },
  { icon: Brain, label: "AI is analyzing your data", detail: "Claude is reading your trades, journals, and psychology..." },
  { icon: Database, label: "Extracting trade entries", detail: "Identifying trade rows across all accounts..." },
  { icon: BookOpen, label: "Parsing daily journals", detail: "Extracting emotions, market mood, and evaluations..." },
  { icon: Clock, label: "Processing chart time logs", detail: "Computing daily study and screen time..." },
  { icon: BarChart3, label: "Calculating account balances", detail: "Reading start/end week balances per account..." },
  { icon: Target, label: "Extracting goals & intentions", detail: "Parsing primary, process, and psychological goals..." },
  { icon: Shield, label: "Saving to your dashboard", detail: "Writing data to all tables..." },
  { icon: Sparkles, label: "Almost there...", detail: "Finalizing and verifying your data..." },
];

const SYNC_STEPS_TRADES = [
  { icon: FileSpreadsheet, label: "Reading spreadsheet data", detail: "Fetching rows from Google Sheets..." },
  { icon: Brain, label: "AI is analyzing trades", detail: "Claude is reading your trade entries..." },
  { icon: Database, label: "Extracting trade data", detail: "Parsing entries, prices, results, evaluations..." },
  { icon: Shield, label: "Saving trades", detail: "Writing to your trade log..." },
  { icon: Sparkles, label: "Almost there...", detail: "Finalizing..." },
];

function SyncProgressOverlay({ mode }: { mode: "trades_only" | "comprehensive" }) {
  const steps = mode === "comprehensive" ? SYNC_STEPS_FULL : SYNC_STEPS_TRADES;
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Simulate progress through steps
    const stepInterval = mode === "comprehensive" ? 15000 : 8000; // ms per step
    const totalSteps = steps.length;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
    }, stepInterval);

    // Elapsed timer
    const timerInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerInterval);
    };
  }, [mode, steps.length]);

  const progressPercent = Math.min(((currentStep + 1) / steps.length) * 100, 95);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="py-6">
      <div className="glass rounded-2xl border border-brand-light/40 p-8 max-w-md mx-auto text-center">
        {/* Animated icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-brand-light/40 border-t-brand animate-spin" />
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/30 animate-pulse">
            {(() => { const StepIcon = steps[currentStep].icon; return <StepIcon size={24} className="text-white" />; })()}
          </div>
        </div>

        {/* Current step */}
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {steps[currentStep].label}
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          {steps[currentStep].detail}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-brand-light/50 rounded-full h-2 mb-3">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                i < currentStep ? "bg-brand" :
                i === currentStep ? "bg-brand scale-125" :
                "bg-brand-light"
              }`}
            />
          ))}
        </div>

        {/* Timer + estimate */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
          <span className="font-mono">
            {minutes}:{String(seconds).padStart(2, "0")} elapsed
          </span>
          <span>·</span>
          <span>
            {mode === "comprehensive"
              ? "Full sync takes 2–5 minutes"
              : "Usually takes 30–60 seconds"}
          </span>
        </div>

        {/* Patience message */}
        <p className="text-[10px] text-gray-300 mt-4 italic">
          AI is carefully reading every row of your spreadsheet — please don&apos;t close this page
        </p>
      </div>
    </div>
  );
}
