# SpineKit Dashboard

Admin dashboard for managing SpineKit tables and data.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Features

- **Table Management** - Create, view, and delete tables
- **Schema Editing** - Add/remove/rename columns, modify constraints
- **Data Management** - Full CRUD operations with pagination and filtering
- **Schema Import/Export** - Reusable table templates as JSON

## Tech Stack

- **Framework**: React 19
- **Routing**: TanStack Router v7
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Notifications**: Sonner

## Project Structure

```
src/
├── api/              # API client for backend
├── components/       # React components
│   ├── ui/          # shadcn primitives
│   └── *.tsx        # Feature components
├── pages/           # Route pages
├── lib/             # Utilities
└── main.tsx         # App entry point
```

## Configuration

The dashboard expects the backend API at `http://localhost:3000` by default. This is configured via Vite proxy in development.

To change the API URL for production, set:

```env
VITE_API_URL=https://your-api.com
```

## Development

```bash
# Start with hot reload
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun test
```

## Component Guidelines

See `CLAUDE.md` in the root for component best practices:
- Keep components under 200 lines
- Extract reusable form components
- Always use `w-full` on form inputs for proper spacing
- Break large dialogs into focused sub-components
