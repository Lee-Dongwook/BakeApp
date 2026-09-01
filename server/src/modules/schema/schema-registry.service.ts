import { Injectable, Logger } from "@nestjs/common";
import {
  ColumnMeta,
  TableMeta,
} from "./interfaces/schema-registry.interface";

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);
  private registry = new Map<string, TableMeta>();

  saveSchema(
    projectId: string,
    tableMeta: Omit<TableMeta, "projectId">,
  ): void {
    const key = `${projectId}:${tableMeta.tableName}`;
    const previous = this.registry.get(key);
    const payload: TableMeta = {
      projectId,
      ...tableMeta,
      createdAt: previous?.createdAt ?? tableMeta.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    this.registry.set(key, payload);
    this.logger.log(
      `[Schema Registry] Registered schema for table: ${tableMeta.tableName} (Project: ${projectId})`,
    );
  }

  addColumn(projectId: string, tableName: string, column: ColumnMeta): boolean {
    const key = `${projectId}:${tableName}`;
    const table = this.registry.get(key);
    if (!table) return false;

    const columns = table.columns.filter(({ name }) => name !== column.name);
    this.registry.set(key, {
      ...table,
      columns: [...columns, column],
      updatedAt: new Date(),
    });
    return true;
  }

  getSchema(projectId: string, tableName: string): TableMeta | null {
    const key = `${projectId}:${tableName}`;
    return this.registry.get(key) ?? null;
  }

  getAllSchemas(projectId?: string): TableMeta[] {
    const allSchemas = Array.from(this.registry.values());
    if (projectId) {
      return allSchemas.filter((schema) => schema.projectId === projectId);
    }
    return allSchemas;
  }

  deleteSchema(projectId: string, tableName: string): boolean {
    const key = `${projectId}:${tableName}`;
    return this.registry.delete(key);
  }
}
