/**
 * Dynamic Data Routes
 * Creates CRUD endpoints for a specific table
 */

import { Hono } from "hono";
import type { DataService } from "../services/data.service";

export function createDataRoutes(tableName: string, dataService: DataService) {
  const app = new Hono();

  // List records
  app.get("/", async (c) => {
    try {
      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "50");
      const sortBy = c.req.query("sortBy") || "created_at";
      const sortOrder = (c.req.query("sortOrder") || "desc") as "asc" | "desc";

      // Parse all other query params as potential filters
      const filters: Record<string, unknown> = {};
      const url = new URL(c.req.url);
      const reservedParams = ["page", "limit", "sortBy", "sortOrder"];
      
      for (const [key, value] of url.searchParams.entries()) {
        if (!reservedParams.includes(key)) {
          filters[key] = value;
        }
      }

      const result = await dataService.list(tableName, {
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      });

      return c.json(result);
    } catch (error: any) {
      console.error(`Error listing ${tableName}:`, error);
      return c.json({ error: error.message || "Failed to list records" }, 500);
    }
  });

  // Get single record
  app.get("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const record = await dataService.get(tableName, id);

      if (!record) {
        return c.json({ error: "Record not found" }, 404);
      }

      return c.json({ data: record });
    } catch (error: any) {
      console.error(`Error getting ${tableName}:`, error);
      return c.json({ error: error.message || "Failed to get record" }, 500);
    }
  });

  // Create record
  app.post("/", async (c) => {
    try {
      const body = await c.req.json();
      const record = await dataService.create(tableName, body);
      return c.json({ data: record }, 201);
    } catch (error: any) {
      console.error(`Error creating ${tableName}:`, error);
      return c.json({ error: error.message || "Failed to create record" }, 400);
    }
  });

  // Update record
  app.put("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const record = await dataService.update(tableName, id, body);

      if (!record) {
        return c.json({ error: "Record not found" }, 404);
      }

      return c.json({ data: record });
    } catch (error: any) {
      console.error(`Error updating ${tableName}:`, error);
      return c.json({ error: error.message || "Failed to update record" }, 400);
    }
  });

  // Delete record
  app.delete("/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const deleted = await dataService.delete(tableName, id);

      if (!deleted) {
        return c.json({ error: "Record not found" }, 404);
      }

      return c.json({ message: "Record deleted successfully" });
    } catch (error: any) {
      console.error(`Error deleting ${tableName}:`, error);
      return c.json({ error: error.message || "Failed to delete record" }, 400);
    }
  });

  return app;
}
