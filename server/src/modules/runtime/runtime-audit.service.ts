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
  actorId: string | null;
  /** 빌더 사용자만 audit_logs.user_id에 기록하고, 런타임 사용자는 changes에 남깁니다. */
  actorType?: "BUILDER_USER" | "RUNTIME_USER" | "SYSTEM";
  target?: string;
  recordId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RuntimeAuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  async log(payload: AuditLogPayload): Promise<void> {
    const actorType = payload.actorType || "BUILDER_USER";
    // audit_logs.user_id는 users(id) 외래 키이므로 런타임 사용자 ID는 넣지 않습니다.
    const userId = actorType === "BUILDER_USER" ? payload.actorId : null;

    const changes = {
      actorType,
      actorId: payload.actorId,
      ...(payload.metadata || {}),
    };

    const query = `
      INSERT INTO audit_logs (
        project_id, user_id, action, target_table, record_id, changes, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, CURRENT_TIMESTAMP);
    `;

    await this.databaseService.query(query, [
      payload.projectId,
      userId,
      payload.eventType,
      payload.target || "RUNTIME",
      payload.recordId || null,
      JSON.stringify(changes),
      payload.ipAddress || null,
    ]);
  }
}
