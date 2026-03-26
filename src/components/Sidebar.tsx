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
      } glass-sidebar flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-pink-200/30">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto shadow-md shadow-pink-500/20">
            <Zap size={18} className="text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 tracking-tight">
                Traderess
              </div>
              <div className="text-[10px] text-pink-500 font-medium">
                COPILOT
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-pink-500/15 text-pink-600 font-medium shadow-sm"
                  : "text-gray-500 hover:bg-pink-50 hover:text-gray-700"
              }`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout + Collapse */}
      <div className="p-3 border-t border-pink-200/30 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
