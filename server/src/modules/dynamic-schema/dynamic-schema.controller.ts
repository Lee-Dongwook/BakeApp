import { Controller, Post, Body } from "@nestjs/common";
import {
  DynamicSchemaService,
  ColumnDefinition,
} from "./dynamic-schema.service";

class CreateTableDto {
  projectId: string;
  tableName: string;
  columns: ColumnDefinition[];
}

class AddColumnDto {
  projectId: string;
  tableName: string;
  column: ColumnDefinition;
}

@Controller("api/dynamic-schema")
export class DynamicSchemaController {
  constructor(private readonly schemaService: DynamicSchemaService) {}

  @Post("table")
  async createTable(@Body() dto: CreateTableDto) {
    return this.schemaService.createCustomTable(
      dto.projectId,
      dto.tableName,
      dto.columns,
    );
  }

  @Post("column")
  async addColumn(@Body() dto: AddColumnDto) {
    return this.schemaService.addCustomColumn(
      dto.projectId,
      dto.tableName,
      dto.column,
    );
  }
}
