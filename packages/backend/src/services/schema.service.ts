/**
 * Schema Service
 * Manages table and field definitions
 */

import type { DatabaseAdapter } from "../adapters/database.adapter";
import type { TableSchema, FieldDefinition } from "@spinekit/shared";
import { tableSchemaSchema } from "@spinekit/shared";

export class SchemaService {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Create a new table in the database
   */
  async createTable(input: unknown): Promise<TableSchema> {
    // Validate input
    const validated = tableSchemaSchema.parse(input);

    // Generate IDs
    const tableId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Check if table already exists
    const exists = await this.db.tableExists(validated.name);
    if (exists) {
      throw new Error(`Table '${validated.name}' already exists`);
    }

    await this.db.beginTransaction();

    try {
      // Insert into _spinekit_tables
      await this.db.execute(
        `INSERT INTO _spinekit_tables (id, name, display_name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tableId, validated.name, validated.displayName, validated.description || null, now, now]
      );

      // Insert fields into _spinekit_fields
      const fields: FieldDefinition[] = [];
      for (let i = 0; i < validated.fields.length; i++) {
        const field = validated.fields[i];
        const fieldId = crypto.randomUUID();

        await this.db.execute(
          `INSERT INTO _spinekit_fields (
            id, table_id, name, display_name, type, required, unique_constraint,
            default_value, description, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fieldId,
            tableId,
            field.name,
            field.displayName,
            field.type,
            field.required ? 1 : 0,
            field.unique ? 1 : 0,
            field.defaultValue ? JSON.stringify(field.defaultValue) : null,
            field.description || null,
            i,
            now,
            now,
          ]
        );

        fields.push({
          id: fieldId,
          name: field.name,
          displayName: field.displayName,
          type: field.type,
          required: field.required,
          unique: field.unique,
          defaultValue: field.defaultValue,
          description: field.description,
        });
      }

      // Create the actual table in the database
      await this.createPhysicalTable(validated.name, fields);

      await this.db.commit();

      return {
        id: tableId,
        name: validated.name,
        displayName: validated.displayName,
        description: validated.description,
        fields,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Get all tables
   */
  async getTables(): Promise<TableSchema[]> {
    const tables = await this.db.query<{
      id: string;
      name: string;
      display_name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM _spinekit_tables ORDER BY created_at DESC");

    const result: TableSchema[] = [];

    for (const table of tables) {
      const fields = await this.getTableFields(table.id);
      result.push({
        id: table.id,
        name: table.name,
        displayName: table.display_name,
        description: table.description || undefined,
        fields,
        createdAt: new Date(table.created_at),
        updatedAt: new Date(table.updated_at),
      });
    }

    return result;
  }

  /**
   * Get a single table by name
   */
  async getTable(tableName: string): Promise<TableSchema | null> {
    const tables = await this.db.query<{
      id: string;
      name: string;
      display_name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM _spinekit_tables WHERE name = ?", [tableName]);

    if (tables.length === 0) return null;

    const table = tables[0];
    const fields = await this.getTableFields(table.id);

    return {
      id: table.id,
      name: table.name,
      displayName: table.display_name,
      description: table.description || undefined,
      fields,
      createdAt: new Date(table.created_at),
      updatedAt: new Date(table.updated_at),
    };
  }

  /**
   * Delete a table
   */
  async deleteTable(tableName: string): Promise<void> {
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }

    await this.db.beginTransaction();

    try {
      // Drop the physical table
      await this.db.execute(`DROP TABLE IF EXISTS ${tableName}`);

      // Delete from _spinekit_tables (cascade will delete fields)
      await this.db.execute("DELETE FROM _spinekit_tables WHERE name = ?", [tableName]);

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Get fields for a table
   */
  private async getTableFields(tableId: string): Promise<FieldDefinition[]> {
    const fields = await this.db.query<{
      id: string;
      name: string;
      display_name: string;
      type: string;
      required: number;
      unique_constraint: number;
      default_value: string | null;
      description: string | null;
    }>(
      "SELECT * FROM _spinekit_fields WHERE table_id = ? ORDER BY sort_order ASC",
      [tableId]
    );

    return fields.map((field) => ({
      id: field.id,
      name: field.name,
      displayName: field.display_name,
      type: field.type as any,
      required: field.required === 1,
      unique: field.unique_constraint === 1,
      defaultValue: field.default_value ? JSON.parse(field.default_value) : undefined,
      description: field.description || undefined,
    }));
  }

  /**
   * Create the actual database table
   */
  private async createPhysicalTable(
    tableName: string,
    fields: FieldDefinition[]
  ): Promise<void> {
    // Build CREATE TABLE SQL
    const columns = [
      "id TEXT PRIMARY KEY",
      ...fields.map((field) => {
        const sqlType = this.mapFieldTypeToSQL(field.type);
        const constraints: string[] = [];

        if (field.required) constraints.push("NOT NULL");
        if (field.unique) constraints.push("UNIQUE");

        return `${field.name} ${sqlType} ${constraints.join(" ")}`.trim();
      }),
      "created_at TEXT NOT NULL",
      "updated_at TEXT NOT NULL",
    ];

    const sql = `CREATE TABLE ${tableName} (${columns.join(", ")})`;
    await this.db.execute(sql);
  }

  /**
   * Add a new column to an existing table
   * Phase 1: Safe operation - column must be nullable or have default value
   */
  async addColumn(tableName: string, fieldDefinition: FieldDefinition): Promise<void> {
    // Validate that table exists
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Validate field definition
    const { fieldDefinitionSchema } = await import("@spinekit/shared");
    const validated = fieldDefinitionSchema.parse(fieldDefinition);

    // Check if column already exists
    const existingField = table.fields.find((f) => f.name === validated.name);
    if (existingField) {
      throw new Error(`Column '${validated.name}' already exists in table '${tableName}'`);
    }

    // Phase 1 Safety: Required columns must have a default value
    if (validated.required && !validated.defaultValue) {
      throw new Error(
        "New column must be nullable or have a default value to avoid breaking existing records"
      );
    }

    await this.db.beginTransaction();

    try {
      const fieldId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Get the next sort order
      const sortOrder = table.fields.length;

      // Insert into _spinekit_fields
      await this.db.execute(
        `INSERT INTO _spinekit_fields (
          id, table_id, name, display_name, type, required, unique_constraint,
          default_value, description, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fieldId,
          table.id,
          validated.name,
          validated.displayName,
          validated.type,
          validated.required ? 1 : 0,
          validated.unique ? 1 : 0,
          validated.defaultValue ? JSON.stringify(validated.defaultValue) : null,
          validated.description || null,
          sortOrder,
          now,
          now,
        ]
      );

      // Add column to physical table
      const sqlType = this.mapFieldTypeToSQL(validated.type);
      const constraints: string[] = [];

      if (validated.required) constraints.push("NOT NULL");
      if (validated.unique) constraints.push("UNIQUE");
      if (validated.defaultValue !== undefined) {
        const defaultVal = this.formatDefaultValue(validated.defaultValue, validated.type);
        constraints.push(`DEFAULT ${defaultVal}`);
      }

      const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN ${validated.name} ${sqlType} ${constraints.join(" ")}`.trim();
      await this.db.execute(alterSQL);

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Delete a column from an existing table
   * Phase 1: Safe operation - removes column and all data in it
   */
  async deleteColumn(tableName: string, columnName: string): Promise<void> {
    // Validate that table exists
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Prevent deleting system columns
    const systemColumns = ["id", "created_at", "updated_at"];
    if (systemColumns.includes(columnName)) {
      throw new Error(`Cannot delete system column '${columnName}'`);
    }

    // Check if column exists
    const field = table.fields.find((f) => f.name === columnName);
    if (!field) {
      throw new Error(`Column '${columnName}' does not exist in table '${tableName}'`);
    }

    await this.db.beginTransaction();

    try {
      // Delete from _spinekit_fields
      await this.db.execute(
        "DELETE FROM _spinekit_fields WHERE table_id = ? AND name = ?",
        [table.id, columnName]
      );

      // Drop column from physical table
      // Note: SQLite supports DROP COLUMN in version 3.35.0+ (2021)
      // Bun uses modern SQLite so this should work
      await this.db.execute(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Update column metadata (display name, description)
   * Phase 1: Safe operation - only updates metadata, no schema changes
   */
  async updateColumnMetadata(
    tableName: string,
    columnName: string,
    updates: { displayName?: string; description?: string }
  ): Promise<void> {
    // Validate that table exists
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Check if column exists
    const field = table.fields.find((f) => f.name === columnName);
    if (!field) {
      throw new Error(`Column '${columnName}' does not exist in table '${tableName}'`);
    }

    // Validate updates
    if (updates.displayName !== undefined && updates.displayName.trim() === "") {
      throw new Error("Display name cannot be empty");
    }

    await this.db.beginTransaction();

    try {
      const now = new Date().toISOString();
      const setParts: string[] = [];
      const params: any[] = [];

      if (updates.displayName !== undefined) {
        setParts.push("display_name = ?");
        params.push(updates.displayName);
      }

      if (updates.description !== undefined) {
        setParts.push("description = ?");
        params.push(updates.description);
      }

      setParts.push("updated_at = ?");
      params.push(now);

      params.push(table.id, columnName);

      await this.db.execute(
        `UPDATE _spinekit_fields SET ${setParts.join(", ")} WHERE table_id = ? AND name = ?`,
        params
      );

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Remove constraints from a column
   * Phase 1: Safe operation - removes required or unique constraints
   */
  async removeConstraint(
    tableName: string,
    columnName: string,
    constraint: "required" | "unique"
  ): Promise<void> {
    // Validate that table exists
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Check if column exists
    const field = table.fields.find((f) => f.name === columnName);
    if (!field) {
      throw new Error(`Column '${columnName}' does not exist in table '${tableName}'`);
    }

    await this.db.beginTransaction();

    try {
      const now = new Date().toISOString();

      if (constraint === "required") {
        // Update metadata
        await this.db.execute(
          "UPDATE _spinekit_fields SET required = 0, updated_at = ? WHERE table_id = ? AND name = ?",
          [now, table.id, columnName]
        );

        // Rebuild table without NOT NULL constraint
        await this.rebuildTableWithoutConstraint(tableName, columnName, "NOT NULL");
      } else if (constraint === "unique") {
        // Update metadata
        await this.db.execute(
          "UPDATE _spinekit_fields SET unique_constraint = 0, updated_at = ? WHERE table_id = ? AND name = ?",
          [now, table.id, columnName]
        );

        // Rebuild table without UNIQUE constraint
        await this.rebuildTableWithoutConstraint(tableName, columnName, "UNIQUE");
      }

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Helper: Rebuild table without a specific constraint
   * This is necessary because SQLite doesn't support ALTER COLUMN
   */
  private async rebuildTableWithoutConstraint(
    tableName: string,
    columnName: string,
    constraint: string
  ): Promise<void> {
    const table = await this.getTable(tableName);
    if (!table) throw new Error(`Table '${tableName}' does not exist`);

    const tempTableName = `${tableName}_temp_${Date.now()}`;

    // Create temp table with new schema
    const columns = [
      "id TEXT PRIMARY KEY",
      ...table.fields.map((field) => {
        const sqlType = this.mapFieldTypeToSQL(field.type);
        const constraints: string[] = [];

        // Skip the constraint we're removing for the specified column
        if (field.name === columnName) {
          if (constraint === "NOT NULL" && field.unique) {
            constraints.push("UNIQUE");
          } else if (constraint === "UNIQUE" && field.required) {
            constraints.push("NOT NULL");
          }
        } else {
          if (field.required) constraints.push("NOT NULL");
          if (field.unique) constraints.push("UNIQUE");
        }

        return `${field.name} ${sqlType} ${constraints.join(" ")}`.trim();
      }),
      "created_at TEXT NOT NULL",
      "updated_at TEXT NOT NULL",
    ];

    await this.db.execute(`CREATE TABLE ${tempTableName} (${columns.join(", ")})`);

    // Copy data
    const allColumns = ["id", ...table.fields.map((f) => f.name), "created_at", "updated_at"];
    await this.db.execute(
      `INSERT INTO ${tempTableName} (${allColumns.join(", ")}) SELECT ${allColumns.join(", ")} FROM ${tableName}`
    );

    // Drop old table and rename temp
    await this.db.execute(`DROP TABLE ${tableName}`);
    await this.db.execute(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`);
  }

  /**
   * Helper: Format default value for SQL
   */
  private formatDefaultValue(value: any, type: string): string {
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
   * Rename a column
   * Phase 2: Preserve data while changing column name
   */
  async renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string
  ): Promise<void> {
    // Validate that table exists
    const table = await this.getTable(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Prevent renaming system columns
    const systemColumns = ["id", "created_at", "updated_at"];
    if (systemColumns.includes(oldColumnName)) {
      throw new Error(`Cannot rename system column '${oldColumnName}'`);
    }

    // Check if old column exists
    const field = table.fields.find((f) => f.name === oldColumnName);
    if (!field) {
      throw new Error(`Column '${oldColumnName}' does not exist in table '${tableName}'`);
    }

    // Validate new column name
    if (!newColumnName || !newColumnName.trim()) {
      throw new Error("New column name cannot be empty");
    }

    const trimmedNewName = newColumnName.trim();

    // If names are the same, do nothing
    if (oldColumnName === trimmedNewName) {
      return;
    }

    // Check if new name is valid identifier
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!identifierRegex.test(trimmedNewName)) {
      throw new Error("New column name must be a valid identifier (letters, numbers, underscores)");
    }

    // Check if new name already exists
    if (systemColumns.includes(trimmedNewName)) {
      throw new Error(`Cannot use system column name '${trimmedNewName}'`);
    }

    const existingField = table.fields.find((f) => f.name === trimmedNewName);
    if (existingField) {
      throw new Error(`Column '${trimmedNewName}' already exists in table '${tableName}'`);
    }

    await this.db.beginTransaction();

    try {
      const now = new Date().toISOString();

      // Update metadata in _spinekit_fields
      await this.db.execute(
        "UPDATE _spinekit_fields SET name = ?, updated_at = ? WHERE table_id = ? AND name = ?",
        [trimmedNewName, now, table.id, oldColumnName]
      );

      // Rename column in physical table
      // SQLite 3.25.0+ supports ALTER TABLE RENAME COLUMN
      await this.db.execute(
        `ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${trimmedNewName}`
      );

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Map SpineKit field types to SQL types (delegate to adapter if available)
   */
  private mapFieldTypeToSQL(fieldType: string): string {
    // Check if adapter has a mapping method
    if ("mapFieldTypeToSQL" in this.db && typeof this.db.mapFieldTypeToSQL === "function") {
      return this.db.mapFieldTypeToSQL(fieldType);
    }

    // Default mapping
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
