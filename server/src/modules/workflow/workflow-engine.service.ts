import { Injectable, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

interface WorkflowNode {
  id: string;
  type: "ACTION" | "CONDITION" | "LOOP" | "RETRY";
  config: {
    actionType?: string; // e.g., "QUERY", "HTTP"
    expression?: string; // CONDITION용 조건식 (예: "data.age > 18")
    loopItemsPath?: string; // LOOP용 순회할 데이터 경로
    maxRetries?: number; // RETRY용 최대 재시도 횟수
    retryDelayMs?: number; // 재시도 대기 시간
    [key: string]: any;
  };
}

@Injectable()
export class WorkflowEngineService {
  constructor(private readonly databaseService: DatabaseService) {}

  async executeWorkflow(workflowId: string, initialInput: any) {
    const wfRes = await this.databaseService.query<{
      nodes: WorkflowNode[];
      edges: any[];
    }>(
      `SELECT nodes, edges FROM workflows WHERE id = $1 AND is_active = true`,
      [workflowId],
    );

    if (wfRes.rows.length === 0) {
      throw new BadRequestException("활성화된 워크플로우를 찾을 수 없습니다.");
    }

    const { nodes } = wfRes.rows[0];
    const executionLogs: any[] = [];
    let currentContext = { ...initialInput };

    try {
      for (const node of nodes) {
        const result = await this.executeNodeWithPolicies(node, currentContext);
        executionLogs.push({
          nodeId: node.id,
          type: node.type,
          status: "SUCCESS",
          result,
        });
        currentContext = { ...currentContext, ...result };
      }

      await this.saveLog(workflowId, "SUCCESS", executionLogs);
      return { success: true, context: currentContext, logs: executionLogs };
    } catch (error: any) {
      executionLogs.push({ status: "FAILED", error: error.message });
      await this.saveLog(workflowId, "FAILED", executionLogs);
      throw new BadRequestException(`워크플로우 실행 중단: ${error.message}`);
    }
  }

  private async executeNodeWithPolicies(
    node: WorkflowNode,
    context: any,
  ): Promise<any> {
    let attempt = 0;
    const maxRetries = node.config.maxRetries || 0;
    const retryDelayMs = node.config.retryDelayMs || 1000;

    while (attempt <= maxRetries) {
      try {
        switch (node.type) {
          case "CONDITION":
            return this.evaluateCondition(node.config.expression, context);

          case "LOOP":
            return await this.evaluateLoop(node, context);

          case "ACTION":
            return await this.executeAction(node.config, context);

          default:
            return context;
        }
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

  private evaluateCondition(
    expression: string,
    context: any,
  ): { branch: string; conditionMet: boolean } {
    try {
      const evaluateFn = new Function(
        "context",
        `with(context) { return !!(${expression}); }`,
      );
      const conditionMet = evaluateFn(context);
      return { branch: conditionMet ? "true" : "false", conditionMet };
    } catch (error: any) {
      throw new BadRequestException(
        `조건식 평가 실패 (${expression}): ${error.message}`,
      );
    }
  }

  private async evaluateLoop(node: WorkflowNode, context: any): Promise<any> {
    const items = context[node.config.loopItemsPath] || [];
    if (!Array.isArray(items)) {
      throw new BadRequestException("반복할 배열 데이터를 찾을 수 없습니다.");
    }

    const loopResults = [];
    for (const item of items) {
      const loopContext = { ...context, currentItem: item };
      // 루프 내부 액션 수행 로직 확장 가능
      loopResults.push(loopContext);
    }
    return { loopResults };
  }

  private async executeAction(config: any, context: any): Promise<any> {
    return { actionExecuted: true, config };
  }

  private async saveLog(workflowId: string, status: string, detail: any) {
    await this.databaseService.query(
      `INSERT INTO workflow_logs (workflow_id, status, execution_detail) VALUES ($1, $2, $3::jsonb)`,
      [workflowId, status, JSON.stringify(detail)],
    );
  }
}
