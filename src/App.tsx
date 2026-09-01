import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { LayoutGrid, Database, Play } from "lucide-react";
import { ComponentNode, useEditorStore } from "./store/useEditorStore";
import { CanvasDroppable } from "./components/CanvasDroppable";
import { ComponentPalette } from "./components/ComponentPalette";
import { PropertyInspector } from "./components/PropertyInspector";
import { CodePreviewModal } from "./components/CodePreviewModal";

export default function App() {
  const { rootNode, addNode } = useEditorStore();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const type = active.data.current?.type as string;
      const label = active.data.current?.label as string;

      if (!type) return;

      const newId = `node-${Date.now()}`;
      let newNode: ComponentNode;

      switch (type) {
        case "View":
          newNode = {
            id: newId,
            type: "View",
            name: `${label} ${newId.slice(-4)}`,
            style: {
              padding: 16,
              backgroundColor: "#f1f5f9",
              borderRadius: 8,
              gap: 8,
            },
            children: [],
          };
          break;

        case "Text":
          newNode = {
            id: newId,
            type: "Text",
            name: `${label} ${newId.slice(-4)}`,
            style: {
              fontSize: 14,
              color: "#334155",
            },
            children: ["새 텍스트 항목"],
          };
          break;

        case "Button":
          newNode = {
            id: newId,
            type: "Button",
            name: `${label} ${newId.slice(-4)}`,
            style: {
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 16,
              paddingRight: 16,
              backgroundColor: "#3b82f6",
              borderRadius: 6,
            },
            children: [
              {
                id: `node-btn-text-${Date.now()}`,
                type: "Text",
                name: "버튼 텍스트",
                style: { color: "#ffffff", fontWeight: "bold" },
                children: ["버튼"],
              },
            ],
          };
          break;

        case "TextInput":
          newNode = {
            id: newId,
            type: "TextInput",
            name: `${label} ${newId.slice(-4)}`,
            props: { placeholder: "내용을 입력하세요" },
            style: {
              padding: 8,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 6,
              backgroundColor: "#ffffff",
              fontSize: 14,
            },
          };
          break;

        default:
          return;
      }

      const targetParentId = (over.id as string) || rootNode.id;
      addNode(targetParentId, newNode);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen w-screen flex-col bg-slate-900 text-white">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-amber-500">🍞 BakeApp</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              v1.0 Editor
            </span>
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-lg space-x-1">
            <button
              type="button"
              className="flex items-center space-x-1 px-3 py-1 bg-slate-700 text-xs rounded font-medium"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>UI Builder</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-1 px-3 py-1 hover:bg-slate-700 text-xs rounded font-medium text-slate-400"
            >
              <Database className="w-3.5 h-3.5" />
              <span>DB Builder</span>
            </button>
          </div>

          <button
            type="button"
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-xs text-white px-3 py-1.5 rounded font-medium transition"
            onClick={() => setIsCodeModalOpen(true)}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Preview & Code</span>
          </button>
        </header>

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          <ComponentPalette />

          <main className="flex-1 bg-slate-900 p-8 flex items-center justify-center overflow-auto">
            <CanvasDroppable rootNode={rootNode} />
          </main>

          <PropertyInspector />
        </div>
      </div>
      <CodePreviewModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </DndContext>
  );
}
