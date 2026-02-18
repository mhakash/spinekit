/**
 * OpenAPI Specification Generator
 * Dynamically generates OpenAPI 3.0 spec based on tables and schema
 */

import type { SchemaService } from "../services/schema.service";

export async function generateOpenAPISpec(schemaService: SchemaService, baseURL: string) {
  const tables = await schemaService.getTables();

  const paths: any = {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api": {
      get: {
        tags: ["System"],
        summary: "API information",
        responses: {
          "200": {
            description: "API metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    version: { type: "string" },
                    endpoints: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  // Auth endpoints
  const authPaths = {
    "/api/auth/sign-up/email": {
      post: {
        tags: ["Authentication"],
        summary: "Sign up with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email", example: "user@example.com" },
                  password: { type: "string", minLength: 8, example: "SecurePass123!" },
                  name: { type: "string", example: "John Doe" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        emailVerified: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/sign-in/email": {
      post: {
        tags: ["Authentication"],
        summary: "Sign in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Bearer token for API authentication" },
                    user: { type: "object" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/api/auth/get-session": {
      get: {
        tags: ["Authentication"],
        summary: "Get current session",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Session information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { type: "object" },
                    session: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  // Schema management endpoints
  const schemaPaths = {
    "/api/admin/schema": {
      get: {
        tags: ["Schema Management"],
        summary: "List all tables",
        responses: {
          "200": {
            description: "List of tables",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tables: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          displayName: { type: "string" },
                          description: { type: "string" },
                          fields: { type: "array" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Schema Management"],
        summary: "Create a new table",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "displayName", "fields"],
                properties: {
                  name: { type: "string", example: "posts" },
                  displayName: { type: "string", example: "Blog Posts" },
                  description: { type: "string", example: "Blog post entries" },
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "displayName", "type"],
                      properties: {
                        name: { type: "string", example: "title" },
                        displayName: { type: "string", example: "Title" },
                        type: { type: "string", enum: ["string", "number", "boolean", "date", "json"] },
                        required: { type: "boolean" },
                        unique: { type: "boolean" },
                        defaultValue: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Table created successfully",
          },
        },
      },
    },
  };

  Object.assign(paths, authPaths, schemaPaths);

  // Dynamic table endpoints
  for (const table of tables) {
    const tablePath = `/api/${table.name}`;
    const tablePathWithId = `/api/${table.name}/{id}`;

    const fieldProperties: any = {};
    const requiredFields: string[] = [];

    for (const field of table.fields) {
      const fieldSchema: any = {};

      switch (field.type) {
        case "string":
          fieldSchema.type = "string";
          break;
        case "number":
          fieldSchema.type = "number";
          break;
        case "boolean":
          fieldSchema.type = "boolean";
          break;
        case "date":
          fieldSchema.type = "string";
          fieldSchema.format = "date-time";
          break;
        case "json":
          fieldSchema.type = "object";
          break;
      }

      fieldSchema.description = field.description || field.displayName;
      fieldProperties[field.name] = fieldSchema;

      if (field.required) {
        requiredFields.push(field.name);
      }
    }

    const recordSchema = {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        ...fieldProperties,
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };

    paths[tablePath] = {
      get: {
        tags: [table.displayName || table.name],
        summary: `List ${table.displayName || table.name}`,
        description: table.description,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number (1-indexed)",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
            description: "Number of records per page",
          },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", default: "created_at" },
            description: "Field to sort by",
          },
          {
            name: "sortOrder",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            description: "Sort order",
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: recordSchema,
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [table.displayName || table.name],
        summary: `Create ${table.displayName || table.name} record`,
        description: table.description,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: requiredFields,
                properties: fieldProperties,
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Record created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: recordSchema,
                  },
                },
              },
            },
          },
        },
      },
    };

    paths[tablePathWithId] = {
      get: {
        tags: [table.displayName || table.name],
        summary: `Get ${table.displayName || table.name} by ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: recordSchema,
                  },
                },
              },
            },
          },
          "404": {
            description: "Record not found",
          },
        },
      },
      put: {
        tags: [table.displayName || table.name],
        summary: `Update ${table.displayName || table.name}`,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: fieldProperties,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Record updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: recordSchema,
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: [table.displayName || table.name],
        summary: `Delete ${table.displayName || table.name}`,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "Record deleted",
          },
          "404": {
            description: "Record not found",
          },
        },
      },
    };
  }

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "SpineKit API",
      version: "0.1.0",
      description:
        "Dynamic REST API generated from table schemas. Create tables and get instant CRUD endpoints with authentication support.",
      contact: {
        name: "SpineKit",
        url: "https://github.com/yourusername/spinekit",
      },
    },
    servers: [
      {
        url: baseURL,
        description: "Local development server",
      },
    ],
    tags: [
      { name: "System", description: "System health and information" },
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Schema Management", description: "Table and schema management" },
      ...tables.map((t) => ({
        name: t.displayName || t.name,
        description: t.description || `Operations for ${t.displayName || t.name}`,
      })),
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your Bearer token obtained from /api/auth/sign-in/email",
        },
      },
    },
  };

  return spec;
}
