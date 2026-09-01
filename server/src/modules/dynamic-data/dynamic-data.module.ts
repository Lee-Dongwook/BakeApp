import { Module } from "@nestjs/common";
import { DynamicDataService } from "./dynamic-data.service";
import { DynamicDataController } from "./dynamic-data.controller";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [AuthModule, ProjectModule],
  providers: [DynamicDataService],
  controllers: [DynamicDataController],
  exports: [DynamicDataService],
})
export class DynamicDataModule {}
