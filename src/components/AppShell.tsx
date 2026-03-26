"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import { DateRangeProvider } from "@/contexts/DateRangeContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DateRangeProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
          <footer className="hidden md:block shrink-0 border-t border-pink-200/40 px-6 py-2 text-center">
            <p className="text-[10px] text-pink-300">
              For educational purposes only — not financial advice
            </p>
          </footer>
        </div>
        {/* Mobile bottom nav — visible only on mobile */}
        <MobileNav />
      </div>
    </DateRangeProvider>
  );
}
