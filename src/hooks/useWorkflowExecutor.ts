import { useState } from "react";

type ActionType =
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "API_CALL"
  | "NAVIGATE"
  | "SHOW_ALERT";

interface ActionNode {
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

interface ExecuteWorkflowParams {
  projectId: string;
  trigger?: "ON_CLICK" | "ON_PAGE_LOAD" | "ON_SUBMIT";
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

    const token = localStorage.getItem("accessToken");

    const resolveParams = (params: Record<string, any>) => {
      const resolved = { ...params };

      if (resolved.data && typeof resolved.data === "object") {
        const newData: Record<string, any> = {};
        for (const [key, val] of Object.entries(resolved.data)) {
          if (
            typeof val === "string" &&
            val.startsWith("{{ form.") &&
            val.endsWith("}}")
          ) {
            const fieldName = val
              .replace("{{ form.", "")
              .replace("}}", "")
              .trim();
            newData[key] = formState[fieldName] ?? val;
          } else {
            newData[key] = val;
          }
        }
        resolved.data = newData;
      }

      if (
        typeof resolved.recordId === "string" &&
        resolved.recordId.startsWith("{{ form.")
      ) {
        const fieldName = resolved.recordId
          .replace("{{ form.", "")
          .replace("}}", "")
          .trim();

        resolved.recordId = formState[fieldName] ?? resolved.recordId;
      }

      return resolved;
    };

    const processedActions = actions.map((act) => ({
      ...act,
      params: resolveParams(act.params),
    }));

    try {
      const response = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authroization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          trigger,
          actions: processedActions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "워크플로우 실행 중 오류가 발생했습니다.",
        );
      }

      const result = await response.json();

      if (result.results) {
        Object.values(result.results).forEach((res: any) => {
          if (res?.clientAction === "SHOW_ALERT") {
            alert(res.message);
          } else if (res?.clientAction === "NAVIGATE") {
            window.location.href = res.targetPage;
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error("[Workflow Executor Error]", error);
      if (error instanceof Error) setError(error.message);
      setError(error);
      alert(error);
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
