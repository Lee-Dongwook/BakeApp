import { create } from "zustand";

export interface ComponentNode {
  id: string;
  type: string;
  name: string;
  props?: Record<string, any>;
  style?: Record<string, any>;
  children?: (ComponentNode | string)[];
}

interface EditorState {
  mode: "EDIT" | "PREVIEW";
  setMode: (mode: "EDIT" | "PREVIEW") => void;

  rootNode: ComponentNode;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  formState: Record<string, any>;
  setFormField: (field: string, value: any) => void;
  resetFormState: () => void;

  workflowResults: Record<string, any>;
  setWorkflowResult: (actionId: string, result: any) => void;

  addNode: (parentId: string, newNode: ComponentNode) => void;
  updateNodeStyle: (nodeId: string, newStyle: Record<string, any>) => void;
  updateNodeProps: (nodeId: string, newProps: Record<string, any>) => void;
  updateNodeTextContent: (nodeId: string, text: string) => void;
  deleteNode: (nodeId: string) => void;
}

const initialRootNode: ComponentNode = {
  id: "root-container",
  type: "Container",
  name: "Root Screen",
  style: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 12,
  },
  children: [
    {
      id: "node-welcome-text",
      type: "Text",
      name: "환영 문구",
      style: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 8,
      },
      children: ["BakeApp 빌더에 오신 것을 환영합니다!"],
    },
  ],
};

const updateNodeInTree = (
  current: ComponentNode,
  targetId: string,
  updater: (node: ComponentNode) => ComponentNode,
): ComponentNode => {
  if (current.id === targetId) {
    return updater(current);
  }

  if (current.children && current.children.length > 0) {
    const updatedChildren = current.children.map((child) => {
      if (typeof child === "string") return child;
      return updateNodeInTree(child, targetId, updater);
    });

    return { ...current, children: updatedChildren };
  }

  return current;
};

const addNodeToTree = (
  current: ComponentNode,
  parentId: string,
  newNode: ComponentNode,
): ComponentNode => {
  if (current.id === parentId) {
    const children = current.children
      ? [...current.children, newNode]
      : [newNode];
    return { ...current, children };
  }

  if (current.children && current.children.length > 0) {
    const updatedChildren = current.children.map((child) => {
      if (typeof child === "string") return child;
      return addNodeToTree(child, parentId, newNode);
    });
    return { ...current, children: updatedChildren };
  }

  return current;
};

const deleteNodeFromTree = (
  current: ComponentNode,
  targetId: string,
): ComponentNode => {
  if (!current.children) return current;

  const updatedChildren = current.children
    .filter((child) => {
      if (typeof child === "string") return true;
      return child.id !== targetId;
    })
    .map((child) => {
      if (typeof child === "string") return child;
      return deleteNodeFromTree(child, targetId);
    });

  return { ...current, children: updatedChildren };
};

export const useEditorStore = create<EditorState>((set) => ({
  mode: "EDIT",
  setMode: (mode) => set({ mode }),

  rootNode: initialRootNode,
  selectedNodeId: "node-welcome-text",

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  formState: {},
  setFormField: (field, value) =>
    set((state) => ({
      formState: { ...state.formState, [field]: value },
    })),
  resetFormState: () => set({ formState: {} }),

  workflowResults: {},
  setWorkflowResult: (actionId, result) =>
    set((state) => ({
      workflowResults: { ...state.workflowResults, [actionId]: result },
    })),

  addNode: (parentId, newNode) =>
    set((state) => ({
      rootNode: addNodeToTree(state.rootNode, parentId, newNode),
      selectedNodeId: newNode.id,
    })),

  updateNodeStyle: (nodeId, newStyle) =>
    set((state) => ({
      rootNode: updateNodeInTree(state.rootNode, nodeId, (node) => ({
        ...node,
        style: { ...node.style, ...newStyle },
      })),
    })),

  updateNodeProps: (nodeId, newProps) =>
    set((state) => ({
      rootNode: updateNodeInTree(state.rootNode, nodeId, (node) => ({
        ...node,
        props: { ...node.props, ...newProps },
      })),
    })),

  updateNodeTextContent: (nodeId, text) =>
    set((state) => ({
      rootNode: updateNodeInTree(state.rootNode, nodeId, (node) => ({
        ...node,
        children: [text],
      })),
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      rootNode: deleteNodeFromTree(state.rootNode, nodeId),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    })),
}));
