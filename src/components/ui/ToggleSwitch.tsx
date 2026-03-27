"use client";

import { useState } from "react";

export default function ToggleSwitch({
  defaultOn = false,
  activeColor = "bg-brand",
}: {
  defaultOn?: boolean;
  activeColor?: string;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
        on ? activeColor : "bg-gray-200"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${
          on ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}
