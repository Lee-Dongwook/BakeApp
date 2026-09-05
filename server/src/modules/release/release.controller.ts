import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { ReleaseService } from "./release.service";

@ApiTags("Project Release & Rollback (버전 관리 및 장애 대응)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects/:projectId/releases")
export class ReleaseController {
  constructor(
    private readonly releaseService: ReleaseService,
    private readonly projectService: ProjectService,
  ) {}

  @Post()
  @ApiOperation({ summary: "현재 상태를 기반으로 새 버전(릴리즈) 생성" })
  async createVersion(
    @Param("projectId") projectId: string,
    @Body() body: { name: string; description?: string },
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.releaseService.createVersion(
      projectId,
      req.user.id,
      body.name,
      body.description,
    );
  }

  @Post(":versionId/deploy")
  @ApiOperation({ summary: "특정 버전을 프로덕션 환경에 배포" })
  async deploy(
    @Param("projectId") projectId: string,
    @Param("versionId") versionId: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.releaseService.deployVersion(projectId, versionId);
  }

  @Post("rollback")
  @ApiOperation({ summary: "운영 장애 발생 시 직전 안정 버전으로 즉시 롤백" })
  async rollback(@Param("projectId") projectId: string, @Req() req: any) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.releaseService.rollbackToPrevious(projectId);
  }
}
