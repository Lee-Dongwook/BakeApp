import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { ComponentNode } from "../store/useCanvasStore";
import { CanvasRenderer } from "./CanvasRenderer";

interface CanvasDroppableProps {
  rootNode: ComponentNode;
}

export const CanvasDroppable: React.FC<CanvasDroppableProps> = ({
  rootNode,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative flex h-[667px] w-[375px] flex-col overflow-hidden rounded-[32px] border-[8px] bg-white text-slate-900 shadow-2xl transition-colors ${
        isOver ? "ring-4 ring-amber-500/50" : "border-[var(--border-strong)]"
      }`}
    >
      <CanvasRenderer node={rootNode} />
    </div>
  );
};
