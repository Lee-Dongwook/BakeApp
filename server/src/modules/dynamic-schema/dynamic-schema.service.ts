import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DynamicSwaggerService } from "../schema/dynamic-swagger.service";
import { SchemaRegistryService } from "../schema/schema-registry.service";
import {
  assertProjectId,
  getProjectTablePrefix,
  sanitizeIdentifier,
} from "../../common/tenant-table";

export interface ColumnDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "datetime" | "text";
  isRequired?: boolean;
}

export interface ProjectTableSummary {
  name: string;
  columns: Array<{
    name: string;
    dataType: string;
    isRequired: boolean;
  }>;
}

@Injectable()
export class DynamicSchemaService implements OnModuleInit {
  private readonly logger = new Logger(DynamicSchemaService.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly dynamicSwagger: DynamicSwaggerService,
  ) {}

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
    return sanitizeIdentifier(identifier);
  }

  private getProjectTablePrefix(projectId: string): string {
    return getProjectTablePrefix(projectId);
  }

  /** 서버 재시작 시 project_schemas에서 인메모리 레지스트리를 복원한다. */
  async onModuleInit() {
    try {
      const result = await this.dbService.query<{
        project_id: string;
        table_name: string;
        schema_definition: { columns: ColumnDefinition[] };
      }>(
        `SELECT project_id, table_name, schema_definition
         FROM project_schemas
         ORDER BY created_at`,
      );

      for (const row of result.rows) {
        this.schemaRegistry.saveSchema(row.project_id, {
          tableName: row.table_name,
          columns: row.schema_definition?.columns ?? [],
        });
      }

      this.logger.log(
        `[Schema Registry] ${result.rows.length}개 동적 스키마를 복원했습니다.`,
      );
      await this.dynamicSwagger.refreshSwaggerDoc();
    } catch (error) {
      // 스키마 복원 실패가 서버 기동 자체를 막지는 않도록 한다.
      this.logger.error(
        `[Schema Registry] 동적 스키마 복원 실패: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  async getProjectTables(projectId: string): Promise<ProjectTableSummary[]> {
    const tablePrefix = this.getProjectTablePrefix(assertProjectId(projectId));
    const tableNamePattern = `^${tablePrefix}[a-z0-9_]+$`;
    const tableResult = await this.dbService.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name ~ $1
       ORDER BY table_name`,
      [tableNamePattern],
    );

    return Promise.all(
      tableResult.rows.map(async ({ table_name }) => {
        const columnResult = await this.dbService.query<{
          column_name: string;
          data_type: string;
          is_nullable: "YES" | "NO";
        }>(
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
             AND column_name NOT IN ('id', 'created_at')
           ORDER BY ordinal_position`,
          [table_name],
        );

        return {
          name: table_name.slice(tablePrefix.length),
          columns: columnResult.rows.map((column) => ({
            name: column.column_name,
            dataType: column.data_type,
            isRequired: column.is_nullable === "NO",
          })),
        };
      }),
    );
  }

  async createCustomTable(
    projectId: string,
    rawTableName: string,
    columns: ColumnDefinition[],
  ) {
    const cleanTableName = this.sanitizeIdentifier(rawTableName);
    const fullTableName = `${this.getProjectTablePrefix(projectId)}${cleanTableName}`;

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new BadRequestException("컬럼을 최소 1개 이상 정의해야 합니다.");
    }

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
      await this.dbService.runInTransaction(async (client) => {
        await client.query(sql);

        await client.query(
          `INSERT INTO project_schemas (project_id, table_name, schema_definition)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, table_name)
           DO UPDATE SET schema_definition = $3, updated_at = NOW()`,
          [projectId, cleanTableName, JSON.stringify({ columns })],
        );
      });

      this.schemaRegistry.saveSchema(projectId, {
        tableName: cleanTableName,
        columns,
      });

      await this.dynamicSwagger.refreshSwaggerDoc();

      return {
        success: true,
        tableName: fullTableName,
        message: `테이블 [${fullTableName}]이 생성되었습니다. 접근 권한은 BakeApp 백엔드에서 프로젝트 멤버 역할로 관리합니다.`,
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
    const cleanTableName = this.sanitizeIdentifier(rawTableName);
    const fullTableName = `${this.getProjectTablePrefix(projectId)}${cleanTableName}`;

    const colName = this.sanitizeIdentifier(column.name);
    const pgType = this.mapToPgType(column.type);
    const nullable = column.isRequired ? "NOT NULL" : "NULL";

    const sql = `ALTER TABLE "${fullTableName}" ADD COLUMN "${colName}" ${pgType} ${nullable};`;

    try {
      await this.dbService.runInTransaction(async (client) => {
        await client.query(sql);

        const schemaRes = await client.query<{
          schema_definition: { columns: ColumnDefinition[] };
        }>(
          `SELECT schema_definition FROM project_schemas WHERE project_id = $1 AND table_name = $2`,
          [projectId, cleanTableName],
        );

        const currentSchema = schemaRes.rows[0]?.schema_definition || {
          columns: [],
        };
        currentSchema.columns = [
          ...(currentSchema.columns ?? []).filter(
            ({ name }) => name !== column.name,
          ),
          column,
        ];

        await client.query(
          `UPDATE project_schemas 
           SET schema_definition = $1, updated_at = NOW()
           WHERE project_id = $2 AND table_name = $3`,
          [JSON.stringify(currentSchema), projectId, cleanTableName],
        );
      });

      this.schemaRegistry.addColumn(projectId, cleanTableName, column);
      await this.dynamicSwagger.refreshSwaggerDoc();

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
