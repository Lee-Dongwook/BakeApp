import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";
import { LocalStorageController } from "./local-storage.controller";
import { LocalStorageService } from "./local-storage.service";

@Module({
  imports: [AuthModule, ProjectModule],
  controllers: [LocalStorageController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class LocalStorageModule {}
