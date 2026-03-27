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
  AlertTriangle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Trade } from "@/lib/types";
import { TRADE_COLUMNS, getDefaultValue, type ColumnDef } from "@/lib/trade-columns";
import { createClient } from "@/lib/supabase/client";

type SortDir = "asc" | "desc";

function newEmptyTrade(): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const col of TRADE_COLUMNS) obj[col.key] = getDefaultValue(col);
  obj.trade_date = new Date().toISOString().split("T")[0];
  return obj;
}

export default function TradeLogTable({
  trades,
  onRefresh,
  visibleColumns: visibleColsProp,
}: {
  trades: Trade[];
  onRefresh: () => void;
  compact?: boolean;
  visibleColumns?: Set<string>;
}) {
  const activeCols = useMemo(
    () => visibleColsProp ? TRADE_COLUMNS.filter((c) => visibleColsProp.has(c.key)) : TRADE_COLUMNS,
    [visibleColsProp],
  );

  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("trade_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [editModalTrade, setEditModalTrade] = useState<Trade | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newTrade, setNewTrade] = useState<Record<string, unknown>>(newEmptyTrade());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const accounts = useMemo(() => [...new Set(trades.map((t) => t.account_name).filter(Boolean))], [trades]);
  const sessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean))], [trades]);

  const filtered = useMemo(() => {
    let list = [...trades];
    if (accountFilter !== "all") list = list.filter((t) => t.account_name === accountFilter);
    if (sessionFilter !== "all") list = list.filter((t) => t.session === sessionFilter);
    if (resultFilter !== "all") list = list.filter((t) => t.result === resultFilter);
    list.sort((a, b) => {
      const aStr = String((a as unknown as Record<string, unknown>)[sortField] || "");
      const bStr = String((b as unknown as Record<string, unknown>)[sortField] || "");
      return sortDir === "asc" ? aStr.localeCompare(bStr, undefined, { numeric: true }) : bStr.localeCompare(aStr, undefined, { numeric: true });
    });
    return list;
  }, [trades, accountFilter, sessionFilter, resultFilter, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function openEditModal(trade: Trade) {
    setEditModalTrade(trade);
    setEditData({ ...(trade as unknown as Record<string, unknown>) });
  }

  async function saveEdit() {
    if (!editModalTrade) return;
    setSaving(true);
    const supabase = createClient();
    const updates = { ...editData };
    delete updates.id; delete updates.user_id; delete updates.created_at;
    for (const col of TRADE_COLUMNS) {
      if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
        updates[col.key] = updates[col.key] === "Yes" || updates[col.key] === true;
      }
    }
    await supabase.from("trade_log").update(updates).eq("id", editModalTrade.id);
    setSaving(false); setEditModalTrade(null); setEditData({}); onRefresh();
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    const supabase = createClient();
    await supabase.from("trade_log").delete().eq("id", deleteConfirmId);
    setDeleteConfirmId(null); onRefresh();
  }

  async function addTrade() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const insert = { ...newTrade };
    for (const col of TRADE_COLUMNS) {
      if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
        insert[col.key] = insert[col.key] === "Yes" || insert[col.key] === true;
      }
    }
    await supabase.from("trade_log").insert({ user_id: user.id, ...insert });
    setSaving(false); setAddingNew(false); setNewTrade(newEmptyTrade()); onRefresh();
  }

  function renderCell(trade: Trade, col: ColumnDef) {
    const val = (trade as unknown as Record<string, unknown>)[col.key];
    if (col.key === "direction") {
      return <span className={`flex items-center gap-1 ${val === "Long" ? "text-emerald-500" : "text-red-500"}`}>{val === "Long" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{String(val)}</span>;
    }
    if (col.key === "result") return <Badge variant={val === "Win" ? "success" : val === "Loss" ? "danger" : "warning"}>{String(val)}</Badge>;
    if (col.type === "url") {
      const url = String(val || "");
      if (!url) return <span className="text-gray-300">—</span>;
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400"><ExternalLink size={12} /></a>;
    }
    if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
      const isYes = val === true || val === "Yes";
      return <span className={isYes ? "text-emerald-500" : "text-gray-300"}>{isYes ? "Yes" : "No"}</span>;
    }
    if (col.key === "sl_price") return <span className="text-red-400">{String(val || "—")}</span>;
    if (col.key === "tp_price") return <span className="text-emerald-400">{String(val || "—")}</span>;
    if (col.key === "overall_pips" || col.key === "rs_gained") {
      const n = Number(val) || 0;
      return <span className={n > 0 ? "text-emerald-500" : n < 0 ? "text-red-500" : "text-gray-500"}>{n}</span>;
    }
    return <span className="text-gray-600 truncate">{String(val || "—")}</span>;
  }

  const activeFilters = [accountFilter, sessionFilter, resultFilter].filter((f) => f !== "all").length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${showFilters || activeFilters > 0 ? "bg-pink-500/10 border-pink-400 text-pink-500" : "bg-pink-100/60 border-pink-200/50 text-gray-600 hover:bg-pink-100"}`}>
          <Filter size={12} /> Filters
          {activeFilters > 0 && <span className="bg-pink-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>}
        </button>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{filtered.length} of {trades.length} trades</span>
          <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors">
            <Plus size={12} /> Add Trade
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white/40 border border-pink-200/40 rounded-lg">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Account</label>
            <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All</option>
              {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Session</label>
            <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All</option>
              {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Result</label>
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="bg-white/50 border border-pink-200/40 rounded px-2 py-1.5 text-xs text-gray-900">
              <option value="all">All</option><option value="Win">Win</option><option value="Loss">Loss</option><option value="BE">BE</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Sort</label>
            <div className="flex gap-1">
              {[{ key: "trade_date", label: "Date" }, { key: "overall_pips", label: "Pips" }, { key: "rs_gained", label: "R's" }].map((s) => (
                <button key={s.key} onClick={() => toggleSort(s.key)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border ${sortField === s.key ? "bg-pink-500/10 border-pink-400 text-pink-500" : "bg-white/50 border-pink-200/40 text-gray-500"}`}>
                  {s.label} {sortField === s.key && (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && <div className="flex items-end"><button onClick={() => { setAccountFilter("all"); setSessionFilter("all"); setResultFilter("all"); }} className="text-[10px] text-gray-500 hover:text-gray-900 underline">Clear</button></div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-pink-200/40">
              <th className="text-left py-2 px-1 text-gray-400 font-medium w-14">Actions</th>
              {activeCols.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  className={`text-left py-2 px-1.5 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-gray-600 ${c.width}`}>
                  <span className="flex items-center gap-0.5">
                    {c.label}
                    {sortField === c.key ? (sortDir === "asc" ? <ArrowUp size={9} /> : <ArrowDown size={9} />) : <ArrowUpDown size={9} className="text-gray-300" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <TradeRow
                key={t.id}
                trade={t}
                cols={activeCols}
                isExpanded={expandedId === t.id}
                onEdit={() => openEditModal(t)}
                onDelete={() => setDeleteConfirmId(t.id)}
                onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                renderCell={renderCell}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-8">
          {trades.length > 0 ? "No trades match filters" : "No trades yet"}
        </p>
      )}

      {/* ─── Edit Modal ──────────────────────────────────────────────────────── */}
      {(editModalTrade || addingNew) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setEditModalTrade(null); setAddingNew(false); }} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-2xl shadow-2xl shadow-pink-500/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-pink-200/30 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {addingNew ? "Add New Trade" : "Edit Trade"}
                </h3>
                {editModalTrade && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editModalTrade.trade_date} · {editModalTrade.pair} · {editModalTrade.direction}
                  </p>
                )}
              </div>
              <button onClick={() => { setEditModalTrade(null); setAddingNew(false); setNewTrade(newEmptyTrade()); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-pink-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* Group columns into sections */}
              <ModalSection title="Trade Info" cols={TRADE_COLUMNS.slice(0, 6)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Timing & Prices" cols={TRADE_COLUMNS.slice(6, 11)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Strategy & Direction" cols={TRADE_COLUMNS.slice(11, 15)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Confirmations" cols={TRADE_COLUMNS.slice(15, 18)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Checks" cols={TRADE_COLUMNS.slice(18, 21)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Results" cols={TRADE_COLUMNS.slice(21, 27)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />
              <ModalSection title="Documentation" cols={TRADE_COLUMNS.slice(27, 31)}
                data={addingNew ? newTrade : editData}
                setData={addingNew ? setNewTrade : setEditData} />

              {/* Evaluation textarea — full width */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Trade Evaluation</label>
                <textarea
                  value={String((addingNew ? newTrade : editData).trade_evaluation || "")}
                  onChange={(e) => {
                    const setter = addingNew ? setNewTrade : setEditData;
                    setter({ ...(addingNew ? newTrade : editData), trade_evaluation: e.target.value });
                  }}
                  rows={5}
                  placeholder="Write your trade evaluation..."
                  className="w-full bg-white/60 border border-pink-200/40 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-400 resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-pink-200/30 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setEditModalTrade(null); setAddingNew(false); setNewTrade(newEmptyTrade()); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={addingNew ? addTrade : saveEdit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-pink-500/20">
                <Save size={14} /> {saving ? "Saving..." : addingNew ? "Add Trade" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Trade?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone. The trade will be permanently removed from your log.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-500 bg-white/60 border border-pink-200/40 rounded-xl hover:bg-pink-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-md shadow-red-500/20">
                Delete Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal Section (groups related fields) ──────────────────────────────────

function ModalSection({ title, cols, data, setData }: {
  title: string;
  cols: ColumnDef[];
  data: Record<string, unknown>;
  setData: (d: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <h4 className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cols.map((col) => (
          <ModalField key={col.key} col={col} data={data} setData={setData} />
        ))}
      </div>
    </div>
  );
}

function ModalField({ col, data, setData }: {
  col: ColumnDef;
  data: Record<string, unknown>;
  setData: (d: Record<string, unknown>) => void;
}) {
  const val = data[col.key];
  const cls = "w-full bg-white/60 border border-pink-200/40 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-pink-400 transition-colors";

  let input: React.ReactNode;
  switch (col.type) {
    case "select": {
      let currentVal = String(val || "");
      if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
        currentVal = val === true ? "Yes" : val === false ? "No" : String(val || "");
      }
      input = (
        <select value={currentVal} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls}>
          <option value="">—</option>
          {col.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    }
    case "date":
      input = <input type="date" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
      break;
    case "time":
      input = <input type="time" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
      break;
    case "number": case "money": case "percent":
      input = <input type="number" step="any" value={val === undefined || val === null ? "" : String(val)} onChange={(e) => setData({ ...data, [col.key]: parseFloat(e.target.value) || 0 })} className={cls} placeholder={col.placeholder} />;
      break;
    case "ratio":
      input = <input type="text" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} placeholder={col.placeholder || "1:1"} />;
      break;
    case "url":
      input = <input type="url" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} placeholder={col.placeholder || "https://..."} />;
      break;
    default:
      input = <input type="text" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
  }

  return (
    <div>
      <label className="block text-[10px] text-gray-400 mb-1">{col.label}</label>
      {input}
    </div>
  );
}

// ─── Trade Row ──────────────────────────────────────────────────────────────

function TradeRow({
  trade, cols, isExpanded, onEdit, onDelete, onToggleExpand, renderCell,
}: {
  trade: Trade;
  cols: ColumnDef[];
  isExpanded: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  renderCell: (trade: Trade, col: ColumnDef) => React.ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-pink-200/30 hover:bg-pink-50/20 transition-colors">
        {/* Actions at the START */}
        <td className="py-1.5 px-1">
          <div className="flex gap-0.5">
            <button onClick={onEdit} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Edit"><Pencil size={12} /></button>
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={12} /></button>
            <button onClick={onToggleExpand} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Expand">
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </td>
        {cols.map((c) => (
          <td key={c.key} className="py-1.5 px-1.5 max-w-[160px] truncate">
            {renderCell(trade, c)}
          </td>
        ))}
      </tr>
      {isExpanded && (trade.trade_evaluation || trade.notes) && (
        <tr className="border-b border-pink-200/30">
          <td colSpan={cols.length + 1} className="py-3 px-4 bg-pink-50/20">
            {trade.trade_evaluation && (
              <div className="mb-3">
                <div className="text-[10px] text-pink-500 font-semibold mb-1 uppercase tracking-wide">Trade Evaluation</div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{trade.trade_evaluation}</p>
              </div>
            )}
            {trade.notes && trade.notes !== trade.trade_evaluation && (
              <div>
                <div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Notes</div>
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
