import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { SqlExecutor } from "../../common/tenant-table";
import { WorkflowSanitizer } from "./workflow-sanitizer.utils";

@Injectable()
export class WorkflowPersistenceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createRun(
    projectId: string,
    workflowId: string,
    triggerType: string,
    triggerContext: any,
    initiatorType: string,
    initiatorId: string | null,
    definitionSnapshot: any,
    client?: SqlExecutor,
  ): Promise<string> {
    const query = `
        INSERT INTO workflow_runs(
            project_id, workflow_id, status, trigger_type, trigger_context,
            input, initiator_type, initiator_id, definition_snapshot, started_at, created_at
        ) VALUES ($1, $2, 'PENDING', $3, $4::jsonb, $5::jsonb, $6, $7, $8::jsonb, NOW(), NOW())
         RETURNING id;
      `;
    const sanitizedInput = WorkflowSanitizer.sanitize(triggerContext);
    const params = [
      projectId,
      workflowId,
      triggerType,
      JSON.stringify(sanitizedInput),
      JSON.stringify(sanitizedInput),
      initiatorType,
      initiatorId,
      JSON.stringify(definitionSnapshot),
    ];

    const res = client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);

    return res.rows[0].id;
  }

  async markRunning(runId: string, client?: SqlExecutor): Promise<boolean> {
    const query = `
      UPDATE workflow_runs
      SET status = 'RUNNING', started_at = COALESCE(started_at, NOW())
      WHERE id = $1 AND status IN ('PENDING', 'WAITING');
    `;
    const res = client
      ? await client.query(query, [runId])
      : await this.databaseService.query(query, [runId]);
    return (res.rowCount ?? 0) > 0;
  }

  async markSucceeded(
    runId: string,
    output: any,
    client?: SqlExecutor,
  ): Promise<void> {
    const query = `
      UPDATE workflow_runs
      SET status = 'SUCCEEDED', output = $2::jsonb, finished_at = NOW()
      WHERE id = $1 AND status = 'RUNNING';
      `;
    const sanitizedOutput = WorkflowSanitizer.sanitize(output);
    const params = [runId, JSON.stringify(sanitizedOutput)];
    client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);
  }

  async markFailed(
    runId: string,
    error: any,
    client?: SqlExecutor,
  ): Promise<void> {
    const query = `
      UPDATE workflow_runs
      SET status = 'FAILED', error = $2::jsonb, finished_at = NOW()
      WHERE id = $1 AND status = 'RUNNING';
    `;
    const standardizedError = WorkflowSanitizer.standardizeError(error);
    const params = [runId, JSON.stringify(standardizedError)];
    client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);
  }

  async createStepRun(
    workflowRunId: string,
    nodeId: string,
    nodeType: string,
    attempt: number,
    input: any,
    client?: SqlExecutor,
  ): Promise<string> {
    const query = `
      INSERT INTO workflow_step_runs (
        workflow_run_id, node_id, node_type, status, attempt, input, started_at, created_at
      ) VALUES ($1, $2, $3, 'RUNNING', $4, $5::jsonb, NOW(), NOW())
      RETURNING id;
    `;

    const sanitizedInput = WorkflowSanitizer.sanitize(input);
    const params = [
      workflowRunId,
      nodeId,
      nodeType,
      attempt,
      JSON.stringify(sanitizedInput),
    ];
    const res = client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);
    return res.rows[0].id;
  }

  async markStepSucceeded(
    stepRunId: string,
    output: any,
    durationMs: number,
    client?: SqlExecutor,
  ): Promise<void> {
    const query = `
      UPDATE workflow_step_runs
      SET status = 'SUCCEEDED', output = $2::jsonb, duration_ms = $3, finished_at = NOW()
      WHERE id = $1;
    `;
    const sanitizedOutput = WorkflowSanitizer.sanitize(output);
    const params = [stepRunId, JSON.stringify(sanitizedOutput), durationMs];
    client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);
  }

  async markStepFailed(
    stepRunId: string,
    error: any,
    durationMs: number,
    client?: SqlExecutor,
  ): Promise<void> {
    const query = `
      UPDATE workflow_step_runs
      SET status = 'FAILED', error = $2::jsonb, duration_ms = $3, finished_at = NOW()
      WHERE id = $1;
    `;
    const standardizedError = WorkflowSanitizer.standardizeError(error);
    const params = [stepRunId, JSON.stringify(standardizedError), durationMs];
    client
      ? await client.query(query, params)
      : await this.databaseService.query(query, params);
  }
}
