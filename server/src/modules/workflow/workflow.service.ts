import { Injectable, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DynamicDataService } from "../dynamic-data/dynamic-data.service";
import { ActionNode, WorkflowPayload } from "./workflow.interface";
import { ValueResolverService } from "./value-resolver.service";

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
    client?: any,
  ) {
    const { type, params } = action;

    switch (type) {
      case "DB_INSERT": {
        if (!params.tableName || !params.data) {
          throw new Error(
            "DB_INSERT 필수 파라미터(tableName, data)가 누락됐습니다.",
          );
        }

        if (
          client &&
          typeof (this.dataService as any).createWithClient === "function"
        ) {
          return await (this.dataService as any).createWithClient(
            client,
            projectId,
            params.tableName,
            params.data,
          );
        }

        return await this.dataService.create(
          projectId,
          params.tableName,
          params.data,
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

        if (
          client &&
          typeof (this.dataService as any).updateWithClient === "function"
        ) {
          return await (this.dataService as any).updateWithClient(
            client,
            projectId,
            params.tableName,
            String(recordId),
            updatePayload,
          );
        }

        return await this.dataService.update(
          projectId,
          params.tableName,
          String(recordId),
          updatePayload,
        );
      }

      case "DB_DELETE": {
        if (!params.tableName || !params.recordId) {
          throw new Error(
            "DB_DELETE 필수 파라미터(tableName, data.id)가 누락되었습니다.",
          );
        }

        if (
          client &&
          typeof (this.dataService as any).removeWithClient === "function"
        ) {
          return await (this.dataService as any).removeWithClient(
            client,
            projectId,
            params.tableName,
            String(params.recordId),
          );
        }

        return await this.dataService.remove(
          projectId,
          params.tableName,
          String(params.recordId),
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
        const response = await fetch(params.url, fetchOptions);
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

          const result = await this.executeSingleAction(
            projectId,
            { ...currentAction, params: resolvedParams },
            client,
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
