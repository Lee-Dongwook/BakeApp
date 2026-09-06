import { Injectable, HttpStatus } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { RuntimeException } from "./runtime.exception";

export interface RuntimeUserRoleInfo {
  roleIds: string[];
  roleNames: string[];
}

@Injectable()
export class RuntimePermissionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUserRoles(userId: string): Promise<RuntimeUserRoleInfo> {
    const query = `
      SELECT r.id, r.name
      FROM runtime_user_roles ur
      JOIN runtime_roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1;
    `;
    const res = await this.databaseService.query(query, [userId]);
    return {
      roleIds: res.rows.map((row) => row.id),
      roleNames: res.rows.map((row) => row.name),
    };
  }

  async validateResourceAccess(
    projectId: string,
    userId: string,
    resourceType: "PAGE" | "QUERY" | "WORKFLOW" | "TABLE",
    resourceId: string,
    action: "READ" | "EXECUTE" | "CREATE" | "UPDATE" | "DELETE",
  ): Promise<boolean> {
    const permQuery = `
      SELECT id FROM runtime_permissions
      WHERE project_id = $1 AND resource_type = $2 AND resource_id = $3 AND action = $4;
    `;

    const permRes = await this.databaseService.query(permQuery, [
      projectId,
      resourceType,
      resourceId,
      action,
    ]);

    if (permRes.rows.length === 0) {
      return true;
    }

    const permissionId = permRes.rows[0].id;

    const accessQuery = `
        SELECT 1
        FROM runtime_user_roles ur
        JOIN runtime_role_permissions rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1 AND rp.permission_id = $2
        LIMIT 1
      `;

    const accessRes = await this.databaseService.query(accessQuery, [
      userId,
      permissionId,
    ]);

    if (accessRes.rows.length === 0) {
      throw new RuntimeException(
        "RUNTIME_ACCESS_DENIED",
        `해당 자원(${resourceType}:${resourceId})에 대한 ${action} 권한이 없습니다.`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  async filterAccessiblePages(
    projectId: string,
    userId: string | undefined,
    pages: any[],
  ): Promise<any[]> {
    if (!userId) return pages;

    const accessiblePages = [];
    for (const page of pages) {
      try {
        await this.validateResourceAccess(
          projectId,
          userId,
          "PAGE",
          page.id,
          "READ",
        );
        accessiblePages.push(page);
      } catch {
        // 권한이 없는 페이지는 Manifest 결과에서 노출 제어
      }
    }
    return accessiblePages;
  }
}
