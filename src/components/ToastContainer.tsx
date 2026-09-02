import React from "react";
import { useRuntimeStore } from "../store/useRuntimeStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const toasts = useRuntimeStore((state) => state.toasts);
  const removeToast = useRuntimeStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  const getBorder = (type: string) => {
    switch (type) {
      case "success":
        return "border-emerald-500/30 bg-slate-900/95";
      case "error":
        return "border-rose-500/30 bg-slate-900/95";
      case "warning":
        return "border-amber-500/30 bg-slate-900/95";
      default:
        return "border-sky-500/30 bg-slate-900/95";
    }
  };

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs text-slate-100 animate-in slide-in-from-bottom-2 fade-in duration-200 ${getBorder(
            toast.type,
          )}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {getIcon(toast.type)}
            <span className="truncate leading-relaxed">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition"
            aria-label="알림 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
