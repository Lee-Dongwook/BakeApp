import { Injectable, BadRequestException } from "@nestjs/common";
import { DynamicDataService } from "../dynamic-data/dynamic-data.service";
import { ActionNode, WorkflowPayload } from "./workflow.interface";
import { ValueResolverService } from "./value-resolver.service";

@Injectable()
export class WorkflowService {
  constructor(
    private readonly dataService: DynamicDataService,
    private readonly valueResolver: ValueResolverService,
  ) {}

  private async executeSingleAction(projectId: string, action: ActionNode) {
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
        );
      }

      case "NAVIGATE": {
        return {
          clientAction: "NAVIGATE",
          targetPage: params.targetPage || "/",
        };
      }

      case "SHOW_ALERT": {
        return {
          clientAction: "SHOW_ALERT",
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
    const { projectId, actions } = payload;

    if (!actions || actions.length === 0) {
      return { success: true, executionLog: ["실행할 액션이 없습니다."] };
    }

    const executionLog: string[] = [];
    const executionResults: Record<string, any> = {};

    const runtimeContext: Record<string, any> = {
      ...clientContext,
      steps: executionResults,
    };

    let currentAction: ActionNode | undefined = actions[0];

    while (currentAction) {
      executionLog.push(
        `[Execution] Action Node ID: ${currentAction.id} (${currentAction.type})`,
      );

      try {
        const resolvedParams = this.valueResolver.resolve(
          currentAction.params,
          runtimeContext,
        );

        const result = await this.executeSingleAction(projectId, {
          ...currentAction,
          params: resolvedParams,
        });

        executionResults[currentAction.id] = result;
        runtimeContext.steps[currentAction.id] = result;

        if (currentAction.nextActionId) {
          currentAction = actions.find(
            (a) => a.id === currentAction.nextActionId,
          );
        } else {
          currentAction = undefined;
        }
      } catch (error) {
        if (error instanceof Error)
          executionLog.push(
            `[Error] Action Node ID: ${currentAction.id} 실패 - ${error.message}`,
          );

        executionLog.push(
          `[Error] Action Node ID: ${currentAction.id} 실패 - ${error}`,
        );

        throw new BadRequestException({
          message: `워크플로우 실행 중 에러가 발생했습니다.`,
          log: executionLog,
        });
      }
    }

    return {
      success: true,
      executionLog,
      results: executionResults,
    };
  }
}
