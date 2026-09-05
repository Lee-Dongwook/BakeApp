import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export interface CreateAuditLogParams {
  projectId?: string;
  userId?: string;
  action: string;
  targetTable?: string;
  recordId?: string;
  changes?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    const query = `
      INSERT INTO audit_logs (project_id, user_id, action, target_table, record_id, changes, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    `;
    await this.databaseService.query(query, [
      params.projectId || null,
      params.userId || null,
      params.action,
      params.targetTable || null,
      params.recordId || null,
      params.changes ? JSON.stringify(params.changes) : null,
      params.ipAddress || null,
    ]);
  }
}
