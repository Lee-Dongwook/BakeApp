import { Module } from "@nestjs/common";
import { DynamicDataService } from "./dynamic-data.service";
import { DynamicDataController } from "./dynamic-data.controller";
import { DatabaseService } from "../../config/database.service";

@Module({
  providers: [DatabaseService, DynamicDataService],
  controllers: [DynamicDataController],
  exports: [DynamicDataService],
})
export class DynamicDataModule {}
