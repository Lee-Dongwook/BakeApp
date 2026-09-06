import { Injectable, HttpStatus } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { RuntimeCacheService } from "./runtime-cache.service";
import { RuntimeException } from "./runtime.exception";

export interface RuntimeManifest {
  app: {
    id: string;
    name: string;
    slug: string;
  };
  release: {
    id: string;
    version: number;
    deployedAt: string;
  };
  runtime: {
    isPublic: boolean;
    authRequired: boolean;
    signupEnabled: boolean;
    defaultPage: string;
  };
  document: {
    pages: any[];
    layout?: any;
  };
}

export interface RuntimeResolution {
  manifest: RuntimeManifest;
  releaseVersion: number;
  /** 배포된 릴리즈 스냅샷 원본 (릴리즈 격리 검증에 사용) */
  snapshot: any;
}

@Injectable()
export class RuntimeAppResolverService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: RuntimeCacheService,
  ) {}

  private buildSanitizedDocument(snapshot: any) {
    const pages = Array.isArray(snapshot.pages)
      ? snapshot.pages.map((p: any) => ({
          id: p.id,
          name: p.name,
          path: p.path,
          components: p.components || [],
        }))
      : snapshot.document?.pages || [];

    return {
      pages,
      layout: snapshot.layout || snapshot.document?.layout || null,
    };
  }

  async resolveBySlug(slug: string): Promise<RuntimeResolution> {
    const cached = this.cacheService.get<RuntimeResolution>(slug);
    if (cached) return cached;

    const settingsQuery = `
      SELECT s.project_id, s.slug, s.is_public, s.auth_required,
             s.signup_enabled, s.default_page, p.name AS project_name
      FROM project_runtime_settings s
      JOIN projects p ON p.id = s.project_id
      WHERE s.slug = $1;
    `;

    const settingsRes = await this.databaseService.query(settingsQuery, [slug]);

    if (settingsRes.rows.length === 0) {
      throw new RuntimeException(
        "RUNTIME_APP_NOT_FOUND",
        `Slug '${slug}'에 해당하는 Runtime App을 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const settings = settingsRes.rows[0];

    // project_deployments는 프로젝트별 활성 프로덕션 버전을 단일 행으로 관리합니다.
    const deploymentQuery = `
      SELECT d.updated_at AS deployed_at,
             v.id AS release_id,
             v.version_number AS release_version,
             v.snapshot
      FROM project_deployments d
      JOIN project_versions v
        ON v.project_id = d.project_id AND v.id = d.active_version_id
      WHERE d.project_id = $1;
    `;

    const deploymentRes = await this.databaseService.query(deploymentQuery, [
      settings.project_id,
    ]);

    if (deploymentRes.rows.length === 0) {
      throw new RuntimeException(
        "RUNTIME_APP_NOT_DEPLOYED",
        "해당 애플리케이션에 활성화된 Production Deployment가 존재하지 않습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    const deployment = deploymentRes.rows[0];
    const rawSnapshot = deployment.snapshot || {};

    const manifest: RuntimeManifest = {
      app: {
        id: settings.project_id,
        name: settings.project_name,
        slug: settings.slug,
      },
      release: {
        id: deployment.release_id,
        version: deployment.release_version,
        deployedAt: new Date(deployment.deployed_at).toISOString(),
      },
      runtime: {
        isPublic: settings.is_public,
        authRequired: settings.auth_required,
        signupEnabled: settings.signup_enabled,
        defaultPage: settings.default_page,
      },
      document: this.buildSanitizedDocument(rawSnapshot),
    };

    const resolution: RuntimeResolution = {
      manifest,
      releaseVersion: deployment.release_version,
      snapshot: rawSnapshot,
    };

    this.cacheService.set(slug, settings.project_id, resolution);

    return resolution;
  }
}
