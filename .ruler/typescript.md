# TypeScript Standards

## Type Safety

- **NEVER use `any` type** - avoid at all cost. The types should work or they indicate a problem.
- Use `unknown` instead of `any` for unknown types
- Always use `"strict": true` in tsconfig.json
- Use proper type guards
- Leverage discriminated unions  
- Use `readonly` where applicable
- Use strict null checks to prevent null pointer exceptions

## Type Organization

- Group related types together
- Export types from a central location  
- Keep type definitions close to usage
- Use library types for external dependencies (e.g., `@prisma/client` exports types from generated client files, use those instead of redefining them)
- Prefer type inference where possible
- Use explicit return types for functions
- Use interfaces for object shapes
- Use type for unions and intersections

## Imports & Exports

- **Never create index barrel files** (index.ts, index.js) - use named exports instead
- Always use direct imports with named exports
- Prefer type imports for type-only imports:
```typescript
import type { SomeType } from './types';
```

## Function Patterns

Always use inline interfaces with function parameters:

✅ **Good:**
```typescript
export function processData({
  id,
  name,
  options
}: {
  id: string;
  name: string;
  options: ProcessingOptions;
}): ProcessedResult {
  // implementation
}
```

❌ **Bad:**
```typescript
interface ProcessDataParams {
  id: string;
  name: string;
  options: ProcessingOptions;
}
```

## Generic Types

- Use generic and exportable types for reusable components
- Constrain generic types when possible
- Use meaningful type parameter names
- Provide default type parameters when appropriate

## Best Practices

- Use type assertions sparingly
- Prefer interface merging over intersection types
- Use mapped types for dynamic objects
- Leverage utility types
- Keep type definitions DRY
- Environment variables should be typed in `env.d.ts` within and used with bracket notation:
```typescript
// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      // ... other env vars
    }
  }
}
```

✅ **DO:**
```typescript
process.env['VARIABLE_NAME']
```

❌ **DON'T:**
```typescript
process.env.VARIABLE_NAME  
```

## Configuration

TypeScript is configured in `tsconfig.json`. Each package extends the root config and additional configs in `@package/config-typescript`.

- Always run `bun run typecheck` to check for type errors after finishing work
- Prisma generates types in `packages/database/generated/client/index.ts`