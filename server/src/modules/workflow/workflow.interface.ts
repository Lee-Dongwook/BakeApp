export type ActionType =
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "API_CALL"
  | "NAVIGATE"
  | "SHOW_ALERT"
  | "SHOW_TOAST";

export interface ActionNode {
  id: string;
  type: ActionType;
  params: {
    tableName?: string;
    recordId?: string;
    data?: Record<string, any>;
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    targetPage?: string;
    message?: string;
  };
  nextActionId?: string;
}

export interface WorkflowPayload {
  projectId: string;
  trigger: "ON_CLICK" | "ON_PAGE_LOAD" | "ON_SUBMIT";
  actions: ActionNode[];
}
