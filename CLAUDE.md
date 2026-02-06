# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: SpineKit

A headless backend toolkit that dynamically generates REST APIs from user-defined table schemas. Includes an admin dashboard for managing the backend.

## Architecture Overview

### Monorepo Structure
```
spinekit/
├── packages/
│   ├── backend/          # Bun.js TypeScript backend
│   ├── dashboard/        # React 19 admin dashboard
│   └── shared/           # Shared TypeScript types and utilities
├── package.json          # Root with Bun workspaces
└── bun.lockb             # Bun lockfile
```

### Core Concepts

**Schema Storage**: Table and column definitions are stored in system tables (`_spinekit_tables`, `_spinekit_columns`, etc.) within the database itself, not in files. This allows dynamic runtime manipulation.

**API Generation**: When tables are created/modified via the dashboard, the backend dynamically registers REST endpoints:

Admin endpoints (schema management):
- `GET /api/admin/schema` - List all tables
- `GET /api/admin/schema/{tableName}` - Get table schema
- `POST /api/admin/schema` - Create new table
- `DELETE /api/admin/schema/{tableName}` - Delete table
- Schema editing endpoints (see Schema Editing section)

Dynamic data endpoints:
- `GET /api/{tableName}` - List with pagination, filtering, sorting
- `GET /api/{tableName}/{id}` - Get single record
- `POST /api/{tableName}` - Create record
- `PUT /api/{tableName}/{id}` - Update record
- `DELETE /api/{tableName}/{id}` - Delete record

**Database Abstraction**: All database operations go through an adapter interface. SQLite is the initial implementation, with Postgres and others planned. Code must never use database-specific features directly.

**Plugin System**: Future batteries/plugins will be modular packages that can hook into lifecycle events (e.g., before/after table creation, API request/response middleware).

## Tech Stack

### Backend (`packages/backend`)
- **Runtime**: Bun.js
- **Language**: TypeScript
- **Database**: SQLite (initial), Postgres (planned)
- **Auth**: Better Auth
- **API Style**: REST with JSON

### Dashboard (`packages/dashboard`)
- **Framework**: React 19
- **Language**: TypeScript
- **Routing**: React Router v7 (using data APIs)
- **State**: React Query for server state
- **Forms**: React Hook Form
- **UI**: shadcn components
- **Build**: Vite (typical for React)

### Shared (`packages/shared`)
- TypeScript types and interfaces
- Validation schemas (Zod)
- Utility functions used by both frontend and backend

## Development Commands

### Setup
```bash
bun install                 # Install all dependencies
```

### Quick Start
```bash
bun run dev                 # Start both backend and dashboard
# Dashboard: http://localhost:5173
# Backend: http://localhost:3000
```

### Backend
```bash
bun run dev:backend         # Start backend only
cd packages/backend
bun run dev                 # Alternative: from backend directory
bun run build              # Build for production
bun test                   # Run backend tests
```

### Dashboard
```bash
bun run dev:dashboard       # Start dashboard only
cd packages/dashboard
bun run dev                 # Alternative: from dashboard directory
bun run build              # Build for production
bun test                   # Run dashboard tests
```

### All Packages
```bash
bun run build              # Build all packages
bun test                   # Run all tests
bun run clean              # Clean build artifacts
```

## Initial Field Types

Start with basic types, expand later:
- `string` (TEXT)
- `number` (INTEGER, REAL)
- `boolean` (BOOLEAN)
- `date` (DATE/TIMESTAMP)
- `json` (JSON/TEXT)

All tables automatically get:
- `id` (primary key)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Key Design Principles

1. **Modularity**: Each feature should be independently testable and replaceable
2. **Database Agnostic**: Never use database-specific SQL in business logic
3. **Type Safety**: Leverage TypeScript strictly; share types between frontend/backend
4. **Configuration Over Code**: Plugin behavior should be configurable via config files/env vars
5. **Clean Code**: Prefer small, focused functions; avoid premature optimization

## Frontend Component Best Practices

