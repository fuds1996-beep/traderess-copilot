"use client";

import { Sparkles, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <div className="h-14 border-b border-pink-200/40 flex items-center justify-between px-6 shrink-0 bg-white/40 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Sparkles size={16} className="text-pink-500" />
        <span className="text-xs text-gray-500">
          Traderess Trading Copilot
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-pink-100 text-pink-600 border border-pink-200/60">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-400">
          For educational purposes only — not financial advice
        </span>
        <button className="w-8 h-8 rounded-xl bg-white/60 border border-pink-200/40 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-300 transition-colors">
          <Bell size={14} />
        </button>
      </div>
    </div>
  );
}
