# Development Commands

## Development Commands

- **Development**: `bun dev` - Starts both the API server and worker in watch mode
- **Build**: `bun run build:prod` - Compiles to executable in `./bin/`
- **Type Check**: `bun run typecheck` - Run TypeScript type checking
- **Start Production**: `./bin/lesswhelmed-me` - Run the compiled executable
- **Build Categorization Package**: `cd packages/categorization && bun run build` - Builds the @lesswhelmed/categorization package

## Testing Commands

- **Run Tests**: `bun test` - Runs all tests using Bun's built-in test runner
- **Watch Tests**: `bun test:watch` - Runs tests in watch mode for development
- **Test Coverage**: `bun test:coverage` - Runs tests with coverage reporting
- **Test Setup**: `bun run test:setup` - Sets up test database (requires TEST_DATABASE_URL)

## Database Commands

- **Generate Prisma Client**: `bun run db:generate`
- **Run Migrations (Dev)**: `bun run db:migrate-dev`
- **Deploy Migrations**: `bun run db:migrate-deploy`
- **Database Studio**: `bun run db:studio`

## Migration Notes

- When running migration script, always include the `--name` argument (e.g., `bun run db:migrate-dev --name added_job_title`)
- Omitting the `--name` argument can cause the migration script to hang
- If the script appears unresponsive, ensure you've passed the required name argument
