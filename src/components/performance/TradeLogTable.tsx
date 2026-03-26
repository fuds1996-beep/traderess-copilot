"use client";

import { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  X,
  Pencil,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Trade } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// ─── Column definitions ──────────────────────────────────────────────────────

const COLUMNS = [
  { key: "account_name", label: "Account", width: "w-20" },
  { key: "day", label: "Day", width: "w-16" },
  { key: "trade_date", label: "Date", width: "w-24" },
  { key: "scenario", label: "Scenario", width: "w-20" },
  { key: "pair", label: "Pair", width: "w-20" },
  { key: "session", label: "Session", width: "w-24" },
  { key: "time_of_entry", label: "Entry Time", width: "w-20" },
  { key: "time_of_exit", label: "Exit Time", width: "w-20" },
  { key: "entry_price", label: "Entry", width: "w-22" },
  { key: "sl_price", label: "SL", width: "w-22" },
  { key: "tp_price", label: "TP", width: "w-22" },
  { key: "direction", label: "Dir", width: "w-16" },
  { key: "entry_strategy", label: "Entry Strat", width: "w-28" },
  { key: "sl_strategy", label: "SL Strat", width: "w-28" },
  { key: "tp_strategy", label: "TP Strat", width: "w-28" },
  { key: "entry_conf_1", label: "Conf 1", width: "w-24" },
  { key: "entry_conf_2", label: "Conf 2", width: "w-24" },
  { key: "entry_conf_3", label: "Conf 3", width: "w-24" },
  { key: "fundamental_check", label: "Fund?", width: "w-14" },
  { key: "event_within_2h", label: "Event?", width: "w-14" },
  { key: "safe_window", label: "Safe?", width: "w-14" },
  { key: "result", label: "Result", width: "w-16" },
  { key: "overall_pips", label: "Pips", width: "w-16" },
  { key: "rs_gained", label: "R's", width: "w-14" },
  { key: "risk_reward", label: "R2R", width: "w-16" },
  { key: "dollar_result", label: "$ Result", width: "w-20" },
  { key: "percent_risked", label: "% Risk", width: "w-16" },
  { key: "before_picture", label: "Before", width: "w-14" },
  { key: "after_picture", label: "After", width: "w-14" },
  { key: "trade_quality", label: "Quality", width: "w-20" },
  { key: "forecasted", label: "Forecast?", width: "w-24" },
] as const;

type TradeKey = (typeof COLUMNS)[number]["key"];

const BOOL_FIELDS = new Set(["fundamental_check", "event_within_2h", "safe_window"]);
const NUM_FIELDS = new Set(["entry_price", "sl_price", "tp_price", "overall_pips", "rs_gained", "pips"]);

type SortDir = "asc" | "desc";

