import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { WorkflowEngineService } from "./workflow-engine.service";
import { DatabaseService } from "../database/database.service";

@ApiTags("Workflow Engine (액션 인터프리터)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects/:projectId/workflows")
export class WorkflowController {
  constructor(
    private readonly workflowEngineService: WorkflowEngineService,
    private readonly projectService: ProjectService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "워크플로우 노드 정의 생성",
  })
  async createWorkflow(
    @Param("projectId") projectId: string,
    @Body() body: { name: string; nodes: any[]; edges: any[] },
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    const result = await this.databaseService.query(
      `INSERT INTO workflows (project_id, name, nodes, edges) VALUES ($1, $2, $3::jsonb, $4::jsonb) RETURNING *`,
      [
        projectId,
        body.name,
        JSON.stringify(body.nodes),
        JSON.stringify(body.edges),
      ],
    );
    return result.rows[0];
  }

  @Post(":workflowId/execute")
  @ApiOperation({ summary: "워크플로우 저장 정의 ID 기반 실행" })
  async execute(
    @Param("projectId") projectId: string,
    @Param("workflowId") workflowId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);

    const triggerType = body?.triggerType || "MANUAL";
    const triggerContext = body?.context || body || {};
    const initiatorType = "BUILDER_USER";
    const initiatorId = req.user.id;

    return this.workflowEngineService.executeWorkflow(
      projectId,
      workflowId,
      triggerType,
      triggerContext,
      initiatorType,
      initiatorId,
    );
  }

  @Get(":workflowId/runs")
  @ApiOperation({ summary: "워크플로우 실행 목록 조회 API" })
  async getRuns(
    @Param("projectId") projectId: string,
    @Param("workflowId") workflowId: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);
    return this.workflowEngineService.getWorkflowRuns(workflowId);
  }

  @Get("runs/:runId")
  @ApiOperation({ summary: "WorkflowRun 상세 조회 API" })
  async getRunDetail(
    @Param("projectId") projectId: string,
    @Param("runId") runId: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);
    return await this.workflowEngineService.getWorkflowRunDetail(runId);
  }
}
