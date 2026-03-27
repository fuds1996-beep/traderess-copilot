"use client";

import { useMemo } from "react";
import {
  Trophy, Shield, Wallet, DollarSign,
  CheckCircle, XCircle, TrendingUp, TrendingDown,
  Hash, Percent,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Trade } from "@/lib/types";
import { getWeekStart } from "@/lib/date-utils";

interface ComputedAccount {
  name: string;
  type: "challenge" | "verification" | "funded";
  trades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: number;
  totalPnl: number;
  totalPips: number;
  totalRs: number;
  status: "active" | "passed" | "failed";
  weeklyPnl: { week: string; pnl: number }[];
}

function classifyAccount(name: string): "challenge" | "verification" | "funded" {
  const lower = name.toLowerCase();
  if (lower.includes("challenge")) return "challenge";
  if (lower.includes("verif")) return "verification";
  if (lower.includes("funded") || lower.includes("fund")) return "funded";
  // Guess from size patterns
  if (lower.includes("alpha") || lower.includes("capital")) return "challenge";
  return "funded"; // default
}

function detectStatus(acct: ComputedAccount): "active" | "passed" | "failed" {
  const lower = acct.name.toLowerCase();
  // Check if name contains status hints
  if (lower.includes("blown") || lower.includes("disqualif") || lower.includes("failed")) return "failed";
  if (lower.includes("passed") || lower.includes("completed")) return "passed";

  // Check by P/L relative to target
  const target = acct.type === "challenge" ? 8 : acct.type === "verification" ? 5 : 0;
  if (target > 0) {
    // Estimate starting balance from first week's trades (rough)
    // If total PnL is very negative, likely failed
    if (acct.totalPnl < -500) return "failed";
  }

  return "active";
}

function computeAccounts(trades: Trade[]): ComputedAccount[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const name = t.account_name || "Unassigned";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(t);
  }

  return [...map.entries()].map(([name, acctTrades]) => {
    const wins = acctTrades.filter((t) => t.result === "Win").length;
    const losses = acctTrades.filter((t) => t.result === "Loss").length;
    const be = acctTrades.filter((t) => t.result === "BE").length;
    const totalPnl = acctTrades.reduce((s, t) => {
      const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    const totalPips = acctTrades.reduce((s, t) => s + (t.overall_pips || t.pips || 0), 0);
    const totalRs = acctTrades.reduce((s, t) => s + (t.rs_gained || 0), 0);

    // Weekly P/L for sparkline
    const weekMap = new Map<string, number>();
    for (const t of acctTrades) {
      const ws = getWeekStart(t.trade_date);
      const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
      weekMap.set(ws, (weekMap.get(ws) || 0) + (isNaN(v) ? 0 : v));
    }
    const weeklyPnl = [...weekMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, pnl]) => ({ week, pnl: Math.round(pnl * 100) / 100 }));

    const acct: ComputedAccount = {
      name,
      type: classifyAccount(name),
      trades: acctTrades.length,
      wins, losses, be,
      winRate: acctTrades.length > 0 ? Math.round((wins / acctTrades.length) * 100) : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalPips: Math.round(totalPips * 10) / 10,
      totalRs: Math.round(totalRs * 100) / 100,
      status: "active",
      weeklyPnl,
    };
    acct.status = detectStatus(acct);
    return acct;
  });
}

const TYPE_META = {
  challenge: { label: "Challenge", icon: Trophy, color: "text-amber-500", target: 8, bg: "bg-amber-50/40 border-amber-200/30" },
  verification: { label: "Verification", icon: Shield, color: "text-blue-500", target: 5, bg: "bg-blue-50/40 border-blue-200/30" },
  funded: { label: "Funded", icon: Wallet, color: "text-emerald-500", target: 0, bg: "bg-emerald-50/40 border-emerald-200/30" },
};

const STATUS_BADGE = {
  active: "info" as const,
  passed: "success" as const,
  failed: "danger" as const,
};

