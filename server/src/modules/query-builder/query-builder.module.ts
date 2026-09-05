import { Module } from "@nestjs/common";
import { QueryBuilderController } from "./query-builder.controller";
import { QueryBuilderService } from "./query-builder.service";
import { DatabaseModule } from "../database/database.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [DatabaseModule, ProjectModule],
  controllers: [QueryBuilderController],
  providers: [QueryBuilderService],
  exports: [QueryBuilderService],
})
export class QueryBuilderModule {}
