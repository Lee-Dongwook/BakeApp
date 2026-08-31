import React from "react";
import { LayoutGrid, Database, Play } from "lucide-react";

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-white">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4 bg-slate-950">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-amber-500">🍞 BakeApp</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            v1.0 Editor
          </span>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-lg space-x-1">
          <button className="flex items-center space-x-1 px-3 py-1 bg-slate-700 text-xs rounded font-medium">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>UI Builder</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1 hover:bg-slate-700 text-xs rounded font-medium text-slate-400">
            <Database className="w-3.5 h-3.5" />
            <span>DB Builder</span>
          </button>
        </div>

        <button className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-xs text-white px-3 py-1.5 rounded font-medium transition">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Preview & Code</span>
        </button>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Components
          </h3>
        </aside>

        <main className="flex-1 bg-slate-900 p-8 flex items-center justify-center overflow-auto">
          <div className="w-[375px] h-[667px] bg-white rounded-[32px] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative text-slate-900 flex flex-col">
            <div className="p-4 bg-slate-100 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 m-2 rounded-xl">
              <p className="text-xs text-slate-400">캔버스 준비 완료</p>
            </div>
          </div>
        </main>

        <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Properties
          </h3>
        </aside>
      </div>
    </div>
  );
}
