# Testing

## Framework

- Uses **Bun's built-in test runner**
- Tests in `/test` directory with `.test.ts` extension
- Separate test database via `TEST_DATABASE_URL`

## Commands

- `bun test` - Run all tests
- `bun test:watch` - Watch mode
- `bun test:coverage` - With coverage

## Key Points

- Tests use `cleanupTestDb()` for isolation
- Mock external APIs to avoid dependencies
- Use factory functions for test data

---

**For complete testing framework details, utilities, and best practices, see [docs/testing.md](docs/testing.md)**

_Read when: Writing tests, setting up test environment, or debugging test failures_
