import React, { useState } from "react";
import { useRuntimeStore } from "../store/useRuntimeStore";
import {
  ChevronLeft,
  Code2,
  Database,
  Edit3,
  LogOut,
  MoreHorizontal,
  Play,
  RotateCcw,
  Save,
} from "lucide-react";

interface HeaderProps {
  onOpenDbBuilder: () => void;
  onOpenCodePreview: () => void;
  projectName: string;
  onBackToProjects: () => void;
  onSignOut: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  saveError: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDbBuilder,
  onOpenCodePreview,
  projectName,
  onBackToProjects,
  onSignOut,
  onSave,
  isSaving,
  isDirty,
  saveError,
}) => {
  const mode = useRuntimeStore((state) => state.mode);
  const setMode = useRuntimeStore((state) => state.setMode);
  const resetFormState = useRuntimeStore((state) => state.resetFormState);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <header className="app-header grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBackToProjects}
          className="text-muted flex items-center gap-1 text-xs hover:text-white"
          title="프로젝트 목록으로 돌아가기"
        >
          <ChevronLeft className="h-4 w-4" /> 프로젝트
        </button>
        <div className="min-w-0 border-l border-[var(--border-subtle)] pl-2">
          <h1 className="truncate text-sm font-semibold">{projectName}</h1>
          <p className="text-muted text-[11px]">BakeApp Studio</p>
        </div>
      </div>

      <div className="segmented">
        <button
          type="button"
          onClick={() => setMode("EDIT")}
          className={`segment flex items-center gap-1.5 ${
            mode === "EDIT" ? "is-selected" : ""
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>편집</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("PREVIEW")}
          className={`segment flex items-center gap-1.5 ${
            mode === "PREVIEW" ? "is-selected" : ""
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>라이브 미리보기</span>
        </button>
      </div>

      <div className="flex items-center gap-3 justify-self-end">
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-xs text-amber-300">변경됨</span>}
          {saveError && (
            <span className="max-w-40 truncate text-xs text-rose-400">
              {saveError}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-success"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "저장 중…" : "저장"}
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((isOpen) => !isOpen)}
            className="icon-btn border border-[var(--border-strong)]"
            aria-label="추가 도구"
            aria-expanded={isMoreMenuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {isMoreMenuOpen && (
            <div className="surface absolute right-0 top-11 z-20 w-44 p-1.5">
              <button
                type="button"
                onClick={() => {
                  onOpenDbBuilder();
                  setIsMoreMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-white"
              >
                <Database className="h-3.5 w-3.5" /> DB Builder
              </button>
              {mode === "PREVIEW" && (
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 상태 초기화
                </button>
              )}
              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button
                type="button"
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" /> 로그아웃
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenCodePreview}
          className="btn btn-primary"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>미리보기 · 코드</span>
        </button>
      </div>
    </header>
  );
};
