/**
 * Database Adapter Interface
 * All database implementations must follow this interface for database-agnostic code
 */

export interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  primaryKey?: boolean;
}

export interface DatabaseAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Query methods
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<QueryResult>;

  // Transaction support
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  // Schema introspection
  tableExists(tableName: string): Promise<boolean>;
  getTableSchema(tableName: string): Promise<ColumnInfo[]>;

  // DDL operations - database-specific implementations
  createTable(tableName: string, columns: ColumnDefinition[]): Promise<void>;
  dropTable(tableName: string): Promise<void>;
  addColumn(tableName: string, column: ColumnDefinition): Promise<void>;
  dropColumn(tableName: string, columnName: string): Promise<void>;
  renameColumn(tableName: string, oldName: string, newName: string): Promise<void>;
  removeConstraint(
    tableName: string,
    columnName: string,
    constraint: "required" | "unique",
    allColumns: ColumnDefinition[]
  ): Promise<void>;

  // Type mapping
  mapFieldTypeToSQL(fieldType: string): string;
  formatDefaultValue(value: any, type: string): string;
  booleanToSQL(value: boolean): number | boolean;
  booleanFromSQL(value: any): boolean;

  getDatabase?(): any;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey: boolean;
}
