import { Module, Global } from "@nestjs/common";
import { SchemaRegistryService } from "./schema-registry.service";
import { DynamicSwaggerService } from "./dynamic-swagger.service";
import { DynamicSchemaService } from "../dynamic-schema/dynamic-schema.service";

@Global()
@Module({
  providers: [
    SchemaRegistryService,
    DynamicSwaggerService,
    DynamicSchemaService,
  ],
  exports: [SchemaRegistryService, DynamicSwaggerService, DynamicSchemaService],
})
export class SchemaModule {}
