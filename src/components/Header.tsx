import React from "react";
import { useRuntimeStore } from "../store/useRuntimeStore";
import {
  ChevronLeft,
  Code2,
  Database,
  Edit3,
  LogOut,
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

  return (
    <header className="app-header flex h-16 shrink-0 items-center justify-between border-b px-6">
      {/* 로고 영역 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToProjects}
          className="text-muted flex items-center gap-1 text-xs hover:text-white"
          title="프로젝트 목록으로 돌아가기"
        >
          <ChevronLeft className="h-4 w-4" /> 프로젝트
        </button>
        <span className="text-xl">🍞</span>
        <div>
          <h1 className="brand text-sm">BakeApp Studio</h1>
          <p className="text-muted max-w-40 truncate text-xs">{projectName}</p>
        </div>
      </div>

      {/* 중앙: Edit / Live Preview 모드 스위처 */}
      <div className="segmented">
        <button
          type="button"
          onClick={() => setMode("EDIT")}
          className={`segment flex items-center gap-1.5 ${
            mode === "EDIT" ? "is-active" : ""
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit Mode</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("PREVIEW")}
          className={`segment flex items-center gap-1.5 ${
            mode === "PREVIEW" ? "is-active" : ""
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Live Preview</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="icon-btn"
          title="로그아웃"
          aria-label="로그아웃"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* 우측: DB Builder & Code Preview 액션 버튼 */}
      <div className="flex items-center gap-3">
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
        {mode === "PREVIEW" && (
          <button
            type="button"
            onClick={resetFormState}
            className="btn btn-secondary"
            title="입력 폼 상태 초기화"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset State</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenDbBuilder}
          className="btn btn-secondary text-amber-300"
        >
          <Database className="h-3.5 w-3.5" />
          <span>DB Builder</span>
        </button>

        <button
          type="button"
          onClick={onOpenCodePreview}
          className="btn btn-primary"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Preview &amp; Code</span>
        </button>
      </div>
    </header>
  );
};
