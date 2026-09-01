import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProjectController } from "./project.controller";
import { ProjectDocumentService } from "./project-document.service";
import { ProjectMemberService } from "./project-member.service";
import { ProjectService } from "./project.service";

@Module({
  imports: [AuthModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectDocumentService, ProjectMemberService],
  exports: [ProjectService],
})
export class ProjectModule {}
