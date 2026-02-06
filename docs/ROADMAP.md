# SpineKit Roadmap

Current status and future plans for SpineKit development.

## Current Status (v0.1.0-alpha.1)

### ✅ Completed Features

**Core Functionality**
- Dynamic REST API generation from table schemas
- Database adapter pattern (SQLite implemented)
- Admin dashboard for table/data management
- Full CRUD operations for table data
- Pagination, filtering, and sorting

**Schema Management**
- Create/delete tables via dashboard
- Add/remove columns safely
- Rename columns with validation
- Update column metadata (display name, description)
- Remove constraints (required, unique)
- Import/export table schemas as JSON

**Testing**
- 54 service-layer tests
- 20 API route tests
- Transaction rollback coverage

## Immediate Priority: Authentication (v0.2.0)

### Better Auth Integration
- [ ] Install and configure Better Auth
- [ ] Email/password authentication
- [ ] Session management
- [ ] Protected admin routes
- [ ] User management interface

### Social Authentication
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Twitter/X OAuth integration
- [ ] Facebook OAuth integration

### Authorization
- [ ] Role-based access control (admin, user)
- [ ] Table-level permissions
- [ ] API key generation for external access

## Phase 1: Core Backend Capabilities

### Relational Data
- [ ] Foreign key constraints
- [ ] One-to-many relationships
- [ ] Many-to-many relationships (junction tables)
- [ ] Cascade operations (delete, update)
- [ ] Nested/joined queries in API

### Extended Field Types
- [ ] File upload fields
- [ ] Enum/select fields (predefined options)
- [ ] Email field with validation
- [ ] URL field with validation
- [ ] Array fields
- [ ] Rich text/HTML fields
- [ ] JSON field with schema validation

### File & Media Storage
- [ ] Local file storage adapter
- [ ] S3-compatible storage adapter
- [ ] Image transformations (resize, crop, format)
- [ ] File metadata (size, type, dimensions)
- [ ] Upload size/type restrictions
- [ ] CDN integration

### Database Support
- [ ] PostgreSQL adapter implementation
- [ ] MySQL adapter implementation
- [ ] Database connection pooling
- [ ] Database adapter test suite
- [ ] Migration system for schema changes

## Phase 2: Advanced Query & Data Operations

### Query Capabilities
- [ ] Advanced filtering operators (gt, lt, gte, lte, like, in, between, not)
- [ ] Full-text search
- [ ] Aggregation queries (count, sum, avg, min, max)
- [ ] Group by operations
- [ ] Complex filter combinations (AND/OR/NOT)
- [ ] Query result caching

### Bulk Operations
- [ ] Bulk insert with validation
- [ ] Bulk update
- [ ] Bulk delete
- [ ] CSV import with validation
- [ ] JSON import/export
- [ ] Transaction support for bulk ops

### Data Validation
- [ ] Field-level validation rules (min/max, regex, custom)
- [ ] Unique combinations (composite constraints)
- [ ] Conditional validation based on other fields
- [ ] Custom validation functions via plugins

### Schema Features
- [ ] Change column type with data migration
- [ ] Add constraints to existing columns
- [ ] Composite unique constraints
- [ ] Computed/virtual fields
- [ ] Field indexes management

## Phase 3: API & Integration Features

### API Extensions
- [ ] GraphQL endpoint generation
- [ ] Real-time subscriptions (WebSocket)
- [ ] API rate limiting
- [ ] Request/response caching
- [ ] API versioning
- [ ] Batch requests

### Webhooks & Events
- [ ] Webhook configuration per table
- [ ] Event triggers (onCreate, onUpdate, onDelete)
- [ ] Retry mechanism for failed webhooks
- [ ] Webhook signature verification
- [ ] Event logs

### Developer Tools
- [ ] OpenAPI/Swagger documentation auto-generation
- [ ] SDK generation (TypeScript, Python, Go, PHP)
- [ ] CLI tool for schema management
- [ ] Database seeding tools
- [ ] API testing tools

## Phase 4: Enterprise & Production

### Advanced Authorization
- [ ] Row-level security policies
- [ ] Field-level permissions
- [ ] Team/workspace isolation
- [ ] Custom permission rules
- [ ] Audit logging

### Plugin System
- [ ] Plugin/battery architecture
- [ ] Lifecycle hooks (before/after operations)
- [ ] Custom field types via plugins
- [ ] Custom validation rules via plugins
- [ ] Middleware system
- [ ] Event system for plugins

### Performance & Scale
- [ ] Query optimization
- [ ] Index management UI
- [ ] Database query profiling
- [ ] Horizontal scaling support
- [ ] Read replicas support
- [ ] Caching strategies (Redis)

### Monitoring & Operations
- [ ] Activity logging
- [ ] Performance metrics
- [ ] Error tracking integration
- [ ] Health check endpoints
- [ ] Backup/restore utilities
- [ ] Database monitoring

## Future Explorations

### AI/ML Integration
- [ ] AI-powered schema suggestions
- [ ] Natural language query interface
- [ ] Data insights and analytics

### Advanced Features
- [ ] Time-series data support
- [ ] Geospatial queries
- [ ] Multi-tenancy support
- [ ] Workflow automation
- [ ] Scheduled tasks/cron jobs

## Community & Ecosystem

- [ ] Official documentation site
- [ ] Example projects repository
- [ ] Plugin marketplace
- [ ] Community templates
- [ ] Video tutorials
- [ ] Docker images
- [ ] Deployment guides (Vercel, Railway, Fly.io, etc.)

## Version History

- **v0.1.0-alpha.1** (Current) - Initial alpha release
  - SQLite adapter
  - Schema management Phase 1 & 2
  - Full CRUD operations
  - Admin dashboard
  - No authentication (development only)

- **v0.2.0** (Planned) - Authentication release
  - Better Auth integration
  - Social OAuth (Google, GitHub, Twitter, Facebook)
  - Role-based access control
  - Protected admin routes

- **v0.3.0** (Planned) - Relational data & extended fields
  - Foreign keys and relationships
  - Extended field types (file, enum, rich text)
  - File/media storage adapters

- **v0.4.0** (Planned) - Advanced queries & bulk operations
  - Advanced filtering and aggregations
  - Bulk operations with validation
  - Full-text search

- **v0.5.0** (Planned) - API extensions
  - GraphQL support
  - Real-time subscriptions
  - Webhooks and events
