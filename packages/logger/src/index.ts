import fs from 'fs';
import path from 'path';
import { createStream, type RotatingFileStream } from 'rotating-file-stream';
import chalk from 'chalk';

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Console colors for different log levels
const LOG_COLORS: Record<LogLevel, typeof chalk> = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  fatal: chalk.bgRed.white,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  stack?: string;
  source?: string;
  sessionId?: string;
  userId?: string;
  duration?: number;
  memory?: number;
}

export interface LoggerConfig {
  logDir?: string;
  logLevel?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  maxFileSize?: `${number}${'B' | 'K' | 'M' | 'G'}`;
  maxFiles?: number;
  compress?: boolean;
}

class Logger {
  private logDir: string;
  private logLevel: LogLevel;
  private isDev: boolean;
  private isServer: boolean;
  private enableConsole: boolean;
  private enableFile: boolean;
  private logStream: RotatingFileStream | null = null;
  private errorStream: RotatingFileStream | null = null;
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
    this.isDev = process.env['NODE_ENV'] === 'development';
    this.isServer = true; // This is a backend-only package
    this.logLevel = config.logLevel || (this.isDev ? 'debug' : 'info');
    this.enableConsole = config.enableConsole !== false;
    this.enableFile = this.isServer && (config.enableFile !== false);
    
    // Determine log directory
    if (config.logDir) {
      this.logDir = config.logDir;
    } else {
      // Default to project root logs directory
      const projectRoot = process.cwd();
      this.logDir = path.join(projectRoot, 'logs');
    }
    
    // Only create log directory and streams on server side
    if (this.isServer && this.enableFile) {
      this.ensureLogDirectory();
      this.createLogStreams();
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private createLogStreams(): void {
    const env = this.isDev ? 'dev' : 'prod';
    
    // Filename generator for timestamped rotation
    const generateFilename = (type: 'app' | 'error') => (time: number | Date, index?: number): string => {
      let dateObj: Date;
      if (typeof time === 'number') {
        dateObj = new Date(time);
      } else {
        dateObj = time;
      }
      
      // If time is invalid, return current log filename
      if (!dateObj || isNaN(dateObj.getTime())) {
        return `${env}-${type}.log`;
      }
      
      // Format: YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Include index if multiple rotations happen on same day
      const indexStr = (index && index > 1) ? `-${index}` : '';
      
      return `${env}-${type}-${dateStr}${indexStr}.log`;
    };
    
    // Create rotating stream for general logs
    this.logStream = createStream(generateFilename('app'), {
      path: this.logDir,
      maxSize: this.config.maxFileSize || '10M', // rotate every 10MB
      interval: '1d', // rotate daily
      compress: this.config.compress !== false ? 'gzip' : false,
      maxFiles: this.config.maxFiles || 30, // keep max 30 files (about 1 month)
    });

    // Create rotating stream for error logs
    this.errorStream = createStream(generateFilename('error'), {
      path: this.logDir,
      maxSize: this.config.maxFileSize || '10M',
      interval: '1d',
      compress: this.config.compress !== false ? 'gzip' : false,
      maxFiles: this.config.maxFiles || 30,
    });
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.logLevel];
  }

  private formatLogEntry(entry: LogEntry): string {
    let logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    
    if (entry.source) {
      logLine += ` [${entry.source}]`;
    }
    
    logLine += ` ${entry.message}`;
    
    if (entry.data) {
      logLine += ` ${JSON.stringify(entry.data)}`;
    }
    
    if (entry.stack) {
      logLine += `\n${entry.stack}`;
    }
    
    if (entry.duration !== undefined) {
      logLine += ` (duration: ${entry.duration}ms)`;
    }
    
    if (entry.memory !== undefined) {
      const memoryMB = (entry.memory / 1024 / 1024).toFixed(2);
      logLine += ` (memory: ${memoryMB}MB)`;
    }
    
    return logLine;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.isServer || !this.enableFile || !this.logStream) {
      return;
    }

    const logLine = this.formatLogEntry(entry) + '\n';
    
