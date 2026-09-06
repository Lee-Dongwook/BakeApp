import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { EnvironmentModule } from "../environment/environment.module";
import { QueryBuilderModule } from "../query-builder/query-builder.module";
import { ReleaseModule } from "../release/release.module";
import { RuntimeAuthModule } from "../runtime-auth/runtime-auth.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { RuntimeAppController } from "./runtime-app.controller";
import { RuntimeAppResolverService } from "./runtime-app-resolver.service";
import { RuntimeAuditService } from "./runtime-audit.service";
import { RuntimeCacheModule } from "./runtime-cache.module";
import { RuntimeDeploymentService } from "./runtime-deployment.service";
import { RuntimeEnvService } from "./runtime-env.service";
import { RuntimeExecutionController } from "./runtime-execution.controller";
import { RuntimeResourceValidatorService } from "./runtime-resource-validator.service";

@Module({
  imports: [
    DatabaseModule,
    RuntimeAuthModule,
    WorkflowModule,
    QueryBuilderModule,
    EnvironmentModule,
    ReleaseModule,
    RuntimeCacheModule,
  ],
  controllers: [RuntimeAppController, RuntimeExecutionController],
  providers: [
    RuntimeAppResolverService,
    RuntimeResourceValidatorService,
    RuntimeEnvService,
    RuntimeAuditService,
    RuntimeDeploymentService,
  ],
  exports: [
    RuntimeAppResolverService,
    RuntimeAuditService,
    RuntimeDeploymentService,
  ],
})
export class RuntimeModule {}
