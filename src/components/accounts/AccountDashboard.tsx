"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, X, Save, AlertTriangle,
  Trophy, Shield, Wallet, DollarSign,
  CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { useTradingAccounts } from "@/hooks/use-trading-accounts";
import { createClient } from "@/lib/supabase/client";
import type { TradingAccount, AccountPayout } from "@/lib/types";

const ACCOUNT_TYPE_META = {
  challenge: { label: "Challenge", icon: Trophy, color: "text-amber-500", target: 8, bg: "bg-amber-50/60 border-amber-200/40" },
  verification: { label: "Verification", icon: Shield, color: "text-blue-500", target: 5, bg: "bg-blue-50/60 border-blue-200/40" },
  funded: { label: "Funded", icon: Wallet, color: "text-emerald-500", target: 0, bg: "bg-emerald-50/60 border-emerald-200/40" },
};

const STATUS_META = {
  active: { label: "Active", variant: "info" as const, icon: Clock },
  passed: { label: "Passed", variant: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", variant: "danger" as const, icon: XCircle },
  completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
};

export default function AccountDashboard() {
  const { challenges, verifications, funded, payouts, totalPayouts, loading, hasData, refresh } = useTradingAccounts();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [editAccount, setEditAccount] = useState<TradingAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New account form
  const [form, setForm] = useState({
    account_name: "", firm_name: "Alpha Capital", account_size: 10000,
    account_type: "challenge" as TradingAccount["account_type"],
    profit_target_pct: 8, max_drawdown_pct: 10,
    current_balance: 10000, starting_balance: 10000, current_pnl: 0,
    profit_split_pct: 80, phase: "", notes: "", started_at: new Date().toISOString().split("T")[0],
  });

  // Payout form
  const [payoutForm, setPayoutForm] = useState({
    account_id: "", payout_date: new Date().toISOString().split("T")[0],
    gross_amount: 0, profit_split_pct: 80, notes: "",
  });

  function resetForm() {
    setForm({
      account_name: "", firm_name: "Alpha Capital", account_size: 10000,
      account_type: "challenge", profit_target_pct: 8, max_drawdown_pct: 10,
      current_balance: 10000, starting_balance: 10000, current_pnl: 0,
      profit_split_pct: 80, phase: "", notes: "", started_at: new Date().toISOString().split("T")[0],
    });
  }

  async function saveAccount() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (editAccount) {
      await supabase.from("trading_accounts").update(form).eq("id", editAccount.id);
    } else {
      await supabase.from("trading_accounts").insert({ user_id: user.id, ...form });
    }
    setSaving(false); setShowAddAccount(false); setEditAccount(null); resetForm(); refresh();
  }

  async function deleteAccount() {
    if (!deleteConfirmId) return;
    const supabase = createClient();
    await supabase.from("trading_accounts").delete().eq("id", deleteConfirmId);
    setDeleteConfirmId(null); refresh();
  }

  async function savePayout() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const net = payoutForm.gross_amount * (payoutForm.profit_split_pct / 100);
    await supabase.from("account_payouts").insert({
      user_id: user.id, ...payoutForm, net_amount: Math.round(net * 100) / 100, status: "paid",
    });
    setSaving(false); setShowAddPayout(false);
    setPayoutForm({ account_id: "", payout_date: new Date().toISOString().split("T")[0], gross_amount: 0, profit_split_pct: 80, notes: "" });
    refresh();
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-pink-100/30 rounded-xl" />)}</div>;
  }

  const cls = "w-full bg-white/60 border border-pink-200/40 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-pink-400";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Trading Accounts</h3>
        <div className="flex gap-2">
          {funded.length > 0 && (
            <button onClick={() => setShowAddPayout(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg">
              <DollarSign size={12} /> Record Payout
            </button>
          )}
          <button onClick={() => { resetForm(); setEditAccount(null); setShowAddAccount(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg">
            <Plus size={12} /> Add Account
          </button>
        </div>
      </div>

      {!hasData && (
        <div className="text-center py-8">
          <Wallet size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No accounts added yet</p>
          <p className="text-[10px] text-gray-300 mt-1">Add your prop firm accounts to track progress, goals, and payouts</p>
        </div>
      )}

      {/* Challenge Accounts */}
      {challenges.length > 0 && (
        <AccountSection title="Challenge Accounts" subtitle="8% profit target" accounts={challenges}
          onEdit={(a) => { setForm({ ...a, started_at: a.started_at || "" } as typeof form); setEditAccount(a); setShowAddAccount(true); }}
          onDelete={(id) => setDeleteConfirmId(id)} />
      )}

      {/* Verification Accounts */}
      {verifications.length > 0 && (
        <AccountSection title="Verification Accounts" subtitle="5% profit target" accounts={verifications}
          onEdit={(a) => { setForm({ ...a, started_at: a.started_at || "" } as typeof form); setEditAccount(a); setShowAddAccount(true); }}
          onDelete={(id) => setDeleteConfirmId(id)} />
      )}

      {/* Funded Accounts */}
      {funded.length > 0 && (
        <AccountSection title="Funded Accounts" subtitle="Active trading" accounts={funded}
          onEdit={(a) => { setForm({ ...a, started_at: a.started_at || "" } as typeof form); setEditAccount(a); setShowAddAccount(true); }}
          onDelete={(id) => setDeleteConfirmId(id)} />
      )}

      {/* Payouts */}
      {payouts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-gray-900">Payouts</span>
            </div>
            <span className="text-xs text-emerald-500 font-bold">Total: ${totalPayouts.toLocaleString()}</span>
          </div>
          <div className="space-y-1.5">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-emerald-50/40 border border-emerald-200/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign size={14} className="text-emerald-500" />
                  <div>
                    <span className="text-xs font-medium text-gray-900">${p.net_amount.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 ml-2">({p.profit_split_pct}% of ${p.gross_amount.toLocaleString()})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "danger"}>{p.status}</Badge>
                  <span className="text-[10px] text-gray-400">{p.payout_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowAddAccount(false); setEditAccount(null); }} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-pink-200/30 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-base font-semibold text-gray-900">{editAccount ? "Edit Account" : "Add Account"}</h3>
              <button onClick={() => { setShowAddAccount(false); setEditAccount(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-400 mb-1">Account Name</label>
                  <input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="10K Challenge" className={cls} /></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Firm</label>
                  <input value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} placeholder="Alpha Capital" className={cls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] text-gray-400 mb-1">Type</label>
                  <select value={form.account_type} onChange={(e) => {
                    const t = e.target.value as TradingAccount["account_type"];
                    setForm({ ...form, account_type: t, profit_target_pct: t === "challenge" ? 8 : t === "verification" ? 5 : 0 });
                  }} className={cls}>
                    <option value="challenge">Challenge</option><option value="verification">Verification</option><option value="funded">Funded</option>
                  </select></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Status</label>
                  <select value={form.phase || "active"} onChange={(e) => setForm({ ...form, phase: e.target.value })} className={cls}>
                    <option value="active">Active</option><option value="passed">Passed</option><option value="failed">Failed</option>
                  </select></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Account Size</label>
                  <input type="number" value={form.account_size} onChange={(e) => setForm({ ...form, account_size: parseFloat(e.target.value) || 0, starting_balance: parseFloat(e.target.value) || 0, current_balance: parseFloat(e.target.value) || 0 })} className={cls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] text-gray-400 mb-1">Profit Target %</label>
                  <input type="number" step="0.1" value={form.profit_target_pct} onChange={(e) => setForm({ ...form, profit_target_pct: parseFloat(e.target.value) || 0 })} className={cls} /></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Max Drawdown %</label>
                  <input type="number" step="0.1" value={form.max_drawdown_pct} onChange={(e) => setForm({ ...form, max_drawdown_pct: parseFloat(e.target.value) || 0 })} className={cls} /></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Current P/L</label>
                  <input type="number" step="0.01" value={form.current_pnl} onChange={(e) => setForm({ ...form, current_pnl: parseFloat(e.target.value) || 0 })} className={cls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-400 mb-1">Profit Split %</label>
                  <input type="number" value={form.profit_split_pct} onChange={(e) => setForm({ ...form, profit_split_pct: parseFloat(e.target.value) || 80 })} className={cls} /></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Started</label>
                  <input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} className={cls} /></div>
              </div>
              <div><label className="block text-[10px] text-gray-400 mb-1">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." className={cls} /></div>
            </div>
            <div className="sticky bottom-0 bg-white/95 border-t border-pink-200/30 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setShowAddAccount(false); setEditAccount(null); }} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={saveAccount} disabled={saving || !form.account_name} className="flex items-center gap-2 px-5 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm rounded-xl shadow-md shadow-pink-500/20">
                <Save size={14} /> {saving ? "Saving..." : editAccount ? "Update" : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payout Modal */}
      {showAddPayout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddPayout(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Record Payout</h3>
            <div className="space-y-3">
              <div><label className="block text-[10px] text-gray-400 mb-1">Account</label>
                <select value={payoutForm.account_id} onChange={(e) => setPayoutForm({ ...payoutForm, account_id: e.target.value })} className={cls}>
                  <option value="">Select account...</option>
                  {funded.map((a) => <option key={a.id} value={a.id}>{a.account_name} ({a.firm_name})</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-400 mb-1">Gross Amount</label>
                  <input type="number" step="0.01" value={payoutForm.gross_amount} onChange={(e) => setPayoutForm({ ...payoutForm, gross_amount: parseFloat(e.target.value) || 0 })} className={cls} /></div>
                <div><label className="block text-[10px] text-gray-400 mb-1">Your Split %</label>
                  <input type="number" value={payoutForm.profit_split_pct} onChange={(e) => setPayoutForm({ ...payoutForm, profit_split_pct: parseFloat(e.target.value) || 80 })} className={cls} /></div>
              </div>
              <div className="p-2 bg-emerald-50/60 rounded-lg text-center">
                <span className="text-[10px] text-gray-400">You receive: </span>
                <span className="text-sm font-bold text-emerald-500">${(payoutForm.gross_amount * payoutForm.profit_split_pct / 100).toFixed(2)}</span>
              </div>
              <div><label className="block text-[10px] text-gray-400 mb-1">Date</label>
                <input type="date" value={payoutForm.payout_date} onChange={(e) => setPayoutForm({ ...payoutForm, payout_date: e.target.value })} className={cls} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAddPayout(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={savePayout} disabled={saving || !payoutForm.account_id} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm rounded-xl">
                <Save size={14} /> Record Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <AlertTriangle size={22} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Account?</h3>
            <p className="text-sm text-gray-500 mb-5">This will also delete all associated payouts.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-gray-500 bg-white/60 border border-pink-200/40 rounded-xl">Cancel</button>
              <button onClick={deleteAccount} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Account Section (Challenge / Verification / Funded) ─────────────────────

function AccountSection({ title, subtitle, accounts, onEdit, onDelete }: {
  title: string;
  subtitle: string;
  accounts: TradingAccount[];
  onEdit: (a: TradingAccount) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const active = accounts.filter((a) => a.status === "active" || a.phase === "active");
  const passed = accounts.filter((a) => a.status === "passed" || a.phase === "passed");
  const failed = accounts.filter((a) => a.status === "failed" || a.phase === "failed");

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-900">{title}</span>
        <span className="text-[10px] text-gray-400">{subtitle}</span>
        <div className="flex gap-1 ml-auto text-[9px]">
          {active.length > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">{active.length} active</span>}
          {passed.length > 0 && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-500 rounded">{passed.length} passed</span>}
          {failed.length > 0 && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded">{failed.length} failed</span>}
        </div>
      </div>
      <div className="space-y-2">
        {accounts.map((a) => {
          const meta = ACCOUNT_TYPE_META[a.account_type];
          const statusMeta = STATUS_META[a.status] || STATUS_META[(a.phase as TradingAccount["status"]) || "active"];
          const progressPct = meta.target > 0 ? Math.min(Math.max((a.current_pnl / a.starting_balance) * 100 / meta.target * 100, 0), 100) : 0;
          const pnlPct = a.starting_balance > 0 ? ((a.current_pnl / a.starting_balance) * 100).toFixed(2) : "0";
          const isExpanded = expanded === a.id;

          return (
            <div key={a.id} className={`border rounded-xl overflow-hidden ${meta.bg}`}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-1 shrink-0 mr-2">
                  <button onClick={() => onEdit(a)} className="p-1 text-gray-400 hover:text-pink-500"><Pencil size={11} /></button>
                  <button onClick={() => onDelete(a.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={11} /></button>
                </div>
                <button onClick={() => setExpanded(isExpanded ? null : a.id)} className="flex-1 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <meta.icon size={14} className={meta.color} />
                    <div>
                      <span className="text-xs font-semibold text-gray-900">{a.account_name}</span>
                      <span className="text-[10px] text-gray-400 ml-1.5">{a.firm_name}</span>
                    </div>
                    <Badge variant={statusMeta?.variant || "info"}>{statusMeta?.label || a.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">${a.account_size.toLocaleString()}</span>
                    <span className={`text-xs font-bold ${a.current_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {a.current_pnl >= 0 ? "+" : ""}${a.current_pnl.toLocaleString()} ({pnlPct}%)
                    </span>
                    {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                  </div>
                </button>
              </div>

              {/* Progress bar for challenges/verifications */}
              {meta.target > 0 && a.status === "active" && (
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
                    <span>Progress to {meta.target}% target</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <ProgressBar value={progressPct} color={progressPct >= 100 ? "bg-emerald-500" : "bg-pink-500"} />
                </div>
              )}

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-pink-200/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-1.5 bg-white/40 rounded"><span className="text-gray-400">Starting</span><div className="text-gray-700 font-medium">${a.starting_balance.toLocaleString()}</div></div>
                  <div className="p-1.5 bg-white/40 rounded"><span className="text-gray-400">Current</span><div className="text-gray-700 font-medium">${a.current_balance.toLocaleString()}</div></div>
                  <div className="p-1.5 bg-white/40 rounded"><span className="text-gray-400">Max DD</span><div className="text-gray-700 font-medium">{a.max_drawdown_pct}%</div></div>
                  <div className="p-1.5 bg-white/40 rounded"><span className="text-gray-400">{a.account_type === "funded" ? "Profit Split" : "Target"}</span><div className="text-gray-700 font-medium">{a.account_type === "funded" ? `${a.profit_split_pct}/${100 - a.profit_split_pct}` : `${a.profit_target_pct}%`}</div></div>
                  {a.started_at && <div className="p-1.5 bg-white/40 rounded"><span className="text-gray-400">Started</span><div className="text-gray-700 font-medium">{a.started_at}</div></div>}
                  {a.notes && <div className="p-1.5 bg-white/40 rounded col-span-2"><span className="text-gray-400">Notes</span><div className="text-gray-700">{a.notes}</div></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
