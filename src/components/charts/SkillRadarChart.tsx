"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SkillRadarChart({
  data,
}: {
  data: { trait: string; value: number; fullMark: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(244,114,182,0.15)" />
        <PolarAngleAxis
          dataKey="trait"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "#d1d5db" }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#e98e97"
          fill="#e98e97"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
