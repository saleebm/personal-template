# Development Commands

## Development Commands

- **Development**: `bun dev` - Starts all apps in development mode
- **Build**: `bun build` - Build all apps and packages
- **Type Check**: `bun typecheck` - Run TypeScript type checking
- **Lint**: `bun lint` - Run ESLint
- **Format**: `bun format` - Format code with Prettier

## Testing Commands

- **Run Tests**: `bun test` - Runs all tests using Bun's built-in test runner
- **Watch Tests**: `bun test:watch` - Runs tests in watch mode for development
- **Test Coverage**: `bun test:coverage` - Runs tests with coverage reporting

## Database Commands

- **Generate Prisma Client**: `bun db:generate`
- **Push Schema**: `bun db:push` - Push schema changes to database (development)
- **Run Migrations (Dev)**: `bun db:migrate:dev` - Create and apply migrations
- **Deploy Migrations**: `bun db:migrate:deploy` - Apply migrations in production
- **Database Studio**: `bun db:studio` - Open Prisma Studio
- **Seed Database**: `bun db:seed` - Seed the database with sample data
- **Format Schema**: `bun db:format` - Format Prisma schema file

## Migration Notes

- When running migration script, always include the `--name` argument (e.g., `bun db:migrate:dev --name added_user_table`)
- Omitting the `--name` argument can cause the migration script to hang
- If the script appears unresponsive, ensure you've passed the required name argument
