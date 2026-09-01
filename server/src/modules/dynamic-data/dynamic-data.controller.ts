import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { DynamicDataService } from "./dynamic-data.service";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";

@ApiTags("Dynamic Data (동적 CRUD)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/dynamic-data")
export class DynamicDataController {
  constructor(
    private readonly dataService: DynamicDataService,
    private readonly projectService: ProjectService,
  ) {}

  @Post(":projectId/:tableName")
  @ApiOperation({ summary: "데이터 생성 (INSERT)" })
  @ApiParam({ name: "projectId", description: "프로젝트 ID" })
  @ApiParam({ name: "tableName", description: "테이블명" })
  async create(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.dataService.create(projectId, tableName, body);
  }

  @Get(":projectId/:tableName")
  @ApiOperation({ summary: "데이터 목록 조회 (SELECT Pagination)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  async findAll(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() req?: any,
  ) {
    await this.projectService.findOneAccessibleByUser(projectId, req.user.id);
    return this.dataService.findAll(
      projectId,
      tableName,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(":projectId/:tableName/:id")
  @ApiOperation({ summary: "데이터 삭제 (DELETE)" })
  @ApiOperation({ summary: "단일 데이터 조회 (SELECT BY ID)" })
  async findOne(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
    @Req() req: any,
  ) {
    await this.projectService.findOneAccessibleByUser(projectId, req.user.id);
    return this.dataService.findOne(projectId, tableName, id);
  }

  @Patch(":projectId/:tableName/:id")
  @ApiOperation({ summary: "데이터 수정 (UPDATE)" })
  async update(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.dataService.update(projectId, tableName, id, body);
  }

  @Delete(":projectId/:tableName/:id")
  async remove(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.dataService.remove(projectId, tableName, id);
  }
}
