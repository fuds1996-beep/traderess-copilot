import Link from "next/link";
import { FileSpreadsheet, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon = FileSpreadsheet,
  title,
  description,
  showConnect = true,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  showConnect?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5">{description}</p>
      {showConnect && (
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <FileSpreadsheet size={14} />
          Connect Google Sheet
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
