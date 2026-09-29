"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastKind = "ok" | "danger" | "info";
interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}

const ToastContext = createContext<((msg: string, kind?: ToastKind) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = `t${counter.current++}`;
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.kind === "danger" ? " danger" : t.kind === "info" ? " info" : "")}>
            <div className="dot" />
            <div>{t.msg}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
