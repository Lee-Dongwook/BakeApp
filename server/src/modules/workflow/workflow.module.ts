import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { WorkflowController } from "./workflow.controller";
import { DynamicDataModule } from "../dynamic-data/dynamic-data.module";

@Module({
  imports: [DynamicDataModule],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
