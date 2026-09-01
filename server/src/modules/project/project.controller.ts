import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectDocumentService } from "./project-document.service";
import { ProjectService } from "./project.service";

class CreateProjectDto {
  name: string;
}

class SaveProjectDocumentDto {
  document: Record<string, unknown>;
}

@ApiTags("Projects (프로젝트)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects")
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectDocumentService: ProjectDocumentService,
  ) {}

  @Post()
  @ApiOperation({ summary: "새 프로젝트 생성" })
  async create(@Body() dto: CreateProjectDto, @Req() req: any) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException("프로젝트 이름을 입력해 주세요.");
    }
    if (name.length > 100) {
      throw new BadRequestException("프로젝트 이름은 100자 이하여야 합니다.");
    }

    return this.projectService.create(req.user.id, name);
  }

  @Get()
  @ApiOperation({ summary: "내 프로젝트 목록 조회" })
  async findAll(@Req() req: any) {
    return this.projectService.findAllByOwner(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "내 프로젝트 상세 조회" })
  async findOne(@Param("id") id: string, @Req() req: any) {
    return this.projectService.findOneByOwner(id, req.user.id);
  }

  @Get(":id/document")
  @ApiOperation({ summary: "프로젝트 편집 문서 조회" })
  async getDocument(@Param("id") id: string, @Req() req: any) {
    await this.projectService.findOneByOwner(id, req.user.id);
    return this.projectDocumentService.findByProjectId(id);
  }

  @Put(":id/document")
  @ApiOperation({ summary: "프로젝트 편집 문서 저장" })
  async saveDocument(
    @Param("id") id: string,
    @Body() dto: SaveProjectDocumentDto,
    @Req() req: any,
  ) {
    if (
      !dto.document ||
      typeof dto.document !== "object" ||
      Array.isArray(dto.document)
    ) {
      throw new BadRequestException("document는 JSON 객체여야 합니다.");
    }

    await this.projectService.findOneByOwner(id, req.user.id);
    return this.projectDocumentService.save(id, dto.document);
  }
}
