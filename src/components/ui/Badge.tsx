const BADGE_STYLES = {
  default: "bg-gray-100 text-gray-600",
  success: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
  danger: "bg-red-50 text-red-600 border border-red-200/60",
  warning: "bg-amber-50 text-amber-600 border border-amber-200/60",
  info: "bg-pink-50 text-pink-600 border border-pink-200/60",
  high: "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-gray-100 text-gray-500",
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
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${BADGE_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
