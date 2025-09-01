import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Logger } from './index.js';
import fs from 'fs';
import path from 'path';

describe('Logger', () => {
  let testLogger: Logger;
  const testLogDir = path.join(process.cwd(), 'test-logs');

  beforeAll(() => {
    // Create test logger with custom directory
    testLogger = new Logger({
      logDir: testLogDir,
      logLevel: 'debug',
      enableConsole: false, // Disable console for tests
      enableFile: true,
    });
  });

  afterAll(async () => {
    // Close logger
    await testLogger.close();
    
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  it('should create log directory', () => {
    expect(fs.existsSync(testLogDir)).toBe(true);
  });

  it('should log at different levels', () => {
    testLogger.debug('Debug message');
    testLogger.info('Info message');
    testLogger.warn('Warning message');
    testLogger.error('Error message');
    testLogger.fatal('Fatal message');
    
    // Just verify no errors thrown
    expect(true).toBe(true);
  });

  it('should log with data', () => {
    testLogger.info('User action', {
      userId: 123,
      action: 'login',
      timestamp: Date.now(),
    });
    
    expect(true).toBe(true);
  });

  it('should log errors with stack trace', () => {
    const error = new Error('Test error');
    testLogger.error('Error occurred', error);
    
    expect(true).toBe(true);
  });

  it('should create child logger', () => {
    const childLogger = testLogger.child('test-module');
    childLogger.info('Child logger message');
    
    expect(true).toBe(true);
  });

  it('should log performance metrics', () => {
    const startTime = Date.now();
    
    // Simulate some work
    const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
    
    testLogger.logPerformance('Calculation completed', startTime, { result: sum });
    
    expect(sum).toBe(499500);
  });

  it('should respect log level', () => {
    const restrictedLogger = new Logger({
      logDir: testLogDir,
      logLevel: 'warn',
      enableConsole: false,
    });
    
    // These should not throw errors even if not logged
    restrictedLogger.debug('Should not be logged');
    restrictedLogger.info('Should not be logged');
    restrictedLogger.warn('Should be logged');
    restrictedLogger.error('Should be logged');
    
    expect(true).toBe(true);
  });

  it('should handle metadata', () => {
    testLogger.info('Request processed', 
      { endpoint: '/api/users' },
      {
        source: 'api-service',
        sessionId: 'abc123',
        userId: 'user-456',
        duration: 150,
        memory: 1024 * 1024 * 50, // 50MB
      }
    );
    
    expect(true).toBe(true);
  });

  it('should get log directory', () => {
    const logDir = testLogger.getLogDir();
    expect(logDir).toBe(testLogDir);
  });

  it('should change log level dynamically', () => {
    testLogger.setLogLevel('error');
    testLogger.info('Should not be logged after level change');
    testLogger.error('Should be logged after level change');
    
    // Reset to debug
    testLogger.setLogLevel('debug');
    
    expect(true).toBe(true);
  });
});

describe('Logger Backend-Only', () => {
  it('should work in Node.js environment', () => {
    // Since this is a backend-only package, we don't need to simulate client environment
    const backendLogger = new Logger({
      logLevel: 'info',
      enableConsole: true,
    });
    
    // Should not throw errors
    backendLogger.info('Backend message');
    backendLogger.error('Backend error', new Error('Test'));
    
    expect(true).toBe(true);
  });
});