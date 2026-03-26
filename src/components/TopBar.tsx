"use client";

import { Sparkles, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/50">
      <div className="flex items-center gap-3">
        <Sparkles size={16} className="text-indigo-400" />
        <span className="text-xs text-slate-400">
          Traderess Trading Copilot
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-900/50 text-blue-400 border border-blue-800">
          Demo Mode
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500">
          For educational purposes only — not financial advice
        </span>
        <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <Bell size={14} />
        </button>
      </div>
    </div>
  );
}
