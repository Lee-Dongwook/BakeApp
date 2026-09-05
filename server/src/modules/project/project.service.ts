import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ProjectMemberRole } from "./project-member.service";

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProjectService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(ownerId: string, name: string): Promise<Project> {
    return this.databaseService.runInTransaction(async (client) => {
      const result = await client.query<Project>(
        `INSERT INTO projects (name, owner_id)
         VALUES ($1, $2)
         RETURNING id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [name.trim(), ownerId],
      );
      const project = result.rows[0];

      await client.query(
        "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')",
        [project.id, ownerId],
      );

      await client.query(
        `INSERT INTO project_documents (project_id, document)
         VALUES ($1, $2)
         ON CONFLICT (project_id) DO NOTHING`,
        [project.id, JSON.stringify({ nodes: [], edges: [] })],
      );

      return project;
    });
  }

  async findAllByOwner(ownerId: string): Promise<Project[]> {
    const result = await this.databaseService.query<Project>(
      `SELECT id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM projects
       WHERE owner_id = $1
       ORDER BY updated_at DESC`,
      [ownerId],
    );

    return result.rows;
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.databaseService.query<Project>(
      `SELECT id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM projects
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findAllAccessibleByUser(userId: string): Promise<Project[]> {
    const result = await this.databaseService.query<Project>(
      `SELECT DISTINCT p.id, p.name, p.owner_id AS "ownerId", p.created_at AS "createdAt", p.updated_at AS "updatedAt"
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.owner_id = $1 OR pm.user_id = $1
       ORDER BY p.updated_at DESC`,
      [userId],
    );

    return result.rows;
  }

  async findOneByOwner(id: string, ownerId: string): Promise<Project> {
    const result = await this.databaseService.query<Project>(
      `SELECT id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM projects
       WHERE id = $1 AND owner_id = $2`,
      [id, ownerId],
    );

    const project = result.rows[0];
    if (!project) {
      throw new NotFoundException(
        "프로젝트를 찾을 수 없거나 접근 권한이 없습니다.",
      );
    }

    return project;
  }

  async findOneAccessibleByUser(id: string, userId: string): Promise<Project> {
    const result = await this.databaseService.query<Project>(
      `SELECT p.id, p.name, p.owner_id AS "ownerId", p.created_at AS "createdAt", p.updated_at AS "updatedAt"
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id IS NOT NULL)`,
      [id, userId],
    );

    const project = result.rows[0];
    if (!project) {
      throw new NotFoundException(
        "프로젝트를 찾을 수 없거나 접근 권한이 없습니다.",
      );
    }

    return project;
  }

  async ensureCanEdit(id: string, userId: string): Promise<void> {
    const result = await this.databaseService.query<{ canEdit: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM projects p
         LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
         WHERE p.id = $1
           AND (p.owner_id = $2 OR pm.role IN ('owner', $3))
       ) AS "canEdit"`,
      [id, userId, ProjectMemberRole.EDITOR],
    );

    if (!result.rows[0]?.canEdit) {
      throw new ForbiddenException("프로젝트를 수정할 권한이 없습니다.");
    }
  }

  async rename(id: string, ownerId: string, name: string): Promise<Project> {
    const result = await this.databaseService.query<Project>(
      `UPDATE projects
       SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND owner_id = $3
       RETURNING id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name.trim(), id, ownerId],
    );

    const project = result.rows[0];
    if (!project) {
      throw new NotFoundException(
        "프로젝트를 찾을 수 없거나 접근 권한이 없습니다.",
      );
    }

    return project;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const result = await this.databaseService.query(
      "DELETE FROM projects WHERE id = $1 AND owner_id = $2",
      [id, ownerId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(
        "프로젝트를 찾을 수 없거나 접근 권한이 없습니다.",
      );
    }
  }
}
