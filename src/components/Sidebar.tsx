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
import { useTraderProfile } from "@/hooks/use-trader-profile";
import { useJournals } from "@/hooks/use-journals";
import { useBriefing } from "@/hooks/use-briefing";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badgeKey: null },
  { href: "/profile", label: "Trader Profile", icon: User, badgeKey: null },
  { href: "/performance", label: "Performance", icon: TrendingUp, badgeKey: null },
  { href: "/journal", label: "Journal", icon: Brain, badgeKey: "journal" as const },
  { href: "/discipline", label: "Discipline", icon: Target, badgeKey: null },
  { href: "/briefing", label: "Weekly Briefing", icon: Newspaper, badgeKey: "briefing" as const },
  { href: "/workflow", label: "Copilot Workflow", icon: Workflow, badgeKey: null },
  { href: "/settings", label: "Settings", icon: Settings, badgeKey: null },
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
  const { profile } = useTraderProfile();
  const { journals } = useJournals();
  const { hasData: hasBriefing } = useBriefing();

  // Badge logic
  const today = new Date().toISOString().split("T")[0];
  const hasTodayJournal = journals.some((j) => j.journal_date === today);

  const badges: Record<string, boolean> = {
    journal: !hasTodayJournal && journals.length > 0, // red dot if no entry today but has past entries
    briefing: !hasBriefing,
  };

  const firstName = profile.full_name?.split(" ")[0] || "";
  const initial = profile.avatar_initial || (firstName ? firstName[0].toUpperCase() : "T");

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
      {/* Logo + Avatar */}
      <div className="p-4 border-b border-pink-200/30">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto shadow-md shadow-pink-500/20">
            <Zap size={18} className="text-white" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 tracking-tight">Traderess</div>
                <div className="text-[10px] text-pink-500 font-medium">COPILOT</div>
              </div>
            </div>
            {firstName && (
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {initial}
                </div>
                <span className="text-xs text-gray-600 truncate">{firstName}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.badgeKey && badges[item.badgeKey];
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-pink-500/15 text-pink-600 font-medium shadow-sm"
                  : "text-gray-500 hover:bg-pink-50 hover:text-gray-700"
              }`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
              {showBadge && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400" />
              )}
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
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );
}
