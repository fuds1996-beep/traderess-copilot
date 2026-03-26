import { ArrowUp, ArrowDown } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Trade } from "@/lib/types";

const HEADERS = [
  "Date",
  "Pair",
  "Dir",
  "Entry",
  "SL",
  "TP",
  "Result",
  "Pips",
  "R:R",
  "Session",
  "Notes",
];

export default function TradeLogTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left py-2 px-2 text-xs text-slate-400 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.id}
              className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-2 px-2 text-slate-300">{t.trade_date}</td>
              <td className="py-2 px-2 text-white font-medium">{t.pair}</td>
              <td className="py-2 px-2">
                <span
                  className={`flex items-center gap-1 ${
                    t.direction === "Long"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {t.direction === "Long" ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  {t.direction}
                </span>
              </td>
              <td className="py-2 px-2 text-slate-300">{t.entry_price}</td>
              <td className="py-2 px-2 text-red-400">{t.sl_price}</td>
              <td className="py-2 px-2 text-emerald-400">{t.tp_price}</td>
              <td className="py-2 px-2">
                <Badge variant={t.result === "Win" ? "success" : "danger"}>
                  {t.result}
                </Badge>
              </td>
              <td
                className={`py-2 px-2 font-medium ${
                  t.pips > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.pips > 0 ? "+" : ""}
                {t.pips}
              </td>
              <td className="py-2 px-2 text-slate-400">{t.risk_reward}</td>
              <td className="py-2 px-2 text-slate-400">{t.session}</td>
              <td className="py-2 px-2 text-xs text-slate-500 max-w-[160px] truncate">
                {t.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
