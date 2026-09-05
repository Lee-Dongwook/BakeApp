import { BadRequestException, Injectable } from "@nestjs/common";
import { SqlExecutor } from "../../common/tenant-table";
import { DatabaseService } from "../database/database.service";
import { DynamicDataService } from "../dynamic-data/dynamic-data.service";
import { ValueResolverService } from "./value-resolver.service";
import { ActionNode, WorkflowPayload } from "./workflow.interface";

@Injectable()
export class WorkflowService {
  constructor(
    private readonly dataService: DynamicDataService,
    private readonly databaseService: DatabaseService,
    private readonly valueResolver: ValueResolverService,
  ) {}

  private async executeSingleAction(
    projectId: string,
    action: ActionNode,
    client?: SqlExecutor,
    runtimeContext?: Record<string, any>,
  ) {
    const { type, params } = action;

    switch (type) {
      case "DB_INSERT": {
        if (!params.tableName || !params.data) {
          throw new Error(
            "DB_INSERT 필수 파라미터(tableName, data)가 누락됐습니다.",
          );
        }

        return await this.dataService.create(
          projectId,
          params.tableName,
          params.data,
          client,
        );
      }

      case "DB_UPDATE": {
        const recordId = params.recordId || params.data?.id;
        if (!params.tableName || !recordId || !params.data) {
          throw new Error(
            "DB_UPDATE 필수 파라미터(tableName, data.id)가 누락되었습니다.",
          );
        }
        const { id, ...updatePayload } =
          typeof params.data === "object" ? params.data : {};

        return await this.dataService.update(
          projectId,
          params.tableName,
          String(recordId),
          updatePayload,
          client,
        );
      }

      case "DB_DELETE": {
        if (!params.tableName || !params.recordId) {
          throw new Error(
            "DB_DELETE 필수 파라미터(tableName, data.id)가 누락되었습니다.",
          );
        }

        return await this.dataService.remove(
          projectId,
          params.tableName,
          String(params.recordId),
          client,
        );
      }

      case "CONDITION": {
        const { left, operator = "==", right } = params;
        let isTrue = false;

        switch (operator) {
          case "==":
            isTrue = left == right;
            break;
          case "===":
            isTrue = left === right;
            break;
          case "!=":
            isTrue = left != right;
            break;
          case "!==":
            isTrue = left !== right;
            break;
          case ">":
            isTrue = Number(left) > Number(right);
            break;
          case ">=":
            isTrue = Number(left) >= Number(right);
            break;
          case "<":
            isTrue = Number(left) < Number(right);
            break;
          case "<=":
            isTrue = Number(left) <= Number(right);
            break;
          case "contains":
            isTrue = String(left ?? "").includes(String(right ?? ""));
            break;
          default:
            isTrue = Boolean(left);
        }

        return { isTrue, left, operator, right };
      }

      // 1. 반복(LOOP) 액션 처리 추가
      case "LOOP": {
        const { itemsPath, loopActions } = params;
        // 런타임 컨텍스트에서 순회할 배열 데이터 추출 (예: steps.node_1.data 등)
        const items =
          this.resolvePath(runtimeContext, itemsPath) || params.items || [];

        if (!Array.isArray(items)) {
          throw new Error("LOOP 액션의 대상이 배열이 아닙니다.");
        }

        const loopResults = [];
        for (const [index, item] of items.entries()) {
          const itemContext = {
            ...runtimeContext,
            currentItem: item,
            currentIndex: index,
            steps: {},
          };
          const subResults: Record<string, any> = {};

          if (loopActions && Array.isArray(loopActions)) {
            for (const subAction of loopActions) {
              const resolvedSubParams = this.valueResolver.resolve(
                subAction.params,
                itemContext,
              );
              const subRes = await this.executeSingleAction(
                projectId,
                { ...subAction, params: resolvedSubParams },
                client,
                itemContext,
              );
              subResults[subAction.id] = subRes;
              itemContext.steps = {
                ...itemContext.steps,
                [subAction.id]: subRes,
              };
            }
          }
          loopResults.push({ index, item, results: subResults });
        }
        return { loopResults, totalCount: items.length };
      }

      case "NAVIGATE": {
        return {
          clientAction: "NAVIGATE",
          targetPage: params.targetPage || "/",
        };
      }

      case "API_CALL": {
        if (!params.url) {
          throw new Error("API_CALL 필수 파라미터(url)가 누락되었습니다.");
        }
        const method = params.method || "GET";
        const fetchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...(params.headers || {}),
        };
        const fetchOptions: RequestInit = {
          method,
          headers: fetchHeaders,
        };
        if (method !== "GET" && params.data) {
          fetchOptions.body =
            typeof params.data === "string"
              ? params.data
              : JSON.stringify(params.data);
        }
        const response = await fetch(
          this.assertSafeUrl(params.url),
          fetchOptions,
        );
        const resText = await response.text();
        try {
          return JSON.parse(resText);
        } catch {
          return { data: resText, status: response.status };
        }
      }

      case "SHOW_TOAST":
      case "SHOW_ALERT": {
        return {
          clientAction: type === "SHOW_TOAST" ? "SHOW_TOAST" : "SHOW_ALERT",
          message: params.message || "완료되었습니다.",
        };
      }

      default:
        throw new Error(`지원하지 않는 액션 타입입니다: ${type}`);
    }
  }

  // 객체 경로 안전 조회 헬퍼 (예: "steps.node_1.data")
  private resolvePath(obj: any, path: string) {
    if (!path) return undefined;
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }

  private async executeWithRetry(
    projectId: string,
    action: ActionNode,
    client?: SqlExecutor,
    runtimeContext?: Record<string, any>,
  ) {
    const maxRetries = action.params?.maxRetries || 0;
    const retryDelayMs = action.params?.retryDelayMs || 1000;
    let attempt = 0;

    while (true) {
      try {
        return await this.executeSingleAction(
          projectId,
          action,
          client,
          runtimeContext,
        );
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * attempt),
        );
      }
    }
  }

  /**
   * SSRF 방어: API_CALL이 내부망/메타데이터 서버로 향하지 않도록 검증
   */
  private assertSafeUrl(rawUrl: string): string {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error(`API_CALL url 형식이 올바르지 않습니다: ${rawUrl}`);
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("API_CALL은 http/https만 지원합니다.");
    }

    const allowList = (process.env.WORKFLOW_ALLOWED_HOSTS || "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

    if (allowList.length > 0) {
      if (!allowList.includes(hostname)) {
        throw new Error(
          `허용되지 않은 API_CALL 대상 호스트입니다: ${hostname}`,
        );
      }
      return url.toString();
    }

    if (WorkflowService.isPrivateHost(hostname)) {
      throw new Error(`내부 네트워크 주소로는 요청할 수 없습니다: ${hostname}`);
    }

    return url.toString();
  }

  private static isPrivateHost(hostname: string): boolean {
    if (
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return true;
    }

    if (
      /^f[cd][0-9a-f]{2}:/.test(hostname) ||
      /^fe[89ab][0-9a-f]:/.test(hostname)
    ) {
      return true;
    }

    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;

    const [a, b] = ipv4.slice(1).map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }

  async executeWorkflow(
    payload: WorkflowPayload,
    clientContext: Record<string, any> = {},
  ) {
    const { projectId, trigger, actions, startActionId } = payload;

    if (!actions || actions.length === 0) {
      return {
        success: true,
        trigger,
        executionLog: ["실행할 액션이 없습니다."],
      };
    }

    const executionLog: string[] = [];
    const executionResults: Record<string, any> = {};

    const runtimeContext: Record<string, any> = {
      ...clientContext,
      steps: executionResults,
    };

    const MAX_EXECUTIONS = 100;
    let executionCount = 0;

    return await this.databaseService.runInTransaction(async (client) => {
      let currentAction: ActionNode | undefined =
        actions.find((a) => a.id === startActionId) || actions[0];

      while (currentAction) {
        executionCount++;
        if (executionCount > MAX_EXECUTIONS) {
          throw new BadRequestException({
            message: "워크플로우 최대 실행 횟수(100회)를 초과하였습니다.",
            log: executionLog,
          });
        }

        executionLog.push(
          `[Execution] Action Node ID: ${currentAction.id} (${currentAction.type})`,
        );

        try {
          const resolvedParams = this.valueResolver.resolve(
            currentAction.params,
            runtimeContext,
          );

          // 2. 재시도 정책(`maxRetries`)이 포함된 실행 래퍼 적용
          const result = await this.executeWithRetry(
            projectId,
            { ...currentAction, params: resolvedParams },
            client,
            runtimeContext,
          );

          executionResults[currentAction.id] = result;
          runtimeContext.steps[currentAction.id] = result;

          if (currentAction.type === "CONDITION") {
            const isTrue = result.isTrue;
            const nextId = isTrue
              ? currentAction.trueNextActionId
              : currentAction.falseNextActionId;

            currentAction = actions.find((a) => a.id === nextId);
          } else if (currentAction.nextActionId) {
            currentAction = actions.find(
              (a) => a.id === currentAction.nextActionId,
            );
          } else {
            currentAction = undefined;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          executionLog.push(
            `[Error] Action Node ID: ${currentAction.id} 실패 - ${errorMessage}`,
          );

          if (currentAction.errorNextActionId) {
            currentAction = actions.find(
              (a) => a.id === currentAction.errorNextActionId,
            );
            continue;
          }

          throw new BadRequestException({
            message: `워크플로우 실행 중 에러가 발생했습니다: ${errorMessage}`,
            log: executionLog,
          });
        }
      }

      return {
        success: true,
        trigger,
        executionLog,
        results: executionResults,
      };
    });
  }
}
