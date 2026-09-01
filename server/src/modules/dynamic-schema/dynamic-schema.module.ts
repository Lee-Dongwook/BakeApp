import { Module } from "@nestjs/common";
import { DynamicSchemaService } from "./dynamic-schema.service";
import { DynamicSchemaController } from "./dynamic-schema.controller";
import { SchemaModule } from "../schema/schema.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [SchemaModule, AuthModule],
  providers: [DynamicSchemaService],
  controllers: [DynamicSchemaController],
  exports: [DynamicSchemaService],
})
export class DynamicSchemaModule {}
