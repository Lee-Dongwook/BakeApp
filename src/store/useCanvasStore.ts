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

export const findParentNode = (
  node: ComponentNode,
  targetId: string,
): ComponentNode | null => {
  for (const child of node.children ?? []) {
    if (typeof child !== "string") {
      if (child.id === targetId) return node;
      const parent = findParentNode(child, targetId);
      if (parent) return parent;
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

export const moveNodeInTree = (
  rootNode: ComponentNode,
  targetId: string,
  direction: "up" | "down",
): ComponentNode => {
  const parent = findParentNode(rootNode, targetId);
  if (!parent || !parent.children) return rootNode;

  const index = parent.children.findIndex(
    (child) => typeof child !== "string" && child.id === targetId,
  );
  if (index === -1) return rootNode;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= parent.children.length) return rootNode;

  const newChildren = [...parent.children];
  const [moved] = newChildren.splice(index, 1);
  newChildren.splice(targetIndex, 0, moved);

  return updateNodeInTree(rootNode, parent.id, (p) => ({
    ...p,
    children: newChildren,
  }));
};

/** 같은 부모를 가진 두 요소의 위치를 드래그 결과에 맞춰 교체합니다. */
export const reorderNodeInTree = (
  rootNode: ComponentNode,
  activeId: string,
  overId: string,
): ComponentNode => {
  if (activeId === overId) return rootNode;

  const activeParent = findParentNode(rootNode, activeId);
  const overParent = findParentNode(rootNode, overId);

  // 서로 다른 컨테이너로의 이동은 기존 드롭 방식과 충돌하지 않도록 지원하지 않습니다.
  if (!activeParent || !overParent || activeParent.id !== overParent.id) {
    return rootNode;
  }

  const children = activeParent.children;
  if (!children) return rootNode;

  const activeIndex = children.findIndex(
    (child) => typeof child !== "string" && child.id === activeId,
  );
  const overIndex = children.findIndex(
    (child) => typeof child !== "string" && child.id === overId,
  );
  if (activeIndex === -1 || overIndex === -1) return rootNode;

  const reordered = [...children];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);

  return updateNodeInTree(rootNode, activeParent.id, (parent) => ({
    ...parent,
    children: reordered,
  }));
};

export interface FlattenedNode {
  node: ComponentNode;
  depth: number;
  parentId: string | null;
}

export const flattenTree = (
  root: ComponentNode,
  depth = 0,
  parentId: string | null = null,
): FlattenedNode[] => {
  const result: FlattenedNode[] = [{ node: root, depth, parentId }];
  for (const child of root.children ?? []) {
    if (typeof child !== "string") {
      result.push(...flattenTree(child, depth + 1, root.id));
    }
  }
  return result;
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
