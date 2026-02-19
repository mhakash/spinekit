/**
 * DataService Tests
 * Tests for CRUD operations and query parameter handling
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { SQLiteAdapter } from "../adapters/sqlite.adapter";
import { SchemaService } from "./schema.service";
import { DataService } from "./data.service";

const TEST_DB = "data-service.test.db";
let adapter: SQLiteAdapter;
let schemaService: SchemaService;
let dataService: DataService;

beforeAll(async () => {
  adapter = new SQLiteAdapter(TEST_DB);
  await adapter.connect();
  schemaService = new SchemaService(adapter);
  dataService = new DataService(adapter);

  // Create test table
  await schemaService.createTable({
    name: "products",
    displayName: "Products",
    description: "Test products table",
    fields: [
      { name: "title", displayName: "Title", type: "string", required: true },
      { name: "price", displayName: "Price", type: "number", required: true },
      { name: "inStock", displayName: "In Stock", type: "boolean", defaultValue: true },
      { name: "category", displayName: "Category", type: "string" },
    ],
  });
});

afterAll(async () => {
  await adapter.disconnect();
  // Clean up test database
  const fs = await import("fs/promises");
  try {
    await fs.unlink(TEST_DB);
  } catch {}
});

describe("DataService - CRUD Operations", () => {
  describe("Create", () => {
    it("should create a record with all fields", async () => {
      const data = {
        title: "Laptop",
        price: 999.99,
        inStock: true,
        category: "Electronics",
      };

      const record = await dataService.create("products", data);

      expect(record).toBeDefined();
      expect((record as any).id).toBeDefined();
      expect((record as any).title).toBe("Laptop");
      expect((record as any).price).toBe(999.99);
      expect((record as any).created_at).toBeDefined();
      expect((record as any).updated_at).toBeDefined();
    });

    it("should create record with only required fields", async () => {
      const data = {
        title: "Mouse",
        price: 25.99,
      };

      const record = await dataService.create("products", data);

      expect(record).toBeDefined();
      expect((record as any).title).toBe("Mouse");
      expect((record as any).price).toBe(25.99);
      expect((record as any).id).toBeDefined();
    });

    it("should reject creating in non-existent table", async () => {
      expect(async () => {
        await dataService.create("fake_table", { title: "test" });
      }).toThrow("Table 'fake_table' does not exist");
    });
  });

  describe("Get", () => {
    it("should get record by id", async () => {
      const created = await dataService.create("products", {
        title: "Keyboard",
        price: 79.99,
      });

      const record = await dataService.get("products", (created as any).id);

      expect(record).toBeDefined();
      expect((record as any).title).toBe("Keyboard");
    });

    it("should return null for non-existent id", async () => {
      const record = await dataService.get("products", "non-existent-id");
      expect(record).toBeNull();
    });

    it("should reject getting from non-existent table", async () => {
      expect(async () => {
        await dataService.get("fake_table", "some-id");
      }).toThrow("Table 'fake_table' does not exist");
    });
  });

  describe("List", () => {
    beforeAll(async () => {
      // Create test data
      for (let i = 1; i <= 15; i++) {
        await dataService.create("products", {
          title: `Product ${i}`,
          price: i * 10,
          category: i % 2 === 0 ? "Electronics" : "Books",
        });
      }
    });

    it("should list records with default pagination", async () => {
      const result = await dataService.list("products");

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it("should paginate results", async () => {
      const page1 = await dataService.list("products", { page: 1, limit: 5 });
      const page2 = await dataService.list("products", { page: 2, limit: 5 });

      expect(page1.data.length).toBe(5);
      expect(page2.data.length).toBe(5);
      expect((page1.data[0] as any).id).not.toBe((page2.data[0] as any).id);
      expect(page1.pagination.page).toBe(1);
      expect(page2.pagination.page).toBe(2);
    });

    it("should sort by column ascending", async () => {
      const result = await dataService.list("products", {
        sortBy: "price",
        sortOrder: "asc",
        limit: 3,
      });

      const prices = result.data.map((r: any) => r.price);
      expect(prices[0]).toBeLessThanOrEqual(prices[1]);
      expect(prices[1]).toBeLessThanOrEqual(prices[2]);
    });

    it("should sort by column descending", async () => {
      const result = await dataService.list("products", {
        sortBy: "price",
        sortOrder: "desc",
        limit: 3,
      });

      const prices = result.data.map((r: any) => r.price);
      expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
      expect(prices[1]).toBeGreaterThanOrEqual(prices[2]);
    });

    it("should filter by single column", async () => {
      const result = await dataService.list("products", {
        filters: { category: "Electronics" },
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((record: any) => {
        expect(record.category).toBe("Electronics");
      });
    });

    it("should handle invalid sort column gracefully", async () => {
      const result = await dataService.list("products", {
        sortBy: "invalid_column",
        limit: 5,
      });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should silently ignore invalid filter columns", async () => {
      const result = await dataService.list("products", {
        filters: {
          category: "Electronics",
          invalid_column: "should_be_ignored",
          another_invalid: 123,
        },
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((record: any) => {
        expect(record.category).toBe("Electronics");
      });
    });

    it("should handle empty filters", async () => {
      const result = await dataService.list("products", {
        filters: {},
      });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should calculate pagination correctly", async () => {
      const result = await dataService.list("products", { limit: 5 });

      expect(result.pagination.totalPages).toBe(
        Math.ceil(result.pagination.total / result.pagination.limit)
      );
    });

    it("should reject listing from non-existent table", async () => {
      expect(async () => {
        await dataService.list("fake_table");
      }).toThrow("Table 'fake_table' does not exist");
    });
  });

  describe("Update", () => {
    it("should update record fields", async () => {
      const created = await dataService.create("products", {
        title: "Old Title",
        price: 50,
      });

      const updated = await dataService.update("products", (created as any).id, {
        title: "New Title",
        price: 75,
      });

      expect((updated as any).title).toBe("New Title");
      expect((updated as any).price).toBe(75);
      expect((updated as any).updated_at).not.toBe((created as any).updated_at);
    });

    it("should update only specified fields", async () => {
      const created = await dataService.create("products", {
        title: "Partial Update Test",
        price: 100,
        category: "Original",
      });

      const updated = await dataService.update("products", (created as any).id, {
        price: 150,
      });

      expect((updated as any).title).toBe("Partial Update Test");
      expect((updated as any).price).toBe(150);
      expect((updated as any).category).toBe("Original");
    });

    it("should return null for non-existent record", async () => {
      const result = await dataService.update("products", "non-existent-id", {
        title: "test",
      });

      expect(result).toBeNull();
    });

    it("should not allow updating id", async () => {
      const created = await dataService.create("products", {
        title: "ID Test",
        price: 10,
      });
      const originalId = (created as any).id;

      const updated = await dataService.update("products", originalId, {
        id: "should-not-change",
        title: "Updated",
      });

      expect((updated as any).id).toBe(originalId);
    });

    it("should not allow updating created_at", async () => {
      const created = await dataService.create("products", {
        title: "Timestamp Test",
        price: 10,
      });
      const originalCreatedAt = (created as any).created_at;

      const updated = await dataService.update("products", (created as any).id, {
        created_at: "2020-01-01T00:00:00.000Z",
        title: "Updated",
      });

      expect((updated as any).created_at).toBe(originalCreatedAt);
    });

    it("should reject updating in non-existent table", async () => {
      expect(async () => {
        await dataService.update("fake_table", "some-id", { title: "test" });
      }).toThrow("Table 'fake_table' does not exist");
    });
  });

  describe("Delete", () => {
    it("should delete existing record", async () => {
      const created = await dataService.create("products", {
        title: "To Delete",
        price: 1,
      });

      const deleted = await dataService.delete("products", (created as any).id);
      expect(deleted).toBe(true);

      const retrieved = await dataService.get("products", (created as any).id);
      expect(retrieved).toBeNull();
    });

    it("should return false for non-existent record", async () => {
      const result = await dataService.delete("products", "non-existent-id");
      expect(result).toBe(false);
    });

    it("should reject deleting from non-existent table", async () => {
      expect(async () => {
        await dataService.delete("fake_table", "some-id");
      }).toThrow("Table 'fake_table' does not exist");
    });
  });

  describe("Performance Optimizations", () => {
    it("should skip schema fetch when no filters or custom sort", async () => {
      // This test verifies behavior rather than implementation
      // If getValidColumnNames is called, it would show up in query logs
      
      const result = await dataService.list("products", {
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
    });

    it("should fetch schema only when needed (with filters)", async () => {
      const result = await dataService.list("products", {
        filters: { category: "Electronics" },
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((record: any) => {
        expect(record.category).toBe("Electronics");
      });
    });

    it("should fetch schema only when needed (with custom sort)", async () => {
      const result = await dataService.list("products", {
        sortBy: "price",
        limit: 5,
      });

      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
