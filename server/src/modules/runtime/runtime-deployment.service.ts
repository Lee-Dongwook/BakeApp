import { Injectable } from "@nestjs/common";
import { ReleaseService } from "../release/release.service";
import { RuntimeAuditService } from "./runtime-audit.service";
import { RuntimeCacheService } from "./runtime-cache.service";

@Injectable()
export class RuntimeDeploymentService {
  constructor(
    private readonly releaseService: ReleaseService,
    private readonly cacheService: RuntimeCacheService,
    private readonly auditService: RuntimeAuditService,
  ) {}

  /**
   * 특정 버전을 활성 프로덕션 배포로 지정하고, 런타임 Manifest 캐시를 무효화합니다.
   */
  async deployRelease(projectId: string, versionId: string, userId: string) {
    const result = await this.releaseService.deployVersion(
      projectId,
      versionId,
    );

    this.cacheService.invalidateProjectCache(projectId);

    await this.auditService.log({
      projectId,
      eventType: "RELEASE_DEPLOY",
      actorId: userId,
      target: "project_deployments",
      recordId: versionId,
    });

    return result;
  }

  /**
   * 직전 버전으로 롤백하고, 런타임 Manifest 캐시를 무효화합니다.
   */
  async rollbackRelease(projectId: string, userId: string) {
    const result = await this.releaseService.rollbackToPrevious(projectId);

    this.cacheService.invalidateProjectCache(projectId);

    await this.auditService.log({
      projectId,
      eventType: "RELEASE_ROLLBACK",
      actorId: userId,
      target: "project_deployments",
      recordId: result.deployVersion,
    });

    return result;
  }
}
