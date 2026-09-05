import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  SqlExecutor,
  buildTenantTableName,
  sanitizeIdentifier,
} from "../../common/tenant-table";

/** id / created_at은 시스템 컬럼이므로 클라이언트가 직접 수정할 수 없다. */
const IMMUTABLE_COLUMNS = new Set(["id", "created_at"]);

@Injectable()
export class DynamicDataService {
  constructor(private readonly dbService: DatabaseService) {}

  /** 트랜잭션 클라이언트가 주어지면 그 클라이언트로, 아니면 풀로 실행한다. */
  private runner(client?: SqlExecutor): SqlExecutor {
    return client ?? this.dbService;
  }

  private getFullTableName(projectId: string, rawTableName: string): string {
    return buildTenantTableName(projectId, rawTableName);
  }

  private toColumns(data: Record<string, any>, action: string): string[] {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new BadRequestException(`${action} 데이터는 JSON 객체여야 합니다.`);
    }

    const keys = Object.keys(data).map((key) => sanitizeIdentifier(key));
    const immutable = keys.filter((key) => IMMUTABLE_COLUMNS.has(key));
    if (immutable.length > 0) {
      throw new BadRequestException(
        `수정할 수 없는 시스템 컬럼입니다: ${immutable.join(", ")}`,
      );
    }
    return keys;
  }

  async create(
    projectId: string,
    rawTableName: string,
    data: Record<string, any>,
    client?: SqlExecutor,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const keys = this.toColumns(data, "생성할");
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new BadRequestException("저장할 데이터가 없습니다.");
    }

    const columnSql = keys.map((k) => `"${k}"`).join(", ");
    const valuePlaceholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `INSERT INTO "${tableName}" (${columnSql}) VALUES (${valuePlaceholders}) RETURNING *;`;

    try {
      const result = await this.runner(client).query(sql, values);
      return result.rows[0];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(`데이터 생성 실패 : ${error.message}`);
      }
      throw new BadRequestException(`데이터 생성 실패 : ${error}`);
    }
  }

  async findAll(
    projectId: string,
    rawTableName: string,
    page = 1,
    limit = 20,
    client?: SqlExecutor,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
    const offset = (safePage - 1) * safeLimit;

    const countSql = `SELECT COUNT(*) FROM "${tableName}";`;
    const dataSql = `SELECT * FROM "${tableName}" ORDER BY created_at DESC LIMIT $1 OFFSET $2;`;

    try {
      const runner = this.runner(client);
      const countResult = await runner.query(countSql);
      const total = parseInt(countResult.rows[0].count, 10);

      const dataResult = await runner.query(dataSql, [safeLimit, offset]);

      return {
        data: dataResult.rows,
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(`데이터 조회 실패 : ${error.message}`);
      }
      throw new BadRequestException(`데이터 조회 실패 : ${error}`);
    }
  }

  async findOne(
    projectId: string,
    rawTableName: string,
    id: string,
    client?: SqlExecutor,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const sql = `SELECT * FROM "${tableName}" WHERE id = $1;`;

    try {
      const result = await this.runner(client).query(sql, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(
          `데이터 단일 조회 실패 : ${error.message}`,
        );
      }
      throw new BadRequestException(`데이터 단일 조회 실패 : ${error}`);
    }
  }

  async update(
    projectId: string,
    rawTableName: string,
    id: string,
    data: Record<string, any>,
    client?: SqlExecutor,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const keys = this.toColumns(data, "수정할");
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new BadRequestException("수정할 데이터 필드가 없습니다.");
    }

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    values.push(id);

    const sql = `UPDATE "${tableName}" SET ${setClause} WHERE id = $${values.length} RETURNING *;`;

    try {
      const result = await this.runner(client).query(sql, values);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error)
        throw new BadRequestException(`데이터 수정 실패: ${error.message}`);
      throw new BadRequestException(`데이터 수정 실패: ${error}`);
    }
  }

  async remove(
    projectId: string,
    rawTableName: string,
    id: string,
    client?: SqlExecutor,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const sql = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING id;`;

    try {
      const result = await this.runner(client).query(sql, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return { success: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error)
        throw new BadRequestException(`데이터 삭제 실패: ${error.message}`);
      throw new BadRequestException(`데이터 삭제 실패: ${error}`);
    }
  }
}
