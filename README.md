# SpineKit

🚀 Modern headless backend toolkit for rapid API development

SpineKit dynamically generates REST APIs from user-defined table schemas. Create tables through the admin dashboard and instantly get a full CRUD API with pagination, filtering, and sorting.

## Features

- **Dynamic API Generation** - Create a table, get instant REST endpoints
- **Admin Dashboard** - Manage tables, columns, and data through a modern UI
- **Schema Editing** - Add/remove columns, rename fields, modify constraints
- **Database Agnostic** - Adapter-based design (SQLite now, Postgres/MySQL ready)
- **Type Safe** - Full TypeScript across backend and frontend
- **Zero Config** - Works out of the box with sensible defaults

## Quick Start

```bash
# Install dependencies
bun install

# Start backend and dashboard
bun run dev
```

- Dashboard: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
spinekit/
├── packages/
│   ├── backend/          # Bun + Hono + SQLite
│   ├── dashboard/        # React 19 + Vite + shadcn
│   └── shared/           # Shared types and schemas
└── package.json          # Bun workspaces
```

## How It Works

1. **Create a table** via the dashboard (e.g., `users`)
2. **Define fields** with types, constraints, and metadata
3. **Use the API** instantly:
   - `GET /api/users` - List records
   - `POST /api/users` - Create record
   - `GET /api/users/:id` - Get record
   - `PUT /api/users/:id` - Update record
   - `DELETE /api/users/:id` - Delete record

## Field Types

- `string` - Text data
- `number` - Numeric data
- `boolean` - True/false
- `date` - Timestamps
- `json` - JSON objects

All tables automatically include `id`, `created_at`, and `updated_at` fields.

## Development

```bash
# Backend only
bun run dev:backend

# Dashboard only
bun run dev:dashboard

# Run tests
bun test

# Build for production
bun run build
```

## Documentation

- [Backend API Reference](./packages/backend/README.md)
- See `CLAUDE.md` for development guidelines

## Tech Stack

- **Backend**: Bun, Hono, SQLite, TypeScript
- **Frontend**: React 19, TanStack Router, TanStack Query, shadcn/ui
- **Validation**: Zod
- **Testing**: Bun test

## License

MIT
