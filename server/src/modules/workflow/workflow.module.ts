import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { DatabaseModule } from "../database/database.module";
import { ValueResolverService } from "./value-resolver.service";
import { WorkflowController } from "./workflow.controller";
import { WorkflowEngineService } from "./workflow-engine.service";
import { WorkflowPersistenceService } from "./workflow-persistence.service";
import { DynamicDataModule } from "../dynamic-data/dynamic-data.module";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";
import { EnvironmentModule } from "../environment/environment.module";

@Module({
  imports: [
    DatabaseModule,
    DynamicDataModule,
    AuthModule,
    ProjectModule,
    EnvironmentModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowEngineService,
    WorkflowPersistenceService,
    ValueResolverService,
  ],
  exports: [
    WorkflowService,
    WorkflowEngineService,
    WorkflowPersistenceService,
    ValueResolverService,
  ],
})
export class WorkflowModule {}
