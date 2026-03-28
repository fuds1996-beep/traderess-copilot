"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Check,
  Clock,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  BookOpen,
  Target,
  BarChart3,
  Calendar,
  Brain,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SyncRecord {
  id: string;
  sync_mode: string;
  sheet_name: string;
  week_start: string;
  status: string;
  confidence: string;
  message: string;
  synced: Record<string, number>;
  duration_seconds: number;
  created_at: string;
}

const DATA_TYPE_META: Record<string, { icon: typeof Database; label: string; color: string }> = {
  trades: { icon: BarChart3, label: "Trades", color: "text-brand" },
  journals: { icon: BookOpen, label: "Journals", color: "text-purple-500" },
  chart_time: { icon: Clock, label: "Chart Time", color: "text-blue-500" },
  account_balances: { icon: Database, label: "Balances", color: "text-emerald-500" },
  missed_trades: { icon: AlertCircle, label: "Missed Trades", color: "text-amber-500" },
  goals: { icon: Target, label: "Goals", color: "text-indigo-500" },
  weekly_summary: { icon: Calendar, label: "Summary", color: "text-rose-500" },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-600 border-emerald-200/40",
  medium: "bg-amber-50 text-amber-600 border-amber-200/40",
  low: "bg-red-50 text-red-600 border-red-200/40",
};

