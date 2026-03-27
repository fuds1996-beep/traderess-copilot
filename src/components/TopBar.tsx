"use client";

import { useState } from "react";
import { Sparkles, Bell, Calendar, ChevronDown } from "lucide-react";
import { useDateRange, type DatePreset } from "@/contexts/DateRangeContext";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_30", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

export default function TopBar() {
  const { range, setPreset, setCustom } = useDateRange();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  return (
    <div className="h-14 border-b border-brand-light/40 flex items-center justify-between px-4 md:px-6 shrink-0 bg-white/40 backdrop-blur-sm relative">
      <div className="flex items-center gap-3">
        <Sparkles size={16} className="text-brand hidden sm:block" />
        <span className="text-xs text-gray-500 hidden sm:block">Traderess Copilot</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Date range selector */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white/60 border border-brand-light/40 rounded-lg hover:bg-white/80 transition-colors"
          >
            <Calendar size={12} className="text-brand" />
            <span className="hidden sm:inline">{range.label}</span>
            <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white/95 backdrop-blur-xl border border-brand-light/40 rounded-xl shadow-lg shadow-brand/10 p-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setPreset(p.value); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                      range.preset === p.value ? "bg-brand-light text-brand font-medium" : "text-gray-600 hover:bg-brand-light/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="border-t border-brand-light/30 mt-1 pt-2 px-3 pb-1">
                  <div className="text-[10px] text-gray-400 mb-1.5">Custom Range</div>
                  <div className="flex gap-1.5">
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                      className="flex-1 bg-white/60 border border-brand-light/40 rounded px-1.5 py-1 text-[10px] text-gray-900 focus:outline-none focus:border-brand" />
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                      className="flex-1 bg-white/60 border border-brand-light/40 rounded px-1.5 py-1 text-[10px] text-gray-900 focus:outline-none focus:border-brand" />
                  </div>
                  <button
                    onClick={() => { if (customFrom && customTo) { setCustom(customFrom, customTo); setOpen(false); } }}
                    disabled={!customFrom || !customTo}
                    className="w-full mt-1.5 px-2 py-1 bg-brand hover:bg-brand-dark disabled:opacity-40 text-white text-[10px] rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="w-8 h-8 rounded-xl bg-white/60 border border-brand-light/40 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand-light transition-colors">
          <Bell size={14} />
        </button>
      </div>
    </div>
  );
}
