import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  findNodeById,
  findParentNode,
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
import { Boxes, CircleHelp, Database, Files, X } from "lucide-react";
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
  const deleteNode = usePageStore((state) => state.deleteNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("COMPONENTS");
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;

      if (event.key === "?") {
        event.preventDefault();
        setIsShortcutHelpOpen((open) => !open);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (activeProject) void saveDocument(activeProject.id);
        return;
      }
      const quickTypes: Record<string, string> = { v: "View", t: "Text", b: "Button", i: "TextInput", l: "DataList" };
      const quickType = quickTypes[event.key.toLowerCase()];
      if (quickType && activePage) {
        event.preventDefault();
        const selected = selectedNodeId ? findNodeById(activePage.rootNode, selectedNodeId) : null;
        const parentId = selected && (selected.type === "Container" || selected.type === "View") ? selected.id : activePage.rootNode.id;
        const node = createBuilderNode(quickType);
        addNode(activePage.id, parentId, node);
        setSelectedNodeId(node.id);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && activePage && selectedNodeId) {
        const selected = findNodeById(activePage.rootNode, selectedNodeId);
        const parent = selected && findParentNode(activePage.rootNode, selectedNodeId);
        if (selected && parent) {
          event.preventDefault();
          const clone = cloneBuilderNode(selected);
          addNode(activePage.id, parent.id, clone);
          setSelectedNodeId(clone.id);
        }
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        activePage &&
        selectedNodeId &&
        selectedNodeId !== activePage.rootNode.id
      ) {
        event.preventDefault();
        deleteNode(activePage.id, selectedNodeId);
        setSelectedNodeId(activePage.rootNode.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePage, activeProject, addNode, deleteNode, saveDocument, selectedNodeId, setSelectedNodeId]);

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
      <button
        type="button"
        onClick={() => setIsShortcutHelpOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text-secondary)] shadow-lg transition hover:bg-[var(--surface-inset)] hover:text-white"
        aria-label="단축키 안내"
      >
        <CircleHelp className="h-5 w-5" />
      </button>
      {isShortcutHelpOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsShortcutHelpOpen(false)}>
          <section className="surface w-full max-w-sm p-6" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Builder</p><h2 id="shortcut-title" className="mt-1 text-lg font-semibold">단축키</h2></div><button type="button" className="icon-btn" onClick={() => setIsShortcutHelpOpen(false)} aria-label="닫기"><X className="h-5 w-5" /></button></div>
            <dl className="space-y-3 text-sm"><Shortcut keys="⌘/Ctrl + S" label="프로젝트 저장" /><Shortcut keys="⌘/Ctrl + D" label="선택 요소 복제" /><Shortcut keys="V / T / B / I / L" label="View · Text · Button · Input · List 추가" /><Shortcut keys="Delete / Backspace" label="선택 요소 삭제" /><Shortcut keys="?" label="이 도움말 열기 또는 닫기" /></dl>
            <p className="text-muted mt-5 text-xs">텍스트 입력 중에는 빌더 단축키가 실행되지 않습니다.</p>
          </section>
        </div>
      )}
    </DndContext>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-secondary">{label}</dt><dd className="badge px-2 py-1 text-[11px]">{keys}</dd></div>;
}

function createBuilderNode(type: string): ComponentNode {
  const id = `node-${Date.now()}`;
  if (type === "Text") return { id, type, name: "새 텍스트", style: { fontSize: 14, color: "#334155" }, children: ["새 텍스트 항목"] };
  if (type === "Button") return { id, type, name: "새 버튼", style: { paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16, backgroundColor: "#3b82f6", borderRadius: 6 }, children: ["버튼"] };
  if (type === "TextInput") return { id, type, name: "새 입력", props: { placeholder: "내용을 입력하세요" }, style: { padding: 8, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6 } };
  if (type === "DataList") return { id, type, name: "새 목록", props: { tableName: "", displayField: "" }, style: { padding: 12, backgroundColor: "#f8fafc", borderRadius: 8, gap: 8 } };
  return { id, type: "View", name: "새 컨테이너", style: { padding: 16, backgroundColor: "#f1f5f9", borderRadius: 8, gap: 8 }, children: [] };
}

function cloneBuilderNode(node: ComponentNode): ComponentNode {
  const id = `node-${Date.now()}`;
  return { ...structuredClone(node), id, name: `${node.name} 복사본` };
}
