/**
 * Column definitions for the trade log table.
 * Each column has a type that determines how it renders and edits.
 */

export type ColType = "text" | "number" | "date" | "time" | "select" | "url" | "textarea" | "money" | "percent" | "ratio";

export interface ColumnDef {
  key: string;
  label: string;
  type: ColType;
  width: string;
  options?: string[]; // for "select" type
  placeholder?: string;
}

export const TRADE_COLUMNS: ColumnDef[] = [
  { key: "account_name", label: "Account", type: "text", width: "w-24" },
  {
    key: "day", label: "Day", type: "select", width: "w-20",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"],
  },
  { key: "trade_date", label: "Date", type: "date", width: "w-28" },
  {
    key: "scenario", label: "Scenario", type: "select", width: "w-24",
    options: ["Primary", "Backup/re-entry"],
  },
  {
    key: "pair", label: "Major Pair", type: "select", width: "w-24",
    options: ["EURUSD", "AUDUSD", "NZDUSD", "GBPUSD", "USDCAD", "USDCHF", "USDJPY"],
  },
  {
    key: "session", label: "Session", type: "select", width: "w-24",
    options: ["LND Open", "NY Open", "NY Close", "Asia Open", "Asia Close"],
  },
  { key: "time_of_entry", label: "Entry Time", type: "time", width: "w-22" },
  { key: "time_of_exit", label: "Exit Time", type: "time", width: "w-22" },
  { key: "entry_price", label: "Entry Rate", type: "number", width: "w-24" },
  { key: "sl_price", label: "SL Rate", type: "number", width: "w-24" },
  { key: "tp_price", label: "TP Rate", type: "number", width: "w-24" },
  {
    key: "entry_strategy", label: "Entry Strategy", type: "select", width: "w-32",
    options: ["Manual entry w/o alert", "Manual entry after alert", "Limit activated", "Stop activated"],
  },
  {
    key: "sl_strategy", label: "SL Strategy", type: "select", width: "w-32",
    options: ["Moved SL to BE", "Moved SL to BE before TP1", "Didnt modify SL"],
  },
  {
    key: "tp_strategy", label: "TP Strategy", type: "select", width: "w-32",
    options: ["TP Closed Automatically", "TP Closed Manually", "Didn't modify TP"],
  },
  {
    key: "direction", label: "Direction", type: "select", width: "w-20",
    options: ["Long", "Short"],
  },
  {
    key: "entry_conf_1", label: "Entry Conf 1", type: "select", width: "w-36",
    options: [
      "Session high/low", "Daily high/low", "Weekly high/low", "Monthly high/low",
      "Half session confirmation", "Full session confirmation", "Double session confirmation",
      "Weekly confirmation", "Monthly confirmation", "Psychological level",
      "News recovery 3min", "News recovery 5min", "News recovery 15min",
      "No confirmation was present", "Break & Continue", "RSI 15", "RSI 1hr", "RSI 4hr",
    ],
  },
  {
    key: "entry_conf_2", label: "Entry Conf 2", type: "select", width: "w-36",
    options: [
      "Session high/low", "Daily high/low", "Weekly high/low", "Monthly high/low",
      "Half session confirmation", "Full session confirmation", "Double session confirmation",
      "Weekly confirmation", "Monthly confirmation", "Psychological level",
      "News recovery 3min", "News recovery 5min", "News recovery 15min",
      "No confirmation was present", "Break & Continue", "RSI 15", "RSI 1hr", "RSI 4hr",
    ],
  },
  {
    key: "entry_conf_3", label: "Entry Conf 3", type: "select", width: "w-36",
    options: [
      "Session high/low", "Daily high/low", "Weekly high/low", "Monthly high/low",
      "Half session confirmation", "Full session confirmation", "Double session confirmation",
      "Weekly confirmation", "Monthly confirmation", "Psychological level",
      "News recovery 3min", "News recovery 5min", "News recovery 15min",
      "No confirmation was present", "Break & Continue", "RSI 15", "RSI 1hr", "RSI 4hr",
    ],
  },
  {
    key: "fundamental_check", label: "Fundamental?", type: "select", width: "w-20",
    options: ["Yes", "No"],
  },
  {
    key: "event_within_2h", label: "Event 2h?", type: "select", width: "w-20",
    options: ["Yes", "No"],
  },
  {
    key: "safe_window", label: "Safe Window?", type: "select", width: "w-20",
    options: ["Yes", "No"],
  },
  {
    key: "result", label: "Outcome", type: "select", width: "w-18",
    options: ["Win", "Loss"],
  },
  { key: "overall_pips", label: "Overall Pips", type: "number", width: "w-20" },
  { key: "rs_gained", label: "R's Gained/Lost", type: "number", width: "w-24" },
  { key: "risk_reward", label: "R2R", type: "ratio", width: "w-18", placeholder: "1:1" },
  { key: "dollar_result", label: "$ Lost/Gained", type: "money", width: "w-24" },
  { key: "percent_risked", label: "% Risked", type: "percent", width: "w-20" },
  { key: "before_picture", label: "Before Pic", type: "url", width: "w-16", placeholder: "TV link" },
  { key: "after_picture", label: "After Pic", type: "url", width: "w-16", placeholder: "TV link" },
  {
    key: "trade_quality", label: "Quality", type: "select", width: "w-24",
    options: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
  },
  {
    key: "forecasted", label: "Forecasted?", type: "select", width: "w-36",
    options: ["Trade was forecasted prior", "Trade was not forecasted"],
  },
  { key: "trade_evaluation", label: "Evaluation", type: "textarea", width: "w-40" },
];

/** Get the default value for a new trade based on column type */
export function getDefaultValue(col: ColumnDef): string | number | boolean {
  switch (col.type) {
    case "number":
    case "money":
    case "percent":
      return 0;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "select":
      return col.options?.[0] || "";
    default:
      return "";
  }
}
