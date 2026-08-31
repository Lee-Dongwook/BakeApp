import { Module } from "@nestjs/common";
import { SupabaseService } from "./config/supabase.service";
import { DynamicSchemaModule } from "./modules/dynamic-schema/dynamic-schema.module";
import { DynamicDataModule } from "./modules/dynamic-data/dynamic-data.module";

@Module({
  imports: [DynamicSchemaModule, DynamicDataModule],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
