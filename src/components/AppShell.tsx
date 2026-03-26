"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <footer className="shrink-0 border-t border-pink-200/40 px-6 py-2 text-center">
          <p className="text-[10px] text-pink-300">
            For educational purposes only — not financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}
