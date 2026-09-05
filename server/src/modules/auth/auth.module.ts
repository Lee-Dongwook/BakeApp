import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { TenantPolicyService } from "./tenant-policy.service";

@Module({
  providers: [AuthService, AuthGuard, TenantPolicyService],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, TenantPolicyService],
})
export class AuthModule {}
