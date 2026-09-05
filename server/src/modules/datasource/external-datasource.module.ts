import { Module } from "@nestjs/common";
import { ExternalDatasourceService } from "./external-datasource.service";
import { ExternalDatasourceController } from "./external-datasource.controller";
import { DatabaseModule } from "../database/database.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [DatabaseModule, ProjectModule],
  controllers: [ExternalDatasourceController],
  providers: [ExternalDatasourceService],
  exports: [ExternalDatasourceService],
})
export class ExternalDatasourceModule {}
