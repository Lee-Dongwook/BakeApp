import { Injectable, HttpStatus } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  sanitizeIdentifier,
  buildTenantTableName,
} from "../../common/tenant-table";
import { ColumnDefinition, AlterColumnPayload } from "./dynamic-schema.types";
import { RuntimeException } from "../runtime/runtime.exception";

@Injectable()
export class DynamicSchemaBuilderService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createTenantTable(
    projectId: string,
    tableName: string,
    columns: ColumnDefinition[],
  ): Promise<{ tableRealName: string; ddlStatements: string[] }> {
    const realTableName = buildTenantTableName(projectId, tableName);
    const sqlStatements: string[] = [];

    const columnDefs: string[] = [
      "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
      "created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
      "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    ];

    const postQueries: string[] = [];

    for (const col of columns) {
      const colName = sanitizeIdentifier(col.name);
      let def = `"${colName}" ${col.type}`;

      if (col.nullable === false) def += " NOT NULL";
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      if (col.isUnique) def += " UNIQUE";

      columnDefs.push(def);

      if (col.foreignKey) {
        const targetRealTable = buildTenantTableName(
          projectId,
          col.foreignKey.targetTable,
        );
        const targetCol = sanitizeIdentifier(col.foreignKey.targetColumn);
        const onDelete = col.foreignKey.onDelete || "SET NULL";
        const fkConstraint = `ALTER TABLE "${realTableName}" ADD CONSTRAINT "fk_${realTableName}_${colName}" FOREIGN KEY ("${colName}") REFERENCES "${targetRealTable}"("${targetCol}") ON DELETE ${onDelete};`;
        postQueries.push(fkConstraint);
      }

      if (col.isIndex) {
        const idxQuery = `CREATE INDEX "idx_${realTableName}_${colName}" ON "${realTableName}"("${colName}");`;
        postQueries.push(idxQuery);
      }
    }

    const createTableDdl = `CREATE TABLE "${realTableName}" (\n ${columnDefs.join(",\n  ")}\n);`;
    sqlStatements.push(createTableDdl, ...postQueries);

    await this.executeAndRecordMigration(
      projectId,
      `CREATE TABLE ${tableName}`,
      sqlStatements,
    );

    return { tableRealName: realTableName, ddlStatements: sqlStatements };
  }

  async alterTenantTable(
    projectId: string,
    tableName: string,
    payload: AlterColumnPayload,
  ): Promise<string[]> {
    const realTableName = buildTenantTableName(projectId, tableName);
    const colName = sanitizeIdentifier(payload.columnName);
    const ddlStatements: string[] = [];

    switch (payload.action) {
      case "ADD": {
        let stmt = `ALTER TABLE "${realTableName}" ADD COLUMN "${colName}" ${payload.newType}`;
        if (payload.nullable === false) stmt += " NOT NULL";
        ddlStatements.push(stmt);

        if (payload.foreignKey) {
          const targetRealTable = buildTenantTableName(
            projectId,
            payload.foreignKey.targetTable,
          );
          const targetCol = sanitizeIdentifier(payload.foreignKey.targetColumn);
          ddlStatements.push(
            `ALTER TABLE "${realTableName}" ADD CONSTRAINT "fk_${realTableName}_${colName}" FOREIGN KEY ("${colName}") REFERENCES "${targetRealTable}"("${targetCol}") ON DELETE ${payload.foreignKey.onDelete || "SET NULL"};`,
          );
        }
        break;
      }

      case "RENAME": {
        if (!payload.newColumnName) {
          throw new RuntimeException(
            "SCHEMA_ALTER_ERROR",
            "새 컬럼명이 필요합니다.",
            HttpStatus.BAD_REQUEST,
          );
        }
        const newColName = sanitizeIdentifier(payload.newColumnName);
        ddlStatements.push(
          `ALTER TABLE "${realTableName}" RENAME COLUMN "${colName}" TO "${newColName}";`,
        );
        break;
      }

      case "MODIFY_TYPE": {
        if (!payload.newType) {
          throw new RuntimeException(
            "SCHEMA_ALTER_ERROR",
            "변경할 데이터 타입이 필요합니다.",
            HttpStatus.BAD_REQUEST,
          );
        }
        const castClause = `USING "${colName}"::${payload.newType}`;
        ddlStatements.push(
          `ALTER TABLE "${realTableName}" ALTER COLUMN "${colName}" TYPE ${payload.newType} ${castClause};`,
        );
        break;
      }

      case "DROP": {
        const countRes = await this.databaseService.query(
          `SELECT COUNT(*) FROM "${realTableName}";`,
        );
        const totalRows = Number.parseInt(countRes.rows[0].count, 10);

        if (totalRows > 0) {
          ddlStatements.push(
            `ALTER TABLE "${realTableName}" DROP COLUMN "${colName}";`,
          );
        } else {
          ddlStatements.push(
            `ALTER TABLE "${realTableName}" DROP COLUMN "${colName}" CASCADE;`,
          );
        }
        break;
      }
    }

    await this.executeAndRecordMigration(
      projectId,
      `ALTER TABLE ${tableName} (${payload.action})`,
      ddlStatements,
    );

    return ddlStatements;
  }

  private async executeAndRecordMigration(
    projectId: string,
    migrationName: string,
    ddlStatements: string[],
  ): Promise<void> {
    const client = await this.databaseService.getPool().connect();

    try {
      await client.query("BEGIN");

      for (const stmt of ddlStatements) {
        await client.query(stmt);
      }

      const verRes = await client.query(
        `SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM project_schema_migrations WHERE project_id = $1;`,
        [projectId],
      );

      const nextVersion = verRes.rows[0].next_version;

      await client.query(
        `INSERT INTO project_schema_migrations (project_id, version, migration_name, ddl_statements)
         VALUES ($1, $2, $3, $4);`,
        [projectId, nextVersion, migrationName, ddlStatements],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new RuntimeException(
        "SCHEMA_MIGRATION_FAILED",
        `스키마 마이그레이션 적용 실패: ${error instanceof Error ? error.message : error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      client.release();
    }
  }
}
