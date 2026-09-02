import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { ValueResolverService } from "./value-resolver.service";
import { WorkflowController } from "./workflow.controller";
import { DynamicDataModule } from "../dynamic-data/dynamic-data.module";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [DynamicDataModule, AuthModule, ProjectModule],
  providers: [WorkflowService, ValueResolverService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
