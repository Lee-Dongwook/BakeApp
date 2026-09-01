export interface ColumnMeta {
  name: string;
  type: "string" | "number" | "boolean" | "datetime" | "text";
  isRequired?: boolean;
  description?: string;
}

export interface TableMeta {
  projectId: string;
  tableName: string;
  columns: ColumnMeta[];
  createdAt?: Date;
  updatedAt?: Date;
}
