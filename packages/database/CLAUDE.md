# Database Package - Claude Instructions

## Overview

This package provides database functionality for AI Dr. using Prisma ORM with PostgreSQL and pgvector support for embeddings.

## Quick Start

```bash
# Generate Prisma client after schema changes
bun run db:generate

# Push schema to database (development)
bun run db:push

# Run migrations (production)
bun run db:migrate:deploy

# Seed database
bun run db:seed
```

## Key Files

- `prisma/schema.prisma` - Database schema definition
- `src/index.ts` - Main exports and database utilities
- `src/vector-utils.ts` - Vector/embedding utilities
- `src/seed.ts` - Database seeding script
- `generated/client/` - Auto-generated Prisma client (DO NOT EDIT)

## Important Notes

### pgvector Status

Currently using JSON storage for embeddings until pgvector is confirmed. To enable pgvector:

1. Install pgvector extension in PostgreSQL
2. Run `CREATE EXTENSION IF NOT EXISTS vector;`
3. Update schema to use `Unsupported("vector(768)")` instead of `Json`
4. Run migrations

### Vector Dimensions

All embeddings must be exactly 768 dimensions (standard for many models).

### Database Connection

The package uses a singleton pattern for Prisma client to prevent connection exhaustion.

## Common Tasks

### Adding a New Model

1. Edit `prisma/schema.prisma`
2. Run `bun run db:generate` to update client
3. Run `bun run db:push` to update database
4. Update seed.ts if needed

### Working with Embeddings

```typescript
import { vectorUtils } from "@repo/database";

// Store embedding (currently as JSON)
const embedding = vectorUtils.toJson(vector768);

// Calculate similarity
const similarity = vectorUtils.cosineSimilarity(vec1, vec2);

// Find nearest neighbors
const neighbors = vectorUtils.findNearestNeighbors(query, vectors, k);
```

### Database Queries

```typescript
import { prisma } from "@repo/database";

// Always use proper error handling
try {
  const result = await prisma.prompt.create({
    data: {
      /* ... */
    },
  });
} catch (error) {
  // Handle Prisma errors appropriately
}
```

## Gotchas

1. **Migrations vs Push**: Use `db:push` for development, `db:migrate` for production
2. **Vector Storage**: Currently JSON, will migrate to pgvector when ready
3. **Connection Pooling**: Handled by Prisma, don't create multiple clients
4. **Type Safety**: Always regenerate client after schema changes

## Testing Considerations

- Always clean test data after tests
- Use transactions for test isolation
- Mock Prisma client for unit tests
- Use separate test database for integration tests

## Performance Tips

1. Use `select` to limit returned fields
2. Use `include` sparingly (can cause N+1 queries)
3. Create appropriate indexes for frequent queries
4. Batch operations when possible with `createMany`

## Security

- Never expose database URLs in code
- Use environment variables for configuration
- Sanitize user inputs (Prisma handles SQL injection)
- Use row-level security where appropriate
