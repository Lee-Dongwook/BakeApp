import { Injectable, HttpStatus } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
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

@Injectable()
export class RuntimeAppResolverService {
  constructor(private readonly databaseService: DatabaseService) {}

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

  async resolveBySlug(
    slug: string,
  ): Promise<{ manifest: RuntimeManifest; releaseVersion: number }> {
    const settingsQuery = `
      SELECT s.*, p.name as project_name
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

    const deploymentQuery = `
      SELECT d.id as deployment_id, d.created_at as deployed_at,
             r.id as release_id, r.version as release_version, r.snapshot
      FROM deployments d
      JOIN releases r ON r.id = d.release_id
      WHERE d.project_id = $1 AND d.environment = 'PRODUCTION' AND d.status = 'ACTIVE'
      ORDER BY d.created_at DESC
      LIMIT 1;
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

    const sanitizedDocument = this.buildSanitizedDocument(rawSnapshot);

    const manifest: RuntimeManifest = {
      app: {
        id: settings.project_id,
        name: settings.project_name,
        slug: settings.slug,
      },
      release: {
        id: deployment.release_id,
        version: deployment.release_version,
        deployedAt: deployment.deployed_at,
      },
      runtime: {
        isPublic: settings.is_public,
        authRequired: settings.auth_required,
        signupEnabled: settings.signup_enabled,
        defaultPage: settings.default_page,
      },
      document: sanitizedDocument,
    };

    return { manifest, releaseVersion: deployment.release_version };
  }
}
