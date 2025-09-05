/**
 * Test setup and teardown utilities
 */

import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  tempDir: string;
  originalEnv: NodeJS.ProcessEnv;
  cleanup: () => Promise<void>;
}

/**
 * Setup test environment
 */
export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Create unique temp directory for test isolation
  const tempDir = join(tmpdir(), `prompt-enhancer-test-${randomBytes(8).toString('hex')}`);
  await mkdir(tempDir, { recursive: true });
  
  // Save original environment
  const originalEnv = { ...process.env };
  
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['PROMPT_STORAGE_DIR'] = join(tempDir, 'storage');
  process.env['PROMPT_CACHE_DIR'] = join(tempDir, 'cache');
  process.env['TEST_MODE'] = 'true';
  
  // Disable actual API calls in test mode
  if (!process.env['ENABLE_REAL_API_CALLS']) {
    delete process.env['GOOGLE_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];
  }
  
  // Create necessary directories
  await mkdir(process.env['PROMPT_STORAGE_DIR'], { recursive: true });
  await mkdir(process.env['PROMPT_CACHE_DIR'], { recursive: true });
  
  // Cleanup function
  const cleanup = async () => {
    // Restore original environment
    process.env = originalEnv;
    
    // Remove temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp directory: ${tempDir}`, error);
    }
  };
  
  return {
    tempDir,
    originalEnv,
    cleanup
  };
}

/**
 * Setup mock API environment
 */
export function setupMockAPIs() {
  const mocks = {
    googleAPI: {
      calls: [] as any[],
      responses: [] as any[],
      errors: [] as any[],
      reset: () => {
        mocks.googleAPI.calls = [];
        mocks.googleAPI.responses = [];
        mocks.googleAPI.errors = [];
      }
    },
    anthropicAPI: {
      calls: [] as any[],
      responses: [] as any[],
      errors: [] as any[],
      reset: () => {
        mocks.anthropicAPI.calls = [];
        mocks.anthropicAPI.responses = [];
        mocks.anthropicAPI.errors = [];
      }
    }
  };
  
  return mocks;
}

/**
 * Create test directories with specific permissions
 */
export async function createTestDirectoryStructure(baseDir: string) {
  const structure = {
    'src': {
      'services': ['user.ts', 'auth.ts', 'payment.ts'],
      'models': ['user.ts', 'order.ts'],
      'controllers': ['userController.ts']
    },
    'tests': ['user.test.ts', 'auth.test.ts'],
    'docs': ['README.md', 'API.md'],
    '.claude': {
      'agents': ['test-agent.md']
    }
  };
  
  async function createStructure(dir: string, structure: any) {
    await mkdir(dir, { recursive: true });
    
    for (const [key, value] of Object.entries(structure)) {
      const path = join(dir, key);
      
      if (Array.isArray(value)) {
        // Create files
        await mkdir(dirname(path), { recursive: true });
        for (const file of value) {
          const filePath = join(dir, key, file);
          await Bun.write(filePath, `// Test file: ${file}`);
        }
      } else if (typeof value === 'object') {
        // Create subdirectory
        await createStructure(path, value);
      }
    }
  }
  
  await createStructure(baseDir, structure);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a test file with specific content
 */
export async function createTestFile(
  path: string,
  content: string,
  options: { mode?: number } = {}
): Promise<void> {
  await Bun.write(path, content);
  
  if (options.mode) {
    const { chmod } = await import('fs/promises');
    await chmod(path, options.mode);
  }
}

/**
 * Simulate file system errors
 */
export class FileSystemErrorSimulator {
  private errors: Map<string, Error> = new Map();
  
  /**
   * Set an error to be thrown for a specific path
   */
  setError(path: string, error: Error) {
    this.errors.set(path, error);
  }
  
  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors.clear();
  }
  
  /**
   * Check if an error should be thrown
   */
  checkError(path: string) {
    const error = this.errors.get(path);
    if (error) {
      throw error;
    }
  }
}

/**
 * Mock clock for testing time-dependent operations
 */
export class MockClock {
  private currentTime: number;
  private timers: Map<number, { callback: Function; time: number }> = new Map();
  private nextTimerId = 1;
  
  constructor(initialTime: Date = new Date()) {
    this.currentTime = initialTime.getTime();
  }
  
  /**
   * Get current time
   */
  now(): number {
    return this.currentTime;
  }
  
  /**
   * Advance time by milliseconds
   */
  tick(ms: number) {
    const targetTime = this.currentTime + ms;
    
    // Execute any timers that should fire
    for (const [id, timer] of this.timers.entries()) {
      if (timer.time <= targetTime) {
        timer.callback();
        this.timers.delete(id);
      }
    }
    
    this.currentTime = targetTime;
  }
  
  /**
   * Set a timeout
   */
  setTimeout(callback: Function, ms: number): number {
    const id = this.nextTimerId++;
    this.timers.set(id, {
      callback,
      time: this.currentTime + ms
    });
    return id;
  }
  
  /**
   * Clear a timeout
   */
  clearTimeout(id: number) {
    this.timers.delete(id);
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  
  /**
   * Mark a point in time
   */
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      throw new Error(`Start mark '${startMark}' not found`);
    }
    
    if (endMark && !this.marks.has(endMark)) {
      throw new Error(`End mark '${endMark}' not found`);
    }
    
    const duration = (end || performance.now()) - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    return duration;
  }
  
  /**
   * Get statistics for a measure
   */
  getStats(name: string) {
    const measures = this.measures.get(name) || [];
    
    if (measures.length === 0) {
      return null;
    }
    
    const sorted = [...measures].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: sorted.length
    };
  }
  
  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

// Import dirname for file operations
import { dirname } from 'path';