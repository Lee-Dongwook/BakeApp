import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export type FilterOperator =
  "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in" | "is_null";

export class WhereConditionDto {
  @ApiProperty({
    example: "orders.status",
    description: "필터링할 필드명 (테이블명.필드명 가능)",
  })
  @IsString()
  field: string;

  @ApiProperty({
    example: "eq",
    description: "비교 연산자 (eq, neq, gt, gte, lt, lte, like, in, is_null)",
  })
  @IsString()
  operator: FilterOperator;

  @ApiPropertyOptional({ example: "COMPLETED", description: "비교할 값" })
  @IsOptional()
  value?: any;
}

export class JoinOptionDto {
  @ApiProperty({ example: "customers", description: "조인할 타겟 테이블명" })
  @IsString()
  targetTable: string;

  @ApiProperty({
    example: "customer_id",
    description: "현재 테이블의 외래키 칼럼명",
  })
  @IsString()
  foreignKey: string;

  @ApiPropertyOptional({
    example: "id",
    description: "타겟 테이블의 참조 칼럼명 (기본: id)",
  })
  @IsOptional()
  @IsString()
  targetKey?: string;

  @ApiPropertyOptional({
    enum: ["INNER", "LEFT", "RIGHT"],
    default: "LEFT",
    description: "조인 방식",
  })
  @IsOptional()
  @IsEnum(["INNER", "LEFT", "RIGHT"])
  type?: "INNER" | "LEFT" | "RIGHT";
}

export class ExecuteQueryDto {
  @ApiProperty({ example: "orders", description: "조회 대상 메인 테이블명" })
  @IsString()
  fromTable: string;

  @ApiPropertyOptional({
    example: ["orders.id", "orders.total", "customers.name"],
    description: "조회할 칼럼 목록",
  })
  @IsArray()
  @IsOptional()
  selectFields?: string[];

  @ApiPropertyOptional({ description: "테이블 조인 조건 목록" })
  @IsArray()
  @IsOptional()
  joins?: JoinOptionDto[];

  @ApiPropertyOptional({ description: "WHERE 조건 필터 목록" })
  @IsArray()
  @IsOptional()
  where?: WhereConditionDto[];

  @ApiPropertyOptional({
    example: { field: "orders.created_at", direction: "DESC" },
    description: "정렬 조건",
  })
  @IsObject()
  @IsOptional()
  orderBy?: { field: string; direction: "ASC" | "DESC" };

  @ApiPropertyOptional({
    example: 20,
    default: 50,
    description: "페이지 당 조회 건수",
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: "오프셋" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number;
}
