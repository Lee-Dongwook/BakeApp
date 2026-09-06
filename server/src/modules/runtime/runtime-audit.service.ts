import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type AuditEventType =
  | "RELEASE_CREATE"
  | "RELEASE_DEPLOY"
  | "RELEASE_ROLLBACK"
  | "RUNTIME_SETTINGS_UPDATE"
  | "RUNTIME_DATA_MUTATION";

export interface AuditLogPayload {
  projectId: string;
  eventType: AuditEventType;
  actorId: string;
  target?: string;
  recordId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RuntimeAuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  async log(payload: AuditLogPayload): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        project_id, event_type, actor_id, target, record_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW());
    `;

    await this.databaseService.query(query, [
      payload.projectId,
      payload.eventType,
      payload.actorId,
      payload.target || "RUNTIME",
      payload.recordId || null,
      JSON.stringify(payload.metadata || {}),
    ]);
  }
}
