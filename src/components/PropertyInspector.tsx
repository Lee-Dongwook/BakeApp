import React from "react";
import { useEditorStore, ComponentNode } from "../store/useEditorStore";
import { Trash2, Sliders, Type as TypeIcon } from "lucide-react";

const findNodeById = (
  node: ComponentNode,
  id: string,
): ComponentNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      if (typeof child !== "string") {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
  }
  return null;
};

export const PropertyInspector: React.FC = () => {
  const {
    rootNode,
    selectedNodeId,
    updateNodeStyle,
    updateNodeProps,
    updateNodeTextContent,
    deleteNode,
  } = useEditorStore();

  if (!selectedNodeId) {
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

  const selectedNode = findNodeById(rootNode, selectedNodeId);

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

  return (
    <aside className="w-72 border-l border-slate-800 bg-slate-950 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs bg-amber-500/10 text-amber-500 font-mono px-2 py-0.5 rounded">
              {selectedNode.type}
            </span>
            <h2 className="text-sm font-semibold text-slate-200 mt-1">
              {selectedNode.name}
            </h2>
          </div>
          {selectedNode.id !== "root-container" && (
            <button
              type="button"
              onClick={() => deleteNode(selectedNode.id)}
              className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
              title="노드 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

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
                updateNodeTextContent(selectedNode.id, e.target.value)
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {selectedNode.type === "TextInput" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">
              Placeholder (안내 문구)
            </label>
            <input
              type="text"
              value={selectedNode.props?.placeholder || ""}
              onChange={(e) =>
                updateNodeProps(selectedNode.id, {
                  placeholder: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            <span>Styles</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              배경색 (Background Color)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedNode.style?.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  updateNodeStyle(selectedNode.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="w-7 h-7 bg-transparent rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={selectedNode.style?.backgroundColor || ""}
                onChange={(e) =>
                  updateNodeStyle(selectedNode.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

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
                    updateNodeStyle(selectedNode.id, {
                      color: e.target.value,
                    })
                  }
                  className="w-7 h-7 bg-transparent rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={selectedNode.style?.color || ""}
                  onChange={(e) =>
                    updateNodeStyle(selectedNode.id, {
                      color: e.target.value,
                    })
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          )}

          {isTextType && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                폰트 크기 (Font Size)
              </label>
              <input
                type="number"
                value={selectedNode.style?.fontSize || 14}
                onChange={(e) =>
                  updateNodeStyle(selectedNode.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400">패딩 (Padding)</label>
            <input
              type="number"
              value={selectedNode.style?.padding || 0}
              onChange={(e) =>
                updateNodeStyle(selectedNode.id, {
                  padding: Number(e.target.value),
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              모서리 곡률 (Border Radius)
            </label>
            <input
              type="number"
              value={selectedNode.style?.borderRadius || 0}
              onChange={(e) =>
                updateNodeStyle(selectedNode.id, {
                  borderRadius: Number(e.target.value),
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <span className="text-[10px] text-slate-600 font-mono block truncate">
          ID: {selectedNode.id}
        </span>
      </div>
    </aside>
  );
};
