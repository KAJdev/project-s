import { create } from "zustand";

export type Toast = {
  id: ID;
  message: string;
  title: string;
  type: "success" | "error" | "warning" | "info";
  createdAt: number;
  duration: number;
};

export const toastStore = create<{
  toasts: Toast[];
  setToasts: (toasts: Toast[]) => void;
  addToast: (toast: Toast) => void;
  removeToast: (toast: ID) => void;
  clearToasts: () => void;
}>((set) => ({
  toasts: [],
  setToasts: (toasts) => set({ toasts }),
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (toast) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== toast) })),
  clearToasts: () => set({ toasts: [] }),
}));

export function createToast(
  message: string,
  title: string,
  type: "success" | "error" | "warning" | "info",
  duration = 5000
) {
  const toast: Toast = {
    id: ID.create(),
    message,
    title,
    type,
    createdAt: Date.now(),
    duration,
  };

  toastStore.getState().addToast(toast);

  setTimeout(() => {
    toastStore.getState().removeToast(toast.id);
  }, duration);
}
