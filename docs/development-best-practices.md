# AI Dr. Development Best Practices

## Overview

This document captures best practices, patterns, and principles learned during the development and improvement of the AI Dr. system. It serves as a guide for maintaining code quality and system reliability.

---

## 🏗️ Architecture Principles

### 1. Explicit Over Implicit

**Principle**: Always be explicit about configurations, paths, and dependencies.

✅ **Good**:

```typescript
const workingDirectory = path.resolve(this.config.projectPath);
spawn(command, args, { cwd: workingDirectory });
```

❌ **Bad**:

```typescript
spawn(command, args); // Assumes current directory
```

### 2. Fail Fast, Fail Clearly

**Principle**: Validate early and provide clear error messages.

✅ **Good**:

```typescript
if (!fs.existsSync(workingDirectory)) {
  throw new ExecutorError(
    `Working directory does not exist: ${workingDirectory}`,
    "INVALID_WORKING_DIRECTORY",
  );
}
```

❌ **Bad**:

```typescript
// Silently fails or gives cryptic errors later
spawn(command, args, { cwd: workingDirectory });
```

### 3. Defense in Depth

**Principle**: Layer multiple safety mechanisms.

```typescript
// Layer 1: Input validation
// Layer 2: Path resolution
// Layer 3: Directory existence check
// Layer 4: Error boundary with retry
// Layer 5: Structured logging
```

---

## 💻 Code Patterns

### 1. Error Handling Pattern

**Always use error boundaries for critical operations:**

```typescript
export class ServiceWithErrorBoundary {
  private errorBoundary: ErrorBoundary;

  constructor() {
    this.errorBoundary = createErrorBoundary({
      onError: (error) => this.logger.error("Operation failed", error),
      retries: 2,
      retryDelay: 1000,
    });
  }

  async criticalOperation(): Promise<Result> {
    return this.errorBoundary.wrap(async () => {
      // Critical code here
    }, "OPERATION_NAME");
  }
}
```

### 2. Logging Pattern

**Use structured logging with context:**

```typescript
class Service {
  private logger: Logger;

  constructor() {
    this.logger = createLogger("ServiceName", {
      context: { serviceVersion: "1.0.0" },
    });
  }

  async operation(requestId: string) {
    const opLogger = this.logger.child({ requestId });

    opLogger.info("Operation started");
    try {
      const result = await this.doWork();
      opLogger.info("Operation completed", { result });
      return result;
    } catch (error) {
      opLogger.error("Operation failed", error);
      throw error;
    }
  }
}
```

### 3. Configuration Pattern

**Centralize and validate configuration:**

```typescript
interface ServiceConfig {
  projectPath: string;
  executor: string;
  timeout?: number;
}

class Service {
  private config: Required<ServiceConfig>;

  constructor(config: ServiceConfig) {
    this.config = this.validateConfig(config);
  }

  private validateConfig(config: ServiceConfig): Required<ServiceConfig> {
    return {
      projectPath: path.resolve(config.projectPath),
      executor: config.executor,
      timeout: config.timeout ?? 30000,
    };
  }
}
```

### 4. Testing Pattern

**Mock external dependencies properly:**

```typescript
// Mock at module level
vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(() => true),
}));

// Create controllable mocks
const mockChildProcess = {
  stdout: new EventEmitter(),
  stderr: new EventEmitter(),
  on: vi.fn((event, callback) => {
    if (event === "close") {
      // Control when process closes
      setTimeout(() => callback(0), 100);
    }
    return mockChildProcess;
  }),
  kill: vi.fn(),
};
```

---

## 🛡️ Security Best Practices

### 1. Path Security

```typescript
// Always validate and resolve paths
const safePath = path.resolve(userProvidedPath);
if (!safePath.startsWith(allowedBasePath)) {
  throw new SecurityError("Path traversal attempt detected");
}
```

### 2. Input Validation

```typescript
// Validate all user inputs
const schema = z.object({
  prompt: z.string().max(10000),
  projectId: z.string().uuid(),
});

const validated = schema.parse(userInput);
```

