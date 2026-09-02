import { useEffect, useState } from "react";
import { Sliders, Trash2, Zap } from "lucide-react";
import { apiClient } from "../api/client";
import type { TableMeta } from "../api/schema";
import { findNodeById, useCanvasStore } from "../store/useCanvasStore";
import { selectActivePage, usePageStore } from "../store/usePageStore";
import { useProjectStore } from "../store/useProjectStore";
import { StyleEditor } from "./property-inspector/StyleEditor";
import type { InspectorTab, WorkflowAction } from "./property-inspector/types";
import { WorkflowEditor } from "./property-inspector/WorkflowEditor";

export const PropertyInspector = () => {
  const activePage = usePageStore(selectActivePage);
  const updateNodeStyle = usePageStore((state) => state.updateNodeStyle);
  const updateNodeProps = usePageStore((state) => state.updateNodeProps);
  const updateNodeTextContent = usePageStore(
    (state) => state.updateNodeTextContent,
  );
  const deleteNode = usePageStore((state) => state.deleteNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const projectId = useProjectStore((state) => state.activeProject?.id);
  const [activeTab, setActiveTab] = useState<InspectorTab>("STYLE");
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);

  useEffect(() => {
    const fetchSchema = async () => {
      if (!projectId) {
        setTables([]);
        return;
      }

      try {
        setLoadingSchema(true);
        setTables(
          await apiClient.get<TableMeta[]>(
            `/api/dynamic-schema/tables/${projectId}`,
            { auth: true },
          ),
        );
      } catch (error) {
        console.error("Schema fetch failed:", error);
      } finally {
        setLoadingSchema(false);
      }
    };

    void fetchSchema();
  }, [projectId]);

  if (!activePage || !selectedNodeId)
    return <EmptyInspector message="캔버스에서 요소를 선택하세요." />;

  const selectedNode = findNodeById(activePage.rootNode, selectedNodeId);
  if (!selectedNode)
    return <EmptyInspector message="노드를 찾을 수 없습니다." />;

  const actions = (selectedNode.props?.onClickWorkflow ||
    []) as WorkflowAction[];
  const saveActions = (updatedActions: WorkflowAction[]) => {
    const linkedActions = updatedActions.map((action, index) => ({
      ...action,
      nextActionId: updatedActions[index + 1]?.id,
    }));
    updateNodeProps(activePage.id, selectedNode.id, {
      onClickWorkflow: linkedActions,
    });
  };

  return (
    <aside className="w-72 border-l border-slate-800 bg-slate-950 flex flex-col justify-between h-full">
      <div className="flex flex-col flex-1 overflow-hidden">
        <InspectorHeader
          nodeType={selectedNode.type}
          nodeName={selectedNode.name}
          canDelete={selectedNode.id !== activePage.rootNode.id}
          onDelete={() => {
            deleteNode(activePage.id, selectedNode.id);
            setSelectedNodeId(null);
          }}
        />
        <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {activeTab === "STYLE" ? (
            <StyleEditor
              page={activePage}
              node={selectedNode}
              tables={tables}
              loadingSchema={loadingSchema}
              updateNodeStyle={updateNodeStyle}
              updateNodeProps={updateNodeProps}
              updateNodeTextContent={updateNodeTextContent}
            />
          ) : (
            <WorkflowEditor actions={actions} onSave={saveActions} />
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-800">
        <span className="text-[10px] text-slate-600 font-mono block truncate">
          ID: {selectedNode.id}
        </span>
      </div>
    </aside>
  );
};

function EmptyInspector({ message }: { message: string }) {
  return (
    <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Properties
      </h3>
      <div className="text-xs text-slate-500">{message}</div>
    </aside>
  );
}

function InspectorHeader({
  nodeType,
  nodeName,
  canDelete,
  onDelete,
}: {
  nodeType: string;
  nodeName: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
      <div>
        <span className="text-xs bg-amber-500/10 text-amber-500 font-mono px-2 py-0.5 rounded">
          {nodeType}
        </span>
        <h2 className="text-sm font-semibold text-slate-200 mt-1">
          {nodeName}
        </h2>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
          title="노드 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function TabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: InspectorTab;
  onChange: (tab: InspectorTab) => void;
}) {
  const buttonClassName = (tab: InspectorTab) =>
    `flex-1 py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition ${activeTab === tab ? "border-amber-500 text-amber-400 bg-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"}`;
  return (
    <div className="flex border-b border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => onChange("STYLE")}
        className={buttonClassName("STYLE")}
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>Styles</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("WORKFLOW")}
        className={buttonClassName("WORKFLOW")}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Workflow</span>
      </button>
    </div>
  );
}