function newEmptyTrade(): Partial<Trade> {
  return {
    account_name: "", day: "", trade_date: new Date().toISOString().split("T")[0],
    scenario: "", pair: "EUR/USD", session: "London", time_of_entry: "", time_of_exit: "",
    entry_price: 0, sl_price: 0, tp_price: 0, entry_strategy: "", sl_strategy: "", tp_strategy: "",
    direction: "Long", entry_conf_1: "", entry_conf_2: "", entry_conf_3: "",
    fundamental_check: false, event_within_2h: false, safe_window: true,
    result: "Win", overall_pips: 0, pips: 0, rs_gained: 0, risk_reward: "", dollar_result: "",
    percent_risked: "", before_picture: "", after_picture: "", trade_quality: "",
    forecasted: "", trade_evaluation: "", notes: "",
  };
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function TradeLogTable({
  trades,
  onRefresh,
}: {
  trades: Trade[];
  onRefresh: () => void;
}) {
  // Filters
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("trade_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // CRUD state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>(newEmptyTrade());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derive unique values for filters
  const accounts = useMemo(() => [...new Set(trades.map((t) => t.account_name).filter(Boolean))], [trades]);
  const sessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean))], [trades]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = [...trades];
    if (accountFilter !== "all") list = list.filter((t) => t.account_name === accountFilter);
    if (sessionFilter !== "all") list = list.filter((t) => t.session === sessionFilter);
    if (resultFilter !== "all") list = list.filter((t) => t.result === resultFilter);

    list.sort((a, b) => {
      const aVal = a[sortField as keyof Trade];
      const bVal = b[sortField as keyof Trade];
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [trades, accountFilter, sessionFilter, resultFilter, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // ─── CRUD handlers ──────────────────────────────────────────────────────────

  function startEdit(trade: Trade) {
    setEditingId(trade.id);
    setEditData({ ...trade });
  }

  function cancelEdit() { setEditingId(null); setEditData({}); }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();
    const updates = { ...editData };
    delete updates.id; delete updates.user_id; delete updates.created_at;
    await supabase.from("trade_log").update(updates).eq("id", editingId);
    setSaving(false); cancelEdit(); onRefresh();
  }

  async function deleteTrade(id: string) {
    const supabase = createClient();
    await supabase.from("trade_log").delete().eq("id", id);
    onRefresh();
  }

  async function addTrade() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("trade_log").insert({ user_id: user.id, ...newTrade });
    setSaving(false); setAddingNew(false); setNewTrade(newEmptyTrade()); onRefresh();
  }

  // ─── Cell renderers ─────────────────────────────────────────────────────────

  function renderCell(trade: Trade, key: TradeKey) {
    const val = trade[key as keyof Trade];

    if (key === "direction") {
      return (
        <span className={`flex items-center gap-1 ${val === "Long" ? "text-emerald-400" : "text-red-400"}`}>
          {val === "Long" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{String(val)}
        </span>
      );
    }
    if (key === "result") {
      return <Badge variant={val === "Win" ? "success" : val === "Loss" ? "danger" : "warning"}>{String(val)}</Badge>;
    }
    if (BOOL_FIELDS.has(key)) {
      return <span className={val ? "text-emerald-400" : "text-gray-300"}>{val ? "Yes" : "No"}</span>;
    }
    if (key === "before_picture" || key === "after_picture") {
      const url = String(val || "");
      if (!url) return <span className="text-gray-300">—</span>;
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400"><ExternalLink size={12} /></a>;
    }
    if (key === "overall_pips" || key === "rs_gained") {
      const n = Number(val) || 0;
      return <span className={n > 0 ? "text-emerald-400" : n < 0 ? "text-red-400" : "text-gray-500"}>{n}</span>;
    }
    if (key === "sl_price") return <span className="text-red-400">{String(val || "—")}</span>;
    if (key === "tp_price") return <span className="text-emerald-400">{String(val || "—")}</span>;
    return <span className="text-gray-600">{String(val || "—")}</span>;
  }

  function renderEditCell(key: TradeKey, data: Record<string, unknown>, setData: (d: Record<string, unknown>) => void) {
    const val = data[key];
    if (BOOL_FIELDS.has(key)) {
      return <input type="checkbox" checked={!!val} onChange={(e) => setData({ ...data, [key]: e.target.checked })} className="accent-pink-500 w-3 h-3" />;
    }
    if (key === "direction") {
      return <select value={String(val || "Long")} onChange={(e) => setData({ ...data, [key]: e.target.value })} className="bg-white/60 border border-pink-200/50 rounded px-1 py-0.5 text-[10px] text-gray-900 w-full"><option>Long</option><option>Short</option></select>;
    }
    if (key === "result") {
      return <select value={String(val || "Win")} onChange={(e) => setData({ ...data, [key]: e.target.value })} className="bg-white/60 border border-pink-200/50 rounded px-1 py-0.5 text-[10px] text-gray-900 w-full"><option>Win</option><option>Loss</option><option>BE</option></select>;
    }
    if (NUM_FIELDS.has(key)) {
      return <input type="number" step="any" value={val === undefined || val === null ? "" : String(val)} onChange={(e) => setData({ ...data, [key]: parseFloat(e.target.value) || 0 })} className="bg-white/60 border border-pink-200/50 rounded px-1 py-0.5 text-[10px] text-gray-900 w-full" />;
    }
    return <input type={key === "trade_date" ? "date" : "text"} value={String(val || "")} onChange={(e) => setData({ ...data, [key]: e.target.value })} className="bg-white/60 border border-pink-200/50 rounded px-1 py-0.5 text-[10px] text-gray-900 w-full" />;
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const activeFilters = [accountFilter, sessionFilter, resultFilter].filter((f) => f !== "all").length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            showFilters || activeFilters > 0
              ? "bg-pink-500/10 border-pink-400 text-pink-500"
              : "bg-pink-100/60 border-pink-200/50 text-gray-600 hover:bg-slate-600"
          }`}
        >
          <Filter size={12} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-pink-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{filtered.length} of {trades.length} trades</span>
          {!addingNew ? (
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors">
              <Plus size={12} /> Add Trade
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={addTrade} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"><Save size={12} /> Save</button>
              <button onClick={() => { setAddingNew(false); setNewTrade(newEmptyTrade()); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-100/60 hover:bg-slate-600 text-gray-900 text-xs rounded-lg transition-colors"><X size={12} /> Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white/40 border border-pink-200/40 rounded-lg">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Account</label>
            <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All accounts</option>
              {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Session</label>
            <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All sessions</option>
              {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Result</label>
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All results</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="BE">BE</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Sort by</label>
            <div className="flex gap-1">
              {[
                { key: "trade_date", label: "Date" },
                { key: "overall_pips", label: "Pips" },
                { key: "rs_gained", label: "R's" },
                { key: "result", label: "Result" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors ${
                    sortField === s.key
                      ? "bg-pink-500/10 border-pink-400 text-pink-500"
                      : "bg-white/50 border-pink-200/40 text-gray-500 hover:border-pink-200/50"
                  }`}
                >
                  {s.label}
                  {sortField === s.key && (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => { setAccountFilter("all"); setSessionFilter("all"); setResultFilter("all"); }}
                className="text-[10px] text-gray-400 hover:text-gray-900 transition-colors underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-pink-200/40">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={`text-left py-2 px-1.5 text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors ${c.width}`}
                >
                  <span className="flex items-center gap-0.5">
                    {c.label}
                    {sortField === c.key ? (
                      sortDir === "asc" ? <ArrowUp size={9} /> : <ArrowDown size={9} />
                    ) : (
                      <ArrowUpDown size={9} className="text-gray-300" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-left py-2 px-1.5 text-gray-500 font-medium w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New trade row */}
            {addingNew && (
              <tr className="border-b border-pink-300/50 bg-pink-50/60">
                {COLUMNS.map((c) => (
                  <td key={c.key} className="py-1 px-1">
                    {renderEditCell(c.key, newTrade as Record<string, unknown>, (d) => setNewTrade(d as Partial<Trade>))}
                  </td>
                ))}
                <td className="py-1 px-1" />
              </tr>
            )}

            {/* Existing trades */}
            {filtered.map((t) => (
              <>
                <tr key={t.id} className="border-b border-pink-200/30 hover:bg-pink-50/40 transition-colors">
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="py-1.5 px-1.5 max-w-[160px] truncate">
                      {editingId === t.id ? renderEditCell(c.key, editData, setEditData) : renderCell(t, c.key)}
                    </td>
                  ))}
                  <td className="py-1.5 px-1.5">
                    {editingId === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300" title="Save"><Save size={12} /></button>
                        <button onClick={cancelEdit} className="p-1 text-gray-500 hover:text-gray-900" title="Cancel"><X size={12} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Expand evaluation">
                          {expandedId === t.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <button onClick={() => startEdit(t)} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Edit"><Pencil size={12} /></button>
                        <button onClick={() => deleteTrade(t.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Expanded evaluation row */}
                {expandedId === t.id && (t.trade_evaluation || t.notes) && (
                  <tr key={`${t.id}-eval`} className="border-b border-pink-200/30">
                    <td colSpan={COLUMNS.length + 1} className="py-3 px-4 bg-white/60/30">
                      {t.trade_evaluation && (
                        <div className="mb-3">
                          <div className="text-[10px] text-pink-500 font-semibold mb-1 uppercase tracking-wide">Trade Evaluation</div>
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{t.trade_evaluation}</p>
                        </div>
                      )}
                      {t.notes && t.notes !== t.trade_evaluation && (
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Notes</div>
                          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{t.notes}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && !addingNew && (
        <p className="text-xs text-gray-400 text-center py-8">
          {trades.length > 0 ? "No trades match the current filters" : "No trades yet"}
        </p>
      )}
    </div>
  );
}
