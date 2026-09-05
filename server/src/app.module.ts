import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./modules/database/database.module";
import { DynamicDataModule } from "./modules/dynamic-data/dynamic-data.module";
import { DynamicSchemaModule } from "./modules/dynamic-schema/dynamic-schema.module";
import { ExportModule } from "./modules/export/export.module";
import { FigmaModule } from "./modules/figma/figma.module";
import { GeneratorModule } from "./modules/generator/generator.module";
import { ProjectModule } from "./modules/project/project.module";
import { SchemaModule } from "./modules/schema/schema.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";
import { QueryBuilderModule } from "./modules/query-builder/query-builder.module";

@Module({
  imports: [
    DatabaseModule,
    SchemaModule,
    DynamicSchemaModule,
    DynamicDataModule,
    GeneratorModule,
    WorkflowModule,
    AuthModule,
    ProjectModule,
    ExportModule,
    FigmaModule,
    QueryBuilderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
