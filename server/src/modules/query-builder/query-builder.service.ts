import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ExecuteQueryDto, FilterOperator } from "./dto/query-builder.dto";
import {
  buildTenantTableName,
  sanitizeIdentifier,
} from "../../common/tenant-table";

@Injectable()
export class QueryBuilderService {
  constructor(private readonly databaseService: DatabaseService) {}

  private secureQuoteIdentifier(identifier: string): string {
    return identifier
      .split(".")
      .map((part) => `"${sanitizeIdentifier(part)}"`)
      .join(".");
  }

  async executeQuery(projectId: string, dto: ExecuteQueryDto) {
    const mainTable = buildTenantTableName(projectId, dto.fromTable);
    const queryParams: any[] = [];

    let paramIndex = 1;

    let selectClause = "*";
    if (dto.selectFields && dto.selectFields.length > 0) {
      selectClause = dto.selectFields
        .map((field) => this.secureQuoteIdentifier(field))
        .join(", ");
    }

    let sql = `SELECT ${selectClause} FROM "${mainTable}" AS "${sanitizeIdentifier(dto.fromTable)}"`;
    if (dto.joins && dto.joins.length > 0) {
      for (const join of dto.joins) {
        const joinTableRealName = buildTenantTableName(
          projectId,
          join.targetTable,
        );
        const joinAlias = sanitizeIdentifier(join.targetTable);
        const joinType = join.type || "LEFT";

        const foreignKey = this.secureQuoteIdentifier(
          `${dto.fromTable}.${join.foreignKey}`,
        );
        const targetKey = this.secureQuoteIdentifier(
          `${join.targetTable}.${join.targetKey || "id"}`,
        );

        sql += ` ${joinType} JOIN "${joinTableRealName}" AS "${joinAlias}" ON ${foreignKey} = ${targetKey}`;
      }
    }

    if (dto.where && dto.where.length > 0) {
      const whereClauses: string[] = [];

      for (const cond of dto.where) {
        const fieldName = this.secureQuoteIdentifier(cond.field);
        const clause = this.buildWhereClause(
          cond.operator,
          fieldName,
          cond.value,
          paramIndex,
        );

        if (clause.sql) {
          whereClauses.push(clause.sql);
          if (clause.params) {
            queryParams.push(...clause.params);
            paramIndex += clause.params.length;
          }
        }
      }

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(" AND ")}`;
      }
    }

    if (dto.orderBy) {
      const orderField = this.secureQuoteIdentifier(dto.orderBy.field);
      const direction = dto.orderBy.direction === "DESC" ? "DESC" : "ASC";
      sql += ` ORDER BY ${orderField} ${direction}`;
    }

    const limit = dto.limit || 50;
    const offset = dto.offset || 0;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    try {
      const result = await this.databaseService.query(sql, queryParams);
      return {
        data: result.rows,
        count: result.rowCount,
        limit,
        offset,
      };
    } catch (error) {
      throw new BadRequestException(
        `동적 쿼리 실행 실패: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private buildWhereClause(
    operator: FilterOperator,
    fieldName: string,
    value: any,
    paramIndex: number,
  ): { sql: string; params?: any[] } {
    switch (operator) {
      case "eq":
        return { sql: `${fieldName} = $${paramIndex}`, params: [value] };
      case "neq":
        return { sql: `${fieldName} != $${paramIndex}`, params: [value] };
      case "gt":
        return { sql: `${fieldName} > $${paramIndex}`, params: [value] };
      case "gte":
        return { sql: `${fieldName} >= $${paramIndex}`, params: [value] };
      case "lt":
        return { sql: `${fieldName} < $${paramIndex}`, params: [value] };
      case "lte":
        return { sql: `${fieldName} <= $${paramIndex}`, params: [value] };
      case "like":
        return {
          sql: `${fieldName} ILIKE $${paramIndex}`,
          params: [`%${value}%`],
        };
      case "is_null":
        return { sql: `${fieldName} IS NULL` };
      case "in":
        if (!Array.isArray(value) || value.length === 0) return { sql: "1=0" };
        return { sql: `${fieldName} = ANY($${paramIndex})`, params: [value] };
      default:
        return { sql: "" };
    }
  }
}
