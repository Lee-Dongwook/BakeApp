import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { ExecuteQueryDto, FilterOperator } from "./dto/query-builder.dto";
import {
  buildTenantTableName,
  sanitizeIdentifier,
} from "../../common/tenant-table";
import { RuntimeException } from "../runtime/runtime.exception";

@Injectable()
export class QueryBuilderService {
  constructor(private readonly databaseService: DatabaseService) {}

  private secureQuoteIdentifier(identifier: string): string {
    return identifier
      .split(".")
      .map((part) => `"${sanitizeIdentifier(part)}"`)
      .join(".");
  }

  async executeQuery(
    projectId: string,
    dto: ExecuteQueryDto & { search?: { column: string; keyword: string } },
  ) {
    const mainTable = buildTenantTableName(projectId, dto.fromTable);
    const queryParams: any[] = [];
    let paramIndex = 1;

    let selectClause = "*";
    if (dto.selectFields && dto.selectFields.length > 0) {
      selectClause = dto.selectFields
        .map((field) => this.secureQuoteIdentifier(field))
        .join(", ");
    }

    let baseSql = `FROM "${mainTable}" AS "${sanitizeIdentifier(dto.fromTable)}"`;

    // JOIN 처리
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

        baseSql += ` ${joinType} JOIN "${joinTableRealName}" AS "${joinAlias}" ON ${foreignKey} = ${targetKey}`;
      }
    }

    // WHERE 및 검색 조건 누적
    const whereClauses: string[] = [];

    if (dto.where && dto.where.length > 0) {
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
    }

    // 추가 검색(Search) 기능 결합
    if (dto.search?.column && dto.search.keyword) {
      const searchField = this.secureQuoteIdentifier(dto.search.column);
      whereClauses.push(`${searchField} ILIKE $${paramIndex}`);
      queryParams.push(`%${dto.search.keyword}%`);
      paramIndex++;
    }

    const whereSql =
      whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "";

    // 1. 전체 카운트 쿼리 (페이지네이션 계산용)
    const countQuery = `SELECT COUNT(*) ${baseSql} ${whereSql}`;
    const countResult = await this.databaseService.query<{ count: string }>(
      countQuery,
      queryParams,
    );
    const total = Number.parseInt(countResult.rows[0]?.count || "0", 10);

    // 2. 정렬 처리
    let orderSql = "";
    if (dto.orderBy) {
      const orderField = this.secureQuoteIdentifier(dto.orderBy.field);
      const direction = dto.orderBy.direction === "DESC" ? "DESC" : "ASC";
      orderSql = ` ORDER BY ${orderField} ${direction}`;
    }

    // 3. 페이지네이션 처리 (limit, offset)
    const limit = dto.limit || 50;
    const offset = dto.offset || 0;

    // 데이터 조회 쿼리용 파라미터는 limit, offset용 인덱스가 추가되므로 별도 관리 필요
    const dataParams = [...queryParams, limit, offset];
    const dataQuery = `SELECT ${selectClause} ${baseSql} ${whereSql} ${orderSql} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    try {
      const result = await this.databaseService.query(dataQuery, dataParams);

      return {
        data: result.rows,
        meta: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `동적 쿼리 실행 실패: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async executeStoredQuery(
    projectId: string,
    queryDef: any,
    parameters: Record<string, any> = {},
    currentUser?: any,
  ) {
    const { type, sql, queryPayload, datasourceId } = queryDef;

    // Case A: Query Builder 기반 패러미터형 쿼리 (Internal Table)
    if (type === "BUILDER" || queryPayload) {
      const mergedPayload = {
        ...queryPayload,
        filters: this.bindParametersToFilters(
          queryPayload?.filters,
          parameters,
        ),
      };
      return await this.executeQuery(projectId, mergedPayload);
    }

    if (sql) {
      if (datasourceId) {
        // TODO: 외부 PostgreSQL Datasource Service 연동 시 호출
        // return await this.externalDatasourceService.query(datasourceId, sql, parameters);
      }

      // 파라미터 바인딩 ($1, $2 또는 :param 지원)
      const { parameterizedSql, queryParams } = this.parseSqlParameters(
        sql,
        parameters,
      );
      const res = await this.databaseService.query(
        parameterizedSql,
        queryParams,
      );
      return res.rows;
    }

    throw new RuntimeException(
      "RUNTIME_QUERY_NOT_FOUND",
      "유효한 쿼리 실행 정의(sql 또는 queryPayload)가 올바르지 않습니다.",
    );
  }

  async applyRowLevelPolicies(
    projectId: string,
    tableName: string,
    action: "READ" | "UPDATE" | "DELETE",
    currentUser: any,
    existingWhereClause: string = "",
  ): Promise<{ sqlWhere: string; params: any[] }> {
    if (!currentUser) {
      return { sqlWhere: existingWhereClause, params: [] };
    }

    const rlpQuery = `
      SELECT rlp.filter_expression
      FROM runtime_row_level_policies rlp
      LEFT JOIN runtime_user_roles ur ON (rlp.role_id IS NULL OR rlp.role_id = ur.role_id)
      WHERE rlp.project_id = $1 
        AND rlp.table_name = $2 
        AND rlp.action = $3
        AND (rlp.role_id IS NULL OR ur.user_id = $4);
    `;

    const rlpRes = await this.databaseService.query(rlpQuery, [
      projectId,
      tableName,
      action,
      currentUser.id,
    ]);

    if (rlpRes.rows.length === 0) {
      return { sqlWhere: existingWhereClause, params: [] };
    }

    const injectedConditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const row of rlpRes.rows) {
      let expr = row.filter_expression;

      expr = expr.replace(/\{\{\s*currentUser\.id\s*\}\}/g, (_, key) => {
        const val = currentUser.metadata?.[key] ?? null;
        params.push(val);
        return `$${paramIdx++}`;
      });

      injectedConditions.push(`(${expr})`);
    }

    const combinedRLP = injectedConditions.join(" AND ");
    const finalWhere = existingWhereClause
      ? `(${existingWhereClause}) AND (${combinedRLP})`
      : `WHERE ${combinedRLP}`;

    return { sqlWhere: finalWhere, params };
  }

  private parseSqlParameters(sql: string, params: Record<string, any>) {
    const queryParams: any[] = [];
    let paramIndex = 1;

    const parameterizedSql = sql.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      queryParams.push(params[key] !== undefined ? params[key] : null);
      return `$${paramIndex++}`;
    });

    return { parameterizedSql, queryParams };
  }

  private bindParametersToFilters(filters: any[], params: Record<string, any>) {
    if (!Array.isArray(filters)) return filters;
    return filters.map((f) => ({
      ...f,
      value:
        typeof f.value === "string" && f.value.startsWith(":")
          ? (params[f.value.slice(1)] ?? f.value)
          : f.value,
    }));
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
