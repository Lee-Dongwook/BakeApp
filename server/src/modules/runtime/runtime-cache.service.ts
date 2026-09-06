import { Injectable } from "@nestjs/common";

interface CacheEntry<T> {
  projectId: string;
  data: T;
  expiresAt: number;
}

@Injectable()
export class RuntimeCacheService {
  // 초기 구현: In-Memory Map (향후 Redis/CDN으로 교체 가능 구조)
  private cache = new Map<string, CacheEntry<any>>();

  private getCacheKey(slug: string): string {
    return `runtime:slug:${slug}`;
  }

  get<T>(slug: string): T | null {
    const key = this.getCacheKey(slug);
    const item = this.cache.get(key);

    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(slug: string, projectId: string, data: T, ttlMs = 300000): void {
    this.cache.set(this.getCacheKey(slug), {
      projectId,
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * 배포·롤백 등으로 릴리즈가 바뀌면 해당 프로젝트의 모든 슬러그 캐시를 비웁니다.
   */
  invalidateProjectCache(projectId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.projectId === projectId) {
        this.cache.delete(key);
      }
    }
  }
}
