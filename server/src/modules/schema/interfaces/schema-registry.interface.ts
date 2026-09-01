export interface ColumnMeta {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface TableMeta {
  projectId: string;
  tableName: string;
  columns: ColumnMeta[];
  createdAt?: Date;
  updatedAt?: Date;
}
