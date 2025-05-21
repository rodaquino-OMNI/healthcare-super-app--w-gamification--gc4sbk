import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { cpus } from 'os';

/**
 * Configuration options for the PrismaService
 */
export interface PrismaServiceOptions {
  /**
   * Maximum number of connections in the pool
   * Default: (number of CPUs * 2) + 1
   */
  connectionLimit?: number;
  
  /**
   * Connection pool timeout in seconds
   * Default: 15
   */
  poolTimeout?: number;
  
  /**
   * Enable query logging
   * Default: false in production, true otherwise
   */
  enableLogging?: boolean;
  
  /**
   * Log queries that take longer than this threshold (in ms)
   * Default: 500
   */
  slowQueryThreshold?: number;
  
  /**
   * Maximum number of retry attempts for transient errors
   * Default: 3
   */
  maxRetries?: number;
  
  /**
   * Initial backoff time in ms for retry attempts
   * Default: 100
   */
  initialBackoff?: number;
}

/**
 * Enhanced PrismaService that extends PrismaClient with journey-specific optimizations,
 * connection pooling, lifecycle hooks, and error handling.
 * 
 * Acts as the primary database connector for all gamification engine modules,
 * providing optimized query execution and resilient database access patterns.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly options: PrismaServiceOptions;

  constructor(private readonly configService: ConfigService) {
    // Calculate default connection limit based on CPU cores
    const defaultConnectionLimit = (cpus().length * 2) + 1;
    
    // Get environment-specific configuration
    const isProduction = configService.get('NODE_ENV') === 'production';
    
    // Set default options
    const defaultOptions: PrismaServiceOptions = {
      connectionLimit: configService.get('DATABASE_CONNECTION_LIMIT') || defaultConnectionLimit,
      poolTimeout: configService.get('DATABASE_POOL_TIMEOUT') || 15,
      enableLogging: configService.get('DATABASE_LOGGING_ENABLED') ?? !isProduction,
      slowQueryThreshold: configService.get('DATABASE_SLOW_QUERY_THRESHOLD') || 500,
      maxRetries: configService.get('DATABASE_MAX_RETRIES') || 3,
      initialBackoff: configService.get('DATABASE_INITIAL_BACKOFF') || 100
    };
    
    this.options = defaultOptions;
    
    // Initialize PrismaClient with connection pooling configuration
    super({
      datasources: {
        db: {
          url: this.getDatabaseUrl()
        }
      },
      log: this.getLogLevels()
    });
    
    // Add query logging middleware if enabled
    if (this.options.enableLogging) {
      this.setupQueryLoggingMiddleware();
    }
  }

  /**
   * Constructs the database URL with connection pooling parameters
   */
  private getDatabaseUrl(): string {
    const baseUrl = this.configService.get<string>('DATABASE_URL');
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    
    // Add connection pooling parameters if not already present
    const hasParams = baseUrl.includes('?');
    const separator = hasParams ? '&' : '?';
    
    return `${baseUrl}${separator}connection_limit=${this.options.connectionLimit}&pool_timeout=${this.options.poolTimeout}`;
  }

  /**
   * Determines log levels based on configuration
   */
  private getLogLevels() {
    if (!this.options.enableLogging) {
      return [];
    }
    
    return [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
      { level: 'info', emit: 'stdout' }
    ];
  }

  /**
   * Sets up middleware for query logging and performance monitoring
   */
  private setupQueryLoggingMiddleware() {
    this.$on('query', (e) => {
      const queryExecutionTime = e.duration;
      
      // Log slow queries with warning level
      if (queryExecutionTime > this.options.slowQueryThreshold) {
        this.logger.warn(
          `Slow query detected (${queryExecutionTime}ms): ${e.query}`,
          { params: e.params, duration: queryExecutionTime }
        );
      } else if (this.options.enableLogging) {
        // Log normal queries with debug level
        this.logger.debug(
          `Query executed (${queryExecutionTime}ms): ${e.query}`,
          { params: e.params, duration: queryExecutionTime }
        );
      }
    });
  }

  /**
   * Connects to the database when the module is initialized
   */
  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Disconnects from the database when the module is destroyed
   */
  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
      // Don't throw here to avoid preventing application shutdown
    }
  }

  /**
   * Executes a database operation with retry logic for transient errors
   * @param operation The database operation to execute
   * @param options Custom retry options
   * @returns The result of the database operation
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: { maxRetries?: number; initialBackoff?: number }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.options.maxRetries;
    const initialBackoff = options?.initialBackoff ?? this.options.initialBackoff;
    
    let lastError: Error;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on transient errors
        if (!this.isTransientError(error)) {
          this.logger.error(`Non-transient database error: ${error.message}`, error);
          throw error;
        }
        
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Calculate backoff with exponential strategy
          const backoff = initialBackoff * Math.pow(2, retryCount - 1);
          
          this.logger.warn(
            `Transient database error: ${error.message}. Retrying in ${backoff}ms (attempt ${retryCount}/${maxRetries})`,
            error
          );
          
          // Wait for backoff period before retrying
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    this.logger.error(
      `Failed database operation after ${maxRetries} retry attempts: ${lastError.message}`,
      lastError
    );
    
    throw lastError;
  }

  /**
   * Determines if an error is transient and can be retried
   * @param error The error to check
   * @returns True if the error is transient, false otherwise
   */
  private isTransientError(error: any): boolean {
    // Check for connection-related errors
    if (error.code === 'P1001' || error.code === 'P1002') {
      return true;
    }
    
    // Check for connection pool timeout errors
    if (error.message && error.message.includes('connection pool')) {
      return true;
    }
    
    // Check for specific database errors that are known to be transient
    const transientErrorCodes = [
      '40001', // Serialization failure
      '40P01', // Deadlock detected
      '57P01', // Database server closed the connection unexpectedly
      '57P02', // Database server connection terminated
      '57P03', // Database server connection lost
      'XX000'  // Internal error
    ];
    
    return transientErrorCodes.includes(error.code);
  }

  /**
   * Creates a transaction with retry logic for transient errors
   * @param fn The function to execute within the transaction
   * @returns The result of the transaction
   */
  async transactionWithRetry<T>(
    fn: (prisma: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(() => this.$transaction(fn));
  }
}