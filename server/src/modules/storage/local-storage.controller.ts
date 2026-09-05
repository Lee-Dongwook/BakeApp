import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response, Express } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { ProjectService } from "../project/project.service";
import { LocalStorageService } from "./local-storage.service";

@ApiTags("Local Storage (로컬 파일 관리)")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/projects/:projectId/storage")
export class LocalStorageController {
  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly projectService: ProjectService,
  ) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "로컬 서버로 파일 직접 업로드" })
  async uploadFile(
    @Param("projectId") projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.localStorageService.saveFile(projectId, file);
  }

  @Get("download")
  @ApiOperation({ summary: "로컬 저장된 파일 다운로드/조회" })
  async downloadFile(
    @Param("projectId") projectId: string,
    @Query("key") key: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    await this.projectService.ensureCanView(projectId, req.user.id);
    const filePath = this.localStorageService.getFilePath(key);
    return res.sendFile(filePath);
  }

  @Delete()
  @ApiOperation({ summary: "로컬 저장된 파일 삭제" })
  async deleteFile(
    @Param("projectId") projectId: string,
    @Query("key") key: string,
    @Req() req: any,
  ) {
    await this.projectService.ensureCanEdit(projectId, req.user.id);
    return this.localStorageService.deleteFile(key);
  }
}
