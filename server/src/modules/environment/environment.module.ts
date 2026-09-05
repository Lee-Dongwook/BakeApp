import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { EnvironmentService } from "./environment.service";

@Module({
  imports: [DatabaseModule],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
