import { Module } from "@nestjs/common";
import { DynamicSwaggerService } from "./dynamic-swagger.service";
import { SchemaRegistryService } from "./schema-registry.service";

@Module({
  providers: [SchemaRegistryService, DynamicSwaggerService],
  exports: [SchemaRegistryService, DynamicSwaggerService],
})
export class SchemaModule {}
