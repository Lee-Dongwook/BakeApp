import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export interface ProjectDocument {
  projectId: string;
  document: Record<string, unknown>;
  updatedAt: Date | null;
}

const EMPTY_PROJECT_DOCUMENT: Record<string, unknown> = {
  pages: [],
  queries: [],
  workflows: [],
};

@Injectable()
export class ProjectDocumentService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByProjectId(projectId: string): Promise<ProjectDocument> {
    const result = await this.databaseService.query<ProjectDocument>(
      `SELECT project_id AS "projectId", document, updated_at AS "updatedAt"
       FROM project_documents
       WHERE project_id = $1`,
      [projectId],
    );

    return (
      result.rows[0] ?? {
        projectId,
        document: structuredClone(EMPTY_PROJECT_DOCUMENT),
        updatedAt: null,
      }
    );
  }

  async save(
    projectId: string,
    document: Record<string, unknown>,
  ): Promise<ProjectDocument> {
    const result = await this.databaseService.query<ProjectDocument>(
      `INSERT INTO project_documents (project_id, document)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (project_id)
       DO UPDATE SET document = EXCLUDED.document, updated_at = CURRENT_TIMESTAMP
       RETURNING project_id AS "projectId", document, updated_at AS "updatedAt"`,
      [projectId, JSON.stringify(document)],
    );

    return result.rows[0];
  }
}
