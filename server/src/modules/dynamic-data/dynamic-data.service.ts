import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class DynamicDataService {
  constructor(private readonly dbService: DatabaseService) {}

  private sanitizeIdentifier(identifier: string): string {
    const safeRegex = /^[a-z0-9_]+$/;
    if (!safeRegex.test(identifier)) {
      throw new BadRequestException(
        `유효하지 않은 식별자입니다: ${identifier}`,
      );
    }
    return identifier;
  }

  private getFullTableName(projectId: string, rawTableName: string): string {
    const cleanProjectId = projectId.replace(/-/g, "_");
    const cleanTableName = this.sanitizeIdentifier(rawTableName);
    return `tenant_${cleanProjectId}_${cleanTableName}`;
  }

  async create(
    projectId: string,
    rawTableName: string,
    data: Record<string, any>,
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const keys = Object.keys(data).map((key) => this.sanitizeIdentifier(key));
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new BadRequestException("저장할 데이터가 없습니다.");
    }

    const columnSql = keys.map((k) => `"${k}"`).join(", ");
    const valuePlaceholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `INSERT INTO "${tableName}" (${columnSql}) VALUES (${valuePlaceholders}) RETURNING *;`;

    try {
      const result = await this.dbService.query(sql, values);
      return result.rows[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`데이터 생성 실패 : ${error.message}`);
      }
      throw new BadRequestException(`데이터 생성 실패 : ${error}`);
    }
  }

  async findAll(projectId: string, rawTableName: string, page = 1, limit = 20) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) FROM "${tableName}";`;
    const dataSql = `SELECT * FROM "${tableName}" ORDER BY created_at DESC LIMIT $1 OFFSET $2;`;

    try {
      const countResult = await this.dbService.query(countSql);
      const total = parseInt(countResult.rows[0].count, 10);

      const dataResult = await this.dbService.query(dataSql, [limit, offset]);

      return {
        data: dataResult.rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`데이터 조회 실패 : ${error.message}`);
      }
      throw new BadRequestException(`데이터 조회 실패 : ${error}`);
    }
  }

  async findOne(projectId: string, rawTableName: string, id: string) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const sql = `SELECT * FROM "${tableName}" WHERE id = $1;`;

    try {
      const result = await this.dbService.query(sql, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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
  ) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const keys = Object.keys(data).map((key) => this.sanitizeIdentifier(key));
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new BadRequestException("수정할 데이터 필드가 없습니다.");
    }

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    values.push(id);

    const sql = `UPDATE "${tableName}" SET ${setClause} WHERE id = $${values.length} RETURNING *;`;

    try {
      const result = await this.dbService.query(sql, values);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error)
        throw new BadRequestException(`데이터 수정 실패: ${error.message}`);
      throw new BadRequestException(`데이터 수정 실패: ${error}`);
    }
  }

  async remove(projectId: string, rawTableName: string, id: string) {
    const tableName = this.getFullTableName(projectId, rawTableName);
    const sql = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING id;`;

    try {
      const result = await this.dbService.query(sql, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`ID [${id}] 데이터를 찾을 수 없습니다.`);
      }
      return { success: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error)
        throw new BadRequestException(`데이터 삭제 실패: ${error.message}`);
      throw new BadRequestException(`데이터 삭제 실패: ${error}`);
    }
  }
}
