import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { TenantPolicyService } from "../auth/tenant-policy.service";
import { ProjectController } from "./project.controller";
import { ProjectDocumentService } from "./project-document.service";
import { ProjectMemberService } from "./project-member.service";
import { ProjectService } from "./project.service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectDocumentService,
    ProjectMemberService,
    TenantPolicyService,
  ],
  exports: [ProjectService, ProjectDocumentService, ProjectMemberService],
})
export class ProjectModule {}
