import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
  email?: string;
}

@Injectable()
export class ProjectMemberService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(projectId: string): Promise<ProjectMember[]> {
    const result = await this.databaseService.query<ProjectMember>(
      `SELECT pm.project_id AS "projectId", 
              pm.user_id AS "userId", 
              pm.role, 
              pm.created_at AS "createdAt",
              u.email
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY CASE pm.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, pm.created_at`,
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

  async upsertByEmail(
    projectId: string,
    email: string,
    role: ProjectMemberRole,
  ): Promise<ProjectMember> {
    const userResult = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundException(
        "해당 이메일을 가진 사용자를 찾을 수 없습니다.",
      );
    }

    return this.upsert(projectId, user.id, role);
  }

  async remove(projectId: string, userId: string): Promise<void> {
    const result = await this.databaseService.query(
      `DELETE FROM project_members
       WHERE project_id = $1 AND user_id = $2 AND role <> 'owner'`,
      [projectId, userId],
    );

    if (result.rowCount === 0) {
      throw new BadRequestException(
        "소유자는 삭제할 수 없거나 존재하지 않는 멤버입니다.",
      );
    }
  }
}
