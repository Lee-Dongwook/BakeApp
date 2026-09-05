export type ActionType =
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "CONDITION"
  | "LOOP"
  | "RETRY"
  | "API_CALL"
  | "NAVIGATE"
  | "SHOW_ALERT"
  | "SHOW_TOAST";

export interface ConditionParams {
  left?: any;
  operator?: "==" | "===" | "!=" | "!==" | ">" | ">=" | "<" | "<=" | "contains";
  right?: any;
}

export interface LoopParams {
  itemsPath?: string; // 순회할 데이터의 런타임 경로 (예: "steps.node_1.data")
  items?: any[]; // 직접 전달된 배열 데이터
  loopActions?: ActionNode[]; // 루프 내부에서 순차 실행할 서브 액션 노드들
}

export interface RetryParams {
  maxRetries?: number; // 최대 재시도 횟수
  retryDelayMs?: number; // 재시도 대기 시간 (밀리초)
}

export interface ActionParams extends ConditionParams, LoopParams, RetryParams {
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
