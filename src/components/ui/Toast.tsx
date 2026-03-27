"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
}

const ToastCtx = createContext<{
  toast: (message: string, variant?: ToastItem["variant"]) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string, variant: ToastItem["variant"] = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-[90] flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = {
    success: <Check size={14} className="text-emerald-500" />,
    error: <AlertTriangle size={14} className="text-red-500" />,
    info: <Info size={14} className="text-blue-500" />,
  };

  const borders = {
    success: "border-emerald-200/60",
    error: "border-red-200/60",
    info: "border-blue-200/60",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-xl border ${borders[item.variant]} rounded-xl shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      {icons[item.variant]}
      <span className="text-xs text-gray-700 flex-1">{item.message}</span>
      <button onClick={onDismiss} className="p-0.5 text-gray-400 hover:text-gray-600">
        <X size={12} />
      </button>
    </div>
  );
}
