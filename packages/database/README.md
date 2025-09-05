# @repo/database

Database package for AI Dr. with Prisma ORM and pgvector support for embeddings.

## Features

- **Prisma ORM**: Type-safe database access with auto-generated client
- **pgvector Support**: Store and query vector embeddings for similarity search
- **Category System**: Hierarchical categorization with embeddings
- **Prompt Storage**: Enhanced prompt storage with metadata and vectors
- **Workflow Tracking**: Track workflow execution and status
- **Audit Logging**: Server-side logging with structured data

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Database

Create a `.env` file with your database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai-doctore"
```

### 3. Enable pgvector Extension

Connect to your PostgreSQL database and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Run Migrations

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or run migrations (for production)
bun run db:migrate:deploy
```

### 5. Seed Database (Optional)

```bash
bun run db:seed
```

## Usage

### Basic Usage

```typescript
import { prisma } from "@repo/database";

// Create a prompt
const prompt = await prisma.prompt.create({
  data: {
    rawPrompt: "Fix the login bug",
    instruction: "Debug and fix the authentication issue",
    workflowType: "bug",
    complexity: "medium",
    score: 85,
  },
});

// Query with relations
const promptWithCategories = await prisma.prompt.findUnique({
  where: { id: prompt.id },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
});
```

### Working with Vectors

Until pgvector is fully configured, vectors are stored as JSON:

```typescript
import { vectorUtils } from "@repo/database";

// Store a vector
const embedding = vectorUtils.toJson(myVector); // myVector: number[768]
await prisma.prompt.update({
  where: { id: promptId },
  data: { embedding },
});

// Retrieve and use vector
const prompt = await prisma.prompt.findUnique({
  where: { id: promptId },
});
const vector = vectorUtils.fromJson(prompt.embedding);

// Calculate similarity
const similarity = vectorUtils.cosineSimilarity(vector1, vector2);

// Find nearest neighbors
const neighbors = vectorUtils.findNearestNeighbors(queryVector, vectors, 5);
```

### Database Health Check

```typescript
import { checkDatabaseHealth, checkPgVectorExtension } from "@repo/database";

// Check database connection
const health = await checkDatabaseHealth();
console.log("Database connected:", health.connected);

// Check pgvector status
const pgvector = await checkPgVectorExtension();
console.log("pgvector installed:", pgvector.installed);
```

## Scripts

- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate:dev` - Create and apply development migrations
- `bun run db:migrate:deploy` - Apply migrations in production
- `bun run db:migrate:reset` - Reset database and reapply migrations
- `bun run db:studio` - Open Prisma Studio GUI
- `bun run db:seed` - Seed database with sample data
- `bun run db:format` - Format Prisma schema file

## Schema Overview

### Core Models

- **User**: Application users
- **Category**: Hierarchical categorization with embeddings
- **Prompt**: Enhanced prompts with metadata and embeddings
- **Workflow**: Workflow execution tracking
- **LogEntry**: Structured server-side logging

### Relationships

```
User
├── Prompts (1:n)
├── Categories (1:n)
└── Workflows (1:n)

Category
├── Parent Category (n:1)
├── Child Categories (1:n)
└── Prompts (n:n via PromptCategory)

Prompt
├── User (n:1)
├── Categories (n:n via PromptCategory)
└── Workflow (1:1)
```

## pgvector Migration

Currently, embeddings are stored as JSON. To migrate to native pgvector:

1. Enable pgvector extension in PostgreSQL
2. Update schema.prisma to use `Unsupported("vector(768)")`
3. Run migration to convert JSON to vector columns
4. Update application code to use pgvector operators

## Development

### Type Safety

All database operations are fully type-safe thanks to Prisma's generated client:

```typescript
// Type-safe queries
const prompt = await prisma.prompt.findUnique({
  where: { id: "abc123" }, // TypeScript knows 'id' is a string
  select: {
    instruction: true, // TypeScript knows available fields
    workflow: {
      select: {
        status: true, // Nested selections are type-safe
      },
    },
  },
});
```

### Testing

```bash
bun test
```

## Troubleshooting

### pgvector Not Found

If you see warnings about pgvector, install it:

**macOS:**

```bash
brew install pgvector
```

**Ubuntu/Debian:**

```bash
sudo apt install postgresql-16-pgvector
```

**From source:**
See [pgvector installation guide](https://github.com/pgvector/pgvector#installation)

### Connection Issues

1. Check DATABASE_URL is correct
2. Ensure PostgreSQL is running
3. Verify user has necessary permissions
4. Check firewall/network settings

## License

Private - AI Dr. Project
