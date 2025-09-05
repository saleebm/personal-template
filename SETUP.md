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

### 1. Clone the Template

```bash
# Clone the template
git clone https://github.com/saleebm/personal-template my-project
cd my-project
rm -rf .git
git init
```

### 2. Run the Unified Setup Script

The template now includes a comprehensive setup script that handles everything automatically:

```bash
# Interactive setup (recommended for first-time users)
./scripts/setup.sh

# Non-interactive setup (for CI/CD or automated environments)
PROJECT_NAME="my-project" DB_PASSWORD="mypassword" ./scripts/setup.sh --non-interactive

# Skip database setup entirely
./scripts/setup.sh --skip-database
```

**Setup Script Features:**

- ✅ **Automatic backup** of existing `.env` files with timestamps
- ✅ **Value preservation** - never overwrites your existing settings
- ✅ **Smart environment management** with variable interpolation
- ✅ **Database setup** with connection testing and schema initialization
- ✅ **Resume functionality** if interrupted
- ✅ **Non-interactive mode** for automation

**Environment Variables (for non-interactive mode):**

```bash
PROJECT_NAME="my-app"           # Project name
DB_HOST="localhost"             # Database host
DB_PORT="5432"                  # Database port
DB_NAME="my_database"           # Database name
DB_USER="postgres"              # Database user
DB_PASSWORD="mypassword"        # Database password
GITHUB_TOKEN="your-token"       # GitHub API token
GEMINI_API_KEY="your-key"       # Gemini AI API key
OPENAI_API_KEY="your-key"       # OpenAI API key
AI_GATEWAY_API_KEY="your-key"   # AI Gateway API key
```

### 3. Manual Setup (Alternative)

If you prefer manual configuration or need to troubleshoot:

```bash
# Install dependencies
bun install

# Create database
createdb your_database

# Copy and configure environment files
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env

# Edit .env files with your credentials
# Then run:
bun db:generate
bun db:push
bun db:seed  # Optional
```

### 4. Start Development

After running the setup script, you can immediately start developing:

```bash
# Start development server
bun dev

# In another terminal, open Prisma Studio (optional)
bun db:studio

# Your app will be available at http://localhost:3000
```

### 5. Claude AI Integration (Optional)

If you're using Claude for AI-powered development:

```bash
# Start Claude CLI in your project
claude

# The template includes pre-configured Claude instructions in:
# - CLAUDE.md (root instructions)
# - .ruler/ directory (agent rules and instructions)
```

## 📁 Project Structure

```
.
├── apps/                    # Applications
│   └── web/                # Next.js 15 web application
├── packages/               # Shared packages
│   ├── database/          # Prisma database client
│   ├── ui/                # Shared UI components
│   ├── logger/            # Logging utilities
│   ├── eslint-config/     # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── scripts/               # Automation scripts (unified setup.sh)
├── docs/                  # Documentation
├── .ruler/                # Agent rules and instructions (if using Claude)
└── turbo.json            # Turborepo configuration
```

### Key Files

- **`scripts/setup.sh`** - Unified setup script (replaces all previous setup scripts)
- **`.env.example`** - Root environment template
- **`apps/web/.env.example`** - Next.js app environment template
- **`packages/database/.env.example`** - Database-specific template

## 🛠️ Available Commands

### Development

- `bun dev` - Start development servers
- `bun build` - Build all packages
- `bun test` - Run tests
- `bun typecheck` - Check TypeScript types
- `bun lint` - Run linter

### Database

- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push schema changes to database
- `bun db:migrate:dev` - Create and apply migrations (dev)
- `bun db:migrate:deploy` - Apply migrations (production)
- `bun db:studio` - Open Prisma Studio
- `bun db:seed` - Seed the database
- `bun db:format` - Format Prisma schema

### Testing

- `bun test` - Run all tests
- `bun test:watch` - Run tests in watch mode
- `bun test:coverage` - Run tests with coverage

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

### Setup Script Issues

#### Setup Script Won't Run

```bash
# Make sure the script is executable
chmod +x scripts/setup.sh

# Check if Bun is installed
bun --version

# Run with more verbose output
bash -x scripts/setup.sh
```

#### Setup Interrupted

```bash
# The script supports resume functionality
# Simply run it again - it will continue from where it left off
./scripts/setup.sh
```

#### Environment Values Not Preserved

```bash
# Check if backups were created
ls -la *.backup.*

# The script automatically creates timestamped backups
# You can restore from: .env.backup.YYYYMMDD_HHMMSS
```

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_ctl status
# or on Ubuntu/Debian:
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -p 5432 -U postgres -d your_database

# Re-run just the database setup
./scripts/setup.sh --non-interactive
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 bun dev
```

#### Type Errors

```bash
# Regenerate Prisma client
bun db:generate

# Check all types
bun typecheck

# Build all packages
bun build
```

#### Environment Variables Not Working

```bash
# Check if .env files exist in correct locations
ls -la .env apps/web/.env packages/database/.env

# Verify variable interpolation in root .env
cat .env | grep DATABASE_URL

# For Next.js, check that variables are expanded (no ${} syntax)
cat apps/web/.env | grep DATABASE_URL
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
