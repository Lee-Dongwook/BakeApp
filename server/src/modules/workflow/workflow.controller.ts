import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { WorkflowService } from "./workflow.service";
import { WorkflowPayload } from "./workflow.interface";

@ApiTags("Workflow Engine (액션 인터프리터)")
@Controller("api/workflow")
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post("execute")
  @ApiOperation({
    summary: "버튼/이벤트 워크플로우 순차 실행",
    description:
      "프론트엔드에서 트리거된 연쇄 액션 노드 트리를 백엔드에서 인터프리팅하여 DB 연동 및 클라이언트 액션을 처리합니다.",
  })
  @ApiResponse({ status: 201, description: "워크플로우 성공적 실행" })
  async execute(@Body() payload: WorkflowPayload) {
    return this.workflowService.executeWorkflow(payload);
  }
}
