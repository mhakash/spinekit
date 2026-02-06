/**
 * Core types shared between backend and frontend
 */

export type FieldType = "string" | "number" | "boolean" | "date" | "json";

export interface TableSchema {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fields: FieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldDefinition {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface DatabaseAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}
