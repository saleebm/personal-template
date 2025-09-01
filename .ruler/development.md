# Development Workflow

## Use Bun Instead of Node.js

- Always check your current working directory and make sure you are in the correct directory before running any commands.
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>`
- Bun automatically loads .env, so don't use dotenv

## Standard Development Sequence

After ANY changes, run this sequence:
```bash
bun dev          # 1. Test integration (Turborepo)
bun typecheck    # 2. Verify types  
bun test         # 3. Run unit tests
bun lint         # 4. Check code quality
```

## Database Operations (Prisma)

```bash
bun run db:migrate:dev     # Development migrations
bun run db:push            # Push schema changes
bun run db:generate        # Generate client
bun run db:studio          # Open Prisma Studio
bun run db:seed            # Seed database
```

## Environment Setup Requirements

1. Bun installed (latest version)
2. Database connection configured in `.env` files

## Development Rules

1. **Check command output** - even if you see what you want, address any other issues that appear. Clear up issues related to your changes. 
2. **Use playwright mcp to view web page for errors.** Test the changes in the browser.
3. **Keep commands in root package.json** for ease of use
4. **Always keep commands in root package.json file** for ease of use


## Reproducible Setup

1. Always provide setup scripts in `/scripts` directory
2. Document all environment variables in `.env.example`  
3. Use configuration detection to find system dependencies