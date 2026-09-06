import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { RuntimeCacheService } from "./runtime-cache.service";
import { RuntimeAuditService } from "./runtime-audit.service";

@Injectable()
export class RuntimeDeploymentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: RuntimeCacheService,
    private readonly auditService: RuntimeAuditService,
  ) {}

  async deployRelease(projectId: string, releaseId: string, userId: string) {
    await this.databaseService.query(
      `UPDATE deployments SET status = 'INACTIVE' WHERE project_id = $1 AND environment = 'PRODUCTION'`,
      [projectId],
    );

    const result = await this.databaseService.query(
      `INSERT INTO deployments (project_id, release_id, environment, status)
       VALUES ($1, $2, 'PRODUCTION', 'ACTIVE') RETURNING *`,
      [projectId, releaseId],
    );

    this.cacheService.invalidateProjectCache(projectId);

    await this.auditService.log({
      projectId,
      eventType: "RELEASE_DEPLOY",
      actorId: userId,
      recordId: releaseId,
      metadata: { deploymentId: result.rows[0].id },
    });

    return result.rows[0];
  }

  async rollbackRelease(
    projectId: string,
    targetReleaseId: string,
    userId: string,
  ) {
    await this.databaseService.query(
      `UPDATE deployments SET status = 'INACTIVE' WHERE project_id = $1 AND environment = 'PRODUCTION'`,
      [projectId],
    );

    const result = await this.databaseService.query(
      `INSERT INTO deployments (project_id, release_id, environment, status)
       VALUES ($1, $2, 'PRODUCTION', 'ACTIVE') RETURNING *`,
      [projectId, targetReleaseId],
    );

    this.cacheService.invalidateProjectCache(projectId);

    await this.auditService.log({
      projectId,
      eventType: "RELEASE_ROLLBACK",
      actorId: userId,
      recordId: targetReleaseId,
    });

    return result.rows[0];
  }
}
