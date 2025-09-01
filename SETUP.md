# 🚀 Bun Monorepo Template - Setup Guide

A production-ready monorepo template with Bun, Next.js 15, Turborepo, and Claude AI integration.

## Prerequisites

This template requires:
- **macOS or Linux** (Windows not currently supported)
- **Bun** (latest version) - [Install Bun](https://bun.sh/docs/installation)
- **PostgreSQL** - [Install PostgreSQL](https://www.postgresql.org/download/)
- **Claude CLI** - [Install Claude](https://docs.anthropic.com/en/docs/claude-code/claude-cli)
- **Git** - [Install Git](https://git-scm.com/downloads)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the template
git clone https://github.com/yourusername/bun-monorepo-template.git my-project
cd my-project

# Install dependencies
bun install
```

### 2. Configure Environment

Update the `.env` files with your credentials:

```bash
# Root .env
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-token
AUTH_HEADER=your-secure-api-key

# Also update:
# - packages/database/.env
# - apps/web/.env
```

### 3. Database Setup

```bash
# Create database
createdb your_database

# Push schema to database
bun run db:push

# (Optional) Seed with sample data
bun run db:seed
```

### 4. Claude AI Integration

To enable AI-powered workflows:

```bash
# Start Claude CLI
claude

# Install GitHub App for AI Dr workflows
/install-github-app

# Follow the prompts to authenticate
```

### 5. Start Development

```bash
# Start development server
bun dev

# In a new terminal, start Claude for AI assistance
claude
```

## 📁 Project Structure

```
.
├── apps/
│   └── web/              # Next.js 15 application
├── packages/
│   ├── database/         # Prisma ORM & database utilities
│   ├── ui/              # Shared UI components
│   └── config-*/        # Configuration packages
├── scripts/             # Database and setup scripts
├── .claude/             # Claude AI configuration
├── .ruler/              # Agent rules and instructions
└── turbo.json          # Turborepo configuration
```

## 🛠️ Available Commands

### Development
- `bun dev` - Start development servers
- `bun build` - Build all packages
- `bun test` - Run tests
- `bun typecheck` - Check TypeScript types
- `bun lint` - Run linter

### Database
- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push schema changes
- `bun db:migrate:dev` - Create migration
- `bun db:studio` - Open Prisma Studio

### MCP Servers
- `bun mcp:filesystem` - File system operations
- `bun mcp:github` - GitHub integration
- `bun mcp:sequential-thinking` - AI reasoning

## 🤖 Claude AI Features

This template is optimized for Claude AI development:

### Agent Capabilities
- **Workflow Orchestration** - AI-driven task management
- **Code Generation** - Component and API creation
- **Type Safety** - Automatic TypeScript error resolution
- **Architecture Review** - Principal engineer guidance

### Using Claude

```bash
# Start Claude in your project
claude

# Ask for help
> Help me create a new API endpoint

# Run workflows
> Create a user authentication system

# Get architecture advice
> Review my database schema
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_ctl status

# Verify connection string
psql postgresql://user:password@localhost:5432/your_database
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Type Errors
```bash
# Regenerate Prisma client
bun run db:generate

# Check all types
bun typecheck
```

## 📚 Documentation

- [Development Guide](docs/development.md)
- [Architecture Overview](architecture/SYSTEM_ARCHITECTURE.md)
- [API Documentation](architecture/API_CONTRACTS.md)
- [Testing Guide](docs/testing.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Submit a pull request

## 📄 License

MIT - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Next.js](https://nextjs.org) - React framework
- [Turborepo](https://turbo.build) - Monorepo build system
- [Claude](https://claude.ai) - AI development assistant
- [Prisma](https://prisma.io) - Database ORM

---

**Need help?** Open an issue or reach out to the community!