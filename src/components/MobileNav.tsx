"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  Target,
  MoreHorizontal,
  User,
  Newspaper,
  Workflow,
  Settings,
  X,
} from "lucide-react";

const MAIN_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/journal", label: "Journal", icon: Brain },
  { href: "/discipline", label: "Discipline", icon: Target },
];

const MORE_NAV = [
  { href: "/profile", label: "Trader Profile", icon: User },
  { href: "/briefing", label: "Weekly Briefing", icon: Newspaper },
  { href: "/workflow", label: "Copilot Workflow", icon: Workflow },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_NAV.some((item) => pathname === item.href);

  return (
    <>
      {/* Bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-brand-light/40 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive ? "text-brand" : "text-gray-400"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
              isMoreActive ? "text-brand" : "text-gray-400"
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More sheet overlay */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-3xl border-t border-brand-light/40 p-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">More</h3>
              <button onClick={() => setShowMore(false)} className="p-1 text-gray-400"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MORE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    pathname === item.href ? "bg-brand-light text-brand" : "text-gray-600 hover:bg-brand-light/50"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
