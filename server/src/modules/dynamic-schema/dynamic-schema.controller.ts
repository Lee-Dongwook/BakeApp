import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  DynamicSchemaService,
  ColumnDefinition,
} from "./dynamic-schema.service";
import { TablePolicyDefinition } from "../auth/interfaces/rbac-policy.interface";

class CreateTableDto {
  projectId: string;
  tableName: string;
  columns: ColumnDefinition[];
  rbacPolicy?: Omit<TablePolicyDefinition, "tableName">;
}

class AddColumnDto {
  projectId: string;
  tableName: string;
  column: ColumnDefinition;
}

@ApiTags("Dynamic Schema (동적 DDL)")
@Controller("api/dynamic-schema")
export class DynamicSchemaController {
  constructor(private readonly schemaService: DynamicSchemaService) {}

  @Post("table")
  @ApiOperation({
    summary: "동적 DB 테이블 생성",
    description: "지정한 스키마 기반으로 PostgreSQL 테이블을 생성합니다.",
  })
  @ApiResponse({ status: 201, description: "테이블 생성 성공" })
  async createTable(@Body() dto: CreateTableDto) {
    return this.schemaService.createCustomTable(
      dto.projectId,
      dto.tableName,
      dto.columns,
      dto.rbacPolicy,
    );
  }

  @Post("column")
  @ApiOperation({
    summary: "동적 DB 컬럼 추가",
    description: "기존에 생성된 테이블에 새로운 필드를 추가합니다.",
  })
  @ApiResponse({ status: 201, description: "컬럼 추가 성공" })
  async addColumn(@Body() dto: AddColumnDto) {
    return this.schemaService.addCustomColumn(
      dto.projectId,
      dto.tableName,
      dto.column,
    );
  }
}
