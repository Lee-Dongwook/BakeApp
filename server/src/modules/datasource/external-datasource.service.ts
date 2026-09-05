import { BadRequestException, Injectable } from "@nestjs/common";
import { Pool } from "pg"; // PostgreSQL 기준 (MySQL의 경우 mysql2 사용)
import { DatabaseService } from "../database/database.service";

interface ExternalDbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

@Injectable()
export class ExternalDatasourceService {
  private poolCache: Map<string, Pool> = new Map();

  constructor(private readonly databaseService: DatabaseService) {}

  private getPool(datasourceId: string, config: ExternalDbConfig): Pool {
    if (this.poolCache.has(datasourceId)) {
      return this.poolCache.get(datasourceId)!;
    }

    const pool = new Pool({
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    this.poolCache.set(datasourceId, pool);
    return pool;
  }

  async executeExternalQuery(
    projectId: string,
    datasourceId: string,
    sql: string,
    params: any[] = [],
  ) {
    const dsRes = await this.databaseService.query<{
      config: ExternalDbConfig;
      type: string;
    }>(
      `SELECT config, type FROM project_datasources WHERE id = $1 AND project_id = $2`,
      [datasourceId, projectId],
    );

    if (dsRes.rows.length === 0) {
      throw new BadRequestException(
        "등록되지 않았거나 접근할 수 없는 외부 데이터소스입니다.",
      );
    }

    const { config, type } = dsRes.rows[0];
    if (type !== "POSTGRESQL") {
      throw new BadRequestException(
        "지원하지 않는 외부 데이터소스 타입입니다.",
      );
    }

    const pool = this.getPool(datasourceId, config);

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return {
          data: result.rows,
          rowCount: result.rowCount,
        };
      } finally {
        client.release();
      }
    } catch (error: any) {
      throw new BadRequestException(
        `외부 데이터소스 쿼리 실행 실패: ${error.message}`,
      );
    }
  }
}