### 3. Secret Management

```typescript
// Never log secrets
const sanitizedConfig = {
  ...config,
  apiKey: config.apiKey ? "***" : undefined,
};
logger.info("Config loaded", sanitizedConfig);
```

---

## 📊 Performance Guidelines

### 1. Async Operations

```typescript
// Use Promise.all for parallel operations
const [result1, result2, result3] = await Promise.all([
  operation1(),
  operation2(),
  operation3(),
]);
```

### 2. Resource Management

```typescript
// Always clean up resources
class ResourceManager {
  private resources: Set<Resource> = new Set();

  async acquire(): Promise<Resource> {
    const resource = await createResource();
    this.resources.add(resource);
    return resource;
  }

  async dispose(): Promise<void> {
    await Promise.all(Array.from(this.resources).map((r) => r.dispose()));
    this.resources.clear();
  }
}
```

### 3. Caching Strategy

```typescript
class CachedService {
  private cache = new Map<string, CacheEntry>();

  async get(key: string): Promise<Value> {
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      return cached.value;
    }

    const value = await this.fetch(key);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    return value;
  }
}
```

---

## 🧪 Testing Best Practices

### 1. Test Structure

```typescript
describe("Component", () => {
  describe("method", () => {
    it("should handle normal case", async () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = await component.method(input);

      // Assert
      expect(result).toMatchObject(expectedOutput);
    });

    it("should handle error case", async () => {
      // Test error scenarios
    });

    it("should handle edge case", async () => {
      // Test boundary conditions
    });
  });
});
```

### 2. Test Data Builders

```typescript
class TestDataBuilder {
  private data = { ...defaultData };

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withStatus(status: Status): this {
    this.data.status = status;
    return this;
  }

  build(): TestData {
    return { ...this.data };
  }
}
```

### 3. Async Test Helpers

```typescript
async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
```

---

## 📦 Package Management

### 1. Monorepo Structure

```
packages/
  ├── logger/           # Shared logging
  ├── error-boundary/   # Error handling
  ├── session-manager/  # Session persistence
  ├── executor-factory/ # Executor creation
  └── shared-types/     # TypeScript types
```

### 2. Package Dependencies

```json
{
  "dependencies": {
    "@repo/logger": "*", // Internal packages
    "external-lib": "^1.0.0" // External with version
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "vitest": "^2.1.8"
  }
}
```

### 3. Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  }
}
```

---

## 🔧 Debugging Tips

### 1. Debug Logging

```typescript
// Use debug namespace for conditional logging
const debug = createDebugLogger("ai-dr:executor");

debug("Executing command", { command, args });
```

### 2. Error Context

```typescript
// Add context to errors
class ContextualError extends Error {
  constructor(
    message: string,
    public context: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ContextualError";
  }
}

throw new ContextualError("Operation failed", {
  userId,
  operation,
  timestamp: Date.now(),
});
```

### 3. Performance Profiling

```typescript
const timer = logger.startTimer();
try {
  const result = await heavyOperation();
  const duration = timer();
  logger.info("Operation completed", { duration });
  return result;
} catch (error) {
  const duration = timer();
  logger.error("Operation failed", error, { duration });
  throw error;
}
```

---

## 🚀 Deployment Best Practices

### 1. Environment Variables

```typescript
// Validate required env vars on startup
const requiredEnvVars = ["DATABASE_URL", "REDIS_URL", "CLAUDE_CLI_PATH"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 2. Health Checks

```typescript
app.get("/health", async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    filesystem: await checkFilesystem(),
  };

  const healthy = Object.values(checks).every((c) => c.healthy);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
  });
});
```

### 3. Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, starting graceful shutdown");

  // Stop accepting new requests
  server.close();

  // Wait for ongoing requests
  await waitForRequestsToComplete();

  // Close database connections
  await database.disconnect();

  // Close Redis connections
  await redis.quit();

  logger.info("Graceful shutdown complete");
  process.exit(0);
});
```

_"The best code is not just working code, but code that clearly communicates its intent and is resilient to change."_
