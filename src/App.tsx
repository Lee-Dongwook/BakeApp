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
import { ComponentPalette, createDefaultNode } from "./components/ComponentPalette";
import { LayersPanel } from "./components/LayersPanel";
import { PropertyInspector } from "./components/PropertyInspector";
import { CodePreviewModal } from "./components/CodePreviewModal";
import { DbSchemaBuilderModal } from "./components/DbSchemaBuilderModal";
import { Header } from "./components/Header";
import { PageManagerPanel } from "./components/PageManagerPanel";
import { ApiQueryManagerPanel } from "./components/ApiQueryManagerPanel";
import { ToastContainer } from "./components/ToastContainer";
import { Boxes, CircleHelp, Database, Files, Layers, X } from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { useAuthStore } from "./store/useAuthStore";
import { useProjectStore } from "./store/useProjectStore";
import { useProjectDocumentStore } from "./store/useProjectDocumentStore";
import { useRuntimeStore } from "./store/useRuntimeStore";

type SidebarTab = "COMPONENTS" | "LAYERS" | "PAGES" | "QUERIES";

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
  const duplicateNode = usePageStore((state) => state.duplicateNode);
  const undo = usePageStore((state) => state.undo);
  const redo = usePageStore((state) => state.redo);
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
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && (event.shiftKey && event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y")) {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && activePage && selectedNodeId) {
        event.preventDefault();
        const newId = duplicateNode(activePage.id, selectedNodeId);
        if (newId) setSelectedNodeId(newId);
        return;
      }

      const quickTypes: Record<string, string> = {
        v: "View",
        t: "Text",
        b: "Button",
        i: "TextInput",
        l: "DataList",
        c: "Card",
        s: "Select",
      };
      const quickType = quickTypes[event.key.toLowerCase()];
      if (quickType && activePage) {
        event.preventDefault();
        const selected = selectedNodeId ? findNodeById(activePage.rootNode, selectedNodeId) : null;
        const parentId =
          selected &&
          (selected.type === "Container" ||
            selected.type === "View" ||
            selected.type === "Card" ||
            selected.type === "Form")
            ? selected.id
            : activePage.rootNode.id;
        const node = createDefaultNode(quickType, quickType);
        addNode(activePage.id, parentId, node);
        setSelectedNodeId(node.id);
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
  }, [activePage, activeProject, addNode, deleteNode, duplicateNode, redo, saveDocument, selectedNodeId, setSelectedNodeId, undo]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && activePage) {
      const type = active.data.current?.type as string;
      const label = active.data.current?.label as string;

      if (!type) return;

      const newNode: ComponentNode = createDefaultNode(type, label);

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
              className="grid grid-cols-4 border-b p-1.5 gap-1 bg-[var(--surface-sunken)]"
            >
              {(
                [
                  ["COMPONENTS", "팔레트", Boxes],
                  ["LAYERS", "레이어", Layers],
                  ["PAGES", "페이지", Files],
                  ["QUERIES", "API", Database],
                ] as const
              ).map(([tab, label, Icon]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSidebarTab(tab)}
                  aria-pressed={sidebarTab === tab}
                  className={`panel-tab flex flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] ${
                    sidebarTab === tab ? "is-active font-bold" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1">
              {sidebarTab === "COMPONENTS" && <ComponentPalette />}
              {sidebarTab === "LAYERS" && <LayersPanel />}
              {sidebarTab === "PAGES" && (
                <PageManagerPanel onNavigate={setActivePage} />
              )}
              {sidebarTab === "QUERIES" && <ApiQueryManagerPanel />}
            </div>
          </aside>

          <main className="workspace flex flex-1 items-center justify-center overflow-auto p-8 lg:p-12">
            <CanvasDroppable rootNode={activePage.rootNode} />
          </main>

          <PropertyInspector />
        </div>
      </div>

      <ToastContainer />

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
        className="fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text-secondary)] shadow-xl transition hover:bg-[var(--surface-inset)] hover:text-white"
        aria-label="단축키 안내"
      >
        <CircleHelp className="h-4 w-4" />
      </button>

      {isShortcutHelpOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsShortcutHelpOpen(false)}
        >
          <section
            className="surface w-full max-w-sm p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Studio Shortcuts</p>
                <h2 id="shortcut-title" className="mt-1 text-base font-bold">
                  단축키 안내
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsShortcutHelpOpen(false)}
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-3 text-xs">
              <Shortcut keys="⌘/Ctrl + S" label="프로젝트 저장" />
              <Shortcut keys="⌘/Ctrl + Z" label="실행 취소 (Undo)" />
              <Shortcut keys="⌘/Ctrl + ⇧ + Z / Y" label="다시 실행 (Redo)" />
              <Shortcut keys="⌘/Ctrl + D" label="선택 요소 복제" />
              <Shortcut keys="V / C / T / B / I / S / L" label="View·Card·Text·Btn·Input·Select·List 추가" />
              <Shortcut keys="Delete / Backspace" label="선택 요소 삭제" />
              <Shortcut keys="?" label="이 도움말 열기 / 닫기" />
            </dl>
            <p className="text-muted mt-5 text-[11px]">
              텍스트 입력 중에는 빌더 단축키가 일시 비활성화됩니다.
            </p>
          </section>
        </div>
      )}
    </DndContext>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-secondary">{label}</dt>
      <dd className="badge px-2 py-0.5 text-[10px]">{keys}</dd>
    </div>
  );
}
