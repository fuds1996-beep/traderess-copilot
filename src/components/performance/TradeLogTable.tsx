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
import { TRADE_COLUMNS, getDefaultValue, type ColumnDef } from "@/lib/trade-columns";
import { createClient } from "@/lib/supabase/client";

type SortDir = "asc" | "desc";

function newEmptyTrade(): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const col of TRADE_COLUMNS) {
    obj[col.key] = getDefaultValue(col);
  }
  obj.trade_date = new Date().toISOString().split("T")[0];
  return obj;
}

// ─── Main component ──────────────────────────────────────────────────────────

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
  const [newTrade, setNewTrade] = useState<Record<string, unknown>>(newEmptyTrade());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accounts = useMemo(() => [...new Set(trades.map((t) => t.account_name).filter(Boolean))], [trades]);
  const sessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean))], [trades]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = [...trades];
    if (accountFilter !== "all") list = list.filter((t) => t.account_name === accountFilter);
    if (sessionFilter !== "all") list = list.filter((t) => t.session === sessionFilter);
    if (resultFilter !== "all") list = list.filter((t) => t.result === resultFilter);
    list.sort((a, b) => {
      const aStr = String((a as unknown as Record<string, unknown>)[sortField] || "");
      const bStr = String((b as unknown as Record<string, unknown>)[sortField] || "");
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [trades, accountFilter, sessionFilter, resultFilter, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function startEdit(trade: Trade) { setEditingId(trade.id); setEditData({ ...(trade as unknown as Record<string, unknown>) }); }
  function cancelEdit() { setEditingId(null); setEditData({}); }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();
    const updates = { ...editData };
    delete updates.id; delete updates.user_id; delete updates.created_at;
    // Convert Yes/No selects back to booleans for DB
    for (const col of TRADE_COLUMNS) {
      if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
        updates[col.key] = updates[col.key] === "Yes" || updates[col.key] === true;
      }
    }
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
    const insert = { ...newTrade };
    // Convert Yes/No to booleans
    for (const col of TRADE_COLUMNS) {
      if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
        insert[col.key] = insert[col.key] === "Yes" || insert[col.key] === true;
      }
    }
    await supabase.from("trade_log").insert({ user_id: user.id, ...insert });
    setSaving(false); setAddingNew(false); setNewTrade(newEmptyTrade()); onRefresh();
  }

  // ─── Cell renderers ───────────────────────────────────────────────────────

  function renderCell(trade: Trade, col: ColumnDef) {
    const val = (trade as unknown as Record<string, unknown>)[col.key];

    if (col.key === "direction") {
      return (
        <span className={`flex items-center gap-1 ${val === "Long" ? "text-emerald-500" : "text-red-500"}`}>
          {val === "Long" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{String(val)}
        </span>
      );
    }
    if (col.key === "result") {
      return <Badge variant={val === "Win" ? "success" : val === "Loss" ? "danger" : "warning"}>{String(val)}</Badge>;
    }
    if (col.type === "url") {
      const url = String(val || "");
      if (!url) return <span className="text-gray-300">—</span>;
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400"><ExternalLink size={12} /></a>;
    }
    if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
      const isYes = val === true || val === "Yes";
      return <span className={isYes ? "text-emerald-500" : "text-gray-300"}>{isYes ? "Yes" : "No"}</span>;
    }
    if (col.type === "number" || col.type === "money" || col.type === "percent") {
      const n = Number(val) || 0;
      if (col.key === "sl_price") return <span className="text-red-400">{n || "—"}</span>;
      if (col.key === "tp_price") return <span className="text-emerald-400">{n || "—"}</span>;
      if (col.key === "overall_pips" || col.key === "rs_gained") {
        return <span className={n > 0 ? "text-emerald-500" : n < 0 ? "text-red-500" : "text-gray-500"}>{n}</span>;
      }
      return <span className="text-gray-600">{String(val || "—")}</span>;
    }
    return <span className="text-gray-600 truncate">{String(val || "—")}</span>;
  }

  function renderEditCell(col: ColumnDef, data: Record<string, unknown>, setData: (d: Record<string, unknown>) => void) {
    const val = data[col.key];
    const cls = "bg-white/60 border border-pink-200/50 rounded px-1.5 py-0.5 text-[10px] text-gray-900 w-full focus:outline-none focus:border-pink-400";

    switch (col.type) {
      case "select": {
        // For boolean fields, map true/false to Yes/No
        let currentVal = String(val || "");
        if (["fundamental_check", "event_within_2h", "safe_window"].includes(col.key)) {
          currentVal = val === true ? "Yes" : val === false ? "No" : String(val || "");
        }
        return (
          <select value={currentVal} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls}>
            <option value="">—</option>
            {col.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      case "date":
        return <input type="date" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
      case "time":
        return <input type="time" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
      case "number":
      case "money":
      case "percent":
        return <input type="number" step="any" value={val === undefined || val === null ? "" : String(val)} onChange={(e) => setData({ ...data, [col.key]: parseFloat(e.target.value) || 0 })} className={cls} placeholder={col.placeholder} />;
      case "ratio":
        return <input type="text" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} placeholder={col.placeholder || "1:1"} />;
      case "url":
        return <input type="url" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} placeholder={col.placeholder || "https://..."} />;
      case "textarea":
        return <input type="text" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} placeholder="..." />;
      default:
        return <input type="text" value={String(val || "")} onChange={(e) => setData({ ...data, [col.key]: e.target.value })} className={cls} />;
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
              : "bg-pink-100/60 border-pink-200/50 text-gray-600 hover:bg-pink-100"
          }`}
        >
          <Filter size={12} /> Filters
          {activeFilters > 0 && <span className="bg-pink-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>}
        </button>

        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{filtered.length} of {trades.length} trades</span>
          {!addingNew ? (
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg transition-colors">
              <Plus size={12} /> Add Trade
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={addTrade} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg"><Save size={12} /> Save</button>
              <button onClick={() => { setAddingNew(false); setNewTrade(newEmptyTrade()); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-100/60 text-gray-600 text-xs rounded-lg"><X size={12} /> Cancel</button>
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
              {[{ key: "trade_date", label: "Date" }, { key: "overall_pips", label: "Pips" }, { key: "rs_gained", label: "R's" }, { key: "result", label: "Result" }].map((s) => (
                <button key={s.key} onClick={() => toggleSort(s.key)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors ${sortField === s.key ? "bg-pink-500/10 border-pink-400 text-pink-500" : "bg-white/50 border-pink-200/40 text-gray-500"}`}>
                  {s.label} {sortField === s.key && (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button onClick={() => { setAccountFilter("all"); setSessionFilter("all"); setResultFilter("all"); }} className="text-[10px] text-gray-500 hover:text-gray-900 underline">Clear all</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-pink-200/40">
              {activeCols.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  className={`text-left py-2 px-1.5 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-gray-600 transition-colors ${c.width}`}>
                  <span className="flex items-center gap-0.5">
                    {c.label}
                    {sortField === c.key ? (sortDir === "asc" ? <ArrowUp size={9} /> : <ArrowDown size={9} />) : <ArrowUpDown size={9} className="text-gray-300" />}
                  </span>
                </th>
              ))}
              <th className="text-left py-2 px-1.5 text-gray-400 font-medium w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* New trade row */}
            {addingNew && (
              <tr className="border-b border-pink-300/30 bg-pink-50/30">
                {activeCols.map((c) => (
                  <td key={c.key} className="py-1 px-1">{renderEditCell(c, newTrade, setNewTrade)}</td>
                ))}
                <td className="py-1 px-1" />
              </tr>
            )}

            {/* Existing trades */}
            {filtered.map((t) => (
              <TradeRow
                key={t.id}
                trade={t}
                cols={activeCols}
                isEditing={editingId === t.id}
                isExpanded={expandedId === t.id}
                editData={editData}
                saving={saving}
                onStartEdit={() => startEdit(t)}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onDelete={() => deleteTrade(t.id)}
                onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                onEditDataChange={setEditData}
                renderCell={renderCell}
                renderEditCell={renderEditCell}
              />
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

// ─── Trade Row (extracted to avoid React key issues with fragments) ─────────

function TradeRow({
  trade, cols, isEditing, isExpanded, editData, saving,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, onToggleExpand, onEditDataChange,
  renderCell, renderEditCell,
}: {
  trade: Trade;
  cols: ColumnDef[];
  isEditing: boolean;
  isExpanded: boolean;
  editData: Record<string, unknown>;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onEditDataChange: (d: Record<string, unknown>) => void;
  renderCell: (trade: Trade, col: ColumnDef) => React.ReactNode;
  renderEditCell: (col: ColumnDef, data: Record<string, unknown>, setData: (d: Record<string, unknown>) => void) => React.ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-pink-200/30 hover:bg-pink-50/20 transition-colors">
        {cols.map((c) => (
          <td key={c.key} className="py-1.5 px-1.5 max-w-[160px] truncate">
            {isEditing ? renderEditCell(c, editData, onEditDataChange) : renderCell(trade, c)}
          </td>
        ))}
        <td className="py-1.5 px-1.5">
          {isEditing ? (
            <div className="flex gap-1">
              <button onClick={onSaveEdit} disabled={saving} className="p-1 text-emerald-500 hover:text-emerald-400" title="Save"><Save size={12} /></button>
              <button onClick={onCancelEdit} className="p-1 text-gray-400 hover:text-gray-600" title="Cancel"><X size={12} /></button>
            </div>
          ) : (
            <div className="flex gap-1">
              <button onClick={onToggleExpand} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Expand">
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <button onClick={onStartEdit} className="p-1 text-gray-400 hover:text-pink-500 transition-colors" title="Edit"><Pencil size={12} /></button>
              <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={12} /></button>
            </div>
          )}
        </td>
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
