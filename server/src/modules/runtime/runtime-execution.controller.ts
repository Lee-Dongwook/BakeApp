import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { RuntimeGuard } from "../runtime-auth/runtime.guard";
import { RuntimeAppResolverService } from "./runtime-app-resolver.service";
import { RuntimeResourceValidatorService } from "./runtime-resource-validator.service";
import { RuntimeEnvService } from "./runtime-env.service";
import { WorkflowEngineService } from "../workflow/workflow-engine.service";
import { QueryBuilderService } from "../query-builder/query-builder.service";

@ApiTags("Runtime Execution Engine")
@ApiBearerAuth()
@UseGuards(RuntimeGuard)
@Controller("api/runtime/apps/:slug")
export class RuntimeExecutionController {
  constructor(
    private readonly appResolver: RuntimeAppResolverService,
    private readonly resourceValidator: RuntimeResourceValidatorService,
    private readonly envService: RuntimeEnvService,
    private readonly workflowEngineService: WorkflowEngineService,
    private readonly queryBuilderService: QueryBuilderService,
  ) {}

  @Post("queries/:queryId/execute")
  @ApiOperation({ summary: "Runtime Stored Query 실행" })
  async executeQuery(
    @Param("slug") slug: string,
    @Param("queryId") queryId: string,
    @Body() body: { parameters?: Record<string, any> },
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { manifest, releaseVersion, snapshot } =
      await this.appResolver.resolveBySlug(slug);
    const projectId = manifest.app.id;

    const queryDef = this.resourceValidator.validateResourceInRelease(
      snapshot,
      "queries",
      queryId,
    );

    const resolvedQueryDef = await this.envService.resolveEnvironmentVariables(
      projectId,
      queryDef,
    );

    const executionResult = await this.queryBuilderService.executeStoredQuery(
      projectId,
      resolvedQueryDef,
      body.parameters || {},
      req.runtimeUser,
    );

    res.setHeader("X-BakeApp-Release", String(releaseVersion));
    return res.status(HttpStatus.OK).json({
      success: true,
      data: executionResult,
    });
  }

  @Post("workflows/:workflowId/run")
  @ApiOperation({ summary: "Runtime Workflow 실행 (Release Isolation 적용)" })
  async runWorkflow(
    @Param("slug") slug: string,
    @Param("workflowId") workflowId: string,
    @Body()
    body: { triggerType?: string; triggerContext?: Record<string, any> },
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { manifest, releaseVersion, snapshot } =
      await this.appResolver.resolveBySlug(slug);
    const projectId = manifest.app.id;

    this.resourceValidator.validateResourceInRelease(
      snapshot,
      "workflows",
      workflowId,
    );

    const triggerType = body.triggerType || "RUNTIME_API";
    const triggerContext = {
      ...(body.triggerContext || {}),
      currentUser: req.runtimeUser,
    };

    const result = await this.workflowEngineService.executeWorkflow(
      projectId,
      workflowId,
      triggerType,
      triggerContext,
      "RUNTIME_USER",
      req.runtimeUser.id,
    );

    res.setHeader("X-BakeApp-Release", String(releaseVersion));
    return res.status(HttpStatus.OK).json(result);
  }
}
