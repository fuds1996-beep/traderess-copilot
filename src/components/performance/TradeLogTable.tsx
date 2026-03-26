"use client";

import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  X,
  Pencil,
  ExternalLink,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Trade } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const COLUMNS = [
  { key: "account_name", label: "Account", width: "w-20" },
  { key: "day", label: "Day", width: "w-14" },
  { key: "trade_date", label: "Date", width: "w-24" },
  { key: "scenario", label: "Scenario", width: "w-20" },
  { key: "pair", label: "Pair", width: "w-20" },
  { key: "session", label: "Session", width: "w-20" },
  { key: "time_of_entry", label: "Entry Time", width: "w-20" },
  { key: "time_of_exit", label: "Exit Time", width: "w-20" },
  { key: "entry_price", label: "Entry", width: "w-22" },
  { key: "sl_price", label: "SL", width: "w-22" },
  { key: "tp_price", label: "TP", width: "w-22" },
  { key: "direction", label: "Dir", width: "w-16" },
  { key: "entry_strategy", label: "Entry Strat", width: "w-24" },
  { key: "sl_strategy", label: "SL Strat", width: "w-24" },
  { key: "tp_strategy", label: "TP Strat", width: "w-24" },
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
  { key: "trade_evaluation", label: "Evaluation", width: "w-40" },
] as const;

type TradeKey = (typeof COLUMNS)[number]["key"];

const BOOL_FIELDS = new Set(["fundamental_check", "event_within_2h", "safe_window"]);
const NUM_FIELDS = new Set(["entry_price", "sl_price", "tp_price", "overall_pips", "rs_gained", "pips"]);

function newEmptyTrade(): Partial<Trade> {
  return {
    account_name: "",
    day: "",
    trade_date: new Date().toISOString().split("T")[0],
    scenario: "",
    pair: "EUR/USD",
    session: "London",
    time_of_entry: "",
    time_of_exit: "",
    entry_price: 0,
    sl_price: 0,
    tp_price: 0,
    entry_strategy: "",
    sl_strategy: "",
    tp_strategy: "",
    direction: "Long",
    entry_conf_1: "",
    entry_conf_2: "",
    entry_conf_3: "",
    fundamental_check: false,
    event_within_2h: false,
    safe_window: true,
    result: "Win",
    overall_pips: 0,
    pips: 0,
    rs_gained: 0,
    risk_reward: "",
    dollar_result: "",
    percent_risked: "",
    before_picture: "",
    after_picture: "",
    trade_quality: "",
    forecasted: "",
    trade_evaluation: "",
    notes: "",
  };
}

export default function TradeLogTable({
  trades,
  onRefresh,
}: {
  trades: Trade[];
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>(newEmptyTrade());
  const [saving, setSaving] = useState(false);

  function startEdit(trade: Trade) {
    setEditingId(trade.id);
    setEditData({ ...trade });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();
    const updates = { ...editData };
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    await supabase.from("trade_log").update(updates).eq("id", editingId);
    setSaving(false);
    cancelEdit();
    onRefresh();
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

    await supabase.from("trade_log").insert({
      user_id: user.id,
      ...newTrade,
    });
    setSaving(false);
    setAddingNew(false);
    setNewTrade(newEmptyTrade());
    onRefresh();
  }

  function renderCell(trade: Trade, key: TradeKey) {
    const val = trade[key as keyof Trade];

    if (key === "direction") {
      return (
        <span className={`flex items-center gap-1 ${val === "Long" ? "text-emerald-400" : "text-red-400"}`}>
          {val === "Long" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {String(val)}
        </span>
      );
    }

    if (key === "result") {
      return <Badge variant={val === "Win" ? "success" : val === "Loss" ? "danger" : "warning"}>{String(val)}</Badge>;
    }

    if (BOOL_FIELDS.has(key)) {
      return <span className={val ? "text-emerald-400" : "text-slate-600"}>{val ? "Yes" : "No"}</span>;
    }

    if (key === "before_picture" || key === "after_picture") {
      const url = String(val || "");
      if (!url) return <span className="text-slate-600">—</span>;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
          <ExternalLink size={12} />
        </a>
      );
    }

    if (key === "overall_pips" || key === "rs_gained") {
      const n = Number(val) || 0;
      return <span className={n > 0 ? "text-emerald-400" : n < 0 ? "text-red-400" : "text-slate-400"}>{n}</span>;
    }

    if (key === "sl_price") return <span className="text-red-400">{String(val || "—")}</span>;
    if (key === "tp_price") return <span className="text-emerald-400">{String(val || "—")}</span>;

    return <span className="text-slate-300">{String(val || "—")}</span>;
  }

  function renderEditCell(key: TradeKey, data: Record<string, unknown>, setData: (d: Record<string, unknown>) => void) {
    const val = data[key];

    if (BOOL_FIELDS.has(key)) {
      return (
        <input
          type="checkbox"
          checked={!!val}
          onChange={(e) => setData({ ...data, [key]: e.target.checked })}
          className="accent-indigo-500 w-3 h-3"
        />
      );
    }

    if (key === "direction") {
      return (
        <select
          value={String(val || "Long")}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-white w-full"
        >
          <option>Long</option>
          <option>Short</option>
        </select>
      );
    }

    if (key === "result") {
      return (
        <select
          value={String(val || "Win")}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-white w-full"
        >
          <option>Win</option>
          <option>Loss</option>
          <option>BE</option>
        </select>
      );
    }

    if (NUM_FIELDS.has(key)) {
      return (
        <input
          type="number"
          step="any"
          value={val === undefined || val === null ? "" : String(val)}
          onChange={(e) => setData({ ...data, [key]: parseFloat(e.target.value) || 0 })}
          className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-white w-full"
        />
      );
    }

    return (
      <input
        type={key === "trade_date" ? "date" : "text"}
        value={String(val || "")}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
        className="bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-white w-full"
      />
    );
  }

  return (
    <div>
      {/* Add trade button */}
      <div className="flex justify-end mb-3">
        {!addingNew ? (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
          >
            <Plus size={12} /> Add Trade
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={addTrade}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"
            >
              <Save size={12} /> Save
            </button>
            <button
              onClick={() => { setAddingNew(false); setNewTrade(newEmptyTrade()); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-700">
              {COLUMNS.map((c) => (
                <th key={c.key} className={`text-left py-2 px-1.5 text-slate-400 font-medium whitespace-nowrap ${c.width}`}>
                  {c.label}
                </th>
              ))}
              <th className="text-left py-2 px-1.5 text-slate-400 font-medium w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New trade row */}
            {addingNew && (
              <tr className="border-b border-indigo-800/50 bg-indigo-900/10">
                {COLUMNS.map((c) => (
                  <td key={c.key} className="py-1 px-1">
                    {renderEditCell(c.key, newTrade as Record<string, unknown>, (d) => setNewTrade(d as Partial<Trade>))}
                  </td>
                ))}
                <td className="py-1 px-1" />
              </tr>
            )}

            {/* Existing trades */}
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                {COLUMNS.map((c) => (
                  <td key={c.key} className="py-1.5 px-1.5 max-w-[160px] truncate">
                    {editingId === t.id
                      ? renderEditCell(c.key, editData, setEditData)
                      : renderCell(t, c.key)}
                  </td>
                ))}
                <td className="py-1.5 px-1.5">
                  {editingId === t.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Save"
                      >
                        <Save size={12} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteTrade(t.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trades.length === 0 && !addingNew && (
        <p className="text-xs text-slate-500 text-center py-8">No trades yet</p>
      )}
    </div>
  );
}
