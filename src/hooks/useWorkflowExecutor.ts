import { useState } from "react";
import { tokenStorage } from "../auth/tokenStorage";
import { usePageStore } from "../store/usePageStore";
import { useQueryStore } from "../store/useQueryStore";
import { useRuntimeStore } from "../store/useRuntimeStore";

export type ActionType =
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

export interface ActionNode {
  id: string;
  type: ActionType;
  params: {
    tableName?: string;
    recordId?: string;
    data?: Record<string, any>;
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    queryId?: string;
    targetPage?: string;
    message?: string;
    toastType?: "success" | "error" | "info" | "warning";
    field?: string;
    value?: any;
    modalId?: string;
    textToCopy?: string;
  };
  nextActionId?: string;
}

interface ExecuteWorkflowParams {
  projectId: string;
  trigger?: "ON_CLICK" | "ON_PAGE_LOAD" | "ON_SUBMIT" | "ON_CHANGE";
  actions: ActionNode[];
  formState?: Record<string, any>;
}

export function useWorkflowExecutor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWorkflow = async ({
    projectId,
    trigger = "ON_CLICK",
    actions,
    formState = {},
  }: ExecuteWorkflowParams) => {
    if (!actions || actions.length === 0) return;

    setLoading(true);
    setError(null);

    const token = tokenStorage.get();
    const {
      addToast,
      setFormField,
      resetFormState,
      setPageStateField,
      setAppStateField,
      openModal,
      closeModal,
      setWorkflowResult,
      pageState,
      appState,
    } = useRuntimeStore.getState();
    const { pages, setActivePage, pageParams } = usePageStore.getState();
    const { queries, runQuery } = useQueryStore.getState();

    const resolveValue = (val: any, runtimeSteps: Record<string, any>): any => {
      if (typeof val !== "string") return val;

      const exactMatch = val.match(/^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/);
      if (exactMatch) {
        const path = exactMatch[1];
        const [domain, firstKey, secondKey] = path.split(".");
        if (domain === "form") return formState[firstKey] ?? "";
        if (domain === "pageState") return pageState[firstKey] ?? "";
        if (domain === "appState") return appState[firstKey] ?? "";
        if (domain === "params") return pageParams[firstKey] ?? "";
        if (domain === "steps" && firstKey && secondKey) {
          return runtimeSteps[firstKey]?.[secondKey] ?? "";
        }
        return val;
      }

      return val.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, path) => {
        const [domain, firstKey, secondKey] = path.split(".");
        if (domain === "form") return String(formState[firstKey] ?? "");
        if (domain === "pageState") return String(pageState[firstKey] ?? "");
        if (domain === "appState") return String(appState[firstKey] ?? "");
        if (domain === "params") return String(pageParams[firstKey] ?? "");
        if (domain === "steps" && firstKey && secondKey) {
          return String(runtimeSteps[firstKey]?.[secondKey] ?? "");
        }
        return match;
      });
    };

    const resolveParamsObject = (params: Record<string, any>, runtimeSteps: Record<string, any>) => {
      const resolved: Record<string, any> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const inner: Record<string, any> = {};
          for (const [ik, iv] of Object.entries(v)) {
            inner[ik] = resolveValue(iv, runtimeSteps);
          }
          resolved[k] = inner;
        } else {
          resolved[k] = resolveValue(v, runtimeSteps);
        }
      }
      return resolved;
    };

    const executedSteps: Record<string, any> = {};

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const resolvedParams = resolveParamsObject(action.params, executedSteps);

        if (action.type === "SHOW_TOAST") {
          addToast(
            resolvedParams.message || "작업이 완료되었습니다.",
            resolvedParams.toastType || "success",
          );
          executedSteps[action.id] = { success: true };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "SHOW_ALERT") {
          addToast(resolvedParams.message || "알림", "info");
          executedSteps[action.id] = { success: true };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "SET_FIELD") {
          if (resolvedParams.field) {
            setFormField(resolvedParams.field, resolvedParams.value);
            executedSteps[action.id] = { field: resolvedParams.field, value: resolvedParams.value };
            setWorkflowResult(action.id, executedSteps[action.id]);
          }
          continue;
        }

        if (action.type === "SET_PAGE_STATE") {
          if (resolvedParams.field) {
            setPageStateField(resolvedParams.field, resolvedParams.value);
            executedSteps[action.id] = { field: resolvedParams.field, value: resolvedParams.value };
            setWorkflowResult(action.id, executedSteps[action.id]);
          }
          continue;
        }

        if (action.type === "SET_APP_STATE") {
          if (resolvedParams.field) {
            setAppStateField(resolvedParams.field, resolvedParams.value);
            executedSteps[action.id] = { field: resolvedParams.field, value: resolvedParams.value };
            setWorkflowResult(action.id, executedSteps[action.id]);
          }
          continue;
        }

        if (action.type === "OPEN_MODAL") {
          openModal(resolvedParams.modalId || "modal_default");
          executedSteps[action.id] = { modalOpened: resolvedParams.modalId };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "CLOSE_MODAL") {
          closeModal();
          executedSteps[action.id] = { modalClosed: true };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "RESET_FORM") {
          resetFormState();
          executedSteps[action.id] = { formReset: true };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "COPY_CLIPBOARD") {
          const text = String(resolvedParams.textToCopy || "");
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            addToast("클립보드에 복사되었습니다.", "info");
          }
          executedSteps[action.id] = { copied: text };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "NAVIGATE") {
          const target = resolvedParams.targetPage || "/";
          const matchedPage = pages.find((p) => p.id === target || p.path === target || p.name === target);
          if (matchedPage) {
            setActivePage(matchedPage.id);
          } else if (target.startsWith("http://") || target.startsWith("https://")) {
            window.open(target, "_blank");
          }
          executedSteps[action.id] = { navigatedTo: target };
          setWorkflowResult(action.id, executedSteps[action.id]);
          continue;
        }

        if (action.type === "RUN_QUERY") {
          const targetQueryId = resolvedParams.queryId || queries.find((q) => q.name === resolvedParams.queryId)?.id;
          if (targetQueryId) {
            const queryRes = await runQuery(targetQueryId);
            executedSteps[action.id] = queryRes;
            setWorkflowResult(action.id, queryRes);
          }
          continue;
        }

        // Server-side action execution: DB_INSERT, DB_UPDATE, DB_DELETE, API_CALL
        const response = await fetch("/api/workflow/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId,
            trigger,
            actions: [{ ...action, params: resolvedParams }],
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.message || `액션 [${action.type}] 실행에 실패했습니다.`);
        }

        const serverResult = await response.json();
        const actionResult = serverResult.results?.[action.id] || serverResult;
        executedSteps[action.id] = actionResult;
        setWorkflowResult(action.id, actionResult);

        if (action.type === "DB_INSERT") {
          addToast(`[${resolvedParams.tableName}] 레코드가 성공적으로 추가되었습니다.`, "success");
        } else if (action.type === "DB_UPDATE") {
          addToast(`[${resolvedParams.tableName}] 레코드가 성공적으로 수정되었습니다.`, "success");
        } else if (action.type === "DB_DELETE") {
          addToast(`[${resolvedParams.tableName}] 레코드가 삭제되었습니다.`, "info");
        }
      }

      return { success: true, results: executedSteps };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Workflow Execution Error]", err);
      setError(message);
      addToast(`워크플로우 오류: ${message}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeWorkflow,
    loading,
    error,
  };
}
