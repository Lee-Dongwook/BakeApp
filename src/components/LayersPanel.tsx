import React from "react";
import {
  useCanvasStore,
  flattenTree,
} from "../store/useCanvasStore";
import { usePageStore, selectActivePage } from "../store/usePageStore";
import {
  Layers,
  Box,
  Type,
  MousePointerClick,
  FormInput,
  List,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Image as ImageIcon,
  Tag,
  Minus,
  CheckSquare,
} from "lucide-react";

export const LayersPanel: React.FC = () => {
  const activePage = usePageStore(selectActivePage);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const moveNode = usePageStore((state) => state.moveNode);
  const duplicateNode = usePageStore((state) => state.duplicateNode);
  const deleteNode = usePageStore((state) => state.deleteNode);

  if (!activePage) return null;

  const flattened = flattenTree(activePage.rootNode);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "Container":
      case "View":
      case "Card":
      case "Form":
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case "Text":
        return <Type className="w-3.5 h-3.5 text-sky-400" />;
      case "Button":
        return <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />;
      case "TextInput":
      case "Select":
        return <FormInput className="w-3.5 h-3.5 text-purple-400" />;
      case "Checkbox":
        return <CheckSquare className="w-3.5 h-3.5 text-purple-400" />;
      case "Image":
        return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
      case "Badge":
        return <Tag className="w-3.5 h-3.5 text-indigo-400" />;
      case "Divider":
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
      case "DataList":
      case "Table":
        return <List className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="app-sidebar h-full w-full flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Layers className="brand h-4 w-4" />
          <h3 className="font-bold text-sm">트리 및 레이어</h3>
        </div>
        <span className="badge px-2 py-0.5 text-[10px]">
          {flattened.length}개 요소
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {flattened.map(({ node, depth }) => {
          const isSelected = selectedNodeId === node.id;
          const isRoot = node.id === activePage.rootNode.id;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              className={`group flex items-center justify-between py-1.5 pr-2 rounded-md text-xs cursor-pointer transition-all ${
                isSelected
                  ? "bg-amber-500/15 border border-amber-500/30 text-white font-semibold"
                  : "text-slate-300 hover:bg-[var(--surface-raised)] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {depth > 0 && (
                  <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                )}
                {getNodeIcon(node.type)}
                <span className="truncate">{node.name || node.type}</span>
              </div>

              {!isRoot && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(activePage.id, node.id, "up");
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="위로 이동"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveNode(activePage.id, node.id, "down");
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="아래로 이동"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newId = duplicateNode(activePage.id, node.id);
                      if (newId) setSelectedNodeId(newId);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="복제"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(activePage.id, node.id);
                      if (selectedNodeId === node.id) {
                        setSelectedNodeId(activePage.rootNode.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
