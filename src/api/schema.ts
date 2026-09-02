export interface ColumnMeta {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface TableMeta {
  table_name: string;
  columns: ColumnMeta[];
}
