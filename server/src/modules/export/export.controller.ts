import {
  Controller,
  Get,
  Param,
  UseGuards,
  StreamableFile,
  Header,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ExportService } from "./export.service";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { TenantPolicyService } from "../auth/tenant-policy.service";

@ApiTags("Project Export (전체 프로젝트 Zip 내보내기)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/export")
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly projectService: ProjectService,
    private readonly tenantPolicyService: TenantPolicyService,
  ) {}

  @Get(":projectId/zip")
  @ApiOperation({ summary: "프로젝트 전체 소스코드 zip 아카이브 다운로드" })
  @Header("Content-Type", "application/zip")
  async downloadExportZip(
    @Param("projectId") projectId: string,
    @Req() req: any,
  ) {
    await this.projectService.findOneAccessibleByUser(projectId, req.user.id);
    await this.tenantPolicyService.checkCodeExportPermission(req.user.id);
    const zipBuffer = await this.exportService.generateProjectZip(projectId);

    return new StreamableFile(zipBuffer, {
      type: "application/zip",
      disposition: `attachment; filename="project-${projectId}-export.zip"`,
    });
  }
}
