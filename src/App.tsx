import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { ComponentNode, useEditorStore } from "./store/useEditorStore";
import { CanvasDroppable } from "./components/CanvasDroppable";
import { ComponentPalette } from "./components/ComponentPalette";
import { PropertyInspector } from "./components/PropertyInspector";
import { CodePreviewModal } from "./components/CodePreviewModal";
import { DbSchemaBuilderModal } from "./components/DbSchemaBuilderModal";
import { Header } from "./components/Header";

export default function App() {
  const { rootNode, addNode } = useEditorStore();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

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
        <Header
          onOpenDbBuilder={() => setIsDbModalOpen(true)}
          onOpenCodePreview={() => setIsCodeModalOpen(true)}
        />

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
      <DbSchemaBuilderModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </DndContext>
  );
}
