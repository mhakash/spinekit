/**
 * Schema Routes Tests - API endpoint tests for schema editing
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { SchemaService } from "../services/schema.service";
import { SQLiteAdapter } from "../adapters/sqlite.adapter";
import { createSchemaRoutes } from "./schema.routes";

describe("Schema Routes - Phase 1 Operations", () => {
  let db: SQLiteAdapter;
  let schemaService: SchemaService;
  let app: Hono;

  beforeEach(async () => {
    db = new SQLiteAdapter(":memory:");
    await db.connect();
    schemaService = new SchemaService(db);
    app = createSchemaRoutes(schemaService);

    // Create a test table
    await schemaService.createTable({
      name: "users",
      displayName: "Users",
      description: "User accounts",
      fields: [
        {
          name: "username",
          displayName: "Username",
          type: "string",
          required: true,
          unique: true,
        },
        {
          name: "email",
          displayName: "Email",
          type: "string",
          required: true,
        },
      ],
    });
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe("POST /:tableName/columns", () => {
    test("should add nullable column", async () => {
      const res = await app.request("/users/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "bio",
          displayName: "Biography",
          type: "string",
          required: false,
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.table.fields).toHaveLength(3);

      const bioField = json.table.fields.find((f: any) => f.name === "bio");
      expect(bioField).toBeDefined();
      expect(bioField.displayName).toBe("Biography");
    });

    test("should add column with default value", async () => {
      const res = await app.request("/users/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "status",
          displayName: "Status",
          type: "string",
          required: true,
          defaultValue: "active",
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();

      const statusField = json.table.fields.find((f: any) => f.name === "status");
      expect(statusField.defaultValue).toBe("active");
    });

    test("should reject duplicate column", async () => {
      const res = await app.request("/users/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "username",
          displayName: "Username 2",
          type: "string",
          required: false,
        }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("already exists");
    });

    test("should reject required column without default", async () => {
      const res = await app.request("/users/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "required_field",
          displayName: "Required Field",
          type: "string",
          required: true,
        }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("must be nullable or have a default value");
    });
  });

  describe("DELETE /:tableName/columns/:columnName", () => {
    test("should delete column", async () => {
      const res = await app.request("/users/columns/email", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.table.fields).toHaveLength(1);

      const emailField = json.table.fields.find((f: any) => f.name === "email");
      expect(emailField).toBeUndefined();
    });

    test("should reject deleting system column", async () => {
      const res = await app.request("/users/columns/id", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("system column");
    });

    test("should reject deleting non-existent column", async () => {
      const res = await app.request("/users/columns/non_existent", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("does not exist");
    });
  });

  describe("PATCH /:tableName/columns/:columnName", () => {
    test("should update display name", async () => {
      const res = await app.request("/users/columns/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "User Name",
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "username");
      expect(field.displayName).toBe("User Name");
    });

    test("should update description", async () => {
      const res = await app.request("/users/columns/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Unique username for login",
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "username");
      expect(field.description).toBe("Unique username for login");
    });

    test("should update both display name and description", async () => {
      const res = await app.request("/users/columns/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Email Address",
          description: "User email for notifications",
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "email");
      expect(field.displayName).toBe("Email Address");
      expect(field.description).toBe("User email for notifications");
    });

    test("should reject empty display name", async () => {
      const res = await app.request("/users/columns/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:tableName/columns/:columnName/rename", () => {
    test("should rename column", async () => {
      const res = await app.request("/users/columns/username/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: "user_name" }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "user_name");
      expect(field).toBeDefined();

      const oldField = json.table.fields.find((f: any) => f.name === "username");
      expect(oldField).toBeUndefined();
    });

    test("should reject renaming to existing column", async () => {
      const res = await app.request("/users/columns/username/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: "email" }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("already exists");
    });

    test("should reject renaming system column", async () => {
      const res = await app.request("/users/columns/id/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: "new_id" }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("system column");
    });

    test("should reject invalid new name", async () => {
      const res = await app.request("/users/columns/username/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: "user-name" }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("valid identifier");
    });

    test("should reject missing new name", async () => {
      const res = await app.request("/users/columns/username/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("required");
    });
  });

  describe("DELETE /:tableName/columns/:columnName/constraints/:constraint", () => {
    test("should remove required constraint", async () => {
      const res = await app.request("/users/columns/email/constraints/required", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "email");
      expect(field.required).toBe(false);
    });

    test("should remove unique constraint", async () => {
      const res = await app.request("/users/columns/username/constraints/unique", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();

      const field = json.table.fields.find((f: any) => f.name === "username");
      expect(field.unique).toBe(false);
    });

    test("should reject invalid constraint type", async () => {
      const res = await app.request("/users/columns/email/constraints/invalid", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("Invalid constraint");
    });

    test("should reject removing constraint from non-existent column", async () => {
      const res = await app.request("/users/columns/non_existent/constraints/required", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain("does not exist");
    });
  });
});
