# SpineKit

A headless backend toolkit that dynamically generates REST APIs from user-defined table schemas.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0 or higher

### Installation

```bash
bun install
```

### Development

**Quick Start** - Start both backend and dashboard:

```bash
bun run dev
```

Then open:
- **Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000

**Individual Services:**

```bash
# Backend only
bun run dev:backend

# Dashboard only
bun run dev:dashboard
```

### Project Structure

```
spinekit/
├── packages/
│   ├── backend/          # Bun.js backend with dynamic API generation
│   ├── dashboard/        # React admin dashboard
│   └── shared/           # Shared TypeScript types and utilities
└── CLAUDE.md             # Development guide for Claude Code
```

## Features

- 🎯 Dynamic REST API generation from table schemas
- 📊 Admin dashboard for table management
- 🔌 Modular plugin system (planned)
- 🗄️ Database-agnostic architecture
- 🔐 Built-in authentication with Better Auth
- 📝 Full TypeScript support

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.

## License

MIT
