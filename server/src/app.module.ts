import { Module } from "@nestjs/common";
import { SupabaseService } from "./config/supabase.service";

@Module({
  imports: [],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
