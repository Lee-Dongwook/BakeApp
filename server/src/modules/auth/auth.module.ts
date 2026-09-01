import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { DynamicRlsService } from "./dynamic-rls.service";
import { RbacContextInterceptor } from "./rbac-context.interceptor";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "../../config/supabase.service";

@Module({
  providers: [
    SupabaseService,
    AuthService,
    DynamicRlsService,
    RbacContextInterceptor,
  ],
  controllers: [AuthController],
  exports: [AuthService, DynamicRlsService, RbacContextInterceptor],
})
export class AuthModule {}
