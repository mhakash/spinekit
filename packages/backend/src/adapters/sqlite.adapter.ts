/**
 * SQLite Database Adapter
 */

import { Database } from "bun:sqlite";
import type { DatabaseAdapter, QueryResult, ColumnInfo } from "./database.adapter";

export class SQLiteAdapter implements DatabaseAdapter {
  name = "sqlite";
  private db: Database | null = null;
  private inTransaction = false;

  constructor(private dbPath: string = "spinekit.db") {}

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath, { create: true });
    console.log(`✓ Connected to SQLite database: ${this.dbPath}`);

    // Enable foreign keys
    this.db.run("PRAGMA foreign_keys = ON");

    // Initialize system tables
    await this.initializeSystemTables();
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log("✓ Disconnected from SQLite database");
    }
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.db) throw new Error("Database not connected");

    try {
      const stmt = this.db.query(sql);
      const results = params ? stmt.all(...(params as any[])) : stmt.all();
      return results as T[];
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.db) throw new Error("Database not connected");

    try {
      const stmt = this.db.query(sql);
      const result = params ? stmt.run(...(params as any[])) : stmt.run();

      return {
        rows: [],
        rowCount: result.changes || 0,
      };
    } catch (error) {
      console.error("Execute error:", error);
      throw error;
    }
  }

  async beginTransaction(): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    if (this.inTransaction) throw new Error("Transaction already in progress");

    this.db.run("BEGIN TRANSACTION");
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    if (!this.inTransaction) throw new Error("No transaction in progress");

    this.db.run("COMMIT");
    this.inTransaction = false;
  }

  async rollback(): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    if (!this.inTransaction) throw new Error("No transaction in progress");

    this.db.run("ROLLBACK");
    this.inTransaction = false;
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result[0]?.count > 0;
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.query<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>(`PRAGMA table_info(${tableName})`);

    return result.map((col) => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      defaultValue: col.dflt_value ?? undefined,
      primaryKey: col.pk === 1,
    }));
  }

  /**
   * Initialize SpineKit system tables to store table schemas
   */
  private async initializeSystemTables(): Promise<void> {
    if (!this.db) return;

    // Tables table: stores table definitions
    this.db.run(`
      CREATE TABLE IF NOT EXISTS _spinekit_tables (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Fields table: stores field definitions for each table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS _spinekit_fields (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 0,
        unique_constraint INTEGER NOT NULL DEFAULT 0,
        default_value TEXT,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (table_id) REFERENCES _spinekit_tables(id) ON DELETE CASCADE,
        UNIQUE(table_id, name)
      )
    `);

    console.log("✓ System tables initialized");
  }

  /**
   * Helper method to map SpineKit field types to SQLite types
   */
  mapFieldTypeToSQL(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: "TEXT",
      number: "REAL",
      boolean: "INTEGER",
      date: "TEXT",
      json: "TEXT",
    };
    return typeMap[fieldType] || "TEXT";
  }
}
