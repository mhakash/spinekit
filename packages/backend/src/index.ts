/**
 * SpineKit Backend Entry Point
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { SQLiteAdapter } from "./adapters/sqlite.adapter";
import { SchemaService } from "./services/schema.service";
import { DataService } from "./services/data.service";
import { createSchemaRoutes } from "./routes/schema.routes";
import { createDataRoutes } from "./routes/data.routes";
import { createAuth } from "./auth/auth";
import { createAuthRoutes } from "./routes/auth.routes";
import { generateOpenAPISpec } from "./utils/openapi";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

app.get("/api/openapi.json", async (c) => {
  const spec = await generateOpenAPISpec(schemaService, baseURL);
  return c.json(spec);
});

app.get("/api/docs", swaggerUI({ url: "/api/openapi.json" }));

// Initialize database and services
const dbPath = process.env.DB_PATH || "spinekit.db";
const dbAdapter = new SQLiteAdapter(dbPath);
await dbAdapter.connect();

const schemaService = new SchemaService(dbAdapter);
const dataService = new DataService(dbAdapter);

const auth = createAuth(dbAdapter);

// API info endpoint (must be before dynamic routes)
app.get("/api", async (c) => {
  const tables = await schemaService.getTables();
  return c.json({
    message: "SpineKit API",
    version: "0.1.0",
    endpoints: {
      admin: "/api/admin/schema",
      tables: tables.map((t) => ({
        name: t.name,
        displayName: t.displayName,
        endpoint: `/api/${t.name}`,
      })),
    },
  });
});

app.route("/api/auth", createAuthRoutes(auth));

// Admin routes - schema management
app.route("/api/admin/schema", createSchemaRoutes(schemaService));

const handleTableRoute = async (c: any) => {
  const tableName = c.req.param("tableName");

  // Skip system/reserved routes
  if (tableName.startsWith("_")) {
    return c.notFound();
  }

  // Check if table exists
  const table = await schemaService.getTable(tableName);
  if (!table) {
    return c.json({ error: `Table '${tableName}' not found` }, 404);
  }

  // Create and use the data routes for this table
  const dataRoutes = createDataRoutes(tableName, dataService);

  // Construct a new request with the path stripped of the table name
  const url = new URL(c.req.url);
  const pathMatch = c.req.path.match(/^\/api\/[^/]+(.*)$/);
  const remainingPath = pathMatch ? pathMatch[1] : "";
  url.pathname = remainingPath || "/";

  const newRequest = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.header(),
    body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : undefined,
  });

  return dataRoutes.fetch(newRequest, c.env);
};

app.get("/api/:tableName", handleTableRoute);
app.get("/api/:tableName/:id", handleTableRoute);
app.post("/api/:tableName", handleTableRoute);
app.put("/api/:tableName/:id", handleTableRoute);
app.delete("/api/:tableName/:id", handleTableRoute);

const port = process.env.PORT || 3000;

console.log(`🚀 SpineKit backend started on port ${port}`);

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await dbAdapter.disconnect();
  process.exit(0);
});

export default {
  port,
  fetch: app.fetch,
};
