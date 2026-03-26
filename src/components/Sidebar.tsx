"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  TrendingUp,
  Brain,
  Target,
  Newspaper,
  Workflow,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Trader Profile", icon: User },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/journal", label: "Journal", icon: Brain },
  { href: "/discipline", label: "Discipline", icon: Target },
  { href: "/briefing", label: "Weekly Briefing", icon: Newspaper },
  { href: "/workflow", label: "Copilot Workflow", icon: Workflow },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Zap size={18} className="text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                Traderess
              </div>
              <div className="text-[10px] text-indigo-400 font-medium">
                COPILOT
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout + Collapse */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
