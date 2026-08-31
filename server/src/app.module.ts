import { Module } from "@nestjs/common";
import { SupabaseService } from "./config/supabase.service";
import { DynamicSchemaModule } from "./modules/dynamic-schema/dynamic-schema.module";

@Module({
  imports: [DynamicSchemaModule],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
