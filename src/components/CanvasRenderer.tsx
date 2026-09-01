import React, { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { type ComponentNode, useCanvasStore } from "../store/useCanvasStore";
import { usePageStore } from "../store/usePageStore";
import { useRuntimeStore } from "../store/useRuntimeStore";
import { useQueryStore } from "../store/useQueryStore";
import { useAuthStore } from "../store/useAuthStore";
import { useProjectStore } from "../store/useProjectStore";

interface CanvasRendererProps {
  node: ComponentNode | string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface DataListRendererProps {
  node: ComponentNode;
  mode: "EDIT" | "PREVIEW";
  className: string;
  onClick: (event: React.MouseEvent) => void;
}

const DataListRenderer: React.FC<DataListRendererProps> = ({
  node,
  mode,
  className,
  onClick,
}) => {
  const projectId = useProjectStore((state) => state.activeProject?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tableName = String(node.props?.tableName || "").trim();
  const displayField = String(node.props?.displayField || "").trim();

  useEffect(() => {
    if (mode !== "PREVIEW" || !projectId || !accessToken || !tableName) return;

    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/dynamic-data/${projectId}/${tableName}?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");
        return response.json() as Promise<{ data: Record<string, unknown>[] }>;
      })
      .then((data) => {
        if (isCurrent) setRecords(data.data);
      })
      .catch((fetchError) => {
        if (isCurrent) {
          setError(
            fetchError instanceof Error ? fetchError.message : "데이터를 불러오지 못했습니다.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [accessToken, mode, projectId, tableName]);

  if (mode === "EDIT") {
    return (
      <div
        onClick={onClick}
        style={node.style as React.CSSProperties}
        className={`cursor-pointer text-xs text-slate-500 ${className}`}
      >
        <p className="font-semibold text-slate-700">Data List</p>
        <p className="mt-1">{tableName ? `${tableName} 테이블` : "속성 패널에서 테이블을 선택하세요."}</p>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={node.style as React.CSSProperties} className={className}>
      {isLoading ? (
        <p className="text-sm text-slate-500">데이터를 불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">표시할 데이터가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((record, index) => (
            <li key={String(record.id ?? index)} className="rounded bg-white px-3 py-2 text-sm shadow-sm">
              {String(record[displayField] ?? record.id ?? "")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ node }) => {
  const { mode, formState, setFormField, workflowResults, setWorkflowResult } =
    useRuntimeStore();

  const { selectedNodeId, setSelectedNodeId } = useCanvasStore();

  const { setActivePage, pageParams } = usePageStore();
  const { queryResults } = useQueryStore();

  const resolveDynamicValue = (val: string): string => {
    if (typeof val !== "string") return val;

    return val.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
      const keys = path.split(".");
      if (keys[0] === "form") return formState[keys[1]] ?? "";
      if (keys[0] === "params") return pageParams[keys[1]] ?? "";

      if (keys[0] === "queries") {
        const queryName = keys[1];
        const resultObj = queryResults[queryName];
        if (!resultObj) return "";

        const subPaths = keys.slice(2);

        const target = subPaths.reduce<unknown>((acc, key) => {
          if (acc !== null && typeof acc === "object") {
            return (acc as Record<string, unknown>)[key];
          }
        }, resultObj);

        if (target === undefined || target === null) return "";

        return typeof target === "object"
          ? JSON.stringify(target)
          : String(target);
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
  const actions = node.props?.onClickWorkflow || [];

  const handleClick = async (e: React.MouseEvent) => {
    if (mode === "EDIT") {
      e.stopPropagation();
      setSelectedNodeId(node.id);
      return;
    }

    // 액션이 없는 자식은 이벤트를 부모 버튼/컨테이너로 전달한다.
    if (actions.length === 0) return;

    e.stopPropagation();
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
      if (act.type === "RUN_QUERY") {
        const queryId = act.params?.queryId;
        if (queryId) {
          try {
            await useQueryStore.getState().runQuery(queryId);
          } catch (error) {
            console.error("Query Workflow Error", error);
          }
        }
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

          const res = await fetch(`${API_BASE_URL}/api/workflow/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionType: "DB_INSERT",
              tableName: act.params?.tableName,
              data: parsedData,
            }),
          });

          if (!res.ok) {
            throw new Error(`워크플로우 실행 실패 (${res.status})`);
          }

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

    case "DataList":
      return (
        <DataListRenderer
          node={node}
          mode={mode}
          onClick={handleClick}
          className={`transition-all ${selectionStyle}`}
        />
      );

    default:
      return <div onClick={handleClick}>Unknown Component</div>;
  }
};
