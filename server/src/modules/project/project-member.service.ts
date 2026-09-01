import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export enum ProjectMemberRole {
  VIEWER = "viewer",
  EDITOR = "editor",
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectMemberRole | "owner";
  createdAt: Date;
}

@Injectable()
export class ProjectMemberService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(projectId: string): Promise<ProjectMember[]> {
    const result = await this.databaseService.query<ProjectMember>(
      `SELECT project_id AS "projectId", user_id AS "userId", role, created_at AS "createdAt"
       FROM project_members
       WHERE project_id = $1
       ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, created_at`,
      [projectId],
    );

    return result.rows;
  }

  async findRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember["role"] | null> {
    const result = await this.databaseService.query<{
      role: ProjectMember["role"];
    }>(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId],
    );

    return result.rows[0]?.role ?? null;
  }

  async upsert(
    projectId: string,
    userId: string,
    role: ProjectMemberRole,
  ): Promise<ProjectMember> {
    const result = await this.databaseService.query<ProjectMember>(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id)
       DO UPDATE SET role = EXCLUDED.role
       WHERE project_members.role <> 'owner'
       RETURNING project_id AS "projectId", user_id AS "userId", role, created_at AS "createdAt"`,
      [projectId, userId, role],
    );

    const member = result.rows[0];
    if (!member) {
      throw new BadRequestException(
        "프로젝트 소유자의 역할은 변경할 수 없습니다.",
      );
    }

    return member;
  }
}
