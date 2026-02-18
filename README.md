# SpineKit

🚀 Modern headless backend toolkit for rapid API development

SpineKit dynamically generates REST APIs from user-defined table schemas. Create tables through the admin dashboard and instantly get a full CRUD API with pagination, filtering, and sorting.

## Features

- **Dynamic API Generation** - Create a table, get instant REST endpoints
- **OpenAPI/Swagger Docs** - Auto-generated API documentation with interactive testing
- **Admin Dashboard** - Manage tables, columns, and data through a modern UI
- **Schema Editing** - Add/remove columns, rename fields, modify constraints
- **Authentication** - Built-in auth with cookies + Bearer tokens for headless APIs
- **Database Agnostic** - Adapter-based design (SQLite now, Postgres/MySQL ready)
- **Type Safe** - Full TypeScript across backend and frontend
- **Zero Config** - Works out of the box with sensible defaults
- **Auto Setup** - Database tables created automatically on first run

## Quick Start

```bash
# Install dependencies
bun install

# Start backend and dashboard
bun run dev
```

- Dashboard: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs (Swagger UI)

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

## Authentication

Built-in authentication using Better Auth with **Bearer token support** for headless API access:

### Cookie-Based (Browser)
```bash
# Sign up
POST /api/auth/sign-up/email
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe"
}

# Sign in
POST /api/auth/sign-in/email
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

### Bearer Token (Headless/API)
```bash
# Sign in and get token
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
# Returns: {"token":"abc123...","user":{...}}

# Use token in requests
curl http://localhost:3000/api/posts \
  -H "Authorization: Bearer abc123..."
```

**Frontend Example:**
```typescript
// Store token after sign-in
const { token } = await fetch('/api/auth/sign-in/email', {...}).then(r => r.json());
localStorage.setItem('auth_token', token);

// Use in API requests
fetch('/api/posts', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
});
```

Environment variables (optional, defaults provided):
```bash
BETTER_AUTH_SECRET=your-32-character-secret
BETTER_AUTH_URL=http://localhost:3000
```

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

- [OpenAPI/Swagger Documentation](http://localhost:3000/api/docs) - Interactive API testing
- [Backend API Reference](./packages/backend/README.md)
- See `CLAUDE.md` for development guidelines

## Tech Stack

- **Backend**: Bun, Hono, SQLite, Better Auth, TypeScript
- **Frontend**: React 19, TanStack Router, TanStack Query, shadcn/ui
- **Validation**: Zod
- **Testing**: Bun test (60 tests)

## License

MIT
