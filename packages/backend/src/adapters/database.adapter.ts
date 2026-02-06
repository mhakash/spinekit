/**
 * Database Adapter Interface
 * All database implementations must follow this interface for database-agnostic code
 */

export interface QueryResult {
  rows: unknown[];
  rowCount: number;
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
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey: boolean;
}
