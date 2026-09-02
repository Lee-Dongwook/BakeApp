import { create } from "zustand";
import {
  addNodeToTree,
  deleteNodeFromTree,
  updateNodeInTree,
  moveNodeInTree,
  findNodeById,
  findParentNode,
  type ComponentNode,
} from "./useCanvasStore";
import { notifyEditorChanged } from "./editorChangeTracker";

export interface Page {
  id: string;
  name: string;
  path: string;
  rootNode: ComponentNode;
}

interface PageState {
  pages: Page[];
  activePageId: string;
  pageParams: Record<string, any>;

  history: Page[][];
  historyIndex: number;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  replacePages: (pages: Page[]) => void;
  resetPages: () => void;
  setActivePage: (pageId: string, params?: Record<string, any>) => void;
  addPage: (name: string, path: string) => string;
  renamePage: (pageId: string, name: string, path: string) => void;
  deletePage: (pageId: string) => void;
  addNode: (pageId: string, parentId: string, newNode: ComponentNode) => void;
  moveNode: (pageId: string, nodeId: string, direction: "up" | "down") => void;
  duplicateNode: (pageId: string, nodeId: string) => string | null;
  updateNodeStyle: (
    pageId: string,
    nodeId: string,
    newStyle: Record<string, any>,
  ) => void;
  updateNodeProps: (
    pageId: string,
    nodeId: string,
    newProps: Record<string, any>,
  ) => void;
  updateNodeTextContent: (pageId: string, nodeId: string, text: string) => void;
  deleteNode: (pageId: string, nodeId: string) => void;
}

const initialPages: Page[] = [
  {
    id: "page-home",
    name: "Home",
    path: "/",
    rootNode: {
      id: "root-container-home",
      type: "Container",
      name: "Home Screen",
      style: { flex: 1, backgroundColor: "#ffffff", padding: 24, gap: 16 },
      children: [
        {
          id: "node-home-title",
          type: "Text",
          name: "환영 문구",
          style: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
          children: ["BakeApp 빌더에 오신 것을 환영합니다! 🍞"],
        },
        {
          id: "node-home-desc",
          type: "Text",
          name: "설명",
          style: { fontSize: 14, color: "#64748b" },
          children: ["왼쪽 팔레트에서 컴포넌트를 추가하고 자유롭게 배치해보세요."],
        },
      ],
    },
  },
  {
    id: "page-detail",
    name: "Detail",
    path: "/detail/:id",
    rootNode: {
      id: "root-container-detail",
      type: "Container",
      name: "Detail Screen",
      style: { flex: 1, backgroundColor: "#f8fafc", padding: 24, gap: 16 },
      children: [
        {
          id: "node-detail-title",
          type: "Text",
          name: "상세 페이지",
          style: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
          children: ["상세 정보 화면"],
        },
      ],
    },
  },
];

const pushHistory = (state: PageState, nextPages: Page[]) => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(structuredClone(nextPages));
  if (newHistory.length > 30) newHistory.shift();
  return {
    pages: nextPages,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const usePageStore = create<PageState>((set, get) => ({
  pages: initialPages,
  activePageId: "page-home",
  pageParams: {},
  history: [structuredClone(initialPages)],
  historyIndex: 0,

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const restored = structuredClone(history[nextIndex]);
    set({
      pages: restored,
      historyIndex: nextIndex,
    });
    notifyEditorChanged();
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const restored = structuredClone(history[nextIndex]);
    set({
      pages: restored,
      historyIndex: nextIndex,
    });
    notifyEditorChanged();
  },

  replacePages: (pages) =>
    set({
      pages,
      activePageId: pages[0]?.id ?? "",
      pageParams: {},
      history: [structuredClone(pages)],
      historyIndex: 0,
    }),

  resetPages: () => {
    const fresh = structuredClone(initialPages);
    set({
      pages: fresh,
      activePageId: "page-home",
      pageParams: {},
      history: [structuredClone(fresh)],
      historyIndex: 0,
    });
  },

  setActivePage: (pageId, params = {}) =>
    set({ activePageId: pageId, pageParams: params }),

  addPage: (name, path) => {
    const newPageId = `page-${Date.now()}`;
    const newPage: Page = {
      id: newPageId,
      name,
      path,
      rootNode: {
        id: `root-container-${newPageId}`,
        type: "Container",
        name: `${name} Screen`,
        style: { flex: 1, backgroundColor: "#ffffff", padding: 24, gap: 16 },
        children: [],
      },
    };
    set((state) => ({
      ...pushHistory(state, [...state.pages, newPage]),
      activePageId: newPageId,
      pageParams: {},
    }));
    notifyEditorChanged();
    return newPageId;
  },

  renamePage: (pageId, name, path) => {
    set((state) => {
      const nextPages = state.pages.map((p) =>
        p.id === pageId ? { ...p, name, path } : p,
      );
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  deletePage: (pageId) => {
    const previousPageCount = getPageCount();
    set((state) => {
      if (state.pages.length <= 1) return state;
      const filtered = state.pages.filter((p) => p.id !== pageId);
      return {
        ...pushHistory(state, filtered),
        activePageId:
          state.activePageId === pageId ? filtered[0].id : state.activePageId,
        pageParams: state.activePageId === pageId ? {} : state.pageParams,
      };
    });
    if (previousPageCount > 1) notifyEditorChanged();
  },

  addNode: (pageId, parentId, newNode) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        addNodeToTree(rootNode, parentId, newNode),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  moveNode: (pageId, nodeId, direction) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        moveNodeInTree(rootNode, nodeId, direction),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  duplicateNode: (pageId, nodeId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return null;

    const targetNode = findNodeById(page.rootNode, nodeId);
    const parentNode = findParentNode(page.rootNode, nodeId);
    if (!targetNode || !parentNode) return null;

    const deepCloneWithNewIds = (node: ComponentNode): ComponentNode => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        ...node,
        id: newId,
        name: `${node.name} (복사본)`,
        children: node.children?.map((child) =>
          typeof child === "string" ? child : deepCloneWithNewIds(child),
        ),
      };
    };

    const cloned = deepCloneWithNewIds(targetNode);
    set((s) => {
      const nextPages = updatePageTree(s, pageId, (rootNode) =>
        addNodeToTree(rootNode, parentNode.id, cloned),
      ).pages;
      return pushHistory(s, nextPages);
    });
    notifyEditorChanged();
    return cloned.id;
  },

  updateNodeStyle: (pageId, nodeId, newStyle) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          style: { ...node.style, ...newStyle },
        })),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  updateNodeProps: (pageId, nodeId, newProps) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          props: { ...node.props, ...newProps },
        })),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  updateNodeTextContent: (pageId, nodeId, text) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          children: [text],
        })),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },

  deleteNode: (pageId, nodeId) => {
    set((state) => {
      const nextPages = updatePageTree(state, pageId, (rootNode) =>
        rootNode.id === nodeId
          ? rootNode
          : deleteNodeFromTree(rootNode, nodeId),
      ).pages;
      return pushHistory(state, nextPages);
    });
    notifyEditorChanged();
  },
}));

const getPageCount = () => usePageStore.getState().pages.length;

export const selectActivePage = (state: PageState): Page | undefined =>
  state.pages.find((page) => page.id === state.activePageId);

const updatePageTree = (
  state: PageState,
  pageId: string,
  updater: (rootNode: ComponentNode) => ComponentNode,
): Pick<PageState, "pages"> => ({
  pages: state.pages.map((page) => {
    if (page.id !== pageId) return page;

    const rootNode = updater(page.rootNode);
    return rootNode === page.rootNode ? page : { ...page, rootNode };
  }),
});
