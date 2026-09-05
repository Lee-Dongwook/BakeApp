import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { DatabaseModule } from "../database/database.module";
import { ValueResolverService } from "./value-resolver.service";
import { WorkflowController } from "./workflow.controller";
import { DynamicDataModule } from "../dynamic-data/dynamic-data.module";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [DatabaseModule, DynamicDataModule, AuthModule, ProjectModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, ValueResolverService],
  exports: [WorkflowService, ValueResolverService],
})
export class WorkflowModule {}
