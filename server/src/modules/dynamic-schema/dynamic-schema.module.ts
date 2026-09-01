import { Module } from "@nestjs/common";
import { DynamicSchemaService } from "./dynamic-schema.service";
import { DynamicSchemaController } from "./dynamic-schema.controller";
import { DatabaseService } from "../../config/database.service";
import { SchemaModule } from "../schema/schema.module";

@Module({
  imports: [SchemaModule],
  providers: [DatabaseService, DynamicSchemaService],
  controllers: [DynamicSchemaController],
  exports: [DynamicSchemaService],
})
export class DynamicSchemaModule {}
