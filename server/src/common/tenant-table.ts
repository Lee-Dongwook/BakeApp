import { BadRequestException } from "@nestjs/common";
import type { QueryResult } from "pg";

/**
 * 트랜잭션 클라이언트(PoolClient)와 DatabaseService를 동일하게 받기 위한 최소 인터페이스.
 * 워크플로우처럼 여러 쿼리를 한 트랜잭션으로 묶어야 하는 경로에서 사용합니다.
 */
export interface SqlExecutor {
  query(text: string, params?: any[]): Promise<QueryResult<any>>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTIFIER_PATTERN = /^[a-z0-9_]+$/;

/** 테이블명 문자열에 들어가는 projectId는 반드시 UUID여야 합니다. */
export function assertProjectId(projectId: string): string {
  if (typeof projectId !== "string" || !UUID_PATTERN.test(projectId)) {
    throw new BadRequestException(
      `유효하지 않은 프로젝트 식별자입니다: ${projectId}`,
    );
  }
  return projectId;
}

export function sanitizeIdentifier(identifier: string): string {
  if (typeof identifier !== "string" || !IDENTIFIER_PATTERN.test(identifier)) {
    throw new BadRequestException(
      `유효하지 않은 식별자 이름입니다: ${identifier} (영문 소문자, 숫자, _ 만 가능)`,
    );
  }
  return identifier;
}

export function getProjectTablePrefix(projectId: string): string {
  return `tenant_${assertProjectId(projectId).replace(/-/g, "_")}_`;
}

export function buildTenantTableName(
  projectId: string,
  rawTableName: string,
): string {
  return `${getProjectTablePrefix(projectId)}${sanitizeIdentifier(rawTableName)}`;
}