### Component Reusability

**Break down large components**: When a component exceeds ~200 lines or has multiple responsibilities, split it into smaller, reusable components.

**Good practices:**
- Create focused, single-purpose components (e.g., `FieldInput`, `FieldDisplay`)
- Store reusable form components in `components/form/` directory
- Store reusable UI components in `components/ui/` directory
- Extract repeated UI patterns into separate components
- Use proper TypeScript interfaces for component props
- Ensure components are self-contained with clear prop interfaces

**Component organization:**
```
components/
├── ui/              # shadcn components and basic UI primitives
├── form/            # Reusable form-related components
├── [Feature].tsx    # Feature-specific components (dialogs, pages, etc.)
└── [Feature]/       # Complex features with sub-components
```

**Example of good component breakdown:**
- ❌ Bad: One 500-line `RecordDialog.tsx` with everything
- ✅ Good: `RecordDialog.tsx` (orchestration) + `FieldInput.tsx` (input logic) + `FieldDisplay.tsx` (view logic)

### Spacing and Layout

**Always ensure proper spacing in forms:**
- Use `w-full` className on all Input, Textarea, and Select components
- Wrap form fields in containers with consistent spacing (`space-y-2`, `space-y-4`)
- Add padding to form sections to prevent content from touching edges
- Test inputs don't get cut off on the sides by using proper container widths

## Schema Editing

**Phase 1 - Safe Operations** ✅ Implemented:

1. **Add Column** - `POST /api/admin/schema/:tableName/columns`
   - Must be nullable OR have default value
   - Preserves existing data

2. **Delete Column** - `DELETE /api/admin/schema/:tableName/columns/:columnName`
   - Cannot delete system columns (id, created_at, updated_at)
   - Permanently removes column and data

3. **Update Metadata** - `PATCH /api/admin/schema/:tableName/columns/:columnName`
   - Change display name or description
   - No schema/data impact

4. **Remove Constraints** - `DELETE /api/admin/schema/:tableName/columns/:columnName/constraints/:constraint`
   - Remove `required` or `unique` constraints
   - Uses table rebuild for SQLite compatibility

**Phase 2 - Validated Changes** ✅ Partially Implemented:

5. **Rename Column** - `PUT /api/admin/schema/:tableName/columns/:columnName/rename`
   - Preserves all data and constraints
   - Validates new name doesn't conflict
   - Cannot rename system columns

**Testing:**
- 34 service-layer unit tests
- 20 API route integration tests
- Transaction rollback coverage

**Future Features:**
- Change column type (with validation)
- Add constraints (with data validation)
- Relationships (foreign keys)

## Schema Import/Export

**Export Schema:**
- Export button on table detail page
- Downloads JSON file with table schema (fields only)
- File format: `tablename-schema.json`

**Import Schema:**
- Import button in Create Table dialog
- Accepts JSON files with schema definitions
- Validates and populates form fields automatically
- Reusable templates for common table structures

**JSON Format:**
```json
{
  "displayName": "Users",
  "description": "User accounts",
  "fields": [
    {
      "name": "username",
      "displayName": "Username",
      "type": "string",
      "required": true,
      "unique": true,
      "description": "Unique username"
    }
  ]
}
```

## Future TODOs

- [x] Add data browsing/CRUD operations in the dashboard UI
- [x] Schema editing - Phase 1 (backend)
- [x] Schema editing - Phase 1 (frontend UI)
- [x] Schema import/export functionality
- [ ] Support PostgreSQL database adapter
- [ ] Add field relationship support (foreign keys, one-to-many, many-to-many)
- [ ] Implement plugin/battery system
- [ ] Add field validation rules (min/max, regex, required, unique)
- [ ] Support more field types (email, url, file uploads, etc.)
- [ ] Add API authentication/authorization per table
- [ ] Generate API documentation (OpenAPI/Swagger)
- [ ] Add database migrations system
- [ ] Implement soft deletes
- [ ] Add audit logging for table changes
