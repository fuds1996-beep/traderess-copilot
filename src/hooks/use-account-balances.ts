"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AccountBalance, Trade } from "@/lib/types";
import { getWeekStart } from "@/lib/date-utils";

export function useAccountBalances() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Try account_balances table first (populated by Full Sync)
      const { data: dbBalances } = await supabase
        .from("account_balances")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: true });

      if (dbBalances && dbBalances.length > 0) {
        setBalances(dbBalances as AccountBalance[]);
      } else {
        // Fallback: compute from trade_log dollar_result per account per week
        const { data: trades } = await supabase
          .from("trade_log")
          .select("account_name,trade_date,dollar_result")
          .eq("user_id", user.id)
          .order("trade_date", { ascending: true });

        if (trades && trades.length > 0) {
          setBalances(computeBalancesFromTrades(trades as Trade[]));
        }
      }
    } catch {
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const byAccount = balances.reduce<Record<string, AccountBalance[]>>((acc, b) => {
    if (!acc[b.account_name]) acc[b.account_name] = [];
    acc[b.account_name].push(b);
    return acc;
  }, {});

  const accountNames = Object.keys(byAccount);

  return { balances, byAccount, accountNames, loading, hasData: balances.length > 0, refresh: fetch };
}

/** Compute running account balances from trade dollar results grouped by week */
function computeBalancesFromTrades(trades: Trade[]): AccountBalance[] {
  // Group by account + week
  const map = new Map<string, Map<string, number>>();

  for (const t of trades) {
    const acct = t.account_name || "Unassigned";
    const ws = getWeekStart(t.trade_date);
    const dollars = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    if (isNaN(dollars)) continue;

    if (!map.has(acct)) map.set(acct, new Map());
    const weekMap = map.get(acct)!;
    weekMap.set(ws, (weekMap.get(ws) || 0) + dollars);
  }

  const results: AccountBalance[] = [];

  for (const [acct, weekMap] of map.entries()) {
    const sortedWeeks = [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;

    for (const [ws, weekPnl] of sortedWeeks) {
      const balanceStart = Math.round(cumulative * 100) / 100;
      cumulative += weekPnl;
      const balanceEnd = Math.round(cumulative * 100) / 100;

      results.push({
        id: `${acct}-${ws}`,
        user_id: "",
        account_name: acct,
        week_start: ws,
        balance_start: balanceStart,
        balance_end: balanceEnd,
        weekly_result: Math.round(weekPnl * 100) / 100,
        account_status: "Active",
      });
    }
  }

  return results;
}
