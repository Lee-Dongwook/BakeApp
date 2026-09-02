import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  findNodeById,
  type ComponentNode,
  useCanvasStore,
} from "./store/useCanvasStore";
import { selectActivePage, usePageStore } from "./store/usePageStore";
import { CanvasDroppable } from "./components/CanvasDroppable";
import { ComponentPalette } from "./components/ComponentPalette";
import { PropertyInspector } from "./components/PropertyInspector";
import { CodePreviewModal } from "./components/CodePreviewModal";
import { DbSchemaBuilderModal } from "./components/DbSchemaBuilderModal";
import { Header } from "./components/Header";
import { PageManagerPanel } from "./components/PageManagerPanel";
import { ApiQueryManagerPanel } from "./components/ApiQueryManagerPanel";
import { Boxes, Database, Files } from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { useAuthStore } from "./store/useAuthStore";
import { useProjectStore } from "./store/useProjectStore";
import { useProjectDocumentStore } from "./store/useProjectDocumentStore";
import { useRuntimeStore } from "./store/useRuntimeStore";

type SidebarTab = "COMPONENTS" | "PAGES" | "QUERIES";

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initialize = useAuthStore((state) => state.initialize);
  const signOut = useAuthStore((state) => state.signOut);
  const activeProject = useProjectStore((state) => state.activeProject);
  const closeProject = useProjectStore((state) => state.closeProject);
  const saveDocument = useProjectDocumentStore((state) => state.save);
  const loadDocument = useProjectDocumentStore((state) => state.load);
  const isDocumentLoading = useProjectDocumentStore((state) => state.isLoading);
  const isSaving = useProjectDocumentStore((state) => state.isSaving);
  const isDirty = useProjectDocumentStore((state) => state.isDirty);
  const saveError = useProjectDocumentStore((state) => state.error);
  const activePage = usePageStore(selectActivePage);
  const pages = usePageStore((state) => state.pages);
  const setActivePage = usePageStore((state) => state.setActivePage);
  const addNode = usePageStore((state) => state.addNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("COMPONENTS");
  const search = useSearch({ from: "/project/$projectId" });
  const navigate = useNavigate({ from: "/project/$projectId" });
  const mode = useRuntimeStore((state) => state.mode);
  const setMode = useRuntimeStore((state) => state.setMode);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (activeProject) {
      void loadDocument(activeProject.id);
    }
  }, [activeProject, loadDocument]);

  useEffect(() => {
    if (search.pageId && pages.some((page) => page.id === search.pageId)) {
      setActivePage(search.pageId);
    }
  }, [pages, search.pageId, setActivePage]);

  useEffect(() => {
    if (search.mode) setMode(search.mode === "preview" ? "PREVIEW" : "EDIT");
  }, [search.mode, setMode]);

  useEffect(() => {
    if (!activeProject || !isDirty || isSaving || saveError) return;

    const timer = window.setTimeout(() => {
      void saveDocument(activeProject.id);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeProject, isDirty, isSaving, saveDocument, saveError]);

  useEffect(() => {
    if (
      activePage &&
      selectedNodeId &&
      !findNodeById(activePage.rootNode, selectedNodeId)
    ) {
      setSelectedNodeId(activePage.rootNode.id);
    }
  }, [activePage, selectedNodeId, setSelectedNodeId]);

  useEffect(() => {
    if (!activePage || search.pageId === activePage.id) return;
    void navigate({ search: (previous) => ({ ...previous, pageId: activePage.id }) });
  }, [activePage, navigate, search.pageId]);

  useEffect(() => {
    const nextMode = mode === "PREVIEW" ? "preview" : "edit";
    if (search.mode === nextMode) return;
    void navigate({ search: (previous) => ({ ...previous, mode: nextMode }) });
  }, [mode, navigate, search.mode]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && activePage) {
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

        case "DataList":
          newNode = {
            id: newId,
            type: "DataList",
            name: `${label} ${newId.slice(-4)}`,
            props: { tableName: "", displayField: "" },
            style: {
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              gap: 8,
            },
          };
          break;

        default:
          return;
      }

      const targetParentId =
        over.id === "canvas-drop-zone"
          ? activePage.rootNode.id
          : String(over.id);
      addNode(activePage.id, targetParentId, newNode);
      setSelectedNodeId(newNode.id);
    }
  };

  if (isInitializing) {
    return (
      <div className="app-shell flex h-screen items-center justify-center text-secondary">
        세션 확인 중…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!activeProject) {
    return <ProjectDashboard />;
  }

  if (isDocumentLoading) {
    return (
      <div className="app-shell flex h-screen items-center justify-center text-secondary">
        프로젝트를 불러오는 중…
      </div>
    );
  }

  if (!activePage) {
    return <div className="p-6">활성 페이지를 찾을 수 없습니다.</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="app-shell flex h-screen w-screen flex-col">
        <Header
          onOpenDbBuilder={() => setIsDbModalOpen(true)}
          onOpenCodePreview={() => setIsCodeModalOpen(true)}
          projectName={activeProject.name}
          onBackToProjects={closeProject}
          onSignOut={signOut}
          onSave={() => void saveDocument(activeProject.id)}
          isSaving={isSaving}
          isDirty={isDirty}
          saveError={saveError}
        />

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="app-sidebar flex w-80 shrink-0 flex-col border-r">
            <nav
              aria-label="빌더 도구"
              className="grid grid-cols-3 border-b p-2"
            >
              {(
                [
                  ["COMPONENTS", "컴포넌트", Boxes],
                  ["PAGES", "페이지", Files],
                  ["QUERIES", "API", Database],
                ] as const
              ).map(([tab, label, Icon]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSidebarTab(tab)}
                  aria-pressed={sidebarTab === tab}
                  className={`panel-tab flex items-center justify-center gap-1 px-2 py-2 text-xs ${
                    sidebarTab === tab ? "is-active" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1">
              {sidebarTab === "COMPONENTS" && <ComponentPalette />}
              {sidebarTab === "PAGES" && (
                <PageManagerPanel onNavigate={setActivePage} />
              )}
              {sidebarTab === "QUERIES" && <ApiQueryManagerPanel />}
            </div>
          </aside>

          <main className="workspace flex flex-1 items-center justify-center overflow-auto p-12">
            <CanvasDroppable rootNode={activePage.rootNode} />
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
        projectId={activeProject.id}
      />
    </DndContext>
  );
}
