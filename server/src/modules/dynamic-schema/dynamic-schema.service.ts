import { Injectable, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "src/config/database.service";

export interface ColumnDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "datetime" | "text";
  isRequired?: boolean;
}

@Injectable()
export class DynamicSchemaService {
  constructor(private readonly dbService: DatabaseService) {}

  private mapToPgType(type: string): string {
    switch (type) {
      case "string":
        return "VARCHAR(255)";
      case "text":
        return "TEXT";
      case "number":
        return "NUMERIC";
      case "boolean":
        return "BOOLEAN DEFAULT FALSE";
      case "datetime":
        return "TIMESTAMPTZ";
      default:
        return "TEXT";
    }
  }

  private sanitizeIdentifier(identifier: string): string {
    const safeRegex = /^[a-z0-9_]+$/;
    if (!safeRegex.test(identifier)) {
      throw new BadRequestException(
        `유효하지 않은 식별자 이름입니다: ${identifier} (영문 소문자, 숫자, _ 만 가능)`,
      );
    }

    return identifier;
  }

  async createCustomTable(
    projectId: string,
    rawTableName: string,
    columns: ColumnDefinition[],
  ) {
    const cleanProjectId = projectId.replace(/-/g, "_");
    const cleanTableName = this.sanitizeIdentifier(rawTableName);
    const fullTableName = `tenant_${cleanProjectId}_${cleanTableName}`;

    let sql = `CREATE TABLE IF NOT EXISTS "${fullTableName}" (\n`;
    sql += `  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;

    const columnDefinitions = columns.map((col) => {
      const colName = this.sanitizeIdentifier(col.name);
      const pgType = this.mapToPgType(col.type);
      const nullable = col.isRequired ? "NOT NULL" : "NULL";
      return `  "${colName}" ${pgType} ${nullable}`;
    });

    sql += columnDefinitions.join(",\n");
    sql += `,\n  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);`;

    try {
      await this.dbService.query(sql);

      return {
        success: true,
        tableName: fullTableName,
        message: `테이블 [${fullTableName}]이 성공적으로 생성되었습니다.`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`테이블 생성 실패 : ${error.message}`);
      }
      throw new BadRequestException(`테이블 생성 실패 : ${error}`);
    }
  }

  async addCustomColumn(
    projectId: string,
    rawTableName: string,
    column: ColumnDefinition,
  ) {
    const cleanProjectId = projectId.replace(/-/g, "_");
    const cleanTableName = this.sanitizeIdentifier(rawTableName);
    const fullTableName = `tenant_${cleanProjectId}_${cleanTableName}`;

    const colName = this.sanitizeIdentifier(column.name);
    const pgType = this.mapToPgType(column.type);
    const nullable = column.isRequired ? "NOT NULL" : "NULL";

    const sql = `ALTER TABLE "${fullTableName}" ADD COLUMN "${colName}" ${pgType} ${nullable};`;

    try {
      await this.dbService.query(sql);
      return {
        success: true,
        message: `테이블 [${fullTableName}]에 컬럼 [${colName}]이 추가되었습니다.`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`컬럼 추가 실패 : ${error.message}`);
      }
      throw new BadRequestException(`컬럼 추가 실패 : ${error}`);
    }
  }
}
