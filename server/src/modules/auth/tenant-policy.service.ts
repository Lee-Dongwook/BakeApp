import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class TenantPolicyService {
  constructor(private readonly dbService: DatabaseService) {}

  async initializeTenantLimits(userId: string) {
    await this.dbService.query(
      `INSERT INTO tenant_limits (user_id, plan_type, max_projects, allow_code_export)
       VALUES ($1, 'FREE', 3, true)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
  }

  async recordTermsAgreement(
    userId: string,
    termsVersion: string,
    consents: Record<string, boolean>,
    ipAddress?: string,
  ) {
    await this.dbService.query(
      `INSERT INTO user_terms_agreements (user_id, terms_version, consents, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, termsVersion, JSON.stringify(consents), ipAddress],
    );
  }

  async checkProjectCreationLimit(userId: string) {
    const limitRes = await this.dbService.query<{ max_projects: number }>(
      `SELECT max_projects FROM tenant_limits WHERE user_id = $1`,
      [userId],
    );
    const maxProjects = limitRes.rows[0]?.max_projects ?? 3;

    const countRes = await this.dbService.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM projects WHERE owner_id = $1`,
      [userId],
    );
    const currentCount = Number.parseInt(countRes.rows[0].count, 10);

    if (currentCount >= maxProjects) {
      throw new ForbiddenException(
        `현재 플랜에서는 최대 ${maxProjects}개의 프로젝트만 생성할 수 있습니다.`,
      );
    }
  }

  async checkCodeExportPermission(userId: string) {
    const res = await this.dbService.query<{ allow_code_export: boolean }>(
      `SELECT allow_code_export FROM tenant_limits WHERE user_id = $1`,
      [userId],
    );
    const allowExport = res.rows[0]?.allow_code_export ?? true;

    if (!allowExport) {
      throw new ForbiddenException(
        "현재 플랜에서는 코드 내보내기 기능을 이용할 수 없습니다.",
      );
    }
  }
}
