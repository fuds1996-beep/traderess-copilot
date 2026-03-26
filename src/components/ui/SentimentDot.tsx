import type { Sentiment } from "@/lib/types";

const COLORS: Record<Sentiment, string> = {
  bullish: "bg-emerald-400",
  bearish: "bg-red-400",
  neutral: "bg-amber-400",
};

export default function SentimentDot({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 mt-1 ${COLORS[sentiment]}`}
    />
  );
}
