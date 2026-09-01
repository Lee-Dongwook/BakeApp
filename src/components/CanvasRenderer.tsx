import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { ComponentNode, useEditorStore } from "../store/useEditorStore";

interface CanvasRendererProps {
  node: ComponentNode | string;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ node }) => {
  const { selectedNodeId, setSelectedNodeId } = useEditorStore();

  if (typeof node === "string") {
    return <span>{node}</span>;
  }
  const isContainer = node.type === "Container" || node.type === "View";
  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
    disabled: !isContainer,
  });

  const isSelected = selectedNodeId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };

  const selectionStyle = isSelected
    ? "ring-2 ring-amber-500 ring-offset-1 z-10"
    : "hover:ring-1 hover:ring-amber-300";

  const dropZoneStyle = isOver
    ? "bg-amber-500/10 border-amber-400 border-dashed"
    : "";

  switch (node.type) {
    case "Container":
    case "View":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`relative transition-all cursor-pointer min-h-10 ${selectionStyle} ${dropZoneStyle}`}
        >
          {node.children && node.children.length > 0 ? (
            node.children.map((child, idx) => (
              <CanvasRenderer
                key={typeof child === "string" ? idx : child.id}
                node={child}
              />
            ))
          ) : (
            <div className="text-[10px] text-slate-400 text-center py-2 border border-dashed border-slate-300 rounded">
              여기로 요소를 끌어다 놓으세요
            </div>
          )}
        </div>
      );

    case "Text":
      return (
        <span
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-block transition-all cursor-pointer ${selectionStyle}`}
        >
          {node.children?.map((child, idx) => (
            <CanvasRenderer
              key={typeof child === "string" ? idx : child.id}
              node={child}
            />
          ))}
        </span>
      );

    case "Button":
      return (
        <button
          type="button"
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`flex items-center justify-center transition-all cursor-pointer select-none ${selectionStyle}`}
        >
          {node.children?.map((child, idx) => (
            <CanvasRenderer
              key={typeof child === "string" ? idx : child.id}
              node={child}
            />
          ))}
        </button>
      );

    case "TextInput":
      return (
        <input
          onClick={handleClick}
          readOnly
          placeholder={node.props?.placeholder || "입력하세요"}
          style={node.style as React.CSSProperties}
          className={`transition-all cursor-pointer ${selectionStyle}`}
        />
      );

    default:
      return <div onClick={handleClick}>Unknown Component</div>;
  }
};
