/**
 * Data Service
 * Handles CRUD operations on dynamically created tables
 */

import type { DatabaseAdapter } from "../adapters/database.adapter";

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

export interface ListResult<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class DataService {
  constructor(private db: DatabaseAdapter) {}

  /**
   * List records from a table with pagination, sorting, and filtering
   */
  async list(tableName: string, options: ListOptions = {}): Promise<ListResult> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;
    const sortBy = options.sortBy || "created_at";
    const sortOrder = options.sortOrder || "desc";

    // Check if table exists
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Build WHERE clause from filters
    const { whereClause, params } = this.buildWhereClause(options.filters || {});

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM ${tableName}${whereClause}`;
    const countResult = await this.db.query<{ count: number }>(countSql, params);
    const total = countResult[0]?.count || 0;

    // Get data
    const dataSql = `
      SELECT * FROM ${tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const data = await this.db.query(dataSql, params);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single record by ID
   */
  async get(tableName: string, id: string): Promise<unknown | null> {
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    const result = await this.db.query(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [id]
    );

    return result[0] || null;
  }

  /**
   * Create a new record
   */
  async create(tableName: string, data: Record<string, unknown>): Promise<unknown> {
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Generate ID and timestamps
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    // Build INSERT statement
    const columns = Object.keys(record);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(record);

    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;
    await this.db.execute(sql, values);

    return record;
  }

  /**
   * Update a record by ID
   */
  async update(
    tableName: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<unknown | null> {
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    // Check if record exists
    const existing = await this.get(tableName, id);
    if (!existing) {
      return null;
    }

    // Build UPDATE statement
    const updates = Object.keys(data)
      .filter((key) => key !== "id" && key !== "created_at") // Don't allow updating these
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.keys(data)
      .filter((key) => key !== "id" && key !== "created_at")
      .map((key) => data[key]);

    const now = new Date().toISOString();
    const sql = `UPDATE ${tableName} SET ${updates}, updated_at = ? WHERE id = ?`;

    await this.db.execute(sql, [...values, now, id]);

    // Return updated record
    return this.get(tableName, id);
  }

  /**
   * Delete a record by ID
   */
  async delete(tableName: string, id: string): Promise<boolean> {
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }

    const result = await this.db.execute(
      `DELETE FROM ${tableName} WHERE id = ?`,
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: Record<string, unknown>): {
    whereClause: string;
    params: unknown[];
  } {
    const keys = Object.keys(filters);
    if (keys.length === 0) {
      return { whereClause: "", params: [] };
    }

    const conditions = keys.map((key) => `${key} = ?`);
    const params = keys.map((key) => filters[key]);

    return {
      whereClause: ` WHERE ${conditions.join(" AND ")}`,
      params,
    };
  }
}
