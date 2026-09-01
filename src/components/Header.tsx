import React from "react";
import { useRuntimeStore } from "../store/useRuntimeStore";
import { Code2, Database, Play, Edit3, RotateCcw } from "lucide-react";

interface HeaderProps {
  onOpenDbBuilder: () => void;
  onOpenCodePreview: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDbBuilder,
  onOpenCodePreview,
}) => {
  const mode = useRuntimeStore((state) => state.mode);
  const setMode = useRuntimeStore((state) => state.setMode);
  const resetFormState = useRuntimeStore((state) => state.resetFormState);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6 text-white">
      {/* 로고 영역 */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍞</span>
        <h1 className="font-bold text-lg tracking-wide text-amber-400">
          BakeApp Studio
        </h1>
      </div>

      {/* 중앙: Edit / Live Preview 모드 스위처 */}
      <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setMode("EDIT")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === "EDIT"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit Mode</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("PREVIEW")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === "PREVIEW"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* 우측: DB Builder & Code Preview 액션 버튼 */}
      <div className="flex items-center gap-3">
        {mode === "PREVIEW" && (
          <button
            type="button"
            onClick={resetFormState}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
            title="입력 폼 상태 초기화"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset State</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenDbBuilder}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all shadow-sm"
        >
          <Database className="h-3.5 w-3.5" />
          <span>DB Builder</span>
        </button>

        <button
          type="button"
          onClick={onOpenCodePreview}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Preview &amp; Code</span>
        </button>
      </div>
    </header>
  );
};
