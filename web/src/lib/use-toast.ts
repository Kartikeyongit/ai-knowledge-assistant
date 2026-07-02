"use client";

import { useCallback, useState } from "react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
};

function genId() {
  return Date.now() + Math.random();
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return { toasts, toast, removeToast };
}
