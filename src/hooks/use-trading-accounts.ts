"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TradingAccount, AccountPayout } from "@/lib/types";

export function useTradingAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [payouts, setPayouts] = useState<AccountPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [acctRes, payRes] = await Promise.all([
        supabase.from("trading_accounts").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("account_payouts").select("*").eq("user_id", user.id).order("payout_date", { ascending: false }),
      ]);

      setAccounts((acctRes.data as TradingAccount[]) || []);
      setPayouts((payRes.data as AccountPayout[]) || []);
    } catch {
      setAccounts([]);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Categorize accounts
  const challenges = accounts.filter((a) => a.account_type === "challenge");
  const verifications = accounts.filter((a) => a.account_type === "verification");
  const funded = accounts.filter((a) => a.account_type === "funded");

  const totalPayouts = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.net_amount, 0);

  return {
    accounts, payouts, challenges, verifications, funded,
    totalPayouts, loading, hasData: accounts.length > 0, refresh: fetch,
  };
}
