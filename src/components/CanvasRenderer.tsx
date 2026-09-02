import React, { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { type ComponentNode, useCanvasStore } from "../store/useCanvasStore";
import { usePageStore } from "../store/usePageStore";
import { useRuntimeStore } from "../store/useRuntimeStore";
import { useQueryStore } from "../store/useQueryStore";
import { useAuthStore } from "../store/useAuthStore";
import { useProjectStore } from "../store/useProjectStore";
import { useWorkflowExecutor } from "../hooks/useWorkflowExecutor";
import { apiClient } from "../api/client";
import { DynamicIcon } from "../utils/iconMap";
import { X, TrendingUp, TrendingDown, Layers } from "lucide-react";

interface CanvasRendererProps {
  node: ComponentNode | string;
}

interface DataListRendererProps {
  node: ComponentNode;
  mode: "EDIT" | "PREVIEW";
  className: string;
  onClick: (event: React.MouseEvent) => void;
}

const resolveDynamicValue = (
  val: string,
  context: {
    formState: Record<string, any>;
    pageState: Record<string, any>;
    appState: Record<string, any>;
    pageParams: Record<string, any>;
    queryResults: Record<string, any>;
    workflowResults: Record<string, any>;
  },
): string => {
  if (typeof val !== "string") return val;

  return val.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const keys = path.split(".");
    const [domain, firstKey, secondKey] = keys;

    if (domain === "form") return context.formState[firstKey] ?? "";
    if (domain === "pageState") return context.pageState[firstKey] ?? "";
    if (domain === "appState") return context.appState[firstKey] ?? "";
    if (domain === "params") return context.pageParams[firstKey] ?? "";

    if (domain === "queries") {
      const resultObj = context.queryResults[firstKey];
      if (!resultObj) return "";

      const target = keys
        .slice(2)
        .reduce<unknown>(
          (acc, k) =>
            acc && typeof acc === "object"
              ? (acc as Record<string, unknown>)[k]
              : undefined,
          resultObj,
        );

      if (target === undefined || target === null) return "";
      return typeof target === "object"
        ? JSON.stringify(target)
        : String(target);
    }

    if (domain === "steps" && firstKey && secondKey) {
      return context.workflowResults[firstKey]?.[secondKey] ?? "";
    }

    return "";
  });
};

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
  const limit = Number(node.props?.limit || 20);

  useEffect(() => {
    if (mode !== "PREVIEW" || !projectId || !accessToken || !tableName) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    apiClient
      .get<{ data: Record<string, unknown>[] }>(
        `/api/dynamic-data/${projectId}/${tableName}?limit=${limit}`,
        { auth: true },
      )
      .then((data) => setRecords(data.data || []))
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [accessToken, mode, projectId, tableName, limit]);

  if (mode === "EDIT") {
    return (
      <div
        onClick={onClick}
        style={node.style as React.CSSProperties}
        className={`cursor-pointer rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-xs text-slate-600 ${className}`}
      >
        <div className="flex items-center justify-between font-semibold text-slate-800">
          <span>📋 Data List</span>
          <span className="badge px-2 py-0.5 text-[10px]">
            {tableName ? tableName : "테이블 미지정"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {tableName
            ? `표시 컬럼: ${displayField || "(기본 ID)"}`
            : "우측 속성 패널에서 연결할 테이블을 선택하세요."}
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={node.style as React.CSSProperties}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-4 text-xs text-slate-400 space-x-2">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span>데이터를 불러오는 중…</span>
        </div>
      ) : error ? (
        <div className="rounded bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      ) : records.length === 0 ? (
        <p className="p-3 text-center text-xs text-slate-400">
          표시할 데이터가 없습니다.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {records.map((record, index) => (
            <li
              key={String(record.id ?? index)}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm transition hover:border-amber-300"
            >
              <span>{String(record[displayField] ?? record.id ?? "")}</span>
              {Boolean(record.id) && (
                <span className="font-mono text-[10px] text-slate-400">
                  #{String(record.id).slice(0, 6)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ node }) => {
  const {
    mode,
    formState,
    setFormField,
    pageState,
    setPageStateField,
    appState,
    activeModalId,
    closeModal,
    workflowResults,
  } = useRuntimeStore();

  const { selectedNodeId, setSelectedNodeId } = useCanvasStore();
  const { pageParams } = usePageStore();
  const { queryResults } = useQueryStore();
  const activeProjectId = useProjectStore((state) => state.activeProject?.id);

  const { executeWorkflow } = useWorkflowExecutor();

  const resolveText = (text: string) =>
    resolveDynamicValue(text, {
      formState,
      pageState,
      appState,
      pageParams,
      queryResults,
      workflowResults,
    });

  if (typeof node === "string") {
    return <span>{resolveText(node)}</span>;
  }

  const isContainer =
    node.type === "Container" ||
    node.type === "View" ||
    node.type === "Card" ||
    node.type === "Form" ||
    node.type === "Grid" ||
    node.type === "Row" ||
    node.type === "Column" ||
    node.type === "Modal" ||
    node.type === "Tabs";

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

    if (actions.length === 0) return;
    e.stopPropagation();

    const projectId = activeProjectId || "";

    await executeWorkflow({
      projectId,
      trigger: "ON_CLICK",
      actions,
      formState,
    });
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
                <div className="text-[11px] text-slate-400 text-center py-3 border border-dashed border-slate-300 rounded-lg">
                  여기로 요소를 끌어다 놓으세요
                </div>
              )}
        </div>
      );

    case "Row":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={
            {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              ...node.style,
            } as React.CSSProperties
          }
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
                <div className="text-[10px] text-slate-400 py-1 px-3 border border-dashed border-slate-300 rounded">
                  Row
                </div>
              )}
        </div>
      );

    case "Column":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={
            {
              display: "flex",
              flexDirection: "column",
              gap: 12,
              ...node.style,
            } as React.CSSProperties
          }
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
                <div className="text-[10px] text-slate-400 py-1 px-3 border border-dashed border-slate-300 rounded">
                  Column
                </div>
              )}
        </div>
      );

    case "Grid": {
      const cols = Number(node.props?.columns || 2);
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={
            {
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: 16,
              ...node.style,
            } as React.CSSProperties
          }
          className={`relative transition-all ${
            mode === "EDIT" ? "cursor-pointer min-h-12" : ""
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
                <div className="text-[11px] text-slate-400 text-center py-3 border border-dashed border-slate-300 rounded-lg col-span-full">
                  그리드 컨테이너 ({cols}열)
                </div>
              )}
        </div>
      );
    }

    case "Card":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={
            {
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              ...node.style,
            } as React.CSSProperties
          }
          className={`relative transition-all ${
            mode === "EDIT" ? "cursor-pointer min-h-12" : ""
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
                <div className="text-[11px] text-slate-400 text-center py-2 border border-dashed border-slate-200 rounded">
                  카드 컨테이너
                </div>
              )}
        </div>
      );

    case "Modal": {
      const modalId = node.props?.modalId || node.id;
      const isOpen = mode === "EDIT" || activeModalId === modalId;

      if (!isOpen) return null;

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={`p-4 rounded-xl border border-amber-500/40 bg-amber-50/10 shadow-lg relative ${selectionStyle} ${dropZoneStyle}`}
          style={node.style as React.CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
            <span className="badge px-1.5 py-0.5 text-[10px] font-bold">
              모달: {modalId}
            </span>
            {mode === "PREVIEW" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                }}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {node.children && node.children.length > 0
            ? node.children.map((child, idx) => (
                <CanvasRenderer
                  key={typeof child === "string" ? idx : child.id}
                  node={child}
                />
              ))
            : mode === "EDIT" && (
                <div className="text-center text-xs text-slate-400 py-3 border border-dashed border-slate-300 rounded">
                  모달 본문 콘텐츠를 배치하세요
                </div>
              )}
        </div>
      );
    }

    case "Tabs": {
      const rawTabs = node.props?.tabs || "탭 1, 탭 2, 탭 3";
      const tabs = Array.isArray(rawTabs)
        ? rawTabs
        : String(rawTabs)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
      const activeTab = pageState[`tab_${node.id}`] || tabs[0] || "";

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`relative flex flex-col gap-3 ${selectionStyle} ${dropZoneStyle}`}
        >
          <div className="flex items-center border-b border-slate-200 gap-1">
            {tabs.map((tabName: string) => (
              <button
                key={tabName}
                type="button"
                onClick={(e) => {
                  if (mode === "PREVIEW") {
                    e.stopPropagation();
                    setPageStateField(`tab_${node.id}`, tabName);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition ${
                  activeTab === tabName
                    ? "border-amber-500 text-amber-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
          <div className="p-2">
            {node.children && node.children.length > 0
              ? node.children.map((child, idx) => (
                  <CanvasRenderer
                    key={typeof child === "string" ? idx : child.id}
                    node={child}
                  />
                ))
              : mode === "EDIT" && (
                  <div className="text-center text-xs text-slate-400 py-2 border border-dashed border-slate-200 rounded">
                    탭 콘텐츠 영역
                  </div>
                )}
          </div>
        </div>
      );
    }

    case "Form":
      return (
        <form
          ref={setNodeRef}
          onSubmit={(e) => {
            e.preventDefault();
            void handleClick(e as any);
          }}
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`relative transition-all flex flex-col gap-3 ${
            mode === "EDIT" ? "cursor-pointer min-h-12" : ""
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
                <div className="text-[11px] text-slate-400 text-center py-2 border border-dashed border-slate-300 rounded">
                  양식(Form) 영역
                </div>
              )}
        </form>
      );

    case "Heading":
    case "Text": {
      const level = node.props?.level || "p";
      const tagClass =
        level === "h1"
          ? "text-2xl font-bold tracking-tight text-slate-900"
          : level === "h2"
            ? "text-xl font-bold text-slate-800"
            : level === "h3"
              ? "text-lg font-semibold text-slate-800"
              : "text-sm text-slate-700";

      return (
        <span
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-block transition-all ${tagClass} ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          {node.children?.map((child, idx) => (
            <CanvasRenderer
              key={typeof child === "string" ? idx : child.id}
              node={child}
            />
          ))}
        </span>
      );
    }

    case "StatCard": {
      const title = String(node.props?.title || "총 매출");
      const value = String(node.props?.value || "₩1,250,000");
      const trend = String(node.props?.trend || "+12.5%");
      const iconName = String(node.props?.icon || "TrendingUp");
      const isPositive = !trend.startsWith("-");

      return (
        <div
          onClick={handleClick}
          style={
            {
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              ...node.style,
            } as React.CSSProperties
          }
          className={`flex items-center justify-between transition-all ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">{title}</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1">{value}</h4>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
              {isPositive ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> {trend}
                </span>
              ) : (
                <span className="text-rose-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {trend}
                </span>
              )}
              <span className="text-slate-400 font-normal">vs 지난달</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <DynamicIcon name={iconName} className="w-5 h-5" />
          </div>
        </div>
      );
    }

    case "Chart": {
      const chartType = node.props?.chartType || "bar";
      const title = node.props?.title || "월별 실적";
      const rawData = node.props?.data || [40, 65, 30, 85, 95, 75];
      const data: number[] = Array.isArray(rawData) ? rawData : [40, 65, 30, 85, 95, 75];
      const max = Math.max(...data, 100);

      return (
        <div
          onClick={handleClick}
          style={
            {
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e2e8f0",
              ...node.style,
            } as React.CSSProperties
          }
          className={`flex flex-col gap-3 transition-all ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">{title}</span>
            <span className="badge px-1.5 py-0.5 text-[10px]">
              {chartType.toUpperCase()}
            </span>
          </div>

          {chartType === "bar" ? (
            <div className="flex items-end gap-2 h-24 pt-4 border-b border-slate-100">
              {data.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    style={{ height: `${(val / max) * 100}%` }}
                    className="w-full rounded-t bg-amber-500 hover:bg-amber-600 transition-all"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">
                    {idx + 1}월
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-slate-400 text-xs">
              📊 라인 / 영역 차트 뷰
            </div>
          )}
        </div>
      );
    }

    case "Icon": {
      const iconName = node.props?.name || "Sparkles";
      const iconSize = Number(node.props?.size || 20);
      const iconColor = node.style?.color || "#e9a832";

      return (
        <span
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-flex items-center justify-center transition-all ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          <DynamicIcon name={iconName} size={iconSize} color={iconColor} />
        </span>
      );
    }

    case "Avatar": {
      const src = node.props?.src || "";
      const text = node.props?.text || "DW";
      const size = Number(node.props?.size || 36);

      return (
        <div
          onClick={handleClick}
          style={
            {
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: "#e2e8f0",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...node.style,
            } as React.CSSProperties
          }
          className={`select-none font-bold text-xs text-slate-700 ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          {src ? (
            <img src={src} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{text}</span>
          )}
        </div>
      );
    }

    case "Button": {
      const btnVariant = node.props?.variant || "primary";
      const iconName = node.props?.icon || "";
      const variantClass =
        btnVariant === "secondary"
          ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
          : btnVariant === "danger"
            ? "bg-rose-600 hover:bg-rose-700 text-white"
            : btnVariant === "outline"
              ? "border border-amber-500 text-amber-600 hover:bg-amber-50"
              : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold";

      return (
        <button
          type="button"
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`flex items-center justify-center gap-1.5 transition-all px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer select-none active:scale-[0.98] ${variantClass} ${selectionStyle}`}
        >
          {iconName && <DynamicIcon name={iconName} className="w-3.5 h-3.5" />}
          {node.children && node.children.length > 0
            ? node.children.map((child, idx) => (
                <CanvasRenderer
                  key={typeof child === "string" ? idx : child.id}
                  node={child}
                />
              ))
            : "버튼"}
        </button>
      );
    }

    case "IconButton": {
      const iconName = node.props?.icon || "Search";
      return (
        <button
          type="button"
          onClick={handleClick}
          style={
            {
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...node.style,
            } as React.CSSProperties
          }
          className={`p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition active:scale-95 ${selectionStyle}`}
        >
          <DynamicIcon name={iconName} className="w-4 h-4" />
        </button>
      );
    }

    case "Link": {
      const url = node.props?.url || "#";
      return (
        <a
          href={url}
          onClick={(e) => {
            if (mode === "EDIT") e.preventDefault();
            handleClick(e);
          }}
          style={node.style as React.CSSProperties}
          className={`text-xs text-amber-600 hover:underline inline-flex items-center gap-1 font-medium ${selectionStyle}`}
        >
          {node.children && node.children.length > 0
            ? node.children.map((child, idx) => (
                <CanvasRenderer
                  key={typeof child === "string" ? idx : child.id}
                  node={child}
                />
              ))
            : "링크"}
        </a>
      );
    }

    case "TextInput": {
      const fieldName = node.props?.fieldName || node.id;
      const inputType = node.props?.inputType || "text";
      return (
        <input
          type={inputType}
          onClick={handleClick}
          readOnly={mode === "EDIT"}
          placeholder={node.props?.placeholder || "입력하세요"}
          value={formState[fieldName] || ""}
          onChange={(e) => setFormField(fieldName, e.target.value)}
          style={node.style as React.CSSProperties}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 transition-all ${
            mode === "EDIT"
              ? "cursor-pointer"
              : "focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          } ${selectionStyle}`}
        />
      );
    }

    case "TextArea": {
      const fieldName = node.props?.fieldName || node.id;
      const rows = Number(node.props?.rows || 3);
      return (
        <textarea
          rows={rows}
          onClick={handleClick}
          readOnly={mode === "EDIT"}
          placeholder={node.props?.placeholder || "상세 내용을 입력하세요"}
          value={formState[fieldName] || ""}
          onChange={(e) => setFormField(fieldName, e.target.value)}
          style={node.style as React.CSSProperties}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 resize-none transition-all ${
            mode === "EDIT"
              ? "cursor-pointer"
              : "focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          } ${selectionStyle}`}
        />
      );
    }

    case "Switch": {
      const fieldName = node.props?.fieldName || node.id;
      const label = node.props?.label || "스위치";
      const isChecked = Boolean(formState[fieldName]);

      return (
        <label
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-flex items-center gap-2 text-xs text-slate-800 select-none cursor-pointer ${selectionStyle}`}
        >
          <div
            onClick={() => {
              if (mode === "PREVIEW") setFormField(fieldName, !isChecked);
            }}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              isChecked ? "bg-amber-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isChecked ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span>{label}</span>
        </label>
      );
    }

    case "DatePicker": {
      const fieldName = node.props?.fieldName || node.id;
      return (
        <input
          type="date"
          onClick={handleClick}
          readOnly={mode === "EDIT"}
          value={formState[fieldName] || ""}
          onChange={(e) => setFormField(fieldName, e.target.value)}
          style={node.style as React.CSSProperties}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 ${selectionStyle}`}
        />
      );
    }

    case "Select": {
      const fieldName = node.props?.fieldName || node.id;
      const rawOptions = node.props?.options || "옵션 1, 옵션 2, 옵션 3";
      const options = Array.isArray(rawOptions)
        ? rawOptions
        : String(rawOptions)
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean);

      return (
        <select
          onClick={handleClick}
          disabled={mode === "EDIT"}
          value={formState[fieldName] || ""}
          onChange={(e) => setFormField(fieldName, e.target.value)}
          style={node.style as React.CSSProperties}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 transition-all ${
            mode === "EDIT"
              ? "cursor-pointer"
              : "focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          } ${selectionStyle}`}
        >
          <option value="">{node.props?.placeholder || "-- 선택 --"}</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case "Checkbox": {
      const fieldName = node.props?.fieldName || node.id;
      const label = node.props?.label || "체크박스";
      return (
        <label
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-flex items-center gap-2 text-xs text-slate-800 select-none cursor-pointer transition-all ${selectionStyle}`}
        >
          <input
            type="checkbox"
            disabled={mode === "EDIT"}
            checked={Boolean(formState[fieldName])}
            onChange={(e) => setFormField(fieldName, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          <span>{label}</span>
        </label>
      );
    }

    case "Image": {
      const src =
        node.props?.src ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500";
      const alt = node.props?.alt || "이미지";
      return (
        <img
          src={src}
          alt={alt}
          onClick={handleClick}
          style={
            {
              width: "100%",
              height: 160,
              objectFit: "cover",
              borderRadius: 8,
              ...node.style,
            } as React.CSSProperties
          }
          className={`transition-all ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        />
      );
    }

    case "Badge": {
      const text = node.props?.text || "Badge";
      const variant = node.props?.variant || "neutral";
      const badgeClass =
        variant === "success"
          ? "bg-emerald-100 text-emerald-800"
          : variant === "warning"
            ? "bg-amber-100 text-amber-800"
            : variant === "danger"
              ? "bg-rose-100 text-rose-800"
              : "bg-slate-100 text-slate-800";

      return (
        <span
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass} ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        >
          {text}
        </span>
      );
    }

    case "Divider":
      return (
        <hr
          onClick={handleClick}
          style={node.style as React.CSSProperties}
          className={`my-2 w-full border-slate-200 ${
            mode === "EDIT" ? "cursor-pointer" : ""
          } ${selectionStyle}`}
        />
      );

    case "Spacer": {
      const height = Number(node.props?.height || 16);
      return (
        <div
          onClick={handleClick}
          style={{ height, width: "100%", ...node.style }}
          className={`transition-all ${
            mode === "EDIT" ? "border border-dashed border-slate-200" : ""
          } ${selectionStyle}`}
        />
      );
    }

    case "DataList":
    case "Table":
      return (
        <DataListRenderer
          node={node}
          mode={mode}
          onClick={handleClick}
          className={`transition-all ${selectionStyle}`}
        />
      );

    default:
      return (
        <div
          onClick={handleClick}
          className={`p-2 text-xs text-slate-400 border border-slate-200 rounded ${selectionStyle}`}
        >
          {node.type}
        </div>
      );
  }
};
