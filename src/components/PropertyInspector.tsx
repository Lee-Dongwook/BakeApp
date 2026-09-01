import React, { useState } from "react";
import { findNodeById, useCanvasStore } from "../store/useCanvasStore";
import { selectActivePage, usePageStore } from "../store/usePageStore";
import {
  Plus,
  Sliders,
  Trash2,
  Type as TypeIcon,
  X,
  Zap,
} from "lucide-react";

type WorkflowActionType = "DB_INSERT" | "SHOW_ALERT";

interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  params: Record<string, unknown>;
  nextActionId?: string;
}

export const PropertyInspector: React.FC = () => {
  const activePage = usePageStore(selectActivePage);
  const updateNodeStyle = usePageStore((state) => state.updateNodeStyle);
  const updateNodeProps = usePageStore((state) => state.updateNodeProps);
  const updateNodeTextContent = usePageStore(
    (state) => state.updateNodeTextContent,
  );
  const deleteNode = usePageStore((state) => state.deleteNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore(
    (state) => state.setSelectedNodeId,
  );

  const [activeTab, setActiveTab] = useState<"STYLE" | "WORKFLOW">("STYLE");

  if (!activePage || !selectedNodeId) {
    return (
      <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Properties
        </h3>
        <div className="text-xs text-slate-500">
          캔버스에서 요소를 선택하세요.
        </div>
      </aside>
    );
  }

  const selectedNode = findNodeById(activePage.rootNode, selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Properties
        </h3>
        <div className="text-xs text-slate-500">노드를 찾을 수 없습니다.</div>
      </aside>
    );
  }

  const isTextType = selectedNode.type === "Text";
  const textValue =
    isTextType && typeof selectedNode.children?.[0] === "string"
      ? selectedNode.children[0]
      : "";
  const actions = (selectedNode.props?.onClickWorkflow || []) as WorkflowAction[];

  const saveActions = (updatedActions: WorkflowAction[]) => {
    const linkedActions = updatedActions.map((action, index) => ({
      ...action,
      nextActionId: updatedActions[index + 1]?.id,
    }));

    updateNodeProps(activePage.id, selectedNode.id, {
      onClickWorkflow: linkedActions,
    });
  };

  const handleAddAction = (actionType: WorkflowActionType) => {
    const newAction: WorkflowAction = {
      id: `act_${Date.now()}`,
      type: actionType,
      params:
        actionType === "DB_INSERT"
          ? { tableName: "users", data: { username: "{{ form.name }}" } }
          : actionType === "SHOW_ALERT"
            ? { message: "성공적으로 처리되었습니다!" }
            : { targetPage: "/dashboard" },
    };

    saveActions([...actions, newAction]);
  };

  const handleUpdateParam = (
    actionIndex: number,
    paramKey: string,
    value: unknown,
  ) => {
    const updatedActions = actions.map((action, index) =>
      index === actionIndex
        ? { ...action, params: { ...action.params, [paramKey]: value } }
        : action,
    );
    saveActions(updatedActions);
  };

  const handleRemoveAction = (index: number) => {
    saveActions(actions.filter((_, actionIndex) => actionIndex !== index));
  };

  return (
    <aside className="w-72 border-l border-slate-800 bg-slate-950 flex flex-col justify-between h-full">
      {/* Upper Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header (Node Title & Delete) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs bg-amber-500/10 text-amber-500 font-mono px-2 py-0.5 rounded">
              {selectedNode.type}
            </span>
            <h2 className="text-sm font-semibold text-slate-200 mt-1">
              {selectedNode.name}
            </h2>
          </div>
          {selectedNode.id !== activePage.rootNode.id && (
            <button
              type="button"
              onClick={() => {
                deleteNode(activePage.id, selectedNode.id);
                setSelectedNodeId(null);
              }}
              className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
              title="노드 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab("STYLE")}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activeTab === "STYLE"
                ? "border-amber-500 text-amber-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Styles</span>
          </button>
          <button
            onClick={() => setActiveTab("WORKFLOW")}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition ${
              activeTab === "WORKFLOW"
                ? "border-amber-500 text-amber-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Workflow</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {activeTab === "STYLE" ? (
            <>
              {/* Text Input Content */}
              {isTextType && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center space-x-1">
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span>텍스트 내용</span>
                  </label>
                  <input
                    type="text"
                    value={textValue}
                    onChange={(e) =>
                      updateNodeTextContent(
                        activePage.id,
                        selectedNode.id,
                        e.target.value,
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* TextInput Placeholder */}
              {selectedNode.type === "TextInput" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    Placeholder (안내 문구)
                  </label>
                  <input
                    type="text"
                    value={selectedNode.props?.placeholder || ""}
                    onChange={(e) =>
                      updateNodeProps(activePage.id, selectedNode.id, {
                        placeholder: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Styles Form */}
              <div className="space-y-4">
                <div className="flex items-center space-x-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Visual Controls</span>
                </div>

                {/* Background Color */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    배경색 (Background Color)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedNode.style?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        updateNodeStyle(activePage.id, selectedNode.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-7 h-7 bg-transparent rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={selectedNode.style?.backgroundColor || ""}
                      onChange={(e) =>
                        updateNodeStyle(activePage.id, selectedNode.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Text Color */}
                {isTextType && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      글자색 (Text Color)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={selectedNode.style?.color || "#000000"}
                        onChange={(e) =>
                          updateNodeStyle(activePage.id, selectedNode.id, {
                            color: e.target.value,
                          })
                        }
                        className="w-7 h-7 bg-transparent rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={selectedNode.style?.color || ""}
                        onChange={(e) =>
                          updateNodeStyle(activePage.id, selectedNode.id, {
                            color: e.target.value,
                          })
                        }
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Font Size */}
                {isTextType && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      폰트 크기 (Font Size)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.style?.fontSize || 14}
                      onChange={(e) =>
                        updateNodeStyle(activePage.id, selectedNode.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Padding */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    패딩 (Padding)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.style?.padding || 0}
                    onChange={(e) =>
                      updateNodeStyle(activePage.id, selectedNode.id, {
                        padding: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    모서리 곡률 (Border Radius)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.style?.borderRadius || 0}
                    onChange={(e) =>
                      updateNodeStyle(activePage.id, selectedNode.id, {
                        borderRadius: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Workflow Builder UI */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  On-Click Actions
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleAddAction("DB_INSERT")}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-medium transition"
                  >
                    <Plus className="w-3 h-3" /> DB 생성
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction("SHOW_ALERT")}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px] font-medium transition"
                  >
                    <Plus className="w-3 h-3" /> 알림
                  </button>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  클릭 시 실행할 워크플로우 액션을 추가하세요
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((act, idx) => (
                    <div
                      key={act.id}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 relative space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-semibold">
                          Step {idx + 1}: {act.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(idx)}
                          className="text-slate-500 hover:text-red-400 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Type Details */}
                      {act.type === "DB_INSERT" && (
                        <div className="space-y-2 pt-1">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-medium mb-1">
                              Target Table
                            </label>
                            <input
                              type="text"
                              value={String(act.params.tableName ?? "")}
                              onChange={(e) =>
                                handleUpdateParam(
                                  idx,
                                  "tableName",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-medium mb-1">
                              Data (JSON / Dynamic Binding)
                            </label>
                            <textarea
                              rows={2}
                              value={
                                act.params.data !== null &&
                                typeof act.params.data === "object"
                                  ? JSON.stringify(act.params.data)
                                  : String(act.params.data ?? "")
                              }
                              onChange={(e) => {
                                try {
                                  handleUpdateParam(
                                    idx,
                                    "data",
                                    JSON.parse(e.target.value),
                                  );
                                } catch {
                                  handleUpdateParam(
                                    idx,
                                    "data",
                                    e.target.value,
                                  );
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {act.type === "SHOW_ALERT" && (
                        <div className="pt-1">
                          <label className="block text-[10px] text-slate-400 font-medium mb-1">
                            Alert Message
                          </label>
                          <input
                            type="text"
                            value={String(act.params.message ?? "")}
                            onChange={(e) =>
                              handleUpdateParam(idx, "message", e.target.value)
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            placeholder="예: {{ steps.act_1.id }} 완료!"
                          />
                        </div>
                      )}

                      {idx < actions.length - 1 && (
                        <div className="text-center text-slate-600 font-bold text-xs pt-1">
                          ↓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer (Node ID) */}
      <div className="p-4 border-t border-slate-800">
        <span className="text-[10px] text-slate-600 font-mono block truncate">
          ID: {selectedNode.id}
        </span>
      </div>
    </aside>
  );
};
