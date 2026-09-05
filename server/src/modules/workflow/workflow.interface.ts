export type ActionType =
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "CONDITION"
  | "API_CALL"
  | "NAVIGATE"
  | "SHOW_ALERT"
  | "SHOW_TOAST";

export interface ConditionParams {
  left?: any;
  operator?: "==" | "===" | "!=" | "!==" | ">" | ">=" | "<" | "<=" | "contains";
  right?: any;
}

export interface ActionParams extends ConditionParams {
  tableName?: string;
  recordId?: string;
  data?: Record<string, any>;
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  targetPage?: string;
  message?: string;
}

export interface ActionNode {
  id: string;
  type: ActionType;
  params: ActionParams;
  nextActionId?: string;
  trueNextActionId?: string;
  falseNextActionId?: string;
  errorNextActionId?: string;
}

export interface WorkflowPayload {
  projectId: string;
  trigger: "ON_CLICK" | "ON_PAGE_LOAD" | "ON_SUBMIT";
  actions: ActionNode[];
  startActionId?: string;
}
