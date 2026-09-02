import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";
import { GeneratorModule } from "../generator/generator.module";

@Module({
  imports: [DatabaseModule, AuthModule, ProjectModule, GeneratorModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
