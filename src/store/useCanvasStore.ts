import { create } from "zustand";

export interface ComponentNode {
  id: string;
  type: string;
  name: string;
  props?: Record<string, any>;
  style?: Record<string, any>;
  children?: (ComponentNode | string)[];
}

interface CanvasState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedNodeId: "node-home-title",
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));

export const findNodeById = (
  node: ComponentNode,
  targetId: string,
): ComponentNode | null => {
  if (node.id === targetId) return node;

  for (const child of node.children ?? []) {
    if (typeof child !== "string") {
      const foundNode = findNodeById(child, targetId);
      if (foundNode) return foundNode;
    }
  }

  return null;
};

export const addNodeToTree = (
  node: ComponentNode,
  parentId: string,
  newNode: ComponentNode,
): ComponentNode => {
  if (node.id === parentId) {
    return { ...node, children: [...(node.children ?? []), newNode] };
  }

  return updateChildren(node, (child) =>
    addNodeToTree(child, parentId, newNode),
  );
};

export const updateNodeInTree = (
  node: ComponentNode,
  targetId: string,
  updater: (node: ComponentNode) => ComponentNode,
): ComponentNode => {
  if (node.id === targetId) return updater(node);

  return updateChildren(node, (child) =>
    updateNodeInTree(child, targetId, updater),
  );
};

export const deleteNodeFromTree = (
  node: ComponentNode,
  targetId: string,
): ComponentNode => {
  if (!node.children) return node;

  const children = node.children
    .filter((child) => typeof child === "string" || child.id !== targetId)
    .map((child) =>
      typeof child === "string"
        ? child
        : deleteNodeFromTree(child, targetId),
    );

  const hasChanged =
    children.length !== node.children.length ||
    children.some((child, index) => child !== node.children?.[index]);

  return hasChanged ? { ...node, children } : node;
};

const updateChildren = (
  node: ComponentNode,
  updater: (child: ComponentNode) => ComponentNode,
): ComponentNode => {
  if (!node.children) return node;

  const children = node.children.map((child) =>
    typeof child === "string" ? child : updater(child),
  );
  const hasChanged = children.some(
    (child, index) => child !== node.children?.[index],
  );

  return hasChanged ? { ...node, children } : node;
};
