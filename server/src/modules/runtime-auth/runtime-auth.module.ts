import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "../database/database.module";
import { RuntimeAuthController } from "./runtime-auth.controller";
import { RuntimeAuthService } from "./runtime-auth.service";
import { RuntimeGuard } from "./runtime.guard";

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [RuntimeAuthController],
  providers: [RuntimeAuthService, RuntimeGuard],
  exports: [RuntimeAuthService, RuntimeGuard],
})
export class RuntimeAuthModule {}
