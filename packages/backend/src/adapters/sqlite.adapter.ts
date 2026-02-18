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

  getDatabase(): Database {
    if (!this.db) {
      throw new Error("Database not connected");
    }
    return this.db;
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath, { create: true });
    console.log(`✓ Connected to SQLite database: ${this.dbPath}`);

    // Enable foreign keys
    this.db.run("PRAGMA foreign_keys = ON");

    await this.initializeSystemTables();
    await this.initializeAuthTables();
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

  private async initializeAuthTables(): Promise<void> {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        expiresAt TEXT,
        password TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier)`);

    console.log("✓ Auth tables initialized");
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

  /**
   * Format default value for SQLite
   */
  formatDefaultValue(value: any, type: string): string {
    if (type === "string" || type === "date" || type === "json") {
      return `'${value}'`;
    } else if (type === "boolean") {
      return value ? "1" : "0";
    } else if (type === "number") {
      return String(value);
    }
    return "NULL";
  }

  /**
   * Convert boolean to SQLite representation (0 or 1)
   */
  booleanToSQL(value: boolean): number {
    return value ? 1 : 0;
  }

  /**
   * Convert SQLite representation to boolean
   */
  booleanFromSQL(value: any): boolean {
    return value === 1;
  }

  /**
   * Create a table with given columns
   */
  async createTable(
    tableName: string,
    columns: import("./database.adapter").ColumnDefinition[]
  ): Promise<void> {
    if (!this.db) throw new Error("Database not connected");

    const columnDefs = [
      "id TEXT PRIMARY KEY",
      ...columns.map((col) => {
        const sqlType = this.mapFieldTypeToSQL(col.type);
        const constraints: string[] = [];

        if (col.required) constraints.push("NOT NULL");
        if (col.unique) constraints.push("UNIQUE");
        if (col.defaultValue !== undefined) {
          const defaultVal = this.formatDefaultValue(col.defaultValue, col.type);
          constraints.push(`DEFAULT ${defaultVal}`);
        }

        return `${col.name} ${sqlType} ${constraints.join(" ")}`.trim();
      }),
      "created_at TEXT NOT NULL",
      "updated_at TEXT NOT NULL",
    ];

    const sql = `CREATE TABLE ${tableName} (${columnDefs.join(", ")})`;
    this.db.run(sql);
  }

  /**
   * Drop a table
   */
  async dropTable(tableName: string): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    this.db.run(`DROP TABLE IF EXISTS ${tableName}`);
  }

  /**
   * Add a column to an existing table
   */
  async addColumn(
    tableName: string,
    column: import("./database.adapter").ColumnDefinition
  ): Promise<void> {
    if (!this.db) throw new Error("Database not connected");

    const sqlType = this.mapFieldTypeToSQL(column.type);
    const constraints: string[] = [];

    if (column.required) constraints.push("NOT NULL");
    if (column.unique) constraints.push("UNIQUE");
    if (column.defaultValue !== undefined) {
      const defaultVal = this.formatDefaultValue(column.defaultValue, column.type);
      constraints.push(`DEFAULT ${defaultVal}`);
    }

    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${sqlType} ${constraints.join(" ")}`.trim();
    this.db.run(sql);
  }

  /**
   * Drop a column from a table
   * Note: SQLite 3.35.0+ supports DROP COLUMN
   */
  async dropColumn(tableName: string, columnName: string): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    this.db.run(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
  }

  /**
   * Rename a column
   * Note: SQLite 3.25.0+ supports RENAME COLUMN
   */
  async renameColumn(tableName: string, oldName: string, newName: string): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    this.db.run(`ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName}`);
  }

  /**
   * Remove a constraint from a column
   * SQLite doesn't support ALTER COLUMN, so we need to rebuild the table
   */
  async removeConstraint(
    tableName: string,
    columnName: string,
    constraint: "required" | "unique",
    allColumns: import("./database.adapter").ColumnDefinition[]
  ): Promise<void> {
    if (!this.db) throw new Error("Database not connected");

    const tempTableName = `${tableName}_temp_${Date.now()}`;

    // Create temp table with new schema
    const columnDefs = [
      "id TEXT PRIMARY KEY",
      ...allColumns.map((col) => {
        const sqlType = this.mapFieldTypeToSQL(col.type);
        const constraints: string[] = [];

        // Skip the constraint we're removing for the specified column
        if (col.name === columnName) {
          if (constraint === "required" && col.unique) {
            constraints.push("UNIQUE");
          } else if (constraint === "unique" && col.required) {
            constraints.push("NOT NULL");
          }
        } else {
          if (col.required) constraints.push("NOT NULL");
          if (col.unique) constraints.push("UNIQUE");
        }

        return `${col.name} ${sqlType} ${constraints.join(" ")}`.trim();
      }),
      "created_at TEXT NOT NULL",
      "updated_at TEXT NOT NULL",
    ];

    this.db.run(`CREATE TABLE ${tempTableName} (${columnDefs.join(", ")})`);

    // Copy data
    const allColumnNames = ["id", ...allColumns.map((c) => c.name), "created_at", "updated_at"];
    this.db.run(
      `INSERT INTO ${tempTableName} (${allColumnNames.join(", ")}) SELECT ${allColumnNames.join(", ")} FROM ${tableName}`
    );

    // Drop old table and rename temp
    this.db.run(`DROP TABLE ${tableName}`);
    this.db.run(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`);
  }
}
