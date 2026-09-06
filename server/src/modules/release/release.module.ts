import { Module } from "@nestjs/common";
import { ReleaseService } from "./release.service";
import { ReleaseController } from "./release.controller";
import { DatabaseModule } from "../database/database.module";
import { ProjectModule } from "../project/project.module";
import { SchemaModule } from "../schema/schema.module";
import { RuntimeCacheModule } from "../runtime/runtime-cache.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    ProjectModule,
    SchemaModule,
    RuntimeCacheModule,
  ],
  controllers: [ReleaseController],
  providers: [ReleaseService],
  exports: [ReleaseService],
})
export class ReleaseModule {}
