export type DynamicColumnType =
  | "TEXT"
  | "VARCHAR"
  | "INTEGER"
  | "BIGINT"
  | "BOOLEAN"
  | "TIMESTAMP"
  | "JSONB"
  | "UUID";

export interface ForeignKeyDefinition {
  targetTable: string;
  targetColumn: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  onUpdate?: "CASCADE" | "RESTRICT";
}

export interface ColumnDefinition {
  name: string;
  type: DynamicColumnType;
  nullable?: boolean;
  defaultValue?: string;
  isUnique?: boolean;
  isIndex?: boolean;
  foreignKey?: ForeignKeyDefinition;
}

export interface AlterColumnPayload {
  action: "ADD" | "DROP" | "RENAME" | "MODIFY_TYPE" | "ADD_CONSTRAINT";
  columnName: string;
  newColumnName?: string;
  newType?: DynamicColumnType;
  nullable?: boolean;
  foreignKey?: ForeignKeyDefinition;
  isUnique?: boolean;
}
