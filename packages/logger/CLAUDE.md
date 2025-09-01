# Logger Package - Claude Instructions

## Overview
Server-side logging system with file rotation, designed to work seamlessly on both server and client environments.

## Quick Start

```typescript
import { logger } from '@repo/logger';

logger.info('Starting application');
logger.error('Error occurred', error);
logger.logPerformance('Operation completed', startTime);
```

## Key Features

### File Rotation
- **Daily rotation**: New file each day
- **Size limit**: 10MB default per file
- **Compression**: Automatic gzip of old files
- **Retention**: 30 days of logs by default

### Dual Streams
- `app.log`: All log levels
- `error.log`: Error and fatal only

### Client-Safe
- Server: Full file logging
- Client: Console only (no errors)

## Important Notes

### Environment Detection
```typescript
const isServer = typeof window === 'undefined';
```
File operations only run on server-side.

### Log Levels
- `debug`: Development details
- `info`: General information
- `warn`: Warnings
- `error`: Errors
- `fatal`: Critical failures

### Performance Logging
Automatically captures:
- Duration (milliseconds)
- Memory usage (heap)

## Common Patterns

### Module-Specific Logger
```typescript
const dbLogger = logger.child('database');
dbLogger.info('Query executed');
// Output: [database] Query executed
```

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  logger.error('Operation failed', error);
  // Automatically extracts stack trace
}
```

### API Request Logging
```typescript
const startTime = Date.now();
logger.info('API request', { method, path });
// ... handle request
logger.logPerformance('Request completed', startTime, { status });
```

## File Structure

```
logs/
├── dev-app.log          # Current dev logs
├── dev-error.log        # Current dev errors
├── prod-app.log         # Current prod logs
├── prod-error.log       # Current prod errors
└── *.gz                 # Compressed archives
```

## Configuration

### Via Environment
```env
LOG_LEVEL=debug        # Minimum level to log
LOG_CONSOLE=true       # Console output
LOG_FILE=true          # File output (server only)
NODE_ENV=development   # Environment
```

### Via Code
```typescript
const customLogger = new Logger({
  logDir: './custom-logs',
  logLevel: 'debug',
  maxFileSize: '50M',
  maxFiles: 60
});
```

## Integration Points

### Next.js
- Use in API routes
- Use in server components
- Client components: console only

### Express/Fastify
- Middleware for request logging
- Error handler integration

## Gotchas

1. **Client-side**: File logging silently disabled
2. **Permissions**: Ensure write access to log directory
3. **Disk space**: Monitor rotation and cleanup
4. **Performance**: Use appropriate log levels in production
5. **Async writes**: Don't exit immediately after logging

## Testing Considerations

- Mock logger in unit tests
- Use separate log directory for tests
- Clean up test logs after runs
- Test both server and client modes

## Maintenance

### Log Cleanup
Old logs are automatically removed after `maxFiles` limit.

### Manual Rotation
Restart application to force rotation.

### Monitoring
Check log directory size periodically.

## Security

- Never log sensitive data (passwords, tokens)
- Sanitize user input before logging
- Restrict log directory access
- Consider log encryption for sensitive apps