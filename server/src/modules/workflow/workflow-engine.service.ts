import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { WorkflowService } from "./workflow.service";
import { WorkflowPersistenceService } from "./workflow-persistence.service";
import { WorkflowPayload } from "./workflow.interface";

@Injectable()
export class WorkflowEngineService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly workflowService: WorkflowService,
    private readonly persistence: WorkflowPersistenceService,
  ) {}

  async executeWorkflow(
    projectId: string,
    workflowId: string,
    triggerType: string,
    triggerContext: Record<string, any>,
    initiatorType: string,
    initiatorId: string | null,
  ) {
    const workflowQuery = `SELECT * FROM workflows WHERE id = $1 AND project_id = $2;`;
    const workflowRes = await this.databaseService.query(workflowQuery, [
      workflowId,
      projectId,
    ]);

    if (workflowRes.rows.length === 0) {
      throw new NotFoundException("해당 워크플로우 정의를 찾을 수 없습니다.");
    }

    const workflow = workflowRes.rows[0];
    const payload: WorkflowPayload = {
      projectId,
      workflowId,
      trigger: triggerType as any,
      actions: workflow.nodes || workflow.actions || [],
      startActionId: workflow.start_action_id,
    };

    try {
      const executionResult = await this.workflowService.executeWorkflow(
        payload,
        triggerContext,
      );
      return executionResult;
    } catch (error: any) {
      throw new BadRequestException({
        message: "워크플로우 실행 중 에러가 발생했습니다.",
        error: error.message,
        response: error.getResponse ? error.getResponse() : null,
      });
    }
  }

  async getWorkflowRuns(workflowId: string) {
    const res = await this.databaseService.query(
      `SELECT id, project_id, workflow_id, status, trigger_type, started_at, finished_at, created_at
       FROM workflow_runs
       WHERE workflow_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [workflowId],
    );
    return res.rows;
  }

  async getWorkflowRunDetail(runId: string) {
    const runQuery = `SELECT * FROM workflow_runs WHERE id = $1;`;

    const runRes = await this.databaseService.query(runQuery, [runId]);

    if (runRes.rows.length === 0) {
      throw new NotFoundException(
        "해당 워크플로우 실행 이력을 찾을 수 없습니다.",
      );
    }

    const run = runRes.rows[0];
    const stepsQuery = `
      SELECT * FROM workflow_step_runs 
      WHERE workflow_run_id = $1 
      ORDER BY created_at ASC, attempt ASC;
    `;
    const stepsRes = await this.databaseService.query(stepsQuery, [runId]);

    return {
      ...run,
      steps: stepsRes.rows,
    };
  }
}
