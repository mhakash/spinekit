# SpineKit Backend

Dynamic REST API generator with SQLite database.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## API Endpoints

### Schema Management

#### List all tables
```bash
GET /api/_schema
```

#### Get table details
```bash
GET /api/_schema/:tableName
```

#### Create a new table
```bash
POST /api/_schema
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
      "required": false,
      "unique": false
    }
  ]
}
```

#### Delete a table
```bash
DELETE /api/_schema/:tableName
```

### Dynamic Data API

Once a table is created, the following endpoints are automatically available:

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

- `string` - Text data (TEXT)
- `number` - Numeric data (REAL)
- `boolean` - Boolean values (INTEGER: 0 or 1)
- `date` - Date/timestamp (TEXT in ISO 8601 format)
- `json` - JSON data (TEXT)

## Auto-generated Fields

Every table automatically includes:
- `id` (TEXT PRIMARY KEY) - UUID
- `created_at` (TEXT) - ISO 8601 timestamp
- `updated_at` (TEXT) - ISO 8601 timestamp

## Environment Variables

Create a `.env` file:

```env
PORT=3000
DB_PATH=spinekit.db
```

## Architecture

- **Adapter Pattern**: Database-agnostic design with SQLite as the first implementation
- **Service Layer**: Business logic separated from routing
- **Dynamic Routing**: Routes are created at runtime when tables are created
- **Type Safety**: Full TypeScript with shared types from `@spinekit/shared`

## Examples

See `../../test-api.sh` and `../../test-crud.sh` for working examples.
