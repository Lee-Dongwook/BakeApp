import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "../../config/supabase.service";

@Module({
  providers: [SupabaseService, AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