export default function SyncHistory({ refreshKey }: { refreshKey?: number }) {
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("sync_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setRecords((data as SyncRecord[]) || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory, refreshKey]);

  async function deleteSyncRun(record: SyncRecord) {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete data based on the sync's week_start and sheet range
      // For trades: delete by date range if week_start is available
      if (record.week_start && record.status === "success") {
        const ws = record.week_start;
        // Compute week end (7 days from start)
        const startDate = new Date(ws);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const from = ws;
        const to = endDate.toISOString().split("T")[0];

        // Delete trades in this date range
        if (record.synced.trades) {
          await supabase.from("trade_log").delete()
            .eq("user_id", user.id).gte("trade_date", from).lte("trade_date", to);
        }
        // Delete journals in this date range
        if (record.synced.journals) {
          await supabase.from("daily_journals").delete()
            .eq("user_id", user.id).gte("journal_date", from).lte("journal_date", to);
        }
        // Delete chart time in this date range
        if (record.synced.chart_time) {
          await supabase.from("chart_time_log").delete()
            .eq("user_id", user.id).gte("log_date", from).lte("log_date", to);
        }
        // Delete account balances for this week
        if (record.synced.account_balances) {
          await supabase.from("account_balances").delete()
            .eq("user_id", user.id).eq("week_start", ws);
        }
        // Delete weekly summary for this week
        if (record.synced.weekly_summary) {
          await supabase.from("weekly_summaries").delete()
            .eq("user_id", user.id).eq("week_start", ws);
        }
        // Delete missed trades in this date range
        if (record.synced.missed_trades) {
          await supabase.from("missed_trades").delete()
            .eq("user_id", user.id).gte("trade_date", from).lte("trade_date", to);
        }
        // Delete trading goals for this month
        if (record.synced.goals) {
          await supabase.from("trading_goals").delete()
            .eq("user_id", user.id).eq("period_start", ws.slice(0, 7) + "-01");
        }
      }

      // Delete the sync history record itself
      await supabase.from("sync_history").delete().eq("id", record.id);

      // Remove from local state immediately for instant UI update
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setDeleteConfirmId(null);
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-brand-light/30 rounded-xl" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <History size={24} className="text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No sync history yet</p>
        <p className="text-[10px] text-gray-300 mt-1">Your sync runs will appear here after your first import</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((r) => {
        const isExpanded = expandedId === r.id;
        const syncedEntries = Object.entries(r.synced).filter(([, v]) => v > 0);
        const totalItems = syncedEntries.reduce((s, [, v]) => s + v, 0);
        const date = new Date(r.created_at);
        const timeAgo = getTimeAgo(date);

        return (
          <div key={r.id} className="border border-brand-light/30 rounded-xl overflow-hidden bg-white/30">
            <button
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-light/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  r.status === "success"
                    ? "bg-emerald-50 border border-emerald-200/40"
                    : "bg-red-50 border border-red-200/40"
                }`}>
                  {r.status === "success" ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={14} className="text-red-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {r.sync_mode === "comprehensive" ? "Full Sync" : "Trades Only"}
                    </span>
                    {r.sync_mode === "comprehensive" ? (
                      <Zap size={10} className="text-brand" />
                    ) : (
                      <Sparkles size={10} className="text-brand" />
                    )}
                    {r.confidence && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${CONFIDENCE_COLORS[r.confidence] || "bg-gray-50 text-gray-500"}`}>
                        {r.confidence}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span>{r.sheet_name || "Sheet1"}</span>
                    {r.week_start && <span>· Week {r.week_start}</span>}
                    <span>· {timeAgo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{totalItems} items</span>
                  <span>·</span>
                  <span>{formatDuration(r.duration_seconds)}</span>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-brand-light/20 pt-3 space-y-3">
                {/* Data breakdown */}
                {syncedEntries.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {syncedEntries.map(([key, count]) => {
                      const meta = DATA_TYPE_META[key];
                      const Icon = meta?.icon || Database;
                      return (
                        <div key={key} className="flex items-center gap-2 p-2.5 bg-brand-light/60 rounded-lg">
                          <Icon size={14} className={meta?.color || "text-gray-500"} />
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{count}</div>
                            <div className="text-[9px] text-gray-400">{meta?.label || key}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 bg-white/40 rounded-lg">
                    <span className="text-gray-400">Date</span>
                    <div className="text-gray-700 font-medium">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <div className="p-2 bg-white/40 rounded-lg">
                    <span className="text-gray-400">Time</span>
                    <div className="text-gray-700 font-medium">{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div className="p-2 bg-white/40 rounded-lg">
                    <span className="text-gray-400">Duration</span>
                    <div className="text-gray-700 font-medium">{formatDuration(r.duration_seconds)}</div>
                  </div>
                  <div className="p-2 bg-white/40 rounded-lg">
                    <span className="text-gray-400">Mode</span>
                    <div className="text-gray-700 font-medium">{r.sync_mode === "comprehensive" ? "Full" : "Trades"}</div>
                  </div>
                </div>

                {/* AI message */}
                {r.message && (
                  <div className="p-3 bg-brand-light/60 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain size={11} className="text-brand" />
                      <span className="text-[9px] text-brand font-semibold uppercase tracking-wide">AI Notes</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{r.message}</p>
                  </div>
                )}

                {/* Delete button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setDeleteConfirmId(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-red-400 hover:text-red-500 hover:bg-red-50/60 rounded-lg transition-colors"
                  >
                    <Trash2 size={11} /> Delete this sync &amp; its data
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-brand-light/40 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Sync Data?</h3>
            <p className="text-sm text-gray-500 mb-2">This will permanently delete:</p>
            <div className="text-xs text-gray-500 mb-4 space-y-0.5">
              {(() => {
                const rec = records.find((r) => r.id === deleteConfirmId);
                if (!rec) return null;
                const items = Object.entries(rec.synced).filter(([, v]) => v > 0);
                return items.map(([key, count]) => (
                  <div key={key}>• {count} {DATA_TYPE_META[key]?.label || key}</div>
                ));
              })()}
              <div>• This sync history record</div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-gray-500 bg-white/60 border border-brand-light/40 rounded-xl hover:bg-brand-light">Cancel</button>
              <button
                onClick={() => {
                  const rec = records.find((r) => r.id === deleteConfirmId);
                  if (rec) deleteSyncRun(rec);
                }}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl shadow-md shadow-red-500/20"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
