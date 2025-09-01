# Bun Monorepo Template

A modern, production-ready monorepo template built with Bun, TypeScript, Turborepo, and Next.js. This template provides a solid foundation for building scalable applications with best practices and tooling pre-configured.

## Features

- **🚀 Bun Runtime** - Fast all-in-one JavaScript runtime & toolkit
- **📦 Turborepo** - High-performance build system for monorepos
- **⚛️ Next.js 15** - React framework with App Router
- **🎨 Tailwind CSS v4** - Utility-first CSS framework
- **🗄️ Prisma** - Type-safe database ORM
- **🔍 TypeScript** - Full type safety across the monorepo
- **🎯 ESLint** - Code quality and consistency
- **✨ Prettier** - Code formatting
- **🧪 Testing** - Bun's built-in test runner
- **🔧 Pre-configured** - Development tools and scripts ready to use

## Prerequisites

- [Bun](https://bun.sh) >= 1.2.21
- [Node.js](https://nodejs.org) >= 22 (for some tooling compatibility)
- [PostgreSQL](https://www.postgresql.org/) (or another Prisma-supported database)
- Git

## Quick Start

### 1. Clone the template

```bash
git clone https://github.com/yourusername/bun-monorepo-template.git my-project
cd my-project
rm -rf .git
git init
```

### 2. Run the setup script

```bash
# Make the script executable
chmod +x scripts/setup.sh

# Run the setup wizard
./scripts/setup.sh
```

The setup script will:
- Install dependencies
- Configure environment variables
- Set up the database
- Initialize Prisma
- Prepare the development environment

### 3. Start developing

```bash
# Start the development server
bun dev

# In another terminal, run the database studio (optional)
bun db:studio
```

Your app will be available at http://localhost:3000

## Project Structure

```
.
├── apps/                    # Applications
│   └── web/                # Next.js web application
├── packages/               # Shared packages
│   ├── database/          # Prisma database client
│   ├── ui/                # Shared UI components
│   ├── logger/            # Logging utilities
│   ├── eslint-config/     # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── scripts/               # Automation scripts
├── docs/                  # Documentation
└── turbo.json            # Turborepo configuration
```

## Available Scripts

Run these commands from the root of the monorepo:

### Development
- `bun dev` - Start all apps in development mode
- `bun build` - Build all apps and packages
- `bun typecheck` - Run TypeScript type checking
- `bun lint` - Run ESLint
- `bun format` - Format code with Prettier

### Database
- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push schema changes to database
- `bun db:migrate:dev` - Create and apply migrations (dev)
- `bun db:migrate:deploy` - Apply migrations (production)
- `bun db:studio` - Open Prisma Studio
- `bun db:seed` - Seed the database
- `bun db:format` - Format Prisma schema

## Environment Variables

### Required Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name

# Optional: API Keys (if using MCP servers)
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
```

### Application-specific Variables

For the web app, create `apps/web/.env.local`:

```bash
# Copy from apps/web/.env.example
DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Adding New Packages

1. Create a new directory under `packages/`:
```bash
mkdir packages/my-package
```

2. Initialize the package:
```bash
cd packages/my-package
bun init
```

3. Add the package to the workspace in root `package.json`

4. Reference it in your apps:
```json
{
  "dependencies": {
    "@workspace/my-package": "workspace:*"
  }
}
```

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

## Building for Production

```bash
# Build all packages and apps
bun run build

# The web app will be built to apps/web/.next
```

## Deployment

The template is ready for deployment to various platforms:

- **Vercel**: Works out of the box with automatic monorepo detection
- **Railway**: Use the provided `railway.json` configuration
- **Docker**: Dockerfile can be added for containerized deployments
- **VPS**: Use PM2 or systemd for process management

## Customization

### Renaming the Project

1. Update `name` in root `package.json`
2. Update database name in `.env` files
3. Update `name` in individual package `package.json` files
4. Run `bun install` to update lockfile

### Adding Dependencies

```bash
# Add to root (dev dependencies for tooling)
bun add -d <package-name>

# Add to specific workspace
cd apps/web
bun add <package-name>
```

### Modifying Database Schema

1. Edit `packages/database/prisma/schema.prisma`
2. Run `bun db:generate` to update the client
3. Run `bun db:push` for development or `bun db:migrate:dev` for migrations

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in `.env`
   - Run `bun db:push` to sync schema

2. **Type errors**
   - Run `bun db:generate` after schema changes
   - Run `bun typecheck` to identify issues
   - Ensure all packages are built: `bun build`

3. **Port already in use**
   - The web app runs on port 3000 by default
   - Change the port: `PORT=3001 bun dev`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

Built with excellent tools from the JavaScript ecosystem:
- [Bun](https://bun.sh)
- [Turborepo](https://turbo.build)
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)