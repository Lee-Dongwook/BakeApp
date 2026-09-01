import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import {
  TablePolicyDefinition,
  UserRole,
} from "./interfaces/rbac-policy.interface";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class DynamicRlsService {
  private readonly logger = new Logger(DynamicRlsService.name);

  constructor(private readonly dbService: DatabaseService) {}

  private buildRoleCondition(roles: UserRole[]): string {
    if (!roles || roles.length === 0) return "false";

    const rolesWithAdmin = roles.includes("ADMIN")
      ? roles
      : [...roles, "ADMIN" as const];
    const rolesFormatted = rolesWithAdmin.map((r) => `'${r}'`).join(", ");
    return `current_setting('app.current_user_role', true) IN (${rolesFormatted})`;
  }

  async applyTableRlsPolicy(projectId: string, policy: TablePolicyDefinition) {
    const cleanProjectId = projectId.replace(/-/g, "_");
    const fullTableName = `tenant_${cleanProjectId}_${policy.tableName}`;

    const enableRlsSql = `ALTER TABLE "${fullTableName}" ENABLE ROW LEVEL SECURITY;`;

    const dropOldPoliciesSql = `
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON "${fullTableName}";
        DROP POLICY IF EXISTS "${fullTableName}_read_policy" ON "${fullTableName}";
        DROP POLICY IF EXISTS "${fullTableName}_write_policy" ON "${fullTableName}";
        DROP POLICY IF EXISTS "${fullTableName}_insert_policy" ON "${fullTableName}";
        DROP POLICY IF EXISTS "${fullTableName}_update_policy" ON "${fullTableName}";
        DROP POLICY IF EXISTS "${fullTableName}_delete_policy" ON "${fullTableName}";
    `;

    const readRolesCondition = this.buildRoleCondition(policy.readRoles);
    const ownerCondition = policy.ownerOnly
      ? ` AND (created_by = current_setting('app.current_user_id', true)::uuid)`
      : "";

    const createReadPolicySql = `
      CREATE POLICY "${fullTableName}_read_policy" 
      ON "${fullTableName}" 
      FOR SELECT 
      USING (${readRolesCondition}${ownerCondition});
    `;

    const writeRolesCondition = this.buildRoleCondition(policy.writeRoles);
    const createInsertPolicySql = `
      CREATE POLICY "${fullTableName}_insert_policy"
      ON "${fullTableName}" 
      FOR INSERT
      WITH CHECK (${writeRolesCondition});
    `;

    const createUpdatePolicySql = `
      CREATE POLICY "${fullTableName}_update_policy"
      ON "${fullTableName}"
      FOR UPDATE
      USING (${writeRolesCondition})
      WITH CHECK (${writeRolesCondition});
    `;

    const deleteRolesCondition = this.buildRoleCondition(policy.deleteRoles);
    const createDeletePolicySql = `
      CREATE POLICY "${fullTableName}_delete_policy" 
      ON "${fullTableName}" 
      FOR DELETE 
      USING (${deleteRolesCondition});
    `;

    try {
      await this.dbService.query(enableRlsSql);
      await this.dbService.query(dropOldPoliciesSql);
      await this.dbService.query(createReadPolicySql);
      await this.dbService.query(createInsertPolicySql);
      await this.dbService.query(createUpdatePolicySql);
      await this.dbService.query(createDeletePolicySql);

      this.logger.log(
        `[RLS Engine] Successfully applied RBAC policy for table: ${fullTableName}`,
      );
      return { success: true, tableName: fullTableName };
    } catch (error) {
      if (error instanceof Error)
        throw new BadRequestException(`RLS 정책 적용 실패 : ${error.message}`);
      throw new BadRequestException(`RLS 정책 적용 실패 : ${error}`);
    }
  }
}
