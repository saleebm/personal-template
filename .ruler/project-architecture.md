# Project Architecture

## Directory Structure

```
packages/
  feature-name/
    src/
      index.ts        # Public API exports
      types.ts        # Type definitions
      implementation/ # Core implementation
    tests/           # Test files
    README.md        # Package documentation
```

## Organization Principles

- **Features in packages**, apps use packages
- **DO NOT PUT FILES IN THE ROOT** of the repo; move them to appropriate locations in repo structure
- **Modular, extensible components**
- **Explicit barrel exports** in index files

## Documentation Requirements

Every package must include:

- **README.md** - Purpose, usage, API
- **Type definitions** - Complete interfaces
- **Code comments** - Why, not what
- **Test coverage** - Unit and integration

## Package Structure Standards

1. **Purpose and overview**
2. **Installation instructions**
3. **Usage examples**
4. **API documentation**
5. **Configuration options**

## Testing Organization

- Colocate tests with source files when possible
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep mock executors in separate files
- Use mocks only for testing, never in production
