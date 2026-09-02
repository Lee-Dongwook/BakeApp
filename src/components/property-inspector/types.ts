import type { ComponentNode } from "../../store/useCanvasStore";
import type { Page } from "../../store/usePageStore";

export type InspectorTab = "STYLE" | "WORKFLOW";

export type WorkflowActionType =
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "API_CALL"
  | "RUN_QUERY"
  | "NAVIGATE"
  | "SHOW_ALERT"
  | "SHOW_TOAST"
  | "SET_FIELD"
  | "SET_PAGE_STATE"
  | "SET_APP_STATE"
  | "OPEN_MODAL"
  | "CLOSE_MODAL"
  | "RESET_FORM"
  | "COPY_CLIPBOARD";

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  params: Record<string, unknown>;
  nextActionId?: string;
}

export interface SelectedNodeEditorProps {
  page: Page;
  node: ComponentNode;
  updateNodeStyle: (
    pageId: string,
    nodeId: string,
    style: Record<string, unknown>,
  ) => void;
  updateNodeProps: (
    pageId: string,
    nodeId: string,
    props: Record<string, unknown>,
  ) => void;
  updateNodeTextContent: (pageId: string, nodeId: string, text: string) => void;
}
