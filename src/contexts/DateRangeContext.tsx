"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

export type DatePreset = "this_week" | "last_week" | "this_month" | "last_month" | "last_30" | "all";

export interface DateRange {
  preset: DatePreset;
  from: string;
  to: string;
  label: string;
}

function computeRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (preset) {
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now); mon.setDate(diff);
      return { preset, from: mon.toISOString().split("T")[0], to: today, label: "This Week" };
    }
    case "last_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const mon = new Date(now); mon.setDate(diff);
      const fri = new Date(mon); fri.setDate(mon.getDate() + 6);
      return { preset, from: mon.toISOString().split("T")[0], to: fri.toISOString().split("T")[0], label: "Last Week" };
    }
    case "this_month": {
      const from = `${today.slice(0, 7)}-01`;
      return { preset, from, to: today, label: "This Month" };
    }
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { preset, from: d.toISOString().split("T")[0], to: end.toISOString().split("T")[0], label: "Last Month" };
    }
    case "last_30": {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      return { preset, from: d.toISOString().split("T")[0], to: today, label: "Last 30 Days" };
    }
    default:
      return { preset: "all", from: "2020-01-01", to: "2099-12-31", label: "All Time" };
  }
}

interface DateRangeCtxType {
  range: DateRange;
  setPreset: (p: DatePreset) => void;
  setCustom: (from: string, to: string) => void;
  filterDates: <T extends { trade_date?: string; journal_date?: string; log_date?: string; week_start?: string }>(items: T[]) => T[];
}

const DateRangeCtx = createContext<DateRangeCtxType>({
  range: computeRange("all"),
  setPreset: () => {},
  setCustom: () => {},
  filterDates: (items) => items,
});

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(computeRange("all"));

  const setPreset = useCallback((p: DatePreset) => {
    setRange(computeRange(p));
  }, []);

  const setCustom = useCallback((from: string, to: string) => {
    setRange({ preset: "all" as DatePreset, from, to, label: `${from} – ${to}` });
  }, []);

  // Stable filterDates that only changes when range changes
  const filterDates = useCallback(<T extends { trade_date?: string; journal_date?: string; log_date?: string; week_start?: string }>(items: T[]): T[] => {
    if (range.preset === "all") return items;
    return items.filter((item) => {
      const d = item.trade_date || item.journal_date || item.log_date || item.week_start || "";
      return d >= range.from && d <= range.to;
    });
  }, [range]);

  const value = useMemo(() => ({ range, setPreset, setCustom, filterDates }), [range, setPreset, setCustom, filterDates]);

  return (
    <DateRangeCtx.Provider value={value}>
      {children}
    </DateRangeCtx.Provider>
  );
}

export function useDateRange() {
  return useContext(DateRangeCtx);
}
