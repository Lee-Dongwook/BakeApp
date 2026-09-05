export type ColumnType =
  "string" | "number" | "boolean" | "datetime" | "text" | "relation";

export interface RelationMeta {
  targetTable: string;
  targetColumn?: string;
  relationType: "1:1" | "1:N" | "N:M";
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
}

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  isRequired?: boolean;
  description?: string;
  relation?: RelationMeta;
}

export interface TableMeta {
  projectId: string;
  tableName: string;
  columns: ColumnMeta[];
  createdAt?: Date;
  updatedAt?: Date;
}
