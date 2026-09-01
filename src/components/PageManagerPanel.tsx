import React, { act, useState } from "react";
import { usePageStore } from "../store/usePageStore";
import { FileText, Plus, Trash2, Globe } from "lucide-react";

export const PageManagerPanel: React.FC = () => {
  const { pages, activePageId, setActivePage, addPage, deletePage } =
    usePageStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPagePath, setNewPagePath] = useState("");

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPageName.trim() || !newPagePath.trim()) return;

    addPage(newPageName.trim(), newPagePath.trim());
    setNewPageName("");
    setNewPagePath("");
    setIsAdding(false);
  };

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col h-full text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm">Pages Manager</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          title="새 페이지 추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreatePage}
          className="p-3 border-b border-slate-800 bg-slate-950/50 space-y-2"
        >
          <input
            type="text"
            placeholder="페이지 이름 (예: UserDetail)"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            placeholder="라우트 경로 (예: /users/:id)"
            value={newPagePath}
            onChange={(e) => setNewPagePath(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-2.4 py-1 text-[11px] bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400"
            >
              생성
            </button>
          </div>
        </form>
      )}

      {/* Page List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <div
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer group transition ${
                isActive
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold"
                  : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <div className="truncate">
                  <div className="text-xs">{page.name}</div>
                  <div className="text-2.5 text-slate-500 font-mono">
                    {page.path}
                  </div>
                </div>

                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded transition"
                    title="페이지 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
