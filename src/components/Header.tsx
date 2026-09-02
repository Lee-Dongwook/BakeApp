import React, { useState } from "react";
import { useRuntimeStore, ViewportMode } from "../store/useRuntimeStore";
import { usePageStore } from "../store/usePageStore";
import { useProjectStore } from "../store/useProjectStore";
import { tokenStorage } from "../auth/tokenStorage";
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
  Smartphone,
  Tablet,
  Monitor,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
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
  const viewport = useRuntimeStore((state) => state.viewport);
  const setViewport = useRuntimeStore((state) => state.setViewport);
  const zoom = useRuntimeStore((state) => state.zoom);
  const setZoom = useRuntimeStore((state) => state.setZoom);
  const resetFormState = useRuntimeStore((state) => state.resetFormState);
  const addToast = useRuntimeStore((state) => state.addToast);

  const undo = usePageStore((state) => state.undo);
  const redo = usePageStore((state) => state.redo);
  const canUndo = usePageStore((state) => state.canUndo());
  const canRedo = usePageStore((state) => state.canRedo());

  const activeProject = useProjectStore((state) => state.activeProject);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadZip = async () => {
    if (!activeProject) return;
    setIsExporting(true);
    addToast("프로젝트 전체 소스코드 zip 생성 중…", "info");

    try {
      const token = tokenStorage.get();
      const response = await fetch(`/api/export/${activeProject.id}/zip`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("프로젝트 내보내기 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("프로젝트 zip 다운로드가 완료되었습니다!", "success");
    } catch (err: any) {
      addToast(err.message || "다운로드 오류가 발생했습니다.", "error");
    } finally {
      setIsExporting(false);
      setIsMoreMenuOpen(false);
    }
  };

  const viewports: { mode: ViewportMode; label: string; icon: React.ReactNode }[] = [
    { mode: "mobile", label: "Mobile (375px)", icon: <Smartphone className="h-3.5 w-3.5" /> },
    { mode: "mobile-lg", label: "Mobile Lg (430px)", icon: <Smartphone className="h-4 w-4" /> },
    { mode: "tablet", label: "Tablet (768px)", icon: <Tablet className="h-3.5 w-3.5" /> },
    { mode: "desktop", label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];

  return (
    <header className="app-header grid h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center border-b px-4 sm:px-6 gap-4">
      {/* Left: Project title & Back button */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBackToProjects}
          className="text-muted flex items-center gap-1 text-xs hover:text-white transition"
          title="프로젝트 목록으로 돌아가기"
        >
          <ChevronLeft className="h-4 w-4" /> 프로젝트
        </button>
        <div className="min-w-0 border-l border-[var(--border-subtle)] pl-3">
          <h1 className="truncate text-sm font-semibold">{projectName}</h1>
          <p className="text-muted text-[10px]">BakeApp Studio</p>
        </div>

        {/* Undo / Redo controls */}
        {mode === "EDIT" && (
          <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-3">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="icon-btn disabled:opacity-30 hover:text-white"
              title="실행 취소 (⌘Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="icon-btn disabled:opacity-30 hover:text-white"
              title="다시 실행 (⌘⇧Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Center: Mode switcher and Viewport/Zoom controls */}
      <div className="flex items-center justify-center gap-3">
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
            <Play className="h-3.5 w-3.5 text-amber-400" />
            <span>라이브 미리보기</span>
          </button>
        </div>

        {/* Viewport switcher */}
        <div className="hidden md:flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-0.5">
          {viewports.map((vp) => (
            <button
              key={vp.mode}
              type="button"
              onClick={() => setViewport(vp.mode)}
              title={vp.label}
              className={`p-1.5 rounded-md transition ${
                viewport === vp.mode
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {vp.icon}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 border border-[var(--border-subtle)] rounded-lg px-1 py-0.5 bg-[var(--surface-sunken)]">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1 hover:text-white"
            title="축소"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(1.5, zoom + 0.25))}
            className="p-1 hover:text-white"
            title="확대"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Right: Save, Tools, Code Preview */}
      <div className="flex items-center gap-2 justify-self-end">
        {isDirty && (
          <span className="hidden sm:inline-block text-xs font-semibold text-amber-300 animate-pulse">
            변경됨
          </span>
        )}
        {saveError && (
          <span className="max-w-36 truncate text-xs text-rose-400" title={saveError}>
            {saveError}
          </span>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="btn btn-success text-xs"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "저장 중…" : "저장"}
        </button>

        {/* More Tools Dropdown */}
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
            <div className="surface absolute right-0 top-11 z-30 w-52 p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  onOpenDbBuilder();
                  setIsMoreMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-white"
              >
                <Database className="h-3.5 w-3.5 text-amber-400" /> DB Builder (스키마)
              </button>

              <button
                type="button"
                onClick={() => void handleDownloadZip()}
                disabled={isExporting}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-white"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isExporting ? "압축 생성 중…" : "전체 프로젝트 Zip 내보내기"}</span>
              </button>

              {mode === "PREVIEW" && (
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setIsMoreMenuOpen(false);
                    addToast("폼 및 런타임 상태가 초기화되었습니다.", "info");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 폼 상태 초기화
                </button>
              )}

              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button
                type="button"
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-3.5 w-3.5" /> 로그아웃
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenCodePreview}
          className="btn btn-primary text-xs"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>미리보기 · 코드</span>
        </button>
      </div>
    </header>
  );
};
