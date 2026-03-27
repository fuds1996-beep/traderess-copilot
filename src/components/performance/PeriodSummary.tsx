"use client";

import { useMemo } from "react";
import type { Trade } from "@/lib/types";

const SESSIONS = ["LND Open", "NY Open", "NY Close", "Asia Open", "Asia Close"];

interface SessionStats {
  session: string;
  total: number;
  wins: number;
  successRate: number;
}

interface FullStats {
  tradesTaken: number;
  pipsPositive: number;
  pipsNegative: number;
  pipsOverall: number;
  rsPositive: number;
  rsNegative: number;
  rsOverall: number;
  wins: number;
  be: number;
  losses: number;
  successRate: string;
  sessions: SessionStats[];
}

function computeFullStats(trades: Trade[]): FullStats {
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const be = trades.filter((t) => t.result === "BE").length;
  const tradesTaken = trades.length;
  const successRate = tradesTaken > 0 ? ((wins / tradesTaken) * 100).toFixed(1) : "0";

  let pipsPositive = 0, pipsNegative = 0;
  let rsPositive = 0, rsNegative = 0;

  for (const t of trades) {
    const pips = t.overall_pips || t.pips || 0;
    if (pips > 0) pipsPositive += pips; else pipsNegative += pips;

    const rs = t.rs_gained || 0;
    if (rs > 0) rsPositive += rs; else rsNegative += rs;
  }

  // Session breakdown
  const sessionMap = new Map<string, { total: number; wins: number }>();
  for (const s of SESSIONS) sessionMap.set(s, { total: 0, wins: 0 });

  for (const t of trades) {
    const s = t.session || "";
    // Match to known session — fuzzy match
    const match = SESSIONS.find((sn) =>
      s.toLowerCase().includes(sn.split(" ")[0].toLowerCase()) &&
      s.toLowerCase().includes(sn.split(" ")[1]?.toLowerCase() || ""),
    ) || s;

    if (!sessionMap.has(match)) sessionMap.set(match, { total: 0, wins: 0 });
    const entry = sessionMap.get(match)!;
    entry.total++;
    if (t.result === "Win") entry.wins++;
  }

  const sessions = [...sessionMap.entries()]
    .map(([session, d]) => ({
      session,
      total: d.total,
      wins: d.wins,
      successRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
    }));

  return {
    tradesTaken,
    pipsPositive: round(pipsPositive),
    pipsNegative: round(pipsNegative),
    pipsOverall: round(pipsPositive + pipsNegative),
    rsPositive: round(rsPositive),
    rsNegative: round(rsNegative),
    rsOverall: round(rsPositive + rsNegative),
    wins, be, losses,
    successRate,
    sessions,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function PeriodSummary({
  label,
  trades,
}: {
  label: string;
  trades: Trade[];
}) {
  const stats = useMemo(() => computeFullStats(trades), [trades]);

  if (trades.length === 0) return null;

  const sessionTotal = stats.sessions.reduce((s, d) => s + d.total, 0);
  const sessionWins = stats.sessions.reduce((s, d) => s + d.wins, 0);
  const sessionSuccessRate = sessionTotal > 0 ? Math.round((sessionWins / sessionTotal) * 100) : 0;

  return (
    <div className="glass rounded-2xl p-5 border border-brand-light/40">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{label}</h3>

      {/* Main stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
        <StatCell label="Trades Taken" value={stats.tradesTaken} />
        <StatCell label="Pips Positive" value={`+${stats.pipsPositive}`} color="text-emerald-500" />
        <StatCell label="Pips Negative" value={stats.pipsNegative} color="text-red-500" />
        <StatCell label="Pips Overall" value={stats.pipsOverall} color={stats.pipsOverall >= 0 ? "text-emerald-500" : "text-red-500"} />
        <StatCell label="Positive R's" value={`+${stats.rsPositive}R`} color="text-emerald-500" />
        <StatCell label="Negative R's" value={`${stats.rsNegative}R`} color="text-red-500" />
        <StatCell label="Overall R's" value={`${stats.rsOverall > 0 ? "+" : ""}${stats.rsOverall}R`} color={stats.rsOverall >= 0 ? "text-emerald-500" : "text-red-500"} />
        <StatCell label="Wins" value={stats.wins} color="text-emerald-500" />
        <StatCell label="BE" value={stats.be} color="text-amber-500" />
        <StatCell label="Losses" value={stats.losses} color="text-red-500" />
        <StatCell label="Success Rate %" value={`${stats.successRate}%`}
          color={Number(stats.successRate) >= 60 ? "text-emerald-500" : Number(stats.successRate) >= 40 ? "text-amber-500" : "text-red-500"}
          highlight
        />
      </div>

      {/* Win/Loss bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-gray-100">
          {stats.wins > 0 && <div className="bg-emerald-400" style={{ width: `${(stats.wins / stats.tradesTaken) * 100}%` }} />}
          {stats.be > 0 && <div className="bg-amber-300" style={{ width: `${(stats.be / stats.tradesTaken) * 100}%` }} />}
          {stats.losses > 0 && <div className="bg-red-400" style={{ width: `${(stats.losses / stats.tradesTaken) * 100}%` }} />}
        </div>
        <div className="flex gap-2 text-[9px] text-gray-400 shrink-0">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{stats.wins}W</span>
          {stats.be > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-300" />{stats.be}BE</span>}
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{stats.losses}L</span>
        </div>
      </div>

      {/* Session breakdown table */}
      <div>
        <h4 className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Session Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-brand-light/30">
                <th className="text-left py-1.5 px-2 text-gray-400 font-medium">Sessions</th>
                <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Total</th>
                <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Wins</th>
                <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Success Rate %</th>
              </tr>
            </thead>
            <tbody>
              {stats.sessions.map((s) => (
                <tr key={s.session} className={`border-b border-brand-light/15 ${s.total === 0 ? "opacity-40" : ""}`}>
                  <td className="py-1.5 px-2 text-gray-700 font-medium">{s.session}</td>
                  <td className="py-1.5 px-2 text-center text-gray-600">{s.total}</td>
                  <td className="py-1.5 px-2 text-center text-emerald-500 font-medium">{s.wins}</td>
                  <td className="py-1.5 px-2 text-center">
                    {s.total > 0 ? (
                      <span className={`font-medium ${s.successRate >= 60 ? "text-emerald-500" : s.successRate >= 40 ? "text-amber-500" : "text-red-500"}`}>
                        {s.successRate}%
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t border-brand-light/40 bg-brand-light/30 font-semibold">
                <td className="py-2 px-2 text-gray-900">Total</td>
                <td className="py-2 px-2 text-center text-gray-900">{sessionTotal}</td>
                <td className="py-2 px-2 text-center text-emerald-500">{sessionWins}</td>
                <td className="py-2 px-2 text-center">
                  <span className={`${sessionSuccessRate >= 60 ? "text-emerald-500" : sessionSuccessRate >= 40 ? "text-amber-500" : "text-red-500"}`}>
                    {sessionSuccessRate}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color = "text-gray-900",
  highlight,
}: {
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? "bg-brand-light/60 border border-brand-light/40" : "bg-brand-light/40"}`}>
      <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
