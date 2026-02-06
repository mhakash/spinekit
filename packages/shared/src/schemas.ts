/**
 * Zod validation schemas
 */

import { z } from "zod";

export const fieldTypeSchema = z.enum(["string", "number", "boolean", "date", "json"]);

export const fieldDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid identifier"),
  displayName: z.string().min(1),
  type: fieldTypeSchema,
  required: z.boolean().optional().default(false),
  unique: z.boolean().optional().default(false),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
});

export const tableSchemaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be a valid table name"),
  displayName: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldDefinitionSchema).min(1),
});

export type FieldDefinitionInput = z.infer<typeof fieldDefinitionSchema>;
export type TableSchemaInput = z.infer<typeof tableSchemaSchema>;
