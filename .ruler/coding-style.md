# Coding Standards

## Core Principles

### Single Responsibility Principle
- Each file should have one reason to change
- Files must be modular & single-purpose to maintain readability and ease of maintenance
- Keep functions short and focused on a single task
- Do not put files in the root directory, rather put them in an appropriate directory for clean code organization

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `user-service.ts` |
| **Directories** | kebab-case | `mcp-servers/` |
| **Components** | kebab-case | `user-profile.tsx` |
| **Functions** | camelCase | `getUserById()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| **Types/Interfaces** | PascalCase | `UserData` |
| **Database Tables** | PascalCase | `User` |
| **API Routes** | kebab-case | `/api/user-profile` |


## Error Handling

- Use specific exception types rather than generic exceptions
- Log errors effectively with context  
- Check availability first, provide installation instructions
- Never silently fallback to mocks in production
- Fail gracefully with helpful error messages

## Code Organization

### Exports
- Always use explicit exports
- Group related exports together
- Export types separately from implementations

### Documentation
- Document "why" not "what" 
- Use JSDoc for public APIs
- Keep comments up-to-date with code changes

## Performance

- Use dynamic imports for heavy dependencies
- Implement code splitting at route level
- Cache expensive operations
- Use appropriate cache invalidation strategies
