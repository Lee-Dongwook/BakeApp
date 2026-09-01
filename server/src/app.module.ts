import { Module } from "@nestjs/common";
import { DynamicSchemaModule } from "./modules/dynamic-schema/dynamic-schema.module";
import { DynamicDataModule } from "./modules/dynamic-data/dynamic-data.module";
import { GeneratorModule } from "./modules/generator/generator.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SchemaModule } from "./modules/schema/schema.module";
import { DatabaseModule } from "./modules/database/database.module";

@Module({
  imports: [
    DatabaseModule,
    SchemaModule,
    DynamicSchemaModule,
    DynamicDataModule,
    GeneratorModule,
    WorkflowModule,
    AuthModule,
  ],
  controllers: [],
})
export class AppModule {}
