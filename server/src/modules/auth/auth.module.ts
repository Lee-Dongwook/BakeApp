import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { DynamicRlsService } from "./dynamic-rls.service";
import { RbacContextInterceptor } from "./rbac-context.interceptor";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";

@Module({
  providers: [
    AuthService,
    DynamicRlsService,
    RbacContextInterceptor,
    AuthGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    DynamicRlsService,
    RbacContextInterceptor,
    AuthGuard,
  ],
})
export class AuthModule {}