    // Write to appropriate stream
    if (entry.level === 'error' || entry.level === 'fatal') {
      this.errorStream?.write(logLine);
    }
    this.logStream.write(logLine);
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.enableConsole) {
      return;
    }

    const color = LOG_COLORS[entry.level];
    const prefix = color(`[${entry.level.toUpperCase()}]`);
    
    let message = `${prefix} ${entry.message}`;
    
    if (entry.source) {
      message = `${chalk.gray(`[${entry.source}]`)} ${message}`;
    }
    
    // Console output
    if (entry.level === 'error' || entry.level === 'fatal') {
      console.error(message);
      if (entry.stack) {
        console.error(chalk.gray(entry.stack));
      }
    } else if (entry.level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
    
    // Log data if present
    if (entry.data) {
      console.log(chalk.gray('Data:'), entry.data);
    }
    
    // Log performance metrics if present
    if (entry.duration !== undefined || entry.memory !== undefined) {
      const metrics = [];
      if (entry.duration !== undefined) {
        metrics.push(`duration: ${entry.duration}ms`);
      }
      if (entry.memory !== undefined) {
        const memoryMB = (entry.memory / 1024 / 1024).toFixed(2);
        metrics.push(`memory: ${memoryMB}MB`);
      }
      console.log(chalk.gray(`Performance: ${metrics.join(', ')}`));
    }
  }

  private log(level: LogLevel, message: string, data?: unknown, meta?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      ...meta,
    };

    // Handle Error objects
    if (data instanceof Error) {
      entry.stack = data.stack;
      entry.data = {
        name: data.name,
        message: data.message,
      };
    }

    // Write to console
    this.writeToConsole(entry);
    
    // Write to file (server-side only)
    this.writeToFile(entry);
  }

  // Public logging methods
  public debug(message: string, data?: unknown, meta?: Partial<LogEntry>): void {
    this.log('debug', message, data, meta);
  }

  public info(message: string, data?: unknown, meta?: Partial<LogEntry>): void {
    this.log('info', message, data, meta);
  }

  public warn(message: string, data?: unknown, meta?: Partial<LogEntry>): void {
    this.log('warn', message, data, meta);
  }

  public error(message: string, error?: unknown, meta?: Partial<LogEntry>): void {
    this.log('error', message, error, meta);
  }

  public fatal(message: string, error?: unknown, meta?: Partial<LogEntry>): void {
    this.log('fatal', message, error, meta);
  }

  // Performance logging
  public logPerformance(
    message: string,
    startTime: number,
    data?: unknown
  ): void {
    const duration = Date.now() - startTime;
    const memory = process.memoryUsage().heapUsed;
    
    this.info(message, data, { duration, memory });
  }

  // Create a child logger with a specific source
  public child(source: string): LoggerInstance {
    return {
      debug: (message: string, data?: unknown) => 
        this.debug(message, data, { source }),
      info: (message: string, data?: unknown) => 
        this.info(message, data, { source }),
      warn: (message: string, data?: unknown) => 
        this.warn(message, data, { source }),
      error: (message: string, error?: unknown) => 
        this.error(message, error, { source }),
      fatal: (message: string, error?: unknown) => 
        this.fatal(message, error, { source }),
      logPerformance: (message: string, startTime: number, data?: unknown) => {
        const performanceData = data && typeof data === 'object' ? { ...data, source } : { source };
        return this.logPerformance(message, startTime, performanceData);
      },
    };
  }

  // Flush and close streams
  public async close(): Promise<void> {
    if (this.logStream) {
      await new Promise<void>((resolve) => {
        this.logStream!.end(() => resolve());
      });
    }
    if (this.errorStream) {
      await new Promise<void>((resolve) => {
        this.errorStream!.end(() => resolve());
      });
    }
  }

  // Get log directory path
  public getLogDir(): string {
    return this.logDir;
  }

  // Set log level dynamically
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Logger instance interface for child loggers
export interface LoggerInstance {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: unknown): void;
  fatal(message: string, error?: unknown): void;
  logPerformance(message: string, startTime: number, data?: unknown): void;
}

// Create default logger instance
const defaultConfig: LoggerConfig = {
  logLevel: (process.env['LOG_LEVEL'] as LogLevel) || 'info',
  enableConsole: process.env['LOG_CONSOLE'] !== 'false',
  enableFile: process.env['LOG_FILE'] !== 'false',
};

export const logger = new Logger(defaultConfig);

// Export Logger class for custom instances
export { Logger };

// Convenience exports
export default logger;