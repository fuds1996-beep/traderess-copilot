"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Calendar, Eye, EyeOff, BookOpen, Smile, Meh, Frown } from "lucide-react";
import TradeLogTable from "./TradeLogTable";
import type { Trade, DailyJournal } from "@/lib/types";
import {
  getWeekStart,
  getMonthKey,
  getQuarterKey,
  formatWeekRange,
  formatMonthLabel,
  formatQuarterLabel,
} from "@/lib/date-utils";

type GroupMode = "week" | "month" | "quarter";

function computeGroupStats(trades: Trade[]) {
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const pips = trades.reduce((s, t) => s + (t.overall_pips || t.pips || 0), 0);
  const dollars = trades.reduce((s, t) => {
    const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  return { wins, losses, pips: Math.round(pips * 10) / 10, dollars: Math.round(dollars * 100) / 100, winRate };
}

const DEFAULT_VISIBLE = new Set([
  "account_name", "day", "trade_date", "pair", "session",
  "entry_price", "sl_price", "tp_price", "direction",
  "result", "overall_pips", "rs_gained", "risk_reward",
  "dollar_result", "percent_risked", "trade_quality",
]);

export default function GroupedTradeLog({
  trades,
  journals = [],
  onRefresh,
}: {
  trades: Trade[];
  journals?: DailyJournal[];
  onRefresh: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>("week");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  // Discover custom field keys for column picker
  const customFieldLabels = useMemo(() => {
    const keys = new Set<string>();
    for (const t of trades) {
      if (t.custom_fields && typeof t.custom_fields === "object") {
        for (const k of Object.keys(t.custom_fields)) keys.add(k);
      }
    }
    return [...keys].map((k) => ({
      key: `cf_${k}`,
      label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [trades]);

  const allColumnLabels = useMemo(() => [...ALL_COLUMN_LABELS, ...customFieldLabels], [customFieldLabels]);

  // Sort trades chronologically
  const sortedTrades = useMemo(() =>
    [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date)),
    [trades],
  );

  // Group by selected mode
  const groups = useMemo(() => {
    const keyFn = groupMode === "quarter" ? getQuarterKey : groupMode === "month" ? getMonthKey : getWeekStart;
    const labelFn = groupMode === "quarter" ? formatQuarterLabel : groupMode === "month" ? formatMonthLabel : formatWeekRange;

    const map = new Map<string, Trade[]>();
    for (const t of sortedTrades) {
      const k = keyFn(t.trade_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, grpTrades]) => ({ key, label: labelFn(key), trades: grpTrades }));
  }, [sortedTrades, groupMode]);

  // Group journals by the same period keys as trades
  const journalsByGroup = useMemo(() => {
    const keyFn = groupMode === "quarter" ? getQuarterKey : groupMode === "month" ? getMonthKey : getWeekStart;
    const map = new Map<string, DailyJournal[]>();
    for (const j of journals) {
      const dateStr = j.journal_date || j.week_start || "";
      if (!dateStr) continue;
      const k = keyFn(dateStr);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(j);
    }
    return map;
  }, [journals, groupMode]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleColumn(col: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  }

  if (groups.length === 0) {
    return <TradeLogTable trades={[]} onRefresh={onRefresh} />;
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-0.5 bg-white/50 border border-pink-200/40 rounded-lg">
          {(["week", "month", "quarter"] as GroupMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setGroupMode(m)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                groupMode === m ? "bg-pink-500 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "week" ? "Weekly" : m === "month" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-gray-500 bg-white/50 border border-pink-200/40 rounded-lg hover:bg-white/70 transition-colors"
          >
            {showColumnPicker ? <EyeOff size={11} /> : <Eye size={11} />}
            Columns ({visibleColumns.size})
          </button>

          {showColumnPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-xl shadow-lg p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[10px] text-gray-400">Toggle columns</span>
                  <button onClick={() => setVisibleColumns(DEFAULT_VISIBLE)} className="text-[9px] text-pink-500 hover:text-pink-600">Reset</button>
                </div>
                {allColumnLabels.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 px-2 py-1 text-[10px] text-gray-600 hover:bg-pink-50/50 rounded cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleColumn(key)} className="accent-pink-500 w-3 h-3" />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        const stats = computeGroupStats(group.trades);
        const weekJournals = journalsByGroup.get(group.key) || [];

        return (
          <div key={group.key} className="glass rounded-2xl border border-pink-200/40 overflow-hidden">
            <button onClick={() => toggleGroup(group.key)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-pink-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-pink-500" />
                <span className="text-sm font-semibold text-gray-900">{group.label}</span>
                <span className="text-[10px] text-gray-400">{group.trades.length} trades</span>
                {weekJournals.length > 0 && (
                  <span className="text-[10px] text-purple-400 flex items-center gap-1">
                    <BookOpen size={10} /> {weekJournals.length} journal{weekJournals.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-500 font-medium">{stats.wins}W</span>
                  <span className="text-red-500 font-medium">{stats.losses}L</span>
                  <span className={`font-medium ${stats.dollars >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.dollars >= 0 ? "+" : ""}${Math.abs(stats.dollars).toLocaleString()}
                  </span>
                  <span className="text-gray-400">{stats.winRate}% WR</span>
                </div>
                <div className="hidden md:flex w-20 h-2 rounded-full overflow-hidden bg-gray-100">
                  {stats.wins > 0 && <div className="bg-emerald-400" style={{ width: `${(stats.wins / group.trades.length) * 100}%` }} />}
                  {stats.losses > 0 && <div className="bg-red-400" style={{ width: `${(stats.losses / group.trades.length) * 100}%` }} />}
                </div>
                {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
              </div>
            </button>
            {!isCollapsed && (
              <div className="border-t border-pink-200/30">
                {/* Journal entries for this period */}
                {weekJournals.length > 0 && (
                  <div className="px-5 pt-3 pb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={12} className="text-purple-400" />
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Daily Journal</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                      {weekJournals
                        .sort((a, b) => (a.journal_date || "").localeCompare(b.journal_date || ""))
                        .map((j) => (
                        <JournalMiniCard
                          key={j.id}
                          journal={j}
                          isExpanded={expandedJournalId === j.id}
                          onToggle={() => setExpandedJournalId(expandedJournalId === j.id ? null : j.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Trades by account */}
                <AccountSubGroups trades={group.trades} onRefresh={onRefresh} visibleColumns={visibleColumns} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-group trades by account within each time period ─────────────────────

const ACCOUNT_COLORS = [
  "border-l-pink-400",
  "border-l-emerald-400",
  "border-l-amber-400",
  "border-l-blue-400",
  "border-l-purple-400",
  "border-l-red-400",
];

function AccountSubGroups({ trades, onRefresh, visibleColumns }: {
  trades: Trade[];
  onRefresh: () => void;
  visibleColumns: Set<string>;
}) {
  // Group by account, preserve chronological order within each
  const accountGroups = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const t of trades) {
      const acct = t.account_name || "Unassigned";
      if (!map.has(acct)) map.set(acct, []);
      map.get(acct)!.push(t);
    }
    return [...map.entries()];
  }, [trades]);

  // If only one account (or no account names), show flat list
  if (accountGroups.length <= 1) {
    return (
      <div className="px-5 pb-4 pt-2">
        <TradeLogTable trades={trades} onRefresh={onRefresh} visibleColumns={visibleColumns} />
      </div>
    );
  }

  return (
    <div className="divide-y divide-pink-200/20">
      {accountGroups.map(([accountName, accountTrades], idx) => {
        const stats = computeGroupStats(accountTrades);
        const colorClass = ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length];

        return (
          <div key={accountName} className={`border-l-3 ${colorClass}`}>
            {/* Account sub-header */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-pink-50/30">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colorClass.replace("border-l-", "bg-")}`} />
                <span className="text-xs font-semibold text-gray-800">{accountName}</span>
                <span className="text-[10px] text-gray-400">{accountTrades.length} trades</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-500 font-medium">{stats.wins}W</span>
                <span className="text-red-500 font-medium">{stats.losses}L</span>
                <span className={`font-medium ${stats.dollars >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {stats.dollars >= 0 ? "+" : ""}${Math.abs(stats.dollars).toLocaleString()}
                </span>
                <span className="text-gray-400">{stats.winRate}%</span>
              </div>
            </div>
            {/* Account trades */}
            <div className="px-5 pb-3">
              <TradeLogTable trades={accountTrades} onRefresh={onRefresh} visibleColumns={visibleColumns} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Journal Mini Card (shown inside week groups) ───────────────────────────

const EMOTION_ICONS: Record<number, typeof Smile> = { 1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: Smile };
const EMOTION_COLORS: Record<number, string> = { 1: "text-red-400", 2: "text-amber-400", 3: "text-gray-400", 4: "text-emerald-400", 5: "text-emerald-400" };

function emotionToNum(emotion: string): number {
  const lower = (emotion || "").toLowerCase();
  if (lower.includes("confident") || lower.includes("excited")) return 5;
  if (lower.includes("focused") || lower.includes("calm") || lower.includes("observant")) return 4;
  if (lower.includes("stressed") || lower.includes("doubt") || lower.includes("anxious")) return 2;
  if (lower.includes("frustrat") || lower.includes("fear") || lower.includes("angry")) return 1;
  return 3;
}

function JournalMiniCard({ journal: j, isExpanded, onToggle }: {
  journal: DailyJournal;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const emotionNum = emotionToNum(j.emotion_during);
  const EmIcon = EMOTION_ICONS[emotionNum] || Meh;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? "border-purple-200/60 bg-purple-50/20 col-span-full" : "border-pink-200/30 bg-white/30"}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-2.5 text-left hover:bg-pink-50/30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="text-center w-8">
            <div className="text-[10px] font-bold text-gray-900">{(j.day_of_week || "").slice(0, 3)}</div>
            <div className="text-[8px] text-gray-400">{(j.journal_date || "").slice(5)}</div>
          </div>
          <EmIcon size={14} className={EMOTION_COLORS[emotionNum]} />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-gray-500">{j.emotion_before || "—"}</span>
            <span className="text-gray-300">→</span>
            <span className="text-gray-500">{j.emotion_during || "—"}</span>
            <span className="text-gray-300">→</span>
            <span className="text-gray-500">{j.emotion_after || "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {j.effort_rating > 0 && <span className="text-[9px] text-amber-400">{"⭐".repeat(j.effort_rating)}</span>}
          {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-pink-200/20 pt-2 space-y-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">Mood</span>
              <div className="text-gray-700 font-medium">{j.market_mood || "—"}</div>
            </div>
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">Fundmntls</span>
              <div className="text-gray-700 font-medium">{j.fundamentals_summary || "—"}</div>
            </div>
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">Trades</span>
              <div className="text-gray-700 font-medium">{j.trades_taken || 0}</div>
            </div>
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">Pips</span>
              <div className={`font-medium ${(j.pips_overall || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{j.pips_overall || 0}</div>
            </div>
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">R&apos;s</span>
              <div className={`font-medium ${(j.rs_total || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{j.rs_total || 0}R</div>
            </div>
            <div className="p-1.5 bg-white/40 rounded">
              <span className="text-gray-400">Effort</span>
              <div className="text-gray-700 font-medium">{j.effort_rating || 0}/5</div>
            </div>
          </div>
          {j.journal_text && (
            <div>
              <div className="text-[9px] text-purple-400 font-semibold mb-0.5 uppercase tracking-wide">Journal</div>
              <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{j.journal_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALL_COLUMN_LABELS = [
  { key: "account_name", label: "Account" },
  { key: "day", label: "Day" },
  { key: "trade_date", label: "Date" },
  { key: "scenario", label: "Scenario" },
  { key: "pair", label: "Pair" },
  { key: "session", label: "Session" },
  { key: "time_of_entry", label: "Entry Time" },
  { key: "time_of_exit", label: "Exit Time" },
  { key: "entry_price", label: "Entry Price" },
  { key: "sl_price", label: "SL Price" },
  { key: "tp_price", label: "TP Price" },
  { key: "direction", label: "Direction" },
  { key: "entry_strategy", label: "Entry Strategy" },
  { key: "sl_strategy", label: "SL Strategy" },
  { key: "tp_strategy", label: "TP Strategy" },
  { key: "entry_conf_1", label: "Confirmation 1" },
  { key: "entry_conf_2", label: "Confirmation 2" },
  { key: "entry_conf_3", label: "Confirmation 3" },
  { key: "fundamental_check", label: "Fundamental?" },
  { key: "event_within_2h", label: "Event 2h?" },
  { key: "safe_window", label: "Safe Window?" },
  { key: "result", label: "Result" },
  { key: "overall_pips", label: "Pips" },
  { key: "rs_gained", label: "R's Gained" },
  { key: "risk_reward", label: "R2R" },
  { key: "dollar_result", label: "$ Result" },
  { key: "percent_risked", label: "% Risked" },
  { key: "before_picture", label: "Before Pic" },
  { key: "after_picture", label: "After Pic" },
  { key: "trade_quality", label: "Quality" },
  { key: "forecasted", label: "Forecasted?" },
  { key: "trade_evaluation", label: "Evaluation" },
];
