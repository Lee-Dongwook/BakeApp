import React from "react";
import { Code2, Database } from "lucide-react";

interface HeaderProps {
  onOpenDbBuilder: () => void;
  onOpenCodePreview: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDbBuilder,
  onOpenCodePreview,
}) => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6 text-white">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍞</span>
        <h1 className="font-bold text-lg tracking-wide text-amber-400">
          BakeApp Studio
        </h1>
      </div>

      <div className="flex items-center gap-3">
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
