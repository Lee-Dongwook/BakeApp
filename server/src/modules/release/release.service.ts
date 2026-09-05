import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { SchemaRegistryService } from "../schema/schema-registry.service";

@Injectable()
export class ReleaseService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly schemaRegistry: SchemaRegistryService,
  ) {}

  async createVersion(
    projectId: string,
    userId: string,
    name: string,
    description?: string,
  ) {
    const lastVersionRes = await this.databaseService.query<{ max_v: number }>(
      `SELECT MAX(version_number) as max_v FROM project_versions WHERE project_id = $1`,
      [projectId],
    );
    const nextVersion = (lastVersionRes.rows[0]?.max_v || 0) + 1;

    const schemas = this.schemaRegistry.getAllSchemas(projectId);
    const snapshot = {
      schemas,
      timestamp: new Date().toISOString(),
    };

    const result = await this.databaseService.query(
      `INSERT INTO project_versions (project_id, version_number, name, description, snapshot, created_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, version_number, name, created_at`,
      [
        projectId,
        nextVersion,
        name,
        description || null,
        JSON.stringify(snapshot),
        userId,
      ],
    );

    return result.rows[0];
  }

  async deployVersion(projectId: string, versionId: string) {
    const versionRes = await this.databaseService.query(
      `SELECT id, snapshot FROM project_versions WHERE id = $1 AND project_id = $2`,
      [versionId, projectId],
    );

    if (versionRes.rows.length === 0) {
      throw new NotFoundException("존재하지 않는 버전입니다.");
    }

    const version = versionRes.rows[0];
    console.log(version);

    await this.databaseService.query(
      `INSERT INTO project_deployments (project_id, active_version_id, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (project_id) 
       DO UPDATE SET active_version_id = $2, updated_at = CURRENT_TIMESTAMP`,
      [projectId, versionId],
    );

    return { success: true, deployVersion: versionId };
  }

  async rollbackToPrevious(projectId: string) {
    // 현재 배포된 버전 확인
    const currentDep = await this.databaseService.query(
      `SELECT active_version_id FROM project_deployments WHERE project_id = $1`,
      [projectId],
    );

    const activeId = currentDep.rows[0]?.active_version_id;
    console.log(activeId);

    const versionsRes = await this.databaseService.query(
      `SELECT id FROM project_versions WHERE project_id = $1 ORDER BY version_number DESC LIMIT 2`,
      [projectId],
    );

    if (versionsRes.rows.length < 2) {
      throw new BadRequestException(
        "롤백할 수 있는 이전 버전이 존재하지 않습니다.",
      );
    }

    const targetVersionId = versionsRes.rows[1].id;
    return this.deployVersion(projectId, targetVersionId);
  }
}
