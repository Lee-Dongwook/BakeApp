import { Module } from "@nestjs/common";
import { DynamicDataService } from "./dynamic-data.service";
import { DynamicDataController } from "./dynamic-data.controller";

@Module({
  providers: [DynamicDataService],
  controllers: [DynamicDataController],
  exports: [DynamicDataService],
})
export class DynamicDataModule {}
