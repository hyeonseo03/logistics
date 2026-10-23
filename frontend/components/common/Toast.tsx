"use client";

// 화면 오른쪽 아래에 잠깐 떴다가 사라지는 알림 (성공 / 실패)
// 사용법: const { showToast } = useToast(); showToast("저장되었습니다."); showToast("실패했습니다.", "error");

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | null>(null);

let nextId = 1;
const SHOW_MS = 3000; // 3초 동안 보여준다

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), SHOW_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* aria-live: 화면 읽기 프로그램도 알림을 읽어 준다 */}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? "✓ " : "⚠ "}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast 는 ToastProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
