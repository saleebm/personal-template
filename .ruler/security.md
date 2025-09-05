# Security Guidelines

## Secrets Management

- **Never commit secrets to git**
- Use environment variables for all secrets
- Validate environment configuration on startup
- Provide clear error messages for missing config
- **Never expose** secrets in code - next.js uses PUBLIC\_ prefix for public variables. All server variables must be used on server actions or api routes ONLY.

## Input Validation

- **Validate all** user inputs
- Use specific validation for each input type
- Sanitize user-provided data before processing

## Path Security

- **Sanitize paths** to prevent directory traversal attacks
- Always validate and sanitize file paths
- Use allowed paths configuration
- Prevent directory traversal attacks

## Environment Variables

### Server vs Client (Next.js)

- **Server-only:** Variables without `NEXT_PUBLIC_` prefix (safe for secrets)

```typescript
process.env["DATABASE_URL"];
process.env["API_SECRET"];
```

- **Client-exposed:** Variables with `NEXT_PUBLIC_` prefix (public only!)

```typescript
process.env["NEXT_PUBLIC_API_URL"];
```

## Error Handling

When a required dependency is missing:

```typescript
if (!isAvailable) {
  throw new Error(`
    Dependency is not available.
    
    To install:
    1. Visit installation guide
    2. Run setup script
  `);
}
```

## Command Injection Prevention

- Sanitize all CLI spawning
- Validate command arguments
- Use parameterized commands when possible
- Never trust user input in command construction
