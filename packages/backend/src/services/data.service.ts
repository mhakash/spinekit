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

    await this.validateTableExists(tableName);

    let validSortBy = sortBy;
    let validFilters = options.filters || {};

    // Only validate and filter columns if there are filters or custom sortBy
    if (this.needsColumnValidation(sortBy, options.filters)) {
      const validColumnNames = await this.getValidColumnNames(tableName);
      validSortBy = this.getSafeColumnName(sortBy, validColumnNames, "created_at");
      validFilters = this.filterValidColumns(options.filters || {}, validColumnNames);
    }

    const { whereClause, params } = this.buildWhereClause(validFilters);
    const total = await this.getRecordCount(tableName, whereClause, params);
    const data = await this.fetchRecords(tableName, whereClause, params, validSortBy, sortOrder, limit, offset);

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
    await this.validateTableExists(tableName);
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
    await this.validateTableExists(tableName);

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
    await this.validateTableExists(tableName);

    const existing = await this.get(tableName, id);
    if (!existing) {
      return null;
    }

    const updates = Object.keys(data)
      .filter((key) => key !== "id" && key !== "created_at")
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.keys(data)
      .filter((key) => key !== "id" && key !== "created_at")
      .map((key) => data[key]);

    const now = new Date().toISOString();
    const sql = `UPDATE ${tableName} SET ${updates}, updated_at = ? WHERE id = ?`;

    await this.db.execute(sql, [...values, now, id]);

    return this.get(tableName, id);
  }

  /**
   * Delete a record by ID
   */
  async delete(tableName: string, id: string): Promise<boolean> {
    await this.validateTableExists(tableName);
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

  /**
   * Validate table exists
   */
  private async validateTableExists(tableName: string): Promise<void> {
    const exists = await this.db.tableExists(tableName);
    if (!exists) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
  }

  /**
   * Get valid column names for a table
   */
  private async getValidColumnNames(tableName: string): Promise<string[]> {
    const columns = await this.db.getTableSchema(tableName);
    return columns.map((col) => col.name);
  }

  /**
   * Get total count of records with filters
   */
  private async getRecordCount(
    tableName: string,
    whereClause: string,
    params: unknown[]
  ): Promise<number> {
    const countSql = `SELECT COUNT(*) as count FROM ${tableName}${whereClause}`;
    const countResult = await this.db.query<{ count: number }>(countSql, params);
    return countResult[0]?.count || 0;
  }

  /**
   * Fetch records with sorting and pagination
   */
  private async fetchRecords(
    tableName: string,
    whereClause: string,
    params: unknown[],
    sortBy: string,
    sortOrder: string,
    limit: number,
    offset: number
  ): Promise<unknown[]> {
    const sql = `
      SELECT * FROM ${tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    return await this.db.query(sql, dataParams);
  }

  /**
   * Check if column validation is needed
   */
  private needsColumnValidation(sortBy: string, filters?: Record<string, unknown>): boolean {
    const hasFilters = filters && Object.keys(filters).length > 0;
    const hasCustomSort = sortBy !== "created_at";
    return hasFilters || hasCustomSort;
  }

  /**
   * Get safe column name, fallback to default if invalid
   */
  private getSafeColumnName(
    columnName: string,
    validColumnNames: string[],
    fallback: string
  ): string {
    return validColumnNames.includes(columnName) ? columnName : fallback;
  }

  /**
   * Filter out invalid columns from filters
   */
  private filterValidColumns(
    filters: Record<string, unknown>,
    validColumnNames: string[]
  ): Record<string, unknown> {
    const validFilters: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (validColumnNames.includes(key)) {
        validFilters[key] = value;
      }
    }
    return validFilters;
  }
}