export default function AccountDashboard({ trades }: { trades: Trade[] }) {
  const accounts = useMemo(() => computeAccounts(trades), [trades]);

  const challenges = accounts.filter((a) => a.type === "challenge");
  const verifications = accounts.filter((a) => a.type === "verification");
  const funded = accounts.filter((a) => a.type === "funded");

  const totalPnl = accounts.reduce((s, a) => s + a.totalPnl, 0);

  if (accounts.length === 0) {
    return (
      <div className="text-center py-6">
        <Wallet size={24} className="text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No account data yet — sync your trading data to see account breakdown</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Trading Accounts</h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-400">{accounts.length} accounts</span>
          <span className={`font-bold ${totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            Total: {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="Challenges" count={challenges.length}
          active={challenges.filter((a) => a.status === "active").length}
          passed={challenges.filter((a) => a.status === "passed").length}
          failed={challenges.filter((a) => a.status === "failed").length}
          icon={Trophy} color="text-amber-500" />
        <SummaryCard label="Verifications" count={verifications.length}
          active={verifications.filter((a) => a.status === "active").length}
          passed={verifications.filter((a) => a.status === "passed").length}
          failed={verifications.filter((a) => a.status === "failed").length}
          icon={Shield} color="text-blue-500" />
        <SummaryCard label="Funded" count={funded.length}
          active={funded.filter((a) => a.status === "active").length}
          passed={0}
          failed={funded.filter((a) => a.status === "failed").length}
          icon={Wallet} color="text-emerald-500" />
      </div>

      {/* Account cards */}
      {accounts.map((a) => {
        const meta = TYPE_META[a.type];
        const Icon = meta.icon;
        const target = meta.target;
        // Estimate progress toward target (rough — based on P/L ratio)
        const progressPct = target > 0 && a.totalPnl > 0
          ? Math.min(100, Math.round((a.totalPnl / (a.totalPnl + Math.abs(a.totalPnl) * (target / 100))) * 100 * (100 / target)))
          : 0;

        return (
          <div key={a.name} className={`border rounded-xl p-3 ${meta.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon size={14} className={meta.color} />
                <span className="text-xs font-semibold text-gray-900">{a.name}</span>
                <Badge variant={STATUS_BADGE[a.status]}>{a.status}</Badge>
              </div>
              <span className={`text-sm font-bold ${a.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {a.totalPnl >= 0 ? "+" : ""}${a.totalPnl.toLocaleString()}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
              <MiniCell icon={Hash} label="Trades" value={a.trades} />
              <MiniCell icon={CheckCircle} label="Wins" value={a.wins} color="text-emerald-500" />
              <MiniCell icon={XCircle} label="Losses" value={a.losses} color="text-red-500" />
              <MiniCell icon={Percent} label="Win Rate" value={`${a.winRate}%`}
                color={a.winRate >= 60 ? "text-emerald-500" : a.winRate >= 40 ? "text-amber-500" : "text-red-500"} />
              <MiniCell icon={TrendingUp} label="Pips" value={a.totalPips}
                color={a.totalPips >= 0 ? "text-emerald-500" : "text-red-500"} />
              <MiniCell icon={DollarSign} label="R's" value={`${a.totalRs > 0 ? "+" : ""}${a.totalRs}R`}
                color={a.totalRs >= 0 ? "text-emerald-500" : "text-red-500"} />
            </div>

            {/* Progress bar for challenges/verifications */}
            {target > 0 && a.status === "active" && (
              <div>
                <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
                  <span>Progress to {target}% target</span>
                  <span>{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} color={progressPct >= 100 ? "bg-emerald-500" : "bg-brand"} />
              </div>
            )}

            {/* Win/loss bar */}
            {a.trades > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                  {a.wins > 0 && <div className="bg-emerald-400" style={{ width: `${(a.wins / a.trades) * 100}%` }} />}
                  {a.be > 0 && <div className="bg-amber-300" style={{ width: `${(a.be / a.trades) * 100}%` }} />}
                  {a.losses > 0 && <div className="bg-red-400" style={{ width: `${(a.losses / a.trades) * 100}%` }} />}
                </div>
              </div>
            )}

            {/* Weekly sparkline */}
            {a.weeklyPnl.length > 1 && (
              <div className="mt-1.5">
                <MiniSparkline data={a.weeklyPnl.map((w) => w.pnl)} positive={a.totalPnl >= 0} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, count, active, passed, failed, icon: Icon, color }: {
  label: string; count: number; active: number; passed: number; failed: number;
  icon: typeof Trophy; color: string;
}) {
  if (count === 0) return (
    <div className="p-2.5 bg-brand-light/30 rounded-xl text-center">
      <Icon size={14} className="text-gray-300 mx-auto mb-1" />
      <div className="text-[10px] text-gray-400">{label}</div>
      <div className="text-xs text-gray-300">None</div>
    </div>
  );

  return (
    <div className="p-2.5 bg-brand-light/40 rounded-xl text-center">
      <Icon size={14} className={`${color} mx-auto mb-1`} />
      <div className="text-[10px] text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900">{count}</div>
      <div className="flex justify-center gap-1.5 text-[8px] mt-0.5">
        {active > 0 && <span className="text-blue-500">{active} active</span>}
        {passed > 0 && <span className="text-emerald-500">{passed} passed</span>}
        {failed > 0 && <span className="text-red-500">{failed} failed</span>}
      </div>
    </div>
  );
}

function MiniCell({ icon: Icon, label, value, color = "text-gray-900" }: {
  icon: typeof Hash; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="p-1.5 bg-white/30 rounded text-center">
      <Icon size={10} className="text-gray-400 mx-auto mb-0.5" />
      <div className={`text-[11px] font-bold ${color}`}>{value}</div>
      <div className="text-[8px] text-gray-400">{label}</div>
    </div>
  );
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 16;
  const w = 100;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const color = positive ? "#10b981" : "#ef4444";

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-50">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
