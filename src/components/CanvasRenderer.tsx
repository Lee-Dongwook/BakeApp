import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { type ComponentNode, useCanvasStore } from "../store/useCanvasStore";
import { usePageStore } from "../store/usePageStore";
import { useRuntimeStore } from "../store/useRuntimeStore";

interface CanvasRendererProps {
  node: ComponentNode | string;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ node }) => {
  const { mode, formState, setFormField, workflowResults, setWorkflowResult } =
    useRuntimeStore();

  const { selectedNodeId, setSelectedNodeId } = useCanvasStore();

  const { setActivePage, pageParams } = usePageStore();

  const resolveDynamicValue = (val: string): string => {
    if (typeof val !== "string") return val;

    return val.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
      const keys = path.split(".");
      if (keys[0] === "form") {
        return formState[keys[1]] ?? "";
      }

      if (keys[0] === "params") {
        return pageParams[keys[1]] ?? "";
      }

      if (keys[0] === "steps" && keys[1] && keys[2]) {
        return workflowResults[keys[1]]?.[keys[2]] ?? "";
      }

      return "";
    });
  };

  if (typeof node === "string") {
    return <span>{resolveDynamicValue(node)}</span>;
  }

  const isContainer = node.type === "Container" || node.type === "View";
  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
    disabled: mode === "PREVIEW" || !isContainer,
  });

  const isSelected = mode === "EDIT" && selectedNodeId === node.id;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === "EDIT") {
      setSelectedNodeId(node.id);
      return;
    }

    const actions = node.props?.onClickWorkflow || [];
    for (const act of actions) {
      if (act.type === "NAVIGATE_TO") {
        const targetPageId = act.params?.targetPageId;
        const rawParams = act.params?.params || {};

        const parsedParams: Record<string, any> = {};
        Object.keys(rawParams).forEach((key) => {
          parsedParams[key] = resolveDynamicValue(rawParams[key]);
        });
        console.log(
          `[Router] Navigating to page ${targetPageId} with params:`,
          parsedParams,
        );
        setActivePage(targetPageId, parsedParams);
      }
      if (act.type === "SHOW_ALERT") {
        const msg = resolveDynamicValue(
          act.params?.message || "처리되었습니다.",
        );
        alert(msg);
      } else if (act.type === "DB_INSERT") {
        try {
          const parsedData = JSON.parse(
            resolveDynamicValue(JSON.stringify(act.params?.data || {})),
          );

          console.log(
            `[Workflow Executing] DB Insert -> Table: ${act.params?.tableName}`,
            parsedData,
          );

          const res = await fetch(
            "http://localhost:3000/api/workflow/execute",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                actionType: "DB_INSERT",
                tableName: act.params?.tableName,
                data: parsedData,
              }),
            },
          );

          const resultData = await res.json();
          setWorkflowResult(act.id, resultData);
        } catch (error) {
          console.error("Workflow Execution Error", error);
        }
      }
    }
  };

  const selectionStyle = isSelected
    ? "ring-2 ring-amber-500 ring-offset-1 z-10"
    : mode === "EDIT"
      ? "hover:ring-1 hover:ring-amber-300"
      : "";

  const dropZoneStyle =
    mode === "EDIT" && isOver
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
          className={`relative transition-all ${
            mode === "EDIT" ? "cursor-pointer min-h-10" : ""
          } ${selectionStyle} ${dropZoneStyle}`}
        >
          {node.children && node.children.length > 0
            ? node.children.map((child, idx) => (
                <CanvasRenderer
                  key={typeof child === "string" ? idx : child.id}
                  node={child}
                />
              ))
            : mode === "EDIT" && (
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
          className={`flex items-center justify-center transition-all cursor-pointer select-none hover:opacity-90 active:scale-95 ${selectionStyle}`}
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
      const fieldName = node.props?.fieldName || node.id;
      return (
        <input
          onClick={handleClick}
          readOnly={mode === "EDIT"}
          placeholder={node.props?.placeholder || "입력하세요"}
          value={formState[fieldName] || ""}
          onChange={(e) => setFormField(fieldName, e.target.value)}
          style={node.style as React.CSSProperties}
          className={`transition-all ${
            mode === "EDIT"
              ? "cursor-pointer"
              : "focus:outline-none focus:ring-2 focus:ring-amber-500"
          } ${selectionStyle}`}
        />
      );

    default:
      return <div onClick={handleClick}>Unknown Component</div>;
  }
};
