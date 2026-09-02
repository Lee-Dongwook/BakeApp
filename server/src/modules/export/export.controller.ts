import {
  Controller,
  Get,
  Param,
  UseGuards,
  StreamableFile,
  Header,
} from "@nestjs/common";
import { ExportService } from "./export.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(":projectId/zip")
  @UseGuards(AuthGuard)
  @Header("Content-Type", "application/zip")
  async downloadExportZip(@Param("projectId") projectId: string) {
    const zipBuffer = await this.exportService.generateProjectZip(projectId);

    return new StreamableFile(zipBuffer, {
      type: "application/zip",
      disposition: `attachment; filename="project-${projectId}-export.zip"`,
    });
  }
}
