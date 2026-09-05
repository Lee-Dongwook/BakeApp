import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "path";
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
import { AuditModule } from "./modules/audit/audit.module";
import { ReleaseModule } from "./modules/release/release.module";
import { EnvironmentModule } from "./modules/environment/environment.module";
import { RuntimeAuthModule } from "./modules/runtime-auth/runtime-auth.module";

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
    AuditModule,
    EnvironmentModule,
    RuntimeAuthModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    ReleaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
