import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { WorkflowPayload } from "./workflow.interface";
import { WorkflowService } from "./workflow.service";
import { EnvironmentService } from "../environment/environment.service";

@ApiTags("Workflow Engine (액션 인터프리터)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/workflow")
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly projectService: ProjectService,
    private readonly environmentService: EnvironmentService,
  ) {}

  @Post("execute")
  @ApiOperation({
    summary: "버튼/이벤트 워크플로우 순차 실행",
    description:
      "프론트엔드에서 트리거된 연쇄 액션 노드 트리를 백엔드에서 인터프리팅하여 DB 연동 및 클라이언트 액션을 처리합니다.",
  })
  @ApiBody({
    description: "실행할 워크플로우 페이로드 및 트리거 정보",
    schema: {
      type: "object",
      properties: {
        projectId: { type: "string", example: "proj_12345" },
        trigger: {
          type: "string",
          enum: ["ON_CLICK", "ON_PAGE_LOAD", "ON_SUBMIT"],
          example: "ON_CLICK",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", example: "node_1" },
              type: {
                type: "string",
                enum: [
                  "DB_INSERT",
                  "DB_UPDATE",
                  "DB_DELETE",
                  "CONDITION",
                  "API_CALL",
                  "NAVIGATE",
                  "SHOW_ALERT",
                  "SHOW_TOAST",
                ],
                example: "DB_INSERT",
              },
              params: { type: "object" },
              nextActionId: { type: "string", example: "node_2" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "워크플로우 성공적 실행" })
  async execute(
    @Body() payload: WorkflowPayload,
    @Body("context") clientContext: Record<string, any> = {},
    @Req() req: any,
  ) {
    if (!payload?.projectId) {
      throw new BadRequestException("projectId는 필수입니다.");
    }
    await this.projectService.ensureCanEdit(payload.projectId, req.user.id);

    const envMap = payload.projectId
      ? await this.environmentService.getResolvedEnvironmentMap(
          payload.projectId,
        )
      : {};

    const context = {
      ...clientContext,
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      current_user: req.runtimeUser
        ? { id: req.runtimeUser.sub, role: req.runtimeUser.role }
        : null,
      env: envMap,
    };

    return this.workflowService.executeWorkflow(payload, context);
  }
}
