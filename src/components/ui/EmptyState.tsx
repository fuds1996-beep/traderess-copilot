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
      <div className="w-14 h-14 rounded-2xl bg-brand-light/60 border border-brand-light/40 flex items-center justify-center mb-4">
        <Icon size={24} className="text-brand" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-5">{description}</p>
      {showConnect && (
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark text-gray-900 text-sm rounded-xl transition-all shadow-md shadow-brand/20"
        >
          <FileSpreadsheet size={14} />
          Connect Google Sheet
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
