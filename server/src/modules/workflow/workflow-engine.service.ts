import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { WorkflowService } from "./workflow.service";
import { ActionNode } from "./workflow.interface";

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
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly workflowService: WorkflowService,
  ) {}

  async executeWorkflow(workflowId: string, initialInput: any) {
    const wfRes = await this.databaseService.query<{
      id: string;
      project_id: string;
      name: string;
      nodes: ActionNode[];
      is_active: boolean;
    }>(
      `SELECT id, project_id, name, nodes, is_active FROM workflows WHERE id = $1`,
      [workflowId],
    );

    if (wfRes.rows.length === 0) {
      throw new NotFoundException("지정한 워크플로우를 찾을 수 없습니다.");
    }

    const workflow = wfRes.rows[0];
    if (!workflow.is_active) {
      throw new BadRequestException("비활성화된 워크플로우입니다.");
    }

    const logRes = await this.databaseService.query<{ id: string }>(
      `INSERT INTO workflow_logs (workflow_id, status, execution_detail) VALUES ($1, $2, $3::jsonb) RETURNING id`,
      [workflowId, "RUNNING", JSON.stringify({ steps: {}, logs: [] })],
    );
    const runId = logRes.rows[0].id;

    try {
      const executionResult = await this.workflowService.executeWorkflowChain(
        workflow.project_id,
        workflow.nodes,
        initialInput,
      );

      await this.databaseService.query(
        `UPDATE workflow_logs SET status = $1, execution_detail = $2::jsonb WHERE id = $3`,
        ["SUCCESS", JSON.stringify(executionResult), runId],
      );

      return { success: true, runId, ...executionResult };
    } catch (error: any) {
      const failDetail = {
        message: error.message,
        response: error.getResponse ? error.getResponse() : null,
      };

      await this.databaseService.query(
        `UPDATE workflow_logs SET status = $1, execution_detail = $2::jsonb WHERE id = $3`,
        ["FAILED", JSON.stringify(failDetail), runId],
      );

      throw new BadRequestException({
        message: `워크플로우 실행 실패 (Run ID: ${runId})`,
        error: error.message,
      });
    }
  }

  async getWorkflowRuns(workflowId: string) {
    const res = await this.databaseService.query(
      `SELECT id, status, created_at FROM workflow_logs WHERE workflow_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [workflowId],
    );
    return res.rows;
  }

  async getWorkflowRunDetail(runId: string) {
    const res = await this.databaseService.query(
      `SELECT id, workflow_id, status, execution_detail, created_at FROM workflow_logs WHERE id = $1`,
      [runId],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(
        "해당 워크플로우 실행 로그를 찾을 수 없습니다.",
      );
    }
    return res.rows[0];
  }
}
