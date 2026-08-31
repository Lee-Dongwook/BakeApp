import React from "react";
import { ComponentNode, useEditorStore } from "../store/useEditorStore";

interface CanvasRendererProps {
  node: ComponentNode | string;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ node }) => {
  const { selectedNodeId, setSelectedNodeId } = useEditorStore();

  if (typeof node === "string") {
    return <span>{node}</span>;
  }

  const isSelected = selectedNodeId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };

  const selectionStyle = isSelected
    ? "ring-2 ring-amber-500 ring-offset-1 z-10"
    : "hover:ring-1 hover:ring-amber-300";

  switch (node.type) {
    case "Container":
    case "View":
      return (
        <div
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`relative transition-all cursor-pointer ${selectionStyle}`}
        >
          {node.children?.map((child, idx) => (
            <CanvasRenderer
              key={typeof child === "string" ? idx : child.id}
              node={child}
            />
          ))}
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
          className={`flex items-center justify-center transition-all cursor-pointer ${selectionStyle}`}
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
