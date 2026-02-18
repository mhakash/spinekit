# CLAUDE.md

AI development guidelines for SpineKit. Keep this file concise - detailed documentation belongs in README.md and temp/context/.

## Project Overview

Headless backend toolkit that dynamically generates REST APIs from table schemas. Monorepo with backend (Bun), dashboard (React), and shared types.

## Seamless Setup

SpineKit auto-initializes everything on startup:
- System tables for schema storage
- Auth tables for Better Auth
- No manual migrations needed

Just start the server and go!

## Architecture Rules

1. **Database Agnostic**: Never write database-specific SQL in services. All DDL operations and type conversions go through DatabaseAdapter interface.

2. **Auth Integration**: Better Auth accepts the DatabaseAdapter, not raw database connections. Each adapter implements auth table creation in its `initializeAuthTables()` method.

3. **API Structure**:
 - Admin: `/api/admin/schema/*` (schema management)
 - Data: `/api/{tableName}/*` (dynamic table CRUD)
 - Auth: `/api/auth/*` (authentication endpoints)

3. **Schema Storage**: Table definitions stored in `_spinekit_tables` and `_spinekit_fields` system tables within the database, not files.

4. **Auth Storage**: Better Auth tables (`user`, `session`, `account`, `verification`) created by each adapter in database-specific syntax.

5. **Type Safety**: Use shared types from `@spinekit/shared`. Never use `any` without good reason.

## Development Commands

```bash
bun run dev              # Both backend + dashboard
bun run dev:backend      # Backend only (port 3000)
bun run dev:dashboard    # Dashboard only (port 5173)
bun test                 # Run all tests
```

## Code Organization

### Frontend Components

- Keep components under 200 lines
- Extract reusable form components to `components/form/`
- UI primitives go in `components/ui/` (shadcn)
- Always use `w-full` on Input/Textarea/Select for proper spacing
- Break large dialogs into smaller focused components

### Backend Services

- SchemaService: Schema/table management (zero DB-specific code)
- DataService: CRUD operations for table data
- Auth: Better Auth integration (accepts DatabaseAdapter, not DB-specific)
- All DB operations through DatabaseAdapter interface

## Field Types

- `string`, `number`, `boolean`, `date`, `json`
- Auto-generated: `id` (UUID), `created_at`, `updated_at`

## Testing

- Service layer: 34 tests
- API routes: 20 tests
- Auth integration: 6 tests (auto-creates tables)
- Always test transaction rollback on failures
- Run auth tests: `bun test src/auth/auth.integration.test.ts`

## Documentation

- Keep project docs in temp/context/ for AI reference
- Only user-facing docs go in main directories

## Design Principles

1. Modularity: Independent, testable features
2. Database Agnostic: Adapter pattern for all DB operations
3. Type Safety: Strict TypeScript, shared types
4. Clean Code: Small functions, avoid premature optimization
5. Avoid over-engineering: Only build what's requested

## Current Status

✅ Schema editing Phase 1: Add/delete columns, update metadata, remove constraints
✅ Schema editing Phase 2: Rename columns
✅ Import/export table schemas as JSON
✅ Full CRUD for table data
✅ Email/password authentication (Better Auth)
⏳ PostgreSQL adapter
⏳ Field relationships (foreign keys)
⏳ Plugin/battery system
