import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { TenantPolicyService } from "../auth/tenant-policy.service";
import { ProjectDocumentService } from "./project-document.service";
import {
  ProjectMemberRole,
  ProjectMemberService,
} from "./project-member.service";
import { ProjectService } from "./project.service";

class CreateProjectDto {
  @ApiProperty({ description: "프로젝트 이름", example: "BakeApp Demo" })
  name: string;
}

class SaveProjectDocumentDto {
  @ApiProperty({ description: "노코드 캔버스 JSON 문서" })
  document: Record<string, unknown>;
}

class RenameProjectDto {
  @ApiProperty({ description: "변경할 프로젝트 이름" })
  name: string;
}

class AddProjectMemberDto {
  @ApiProperty({
    description: "초대할 사용자 ID (userId 또는 email 둘 중 하나 선택)",
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: "초대할 사용자 이메일 (피그마 공유용)",
    required: false,
  })
  email?: string;

  @ApiProperty({
    enum: ProjectMemberRole,
    description: "역할 (viewer 또는 editor)",
  })
  role: ProjectMemberRole;
}

@ApiTags("Projects (프로젝트)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects")
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectDocumentService: ProjectDocumentService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly tenantPolicyService: TenantPolicyService,
  ) {}

  @Post()
  @ApiOperation({ summary: "새 프로젝트 생성 (쿼터 제한 허용)" })
  async create(@Body() dto: CreateProjectDto, @Req() req: any) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException("프로젝트 이름을 입력해 주세요.");
    }
    if (name.length > 100) {
      throw new BadRequestException("프로젝트 이름은 100자 이하여야 합니다.");
    }

    await this.tenantPolicyService.checkProjectCreationLimit(req.user.id);

    return this.projectService.create(req.user.id, name);
  }

  @Get()
  @ApiOperation({ summary: "내 프로젝트 목록 조회" })
  async findAll(@Req() req: any) {
    return this.projectService.findAllAccessibleByUser(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "내 프로젝트 상세 조회" })
  async findOne(@Param("id") id: string, @Req() req: any) {
    return this.projectService.findOneAccessibleByUser(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "프로젝트 이름 변경" })
  async rename(
    @Param("id") id: string,
    @Body() dto: RenameProjectDto,
    @Req() req: any,
  ) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException("프로젝트 이름을 입력해 주세요.");
    }
    if (name.length > 100) {
      throw new BadRequestException("프로젝트 이름은 100자 이하여야 합니다.");
    }

    return this.projectService.rename(id, req.user.id, name);
  }

  @Delete(":id")
  @ApiOperation({ summary: "프로젝트 삭제" })
  async delete(@Param("id") id: string, @Req() req: any) {
    await this.projectService.delete(id, req.user.id);
    return { success: true };
  }

  @Get(":id/members")
  @ApiOperation({ summary: "프로젝트 멤버 목록 조회" })
  async findMembers(@Param("id") id: string, @Req() req: any) {
    await this.projectService.findOneAccessibleByUser(id, req.user.id);
    return this.projectMemberService.findAll(id);
  }

  @Post(":id/members")
  @ApiOperation({ summary: "프로젝트 멤버 추가 또는 역할 변경" })
  async addMember(
    @Param("id") id: string,
    @Body() dto: AddProjectMemberDto,
    @Req() req: any,
  ) {
    if (!dto.userId && !dto.email) {
      throw new BadRequestException(
        "추가할 사용자 ID 혹은 이메일을 입력해 주세요.",
      );
    }
    if (!Object.values(ProjectMemberRole).includes(dto.role)) {
      throw new BadRequestException("역할은 viewer 또는 editor여야 합니다.");
    }

    await this.projectService.findOneByOwner(id, req.user.id);

    if (dto.email) {
      return this.projectMemberService.upsertByEmail(id, dto.email, dto.role);
    }

    return this.projectMemberService.upsert(id, dto.userId!, dto.role);
  }

  @Delete(":id/members/:userId")
  @ApiOperation({ summary: "프로젝트 멤버 강퇴 / 삭제" })
  async removeMember(
    @Param("id") id: string,
    @Param("userId") targetUserId: string,
    @Req() req: any,
  ) {
    await this.projectService.findOneByOwner(id, req.user.id);
    await this.projectMemberService.remove(id, targetUserId);
    return { success: true, message: "멤버가 프로젝트에서 제외되었습니다." };
  }

  @Get(":id/document")
  @ApiOperation({ summary: "프로젝트 편집 문서 조회" })
  async getDocument(@Param("id") id: string, @Req() req: any) {
    await this.projectService.findOneAccessibleByUser(id, req.user.id);
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

    await this.projectService.ensureCanEdit(id, req.user.id);
    return this.projectDocumentService.save(id, dto.document);
  }
}
