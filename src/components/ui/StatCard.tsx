"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-brand",
  trend,
  sparkline,
  onClick,
  id,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: { delta: string; positive: boolean } | null;
  sparkline?: number[];
  onClick?: () => void;
  id?: string;
}) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      id={id}
      onClick={onClick}
      className={`glass rounded-2xl p-4 text-left ${onClick ? "cursor-pointer hover:bg-white/70 transition-colors" : ""}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${trend.positive ? "text-emerald-500" : "text-red-500"}`}>
            {trend.positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {trend.delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-2">
          <MiniSparkline data={sparkline} color={color} />
        </div>
      )}
    </Tag>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 100;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  // Derive stroke color from the text color class
  const strokeColor = color.includes("emerald") ? "#10b981"
    : color.includes("blue") ? "#3b82f6"
    : color.includes("amber") ? "#f59e0b"
    : color.includes("purple") ? "#a855f7"
    : color.includes("pink") ? "#e98e97"
    : "#9ca3af";

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-40">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
