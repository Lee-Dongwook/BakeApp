import { Injectable, Logger } from "@nestjs/common";
import { TableMeta } from "./interfaces/schema-registry.interface";

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);
  private registry = new Map<string, TableMeta>();

  async saveSchema(
    projectId: string,
    tableMeta: Omit<TableMeta, "projectId">,
  ): Promise<void> {
    const key = `${projectId}:${tableMeta.tableName}`;
    const payload: TableMeta = {
      projectId,
      ...tableMeta,
      updatedAt: new Date(),
    };

    this.registry.set(key, payload);
    this.logger.log(
      `[Schema Registry] Registered schema for table: ${tableMeta.tableName} (Project: ${projectId})`,
    );
  }

  async getSchema(
    projectId: string,
    tableName: string,
  ): Promise<TableMeta | null> {
    const key = `${projectId}:${tableName}`;
    return this.registry.get(key) || null;
  }

  async getAllSchemas(projectId?: string): Promise<TableMeta[]> {
    const allSchemas = Array.from(this.registry.values());
    if (projectId) {
      return allSchemas.filter((schema) => schema.projectId === projectId);
    }
    return allSchemas;
  }

  async deleteSchema(projectId: string, tableName: string): Promise<boolean> {
    const key = `${projectId}:${tableName}`;
    return this.registry.delete(key);
  }
}
