import React, { useState } from "react";
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
    <div className="app-sidebar flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Globe className="brand h-4 w-4" />
          <h3 className="font-bold text-sm">Pages Manager</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="icon-btn"
          title="새 페이지 추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreatePage}
          className="space-y-2 border-b bg-[var(--surface-inset)] p-3"
        >
          <input
            type="text"
            placeholder="페이지 이름 (예: UserDetail)"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            className="control py-1 text-xs"
          />
          <input
            type="text"
            placeholder="라우트 경로 (예: /users/:id)"
            value={newPagePath}
            onChange={(e) => setNewPagePath(e.target.value)}
            className="control py-1 text-xs"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-muted px-2 py-1 text-[11px] hover:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary px-2 py-1 text-[11px]"
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
              className={`list-item group flex cursor-pointer items-center justify-between px-3 py-2 text-xs ${
                isActive ? "is-active font-semibold" : ""
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <div className="truncate">
                  <div className="text-xs">{page.name}</div>
                  <div className="text-muted font-mono text-[10px]">
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
                    className="icon-btn opacity-0 group-hover:opacity-100 hover:text-red-400"
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
