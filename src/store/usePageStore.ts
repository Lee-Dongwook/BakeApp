import { create } from "zustand";
import {
  addNodeToTree,
  deleteNodeFromTree,
  updateNodeInTree,
  type ComponentNode,
} from "./useCanvasStore";

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

  replacePages: (pages: Page[]) => void;
  resetPages: () => void;
  setActivePage: (pageId: string, params?: Record<string, any>) => void;
  addPage: (name: string, path: string) => void;
  deletePage: (pageId: string) => void;
  addNode: (pageId: string, parentId: string, newNode: ComponentNode) => void;
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
      style: { flex: 1, backgroundColor: "#ffffff", padding: 16, gap: 12 },
      children: [
        {
          id: "node-home-title",
          type: "Text",
          name: "환영 문구",
          style: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
          children: ["BakeApp 빌더에 오신 것을 환영합니다!"],
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
      style: { flex: 1, backgroundColor: "#f8fafc", padding: 16, gap: 12 },
      children: [],
    },
  },
];

export const usePageStore = create<PageState>((set) => ({
  pages: initialPages,
  activePageId: "page-home",
  pageParams: {},

  replacePages: (pages) =>
    set({
      pages,
      activePageId: pages[0]?.id ?? "",
      pageParams: {},
    }),

  resetPages: () =>
    set({
      pages: structuredClone(initialPages),
      activePageId: "page-home",
      pageParams: {},
    }),

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
        style: { flex: 1, backgroundColor: "#ffffff", padding: 16, gap: 12 },
        children: [],
      },
    };
    set((state) => ({
      pages: [...state.pages, newPage],
      activePageId: newPageId,
      pageParams: {},
    }));
  },
  deletePage: (pageId) =>
    set((state) => {
      if (state.pages.length <= 1) return state;
      const filtered = state.pages.filter((p) => p.id !== pageId);
      return {
        pages: filtered,
        activePageId:
          state.activePageId === pageId ? filtered[0].id : state.activePageId,
        pageParams: state.activePageId === pageId ? {} : state.pageParams,
      };
    }),
  addNode: (pageId, parentId, newNode) =>
    set((state) =>
      updatePageTree(state, pageId, (rootNode) =>
        addNodeToTree(rootNode, parentId, newNode),
      ),
    ),
  updateNodeStyle: (pageId, nodeId, newStyle) =>
    set((state) =>
      updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          style: { ...node.style, ...newStyle },
        })),
      ),
    ),
  updateNodeProps: (pageId, nodeId, newProps) =>
    set((state) =>
      updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          props: { ...node.props, ...newProps },
        })),
      ),
    ),
  updateNodeTextContent: (pageId, nodeId, text) =>
    set((state) =>
      updatePageTree(state, pageId, (rootNode) =>
        updateNodeInTree(rootNode, nodeId, (node) => ({
          ...node,
          children: [text],
        })),
      ),
    ),
  deleteNode: (pageId, nodeId) =>
    set((state) =>
      updatePageTree(state, pageId, (rootNode) =>
        rootNode.id === nodeId
          ? rootNode
          : deleteNodeFromTree(rootNode, nodeId),
      ),
    ),
}));

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
