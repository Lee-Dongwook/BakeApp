import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { ExternalDatasourceService } from "./external-datasource.service";
import { DatabaseService } from "../database/database.service";

@ApiTags("External Datasource (외부 데이터베이스/API 연동)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects/:projectId/datasources")
export class ExternalDatasourceController {
  constructor(
    private readonly externalDatasourceService: ExternalDatasourceService,
    private readonly projectService: ProjectService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post()
  @ApiOperation({ summary: "외부 데이터소스 등록" })
  async createDatasource(
    @Param("projectId") projectId: string,
    @Body() body: { name: string; type: string; config: any },
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    const result = await this.databaseService.query(
      `INSERT INTO project_datasources (project_id, name, type, config) VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
      [projectId, body.name, body.type, JSON.stringify(body.config)],
    );
    return result.rows[0];
  }

  @Get()
  @ApiOperation({ summary: "등록된 외부 데이터소스 목록 조회" })
  async listDatasources(
    @Param("projectId") projectId: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);
    const result = await this.databaseService.query(
      `SELECT id, name, type, created_at FROM project_datasources WHERE project_id = $1`,
      [projectId],
    );
    return result.rows;
  }

  @Post(":datasourceId/query")
  @ApiOperation({
    summary: "외부 데이터소스 대상으로 동적 SQL 쿼리 실행 테스트 및 호출",
  })
  async executeQuery(
    @Param("projectId") projectId: string,
    @Param("datasourceId") datasourceId: string,
    @Body() body: { sql: string; params?: any[] },
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.externalDatasourceService.executeExternalQuery(
      projectId,
      datasourceId,
      body.sql,
      body.params || [],
    );
  }

  @Delete(":datasourceId")
  @ApiOperation({ summary: "외부 데이터소스 연동 삭제" })
  async deleteDatasource(
    @Param("projectId") projectId: string,
    @Param("datasourceId") datasourceId: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    await this.databaseService.query(
      `DELETE FROM project_datasources WHERE id = $1 AND project_id = $2`,
      [datasourceId, projectId],
    );
    return { success: true, datasourceId };
  }
}
