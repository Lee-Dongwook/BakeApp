import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { ValueResolverService } from "./value-resolver.service";
import { WorkflowController } from "./workflow.controller";
import { DynamicDataModule } from "../dynamic-data/dynamic-data.module";

@Module({
  imports: [DynamicDataModule],
  providers: [WorkflowService, ValueResolverService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
