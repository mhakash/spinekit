/**
 * Schema Management Routes
 * API endpoints for managing table schemas
 */

import { Hono } from "hono";
import type { SchemaService } from "../services/schema.service";

export function createSchemaRoutes(schemaService: SchemaService) {
  const app = new Hono();

  // Get all tables
  app.get("/", async (c) => {
    try {
      const tables = await schemaService.getTables();
      return c.json({ tables });
    } catch (error) {
      console.error("Error fetching tables:", error);
      return c.json({ error: "Failed to fetch tables" }, 500);
    }
  });

  // Get single table
  app.get("/:tableName", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const table = await schemaService.getTable(tableName);

      if (!table) {
        return c.json({ error: "Table not found" }, 404);
      }

      return c.json({ table });
    } catch (error) {
      console.error("Error fetching table:", error);
      return c.json({ error: "Failed to fetch table" }, 500);
    }
  });

  // Create new table
  app.post("/", async (c) => {
    try {
      const body = await c.req.json();
      const table = await schemaService.createTable(body);
      return c.json({ table }, 201);
    } catch (error: any) {
      console.error("Error creating table:", error);
      return c.json(
        { error: error.message || "Failed to create table" },
        400
      );
    }
  });

  // Delete table
  app.delete("/:tableName", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      await schemaService.deleteTable(tableName);
      return c.json({ message: "Table deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting table:", error);
      return c.json(
        { error: error.message || "Failed to delete table" },
        400
      );
    }
  });

  // Add column to existing table
  app.post("/:tableName/columns", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const body = await c.req.json();
      await schemaService.addColumn(tableName, body);
      const table = await schemaService.getTable(tableName);
      return c.json({ table }, 201);
    } catch (error: any) {
      console.error("Error adding column:", error);
      return c.json(
        { error: error.message || "Failed to add column" },
        400
      );
    }
  });

  // Delete column from table
  app.delete("/:tableName/columns/:columnName", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const columnName = c.req.param("columnName");
      await schemaService.deleteColumn(tableName, columnName);
      const table = await schemaService.getTable(tableName);
      return c.json({ table });
    } catch (error: any) {
      console.error("Error deleting column:", error);
      return c.json(
        { error: error.message || "Failed to delete column" },
        400
      );
    }
  });

  // Update column metadata (display name, description)
  app.patch("/:tableName/columns/:columnName", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const columnName = c.req.param("columnName");
      const body = await c.req.json();
      await schemaService.updateColumnMetadata(tableName, columnName, body);
      const table = await schemaService.getTable(tableName);
      return c.json({ table });
    } catch (error: any) {
      console.error("Error updating column metadata:", error);
      return c.json(
        { error: error.message || "Failed to update column metadata" },
        400
      );
    }
  });

  // Rename column
  app.put("/:tableName/columns/:columnName/rename", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const columnName = c.req.param("columnName");
      const body = await c.req.json();

      if (!body.newName || typeof body.newName !== "string") {
        return c.json({ error: "New column name is required" }, 400);
      }

      await schemaService.renameColumn(tableName, columnName, body.newName);
      const table = await schemaService.getTable(tableName);
      return c.json({ table });
    } catch (error: any) {
      console.error("Error renaming column:", error);
      return c.json(
        { error: error.message || "Failed to rename column" },
        400
      );
    }
  });

  // Remove constraint from column
  app.delete("/:tableName/columns/:columnName/constraints/:constraint", async (c) => {
    try {
      const tableName = c.req.param("tableName");
      const columnName = c.req.param("columnName");
      const constraint = c.req.param("constraint") as "required" | "unique";

      if (constraint !== "required" && constraint !== "unique") {
        return c.json(
          { error: "Invalid constraint. Must be 'required' or 'unique'" },
          400
        );
      }

      await schemaService.removeConstraint(tableName, columnName, constraint);
      const table = await schemaService.getTable(tableName);
      return c.json({ table });
    } catch (error: any) {
      console.error("Error removing constraint:", error);
      return c.json(
        { error: error.message || "Failed to remove constraint" },
        400
      );
    }
  });

  return app;
}
