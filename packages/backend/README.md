# SpineKit Backend

Dynamic REST API generator with database-agnostic adapter layer.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## API Endpoints

### Admin - Schema Management

#### List all tables
```bash
GET /api/admin/schema
```

#### Get table schema
```bash
GET /api/admin/schema/:tableName
```

#### Create a new table
```bash
POST /api/admin/schema
Content-Type: application/json

{
  "name": "users",
  "displayName": "Users",
  "description": "User accounts",
  "fields": [
    {
      "name": "email",
      "displayName": "Email Address",
      "type": "string",
      "required": true,
      "unique": true
    },
    {
      "name": "age",
      "displayName": "Age",
      "type": "number",
      "required": false
    }
  ]
}
```

#### Delete a table
```bash
DELETE /api/admin/schema/:tableName
```

#### Schema Editing Operations

```bash
# Add column
POST /api/admin/schema/:tableName/columns

# Delete column
DELETE /api/admin/schema/:tableName/columns/:columnName

# Rename column
PUT /api/admin/schema/:tableName/columns/:columnName/rename

# Update column metadata (display name, description)
PATCH /api/admin/schema/:tableName/columns/:columnName

# Remove constraint (required or unique)
DELETE /api/admin/schema/:tableName/columns/:columnName/constraints/:constraint
```

### Dynamic Data API

Once a table is created, these endpoints are automatically available:

#### List records
```bash
GET /api/:tableName?page=1&limit=50&sortBy=created_at&sortOrder=desc

# With filters
GET /api/:tableName?email=john@example.com
```

#### Get single record
```bash
GET /api/:tableName/:id
```

#### Create record
```bash
POST /api/:tableName
Content-Type: application/json

{
  "email": "john@example.com",
  "age": 30
}
```

#### Update record
```bash
PUT /api/:tableName/:id
Content-Type: application/json

{
  "age": 31
}
```

#### Delete record
```bash
DELETE /api/:tableName/:id
```

## Field Types

- `string` - Text data
- `number` - Numeric data
- `boolean` - Boolean values
- `date` - Date/timestamp (ISO 8601 format)
- `json` - JSON data

## Auto-generated Fields

Every table automatically includes:
- `id` - UUID primary key
- `created_at` - ISO 8601 timestamp
- `updated_at` - ISO 8601 timestamp

## Environment Variables

Create a `.env` file:

```env
PORT=3000
DB_PATH=spinekit.db
```

## Architecture

### Database Adapter Pattern

SchemaService contains **zero** database-specific SQL. All DDL operations and type conversions are delegated to the `DatabaseAdapter` interface:

- **DDL Methods**: createTable, dropTable, addColumn, dropColumn, renameColumn, removeConstraint
- **Type Conversions**: mapFieldTypeToSQL, formatDefaultValue, booleanToSQL, booleanFromSQL

**Current Adapters:**
- SQLiteAdapter (fully implemented)

**Adding New Databases:**
Implement the DatabaseAdapter interface for Postgres, MySQL, etc. No changes needed in SchemaService.

### Service Layer

- **SchemaService**: Table/column schema management (54 tests)
- **DataService**: CRUD operations for table data

### System Tables

Schema definitions stored in database:
- `_spinekit_tables` - Table metadata
- `_spinekit_fields` - Column definitions

This allows dynamic runtime table creation without file-based migrations.
