import { Module } from "@nestjs/common";
import { SupabaseService } from "./config/supabase.service";
import { DynamicSchemaModule } from "./modules/dynamic-schema/dynamic-schema.module";
import { DynamicDataModule } from "./modules/dynamic-data/dynamic-data.module";
import { GeneratorModule } from "./modules/generator/generator.module";

@Module({
  imports: [DynamicSchemaModule, DynamicDataModule, GeneratorModule],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
