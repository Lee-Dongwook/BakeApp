import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  findNodeById,
  type ComponentNode,
  useCanvasStore,
} from "../store/useCanvasStore";
import { usePageStore, selectActivePage } from "../store/usePageStore";
import { useRuntimeStore } from "../store/useRuntimeStore";
import { CanvasRenderer } from "./CanvasRenderer";
import { ArrowUp, ArrowDown, Copy, Trash2 } from "lucide-react";

interface CanvasDroppableProps {
  rootNode: ComponentNode;
}

export const CanvasDroppable: React.FC<CanvasDroppableProps> = ({
  rootNode,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });
  const viewport = useRuntimeStore((state) => state.viewport);
  const zoom = useRuntimeStore((state) => state.zoom);
  const mode = useRuntimeStore((state) => state.mode);
  const activePage = usePageStore(selectActivePage);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const moveNode = usePageStore((state) => state.moveNode);
  const duplicateNode = usePageStore((state) => state.duplicateNode);
  const deleteNode = usePageStore((state) => state.deleteNode);

  const getViewportDimensions = () => {
    switch (viewport) {
      case "mobile":
        return "w-[375px] min-h-[667px] max-h-[85vh] rounded-[36px] border-[10px]";
      case "mobile-lg":
        return "w-[430px] min-h-[800px] max-h-[88vh] rounded-[40px] border-[10px]";
      case "tablet":
        return "w-[768px] min-h-[800px] max-h-[90vh] rounded-[24px] border-[8px]";
      case "desktop":
        return "w-full max-w-[1060px] min-h-[680px] rounded-[16px] border-[4px]";
    }
  };

  const selectedNode =
    activePage && selectedNodeId
      ? findNodeById(activePage.rootNode, selectedNodeId)
      : null;
  const isRootSelected = selectedNode?.id === activePage?.rootNode.id;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Quick Action Floating Bar for Selected Node in EDIT mode */}
      {mode === "EDIT" && selectedNode && !isRootSelected && (
        <div className="absolute -top-12 z-20 flex items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-2 py-1 shadow-xl animate-in fade-in zoom-in duration-150">
          <span className="badge px-1.5 py-0.5 text-[10px] font-mono mr-1">
            {selectedNode.type}: {selectedNode.name}
          </span>
          <button
            type="button"
            onClick={() => {
              if (activePage) moveNode(activePage.id, selectedNode.id, "up");
            }}
            className="icon-btn hover:text-white"
            title="위로 이동"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activePage) moveNode(activePage.id, selectedNode.id, "down");
            }}
            className="icon-btn hover:text-white"
            title="아래로 이동"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activePage) {
                const newId = duplicateNode(activePage.id, selectedNode.id);
                if (newId) setSelectedNodeId(newId);
              }
            }}
            className="icon-btn hover:text-white"
            title="복제 (⌘D)"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-[var(--border-subtle)] mx-0.5" />
          <button
            type="button"
            onClick={() => {
              if (activePage) {
                deleteNode(activePage.id, selectedNode.id);
                setSelectedNodeId(activePage.rootNode.id);
              }
            }}
            className="icon-btn hover:bg-rose-500/20 hover:text-rose-400"
            title="삭제 (Del)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Frame Container */}
      <div
        ref={setNodeRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center top",
          transition: "width 250ms ease, transform 150ms ease",
        }}
        className={`relative flex flex-col overflow-y-auto bg-white text-slate-900 shadow-2xl ${getViewportDimensions()} ${
          isOver
            ? "ring-4 ring-amber-500/50 border-amber-500"
            : "border-[var(--border-strong)]"
        }`}
      >
        {/* Device Top Bar simulation */}
        <div className="sticky top-0 z-10 flex h-6 w-full shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 text-[10px] font-mono text-slate-400 backdrop-blur-sm select-none">
          <span>{viewport.toUpperCase()}</span>
          <span className="font-semibold text-slate-600">
            {activePage?.name || "Page"}
          </span>
          <span>9:41</span>
        </div>

        {/* Dynamic AST Tree Renderer */}
        <div className="flex-1 flex flex-col">
          <CanvasRenderer node={rootNode} />
        </div>
      </div>
    </div>
  );
};
