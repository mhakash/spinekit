# SpineKit Architecture

Technical architecture and design decisions.

## System Overview

```
┌─────────────────┐
│   Dashboard     │
│   (React)       │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│   Backend API   │
│   (Hono)        │
├─────────────────┤
│ SchemaService   │
│ DataService     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ DatabaseAdapter │
│  (Interface)    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│ SQLite │ │Postgres* │
└────────┘ └──────────┘
   * Future
```

## Core Components

### Backend

**API Layer** (`src/index.ts`)
- Hono web framework
- CORS and logging middleware
- Dynamic route registration
- Admin routes: `/api/admin/schema/*`
- Data routes: `/api/{tableName}/*`

**Service Layer**
- `SchemaService`: Table and column management
- `DataService`: CRUD operations for table data
- Zero database-specific code in services

**Adapter Layer**
- `DatabaseAdapter` interface: Abstract all DB operations
- `SQLiteAdapter`: SQLite implementation
- Future: PostgresAdapter, MySQLAdapter, etc.

### Database Adapter Interface

All database-specific logic is isolated in adapters:

```typescript
interface DatabaseAdapter {
  // Basic operations
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  execute(sql: string, params?: unknown[]): Promise<QueryResult>

  // Transactions
  beginTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>

  // DDL operations
  createTable(tableName: string, columns: ColumnDefinition[]): Promise<void>
  dropTable(tableName: string): Promise<void>
  addColumn(tableName: string, column: ColumnDefinition): Promise<void>
  dropColumn(tableName: string, columnName: string): Promise<void>
  renameColumn(tableName: string, oldName: string, newName: string): Promise<void>
  removeConstraint(...): Promise<void>

  // Type conversions
  mapFieldTypeToSQL(fieldType: string): string
  formatDefaultValue(value: any, type: string): string
  booleanToSQL(value: boolean): number | boolean
  booleanFromSQL(value: any): boolean
}
```

### Frontend

**Pages** (`src/pages/`)
- `TablesPage`: List all tables
- `TableDetailPage`: View table schema
- `TableDataPage`: Manage table records

**Components** (`src/components/`)
- Feature dialogs: CreateTableDialog, AddColumnDialog, etc.
- UI primitives: shadcn/ui components

**API Client** (`src/api/client.ts`)
- Centralized API communication
- Type-safe with shared types from `@spinekit/shared`

### Shared Package

**Types** (`@spinekit/shared`)
- `TableSchema`: Table definition
- `FieldDefinition`: Column definition
- Shared between backend and frontend for type safety

**Validation** (Zod schemas)
- `tableSchemaSchema`: Validates table creation
- `fieldDefinitionSchema`: Validates field definitions

## Data Flow

### Creating a Table

```
Dashboard → POST /api/admin/schema
  ↓
SchemaService.createTable()
  ↓
1. Validate with Zod schema
2. Generate UUID for table
3. Begin transaction
4. Insert into _spinekit_tables
5. Insert fields into _spinekit_fields
6. adapter.createTable() - Create physical table
7. Commit transaction
  ↓
Return TableSchema to dashboard
```

### CRUD Operations

```
Dashboard → GET /api/users?page=1&limit=50
  ↓
Dynamic route handler
  ↓
1. Check table exists (SchemaService)
2. DataService.list()
3. Build SQL with pagination/filtering
4. adapter.query()
  ↓
Return paginated results
```

## Storage Model

### System Tables

Schema metadata stored in database (not files):

**`_spinekit_tables`**
- `id`: UUID primary key
- `name`: Table name (snake_case)
- `display_name`: Human-readable name
- `description`: Optional description
- `created_at`, `updated_at`: Timestamps

**`_spinekit_fields`**
- `id`: UUID primary key
- `table_id`: Foreign key to `_spinekit_tables`
- `name`: Column name
- `display_name`: Human-readable name
- `type`: Field type (string, number, etc.)
- `required`: Boolean (0/1)
- `unique_constraint`: Boolean (0/1)
- `default_value`: JSON string
- `description`: Optional
- `sort_order`: Display order
- `created_at`, `updated_at`: Timestamps

### User Tables

Created dynamically with auto-generated fields:
- `id TEXT PRIMARY KEY` - UUID
- User-defined columns
- `created_at TEXT NOT NULL` - ISO 8601
- `updated_at TEXT NOT NULL` - ISO 8601

## Design Decisions

### Why Database-Stored Schema?

**Pros:**
- Dynamic table creation without code deployment
- Single source of truth
- Easy schema queries
- Simplified backup (one database)

**Cons:**
- No git history for schema changes (planned: audit log)
- Requires database migrations for system tables

### Why Adapter Pattern?

**Pros:**
- Database-agnostic business logic
- Easy to add new databases
- Testable with in-memory adapters

**Cons:**
- Some complexity overhead
- Lowest common denominator for features

### Why Monorepo?

**Pros:**
- Shared types between backend/frontend
- Atomic commits across packages
- Simplified dependency management

**Cons:**
- Larger repository size
- Build orchestration needed

## Security Considerations

### Current State (v0.1.0)

- No authentication (admin dashboard is public)
- No authorization (all users have full access)
- SQL injection protected via parameterized queries
- Input validation with Zod schemas

### Planned Security Features

- Table-level permissions
- API key authentication
- Row-level security
- Rate limiting
- Audit logging

## Performance Considerations

### Current Optimizations

- Transaction-based schema operations
- Parameterized queries
- Pagination for list endpoints

### Future Optimizations

- Query result caching
- Database connection pooling
- Index management
- CDN for static assets

## Testing Strategy

- **Unit Tests**: Service layer (54 tests)
- **Integration Tests**: API routes (20 tests)
- **Transaction Tests**: Rollback on errors
- **Future**: E2E tests with Playwright
