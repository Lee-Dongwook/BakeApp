import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { ComponentNode, useEditorStore } from "../store/useEditorStore";
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
      className={`w-[375px] h-[667px] bg-white rounded-[32px] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative text-slate-900 flex flex-col transition-colors ${
        isOver ? "ring-4 ring-amber-500/50" : ""
      }`}
    >
      <CanvasRenderer node={rootNode} />
    </div>
  );
};
