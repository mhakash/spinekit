/**
 * Schema Service Tests - Phase 1: Safe Schema Operations
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { SchemaService } from "./schema.service";
import { SQLiteAdapter } from "../adapters/sqlite.adapter";
import type { FieldDefinition } from "@spinekit/shared";

type FieldInput = Omit<FieldDefinition, "id">;

describe("SchemaService - Safe Schema Operations", () => {
  let db: SQLiteAdapter;
  let schemaService: SchemaService;

  beforeEach(async () => {
    // Use in-memory database for tests
    db = new SQLiteAdapter(":memory:");
    await db.connect();
    schemaService = new SchemaService(db);

    // Create a test table for schema operations
    await schemaService.createTable({
      name: "test_users",
      displayName: "Test Users",
      description: "Test table for schema operations",
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
        {
          name: "age",
          displayName: "Age",
          type: "number",
          required: false,
        },
      ],
    });
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe("Add Column", () => {
    test("should add nullable column to existing table", async () => {
      const newField: FieldInput = {
        name: "bio",
        displayName: "Biography",
        type: "string",
        required: false,
        unique: false,
      };

      await schemaService.addColumn("test_users", newField as any);

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      expect(table!.fields).toHaveLength(4);

      const bioField = table!.fields.find((f) => f.name === "bio");
      expect(bioField).toBeDefined();
      expect(bioField?.displayName).toBe("Biography");
      expect(bioField?.type).toBe("string");
      expect(bioField?.required).toBe(false);
    });

    test("should add column with default value", async () => {
      const newField: FieldInput = {
        name: "status",
        displayName: "Status",
        type: "string",
        required: true,
        unique: false,
        defaultValue: "active",
      };

      await schemaService.addColumn("test_users", newField as any);

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const statusField = table!.fields.find((f) => f.name === "status");

      expect(statusField).toBeDefined();
      expect(statusField?.defaultValue).toBe("active");
    });

    test("should reject duplicate column name", async () => {
      const duplicateField: FieldInput = {
        name: "username",
        displayName: "Username 2",
        type: "string",
        required: false,
        unique: false,
      };

      expect(
        schemaService.addColumn("test_users", duplicateField as any)
      ).rejects.toThrow("already exists");
    });

    test("should reject required column without default value", async () => {
      const invalidField: FieldInput = {
        name: "required_field",
        displayName: "Required Field",
        type: "string",
        required: true,
        unique: false,
      };

      expect(
        schemaService.addColumn("test_users", invalidField as any)
      ).rejects.toThrow("must be nullable or have a default value");
    });

    test("should reject adding column to non-existent table", async () => {
      const newField: FieldInput = {
        name: "new_field",
        displayName: "New Field",
        type: "string",
        required: false,
        unique: false,
      };

      expect(
        schemaService.addColumn("non_existent_table", newField as any)
      ).rejects.toThrow("does not exist");
    });

    test("should validate field name format", async () => {
      const invalidField: FieldInput = {
        name: "invalid-name",
        displayName: "Invalid Name",
        type: "string",
        required: false,
        unique: false,
      };

      expect(
        schemaService.addColumn("test_users", invalidField as any)
      ).rejects.toThrow();
    });

    test("should add column and preserve existing data", async () => {
      // Insert test data first
      await db.execute(
        "INSERT INTO test_users (id, username, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        ["test-id", "john", "john@example.com", new Date().toISOString(), new Date().toISOString()]
      );

      const newField: FieldInput = {
        name: "bio",
        displayName: "Biography",
        type: "string",
        required: false,
        unique: false,
      };

      await schemaService.addColumn("test_users", newField as any);

      // Verify data still exists
      const rows: any[] = await db.query("SELECT * FROM test_users WHERE id = ?", ["test-id"]);
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("john");
    });
  });

  describe("Delete Column", () => {
    test("should remove column and data", async () => {
      await schemaService.deleteColumn("test_users", "age");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      expect(table!.fields).toHaveLength(2);

      const ageField = table!.fields.find((f) => f.name === "age");
      expect(ageField).toBeUndefined();
    });

    test("should prevent deleting non-existent column", async () => {
      expect(
        schemaService.deleteColumn("test_users", "non_existent_column")
      ).rejects.toThrow("does not exist");
    });

    test("should prevent deleting system columns", async () => {
      expect(
        schemaService.deleteColumn("test_users", "id")
      ).rejects.toThrow("Cannot delete system column");

      expect(
        schemaService.deleteColumn("test_users", "created_at")
      ).rejects.toThrow("Cannot delete system column");

      expect(
        schemaService.deleteColumn("test_users", "updated_at")
      ).rejects.toThrow("Cannot delete system column");
    });

    test("should handle deletion of column with data", async () => {
      // Insert test data
      await db.execute(
        "INSERT INTO test_users (id, username, email, age, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        ["test-id", "john", "john@example.com", 25, new Date().toISOString(), new Date().toISOString()]
      );

      await schemaService.deleteColumn("test_users", "age");

      // Verify column is gone but other data remains
      const rows: any[] = await db.query("SELECT * FROM test_users WHERE id = ?", ["test-id"]);
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("john");
      expect(rows[0].age).toBeUndefined();
    });

    test("should reject deleting column from non-existent table", async () => {
      expect(
        schemaService.deleteColumn("non_existent_table", "some_field")
      ).rejects.toThrow("does not exist");
    });
  });

  describe("Update Metadata", () => {
    test("should update display name", async () => {
      await schemaService.updateColumnMetadata("test_users", "username", {
        displayName: "User Name",
      });

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "username");

      expect(field?.displayName).toBe("User Name");
    });

    test("should update description", async () => {
      await schemaService.updateColumnMetadata("test_users", "username", {
        description: "The user's unique identifier",
      });

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "username");

      expect(field?.description).toBe("The user's unique identifier");
    });

    test("should update both display name and description", async () => {
      await schemaService.updateColumnMetadata("test_users", "email", {
        displayName: "Email Address",
        description: "User's email for notifications",
      });

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "email");

      expect(field?.displayName).toBe("Email Address");
      expect(field?.description).toBe("User's email for notifications");
    });

    test("should reject updating non-existent column", async () => {
      expect(
        schemaService.updateColumnMetadata("test_users", "non_existent", {
          displayName: "New Name",
        })
      ).rejects.toThrow("does not exist");
    });

    test("should reject updating non-existent table", async () => {
      expect(
        schemaService.updateColumnMetadata("non_existent_table", "username", {
          displayName: "New Name",
        })
      ).rejects.toThrow("does not exist");
    });

    test("should reject empty display name", async () => {
      expect(
        schemaService.updateColumnMetadata("test_users", "username", {
          displayName: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("Remove Constraints", () => {
    test("should remove required constraint", async () => {
      await schemaService.removeConstraint("test_users", "email", "required");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "email");

      expect(field?.required).toBe(false);
    });

    test("should remove unique constraint", async () => {
      await schemaService.removeConstraint("test_users", "username", "unique");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "username");

      expect(field?.unique).toBe(false);
    });

    test("should reject removing constraint from non-existent column", async () => {
      expect(
        schemaService.removeConstraint("test_users", "non_existent", "required")
      ).rejects.toThrow("does not exist");
    });

    test("should reject removing constraint from non-existent table", async () => {
      expect(
        schemaService.removeConstraint("non_existent_table", "username", "required")
      ).rejects.toThrow("does not exist");
    });

    test("should handle removing non-existent constraint gracefully", async () => {
      // age is already not required
      await schemaService.removeConstraint("test_users", "age", "required");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      const field = table!.fields.find((f) => f.name === "age");

      expect(field?.required).toBe(false);
    });
  });

  describe("Rename Column", () => {
    test("should rename column and preserve data", async () => {
      // Insert test data
      await db.execute(
        "INSERT INTO test_users (id, username, email, age, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        ["test-id", "john", "john@example.com", 25, new Date().toISOString(), new Date().toISOString()]
      );

      await schemaService.renameColumn("test_users", "username", "user_name");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();

      // Check metadata updated
      const field = table!.fields.find((f) => f.name === "user_name");
      expect(field).toBeDefined();
      expect(field?.displayName).toBe("Username"); // Display name should remain unchanged

      // Check old name doesn't exist
      const oldField = table!.fields.find((f) => f.name === "username");
      expect(oldField).toBeUndefined();

      // Verify data preserved
      const rows: any[] = await db.query("SELECT * FROM test_users WHERE id = ?", ["test-id"]);
      expect(rows).toHaveLength(1);
      expect(rows[0].user_name).toBe("john");
      expect(rows[0].username).toBeUndefined();
    });

    test("should reject renaming to existing column name", async () => {
      expect(
        schemaService.renameColumn("test_users", "username", "email")
      ).rejects.toThrow("already exists");
    });

    test("should reject renaming system columns", async () => {
      expect(
        schemaService.renameColumn("test_users", "id", "new_id")
      ).rejects.toThrow("Cannot rename system column");

      expect(
        schemaService.renameColumn("test_users", "created_at", "new_created")
      ).rejects.toThrow("Cannot rename system column");
    });

    test("should reject renaming to system column name", async () => {
      expect(
        schemaService.renameColumn("test_users", "username", "id")
      ).rejects.toThrow("Cannot use system column name");
    });

    test("should reject invalid column names", async () => {
      expect(
        schemaService.renameColumn("test_users", "username", "user-name")
      ).rejects.toThrow("valid identifier");

      expect(
        schemaService.renameColumn("test_users", "username", "123user")
      ).rejects.toThrow("valid identifier");

      expect(
        schemaService.renameColumn("test_users", "username", "")
      ).rejects.toThrow("cannot be empty");
    });

    test("should reject renaming non-existent column", async () => {
      expect(
        schemaService.renameColumn("test_users", "non_existent", "new_name")
      ).rejects.toThrow("does not exist");
    });

    test("should reject renaming in non-existent table", async () => {
      expect(
        schemaService.renameColumn("non_existent_table", "username", "new_name")
      ).rejects.toThrow("does not exist");
    });

    test("should handle renaming to same name gracefully", async () => {
      await schemaService.renameColumn("test_users", "username", "username");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();

      const field = table!.fields.find((f) => f.name === "username");
      expect(field).toBeDefined();
    });

    test("should preserve column constraints after rename", async () => {
      await schemaService.renameColumn("test_users", "username", "user_name");

      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();

      const field = table!.fields.find((f) => f.name === "user_name");
      expect(field?.required).toBe(true);
      expect(field?.unique).toBe(true);
    });
  });

  describe("Transaction Rollback", () => {
    test("should rollback on add column failure", async () => {
      const invalidField: FieldInput = {
        name: "new_field",
        displayName: "New Field",
        type: "invalid_type" as any,
        required: false,
        unique: false,
      };

      try {
        await schemaService.addColumn("test_users", invalidField as any);
      } catch (error) {
        // Expected to fail
      }

      // Verify no changes were made
      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      expect(table!.fields).toHaveLength(3);
    });

    test("should rollback on delete column failure", async () => {
      // Mock a failure scenario by trying to delete from wrong table
      try {
        await schemaService.deleteColumn("non_existent_table", "username");
      } catch (error) {
        // Expected to fail
      }

      // Verify original table is unchanged
      const table = await schemaService.getTable("test_users");
      expect(table).not.toBeNull();
      expect(table!.fields).toHaveLength(3);
    });
  });
});
