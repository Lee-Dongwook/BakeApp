import { Module } from "@nestjs/common";
import { RuntimeCacheService } from "./runtime-cache.service";

/**
 * 릴리즈 배포 모듈과 런타임 모듈이 같은 캐시 인스턴스를 공유하도록 분리한 모듈입니다.
 */
@Module({
  providers: [RuntimeCacheService],
  exports: [RuntimeCacheService],
})
export class RuntimeCacheModule {}
