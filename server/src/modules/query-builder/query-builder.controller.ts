import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { ExecuteQueryDto } from "./dto/query-builder.dto";
import { QueryBuilderService } from "./query-builder.service";

@ApiTags("Query Builder (관계형 동적 쿼리 엔진)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects/:projectId/query")
export class QueryBuilderController {
  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    private readonly projectService: ProjectService,
  ) {}

  @Post("execute")
  @ApiOperation({ summary: "관계형 테이블 조인 및 동적 조건 조회 쿼리 실행" })
  async executeQuery(
    @Param("projectId") projectId: string,
    @Body() dto: ExecuteQueryDto,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);
    return this.queryBuilderService.executeQuery(projectId, dto);
  }
}
