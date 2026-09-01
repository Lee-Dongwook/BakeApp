import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

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
    const result = await this.databaseService.query<Project>(
      `INSERT INTO projects (name, owner_id)
       VALUES ($1, $2)
       RETURNING id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name.trim(), ownerId],
    );

    return result.rows[0];
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

  async findOneByOwner(id: string, ownerId: string): Promise<Project> {
    const result = await this.databaseService.query<Project>(
      `SELECT id, name, owner_id AS "ownerId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM projects
       WHERE id = $1 AND owner_id = $2`,
      [id, ownerId],
    );

    const project = result.rows[0];
    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없거나 접근 권한이 없습니다.");
    }

    return project;
  }
}
