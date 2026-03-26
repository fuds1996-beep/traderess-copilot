"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  defaultOpen = true,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
