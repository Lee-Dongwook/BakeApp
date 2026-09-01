import { Module } from "@nestjs/common";
import { DynamicSchemaService } from "./dynamic-schema.service";
import { DynamicSchemaController } from "./dynamic-schema.controller";
import { SchemaModule } from "../schema/schema.module";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [SchemaModule, AuthModule, ProjectModule],
  providers: [DynamicSchemaService],
  controllers: [DynamicSchemaController],
  exports: [DynamicSchemaService],
})
export class DynamicSchemaModule {}
