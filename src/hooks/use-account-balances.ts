"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AccountBalance } from "@/lib/types";

export function useAccountBalances() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("account_balances")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: true });

      setBalances((data as AccountBalance[]) || []);
    } catch {
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Group by account for multi-line charts
  const byAccount = balances.reduce<Record<string, AccountBalance[]>>((acc, b) => {
    if (!acc[b.account_name]) acc[b.account_name] = [];
    acc[b.account_name].push(b);
    return acc;
  }, {});

  const accountNames = Object.keys(byAccount);

  return { balances, byAccount, accountNames, loading, hasData: balances.length > 0, refresh: fetch };
}
