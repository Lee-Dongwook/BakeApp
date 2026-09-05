import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditInterceptor } from "./audit.interceptor";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
