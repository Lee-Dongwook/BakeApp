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
    <aside className="app-inspector flex h-full w-72 flex-col justify-between border-l">
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
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
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
      <div className="border-t p-4">
        <span className="text-muted block truncate font-mono text-[10px]">
          ID: {selectedNode.id}
        </span>
      </div>
    </aside>
  );
};

function EmptyInspector({ message }: { message: string }) {
  return (
    <aside className="app-inspector w-72 border-l p-4">
      <h3 className="eyebrow mb-3">Properties</h3>
      <div className="text-muted text-xs">{message}</div>
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
    <div className="flex items-center justify-between border-b p-4">
      <div>
        <span className="badge px-2 py-0.5 text-xs">{nodeType}</span>
        <h2 className="text-secondary mt-1 text-sm font-semibold">
          {nodeName}
        </h2>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="icon-btn hover:bg-red-500/20 hover:text-red-400"
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
    `inspector-tab flex flex-1 items-center justify-center space-x-1.5 py-2 text-xs font-semibold ${activeTab === tab ? "is-active" : ""}`;
  return (
    <div className="flex border-b bg-[var(--surface-inset)]">
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
