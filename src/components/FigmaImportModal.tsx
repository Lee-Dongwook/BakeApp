import React, { useState } from "react";
import { Link, LoaderCircle, Palette, X } from "lucide-react";
import { apiClient } from "../api/client";
import type { ComponentNode } from "../store/useCanvasStore";

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (node: ComponentNode) => void;
}

export const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isImporting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const url = figmaUrl.trim();
    if (!url) {
      setError("가져올 Figma 링크를 입력해 주세요.");
      return;
    }

    setIsImporting(true);
    setError(null);
    try {
      const response = await apiClient.post<{ success: boolean; data: ComponentNode }>(
        "/api/figma/import",
        { figmaUrl: url },
        { auth: true },
      );
      onImported(response.data);
      setFigmaUrl("");
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Figma 디자인을 가져오지 못했습니다.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={handleClose}
    >
      <section
        className="surface w-full max-w-lg p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="figma-import-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-400">
              <Palette className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Figma Import</span>
            </div>
            <h2 id="figma-import-title" className="text-lg font-semibold text-white">
              Figma 디자인 가져오기
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              Frame 링크를 붙여 넣으면 새 페이지로 가져옵니다. 원래 페이지는 변경되지 않습니다.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            disabled={isImporting}
            aria-label="Figma 가져오기 창 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Figma 파일 또는 Frame 링크
            <div className="relative mt-1.5">
              <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                value={figmaUrl}
                onChange={(event) => setFigmaUrl(event.target.value)}
                placeholder="https://www.figma.com/design/..."
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400"
                disabled={isImporting}
                autoFocus
              />
            </div>
          </label>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn text-xs" onClick={handleClose} disabled={isImporting}>
              취소
            </button>
            <button type="submit" className="btn btn-primary text-xs" disabled={isImporting}>
              {isImporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Palette className="h-3.5 w-3.5" />}
              {isImporting ? "가져오는 중…" : "새 페이지로 가져오기"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
