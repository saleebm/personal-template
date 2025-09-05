# @repo/logger

Robust server-side logging system with file rotation, structured logging, and performance metrics for AI Dr.

## Features

- **File Rotation**: Automatic daily rotation with size limits
- **Dual Streams**: Separate streams for general and error logs
- **Compression**: Automatic gzip compression of rotated files
- **Client-Safe**: Gracefully degrades to console logging on client-side
- **Structured Logging**: JSON-formatted data with metadata support
- **Performance Metrics**: Built-in duration and memory tracking
- **Child Loggers**: Create scoped loggers for specific modules
- **Color-Coded Console**: Beautiful, readable console output
- **TypeScript Support**: Full type safety

## Installation

```bash
bun add @repo/logger
```

## Usage

### Basic Logging

```typescript
import { logger } from "@repo/logger";

// Simple logging
logger.info("Application started");
logger.debug("Debug information", { userId: 123 });
logger.warn("Warning message");
logger.error("Error occurred", new Error("Something went wrong"));
logger.fatal("Fatal error", error);
```

### With Metadata

```typescript
logger.info(
  "User action",
  { action: "login", email: "user@example.com" },
  {
    source: "auth-service",
    sessionId: "abc123",
    userId: "user-456",
  },
);
```

### Performance Logging

```typescript
const startTime = Date.now();

// Do some work...

logger.logPerformance("Database query completed", startTime, {
  query: "SELECT * FROM users",
  rows: 100,
});
// Logs: "Database query completed (duration: 123ms) (memory: 45.2MB)"
```

### Child Loggers

Create scoped loggers for specific modules:

```typescript
const authLogger = logger.child("auth-service");
const dbLogger = logger.child("database");

authLogger.info("User authenticated");
// Logs: [auth-service] User authenticated

dbLogger.error("Connection failed", error);
// Logs: [database] Connection failed
```

### Custom Logger Instance

```typescript
import { Logger } from "@repo/logger";

const customLogger = new Logger({
  logDir: "/custom/log/path",
  logLevel: "debug",
  enableConsole: true,
  enableFile: true,
  maxFileSize: "50M",
  maxFiles: 60,
  compress: true,
});

customLogger.info("Custom logger initialized");
```

## Configuration

### Environment Variables

```env
# Log level: debug, info, warn, error, fatal
LOG_LEVEL=info

# Enable/disable console output
LOG_CONSOLE=true

# Enable/disable file output (server-side only)
LOG_FILE=true

# Node environment
NODE_ENV=development
```

### Configuration Options

```typescript
interface LoggerConfig {
  logDir?: string; // Log directory path (default: ./logs)
  logLevel?: LogLevel; // Minimum log level
  enableConsole?: boolean; // Enable console output
  enableFile?: boolean; // Enable file output (server only)
  maxFileSize?: string; // Max file size before rotation (default: 10M)
  maxFiles?: number; // Max number of rotated files (default: 30)
  compress?: boolean; // Compress rotated files (default: true)
}
```

## File Structure

Logs are organized as follows:

```
logs/
├── dev-app.log           # Current development app log
├── dev-error.log         # Current development error log
├── dev-app-2025-01-15.log.gz    # Rotated app log
├── dev-error-2025-01-15.log.gz  # Rotated error log
├── prod-app.log          # Current production app log
└── prod-error.log        # Current production error log
```

## Log Levels

| Level | Numeric | Description                                |
| ----- | ------- | ------------------------------------------ |
| debug | 0       | Detailed debug information                 |
| info  | 1       | General informational messages             |
| warn  | 2       | Warning messages                           |
| error | 3       | Error messages                             |
| fatal | 4       | Fatal errors requiring immediate attention |

## Server vs Client

### Server-Side (Node.js/Bun)

- Full functionality with file rotation
- Dual log streams (app and error)
- Compression and archival
- Performance metrics

### Client-Side (Browser)

- Graceful fallback to console only
- No file system errors
- Color-coded console output
- Same API for consistency

## Integration Examples

### Next.js App

```typescript
// app/api/route.ts
import { logger } from "@repo/logger";

export async function POST(request: Request) {
  const apiLogger = logger.child("api");

  try {
    const startTime = Date.now();
    const data = await request.json();

    apiLogger.info("API request received", data);

    // Process request...

    apiLogger.logPerformance("Request processed", startTime);

    return Response.json({ success: true });
  } catch (error) {
    apiLogger.error("API error", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Express Middleware

```typescript
import { logger } from "@repo/logger";

app.use((req, res, next) => {
  const requestLogger = logger.child("http");
  const startTime = Date.now();

  requestLogger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.on("finish", () => {
    requestLogger.logPerformance(
      `${req.method} ${req.path} ${res.statusCode}`,
      startTime,
      { statusCode: res.statusCode },
    );
  });

  next();
});
```

### Error Handling

```typescript
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal("Unhandled rejection", { reason, promise });
});
```

## Best Practices

1. **Use Child Loggers**: Create scoped loggers for different modules
2. **Log Levels**: Use appropriate levels (debug for development, info for production)
3. **Structured Data**: Pass objects for better searchability
4. **Performance Tracking**: Use `logPerformance` for critical operations
5. **Error Context**: Always include error objects when logging errors
6. **Cleanup**: Close logger on application shutdown

```typescript
// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  await logger.close();
  process.exit(0);
});
```

## Advanced Features

### Dynamic Log Level

Change log level at runtime:

```typescript
// Start with info level
logger.setLogLevel("info");

// Enable debug logging
logger.setLogLevel("debug");
```

### Get Log Directory

```typescript
const logPath = logger.getLogDir();
console.log(`Logs are stored in: ${logPath}`);
```

### Custom Formatting

Extend the Logger class for custom formatting:

```typescript
class CustomLogger extends Logger {
  protected formatLogEntry(entry: LogEntry): string {
    // Custom formatting logic
    return `CUSTOM: ${super.formatLogEntry(entry)}`;
  }
}
```

## Troubleshooting

### Logs Not Appearing

1. Check log level: `LOG_LEVEL` environment variable
2. Verify file permissions in log directory
3. Ensure `enableFile` is true for server-side
4. Check available disk space

### Performance Impact

- File I/O is async and non-blocking
- Compression happens on rotated files only
- Use appropriate log levels in production
- Consider log sampling for high-traffic applications

## License

Private - AI Dr. Project
