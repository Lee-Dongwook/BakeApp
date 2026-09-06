import { Injectable } from "@nestjs/common";

@Injectable()
export class RuntimeCacheService {
  // 초기 구현: In-Memory Map (향후 Redis/CDN으로 교체 가능 구조)
  private cache = new Map<string, { data: any; expiresAt: number }>();

  private getCacheKey(projectId: string, releaseId: string): string {
    return `runtime:${projectId}:${releaseId}`;
  }

  getManifest(projectId: string, releaseId: string): any | null {
    const key = this.getCacheKey(projectId, releaseId);
    const item = this.cache.get(key);

    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  setManifest(
    projectId: string,
    releaseId: string,
    manifest: any,
    ttlMs = 300000,
  ): void {
    const key = this.getCacheKey(projectId, releaseId);
    this.cache.set(key, {
      data: manifest,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidateProjectCache(projectId: string): void {
    const prefix = `runtime:${projectId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}
