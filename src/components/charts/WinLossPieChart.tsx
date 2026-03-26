"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PIE_COLORS } from "@/lib/mock-data";

export default function WinLossPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
          >
            {PIE_COLORS.map((c, i) => (
              <Cell key={i} fill={c} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-xs text-slate-400">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PIE_COLORS[i] }}
            />
            {d.value} {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
