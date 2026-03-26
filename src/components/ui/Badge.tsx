const BADGE_STYLES = {
  default: "bg-slate-700 text-slate-300",
  success: "bg-emerald-900/50 text-emerald-400 border border-emerald-800",
  danger: "bg-red-900/50 text-red-400 border border-red-800",
  warning: "bg-amber-900/50 text-amber-400 border border-amber-800",
  info: "bg-blue-900/50 text-blue-400 border border-blue-800",
  high: "bg-red-900/60 text-red-300",
  medium: "bg-amber-900/60 text-amber-300",
  low: "bg-slate-700 text-slate-400",
} as const;

export default function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof BADGE_STYLES;
}) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
