/**
 * API Client for SpineKit Backend
 */

import type { TableSchema, TableSchemaInput } from "@spinekit/shared";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface ListResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Schema endpoints
  async getTables(): Promise<{ tables: TableSchema[] }> {
    return this.request("/admin/schema");
  }

  async getTable(tableName: string): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}`);
  }

  async createTable(data: TableSchemaInput): Promise<{ table: TableSchema }> {
    return this.request("/admin/schema", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTable(tableName: string): Promise<{ message: string }> {
    return this.request(`/admin/schema/${tableName}`, {
      method: "DELETE",
    });
  }

  // Schema editing endpoints
  async addColumn(
    tableName: string,
    fieldDefinition: {
      name: string;
      displayName: string;
      type: string;
      required?: boolean;
      unique?: boolean;
      defaultValue?: any;
      description?: string;
    }
  ): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}/columns`, {
      method: "POST",
      body: JSON.stringify(fieldDefinition),
    });
  }

  async deleteColumn(tableName: string, columnName: string): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}/columns/${columnName}`, {
      method: "DELETE",
    });
  }

  async updateColumnMetadata(
    tableName: string,
    columnName: string,
    updates: { displayName?: string; description?: string }
  ): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}/columns/${columnName}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async removeConstraint(
    tableName: string,
    columnName: string,
    constraint: "required" | "unique"
  ): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}/columns/${columnName}/constraints/${constraint}`, {
      method: "DELETE",
    });
  }

  async renameColumn(
    tableName: string,
    columnName: string,
    newName: string
  ): Promise<{ table: TableSchema }> {
    return this.request(`/admin/schema/${tableName}/columns/${columnName}/rename`, {
      method: "PUT",
      body: JSON.stringify({ newName }),
    });
  }

  // Data endpoints
  async listRecords<T = unknown>(
    tableName: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      filters?: Record<string, string>;
    }
  ): Promise<ListResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }

    const query = searchParams.toString();
    return this.request(`/${tableName}${query ? `?${query}` : ""}`);
  }

  async getRecord<T = unknown>(
    tableName: string,
    id: string
  ): Promise<{ data: T }> {
    return this.request(`/${tableName}/${id}`);
  }

  async createRecord<T = unknown>(
    tableName: string,
    data: Record<string, unknown>
  ): Promise<{ data: T }> {
    return this.request(`/${tableName}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRecord<T = unknown>(
    tableName: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<{ data: T }> {
    return this.request(`/${tableName}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteRecord(tableName: string, id: string): Promise<{ message: string }> {
    return this.request(`/${tableName}/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
