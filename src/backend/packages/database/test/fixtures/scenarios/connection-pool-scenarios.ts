/**
 * @file connection-pool-scenarios.ts
 * @description Test fixtures for database connection pooling scenarios, designed to test
 * the enhanced PrismaService's connection management capabilities. These fixtures validate
 * proper pool initialization, connection reuse, timeout handling, and resource cleanup
 * across high-concurrency operations.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../src/prisma.service';
import { ConnectionManager } from '../../../src/connection/connection-manager';
import { ConnectionPool } from '../../../src/connection/connection-pool';
import { ConnectionHealth, ConnectionStatus } from '../../../src/connection/connection-health';
import { ConnectionRetry, RetryOperationType } from '../../../src/connection/connection-retry';
import { DatabaseException } from '../../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../../src/errors/database-error.types';
import { JourneyType } from '../../../src/types/journey.types';
import { QueryPattern } from '../../../src/connection/connection-manager';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

/**
 * Interface for connection pool test scenario configuration
 */
export interface ConnectionPoolScenarioConfig {
  /** Minimum number of connections to keep in the pool */
  minConnections?: number;
  /** Maximum number of connections to keep in the pool */
  maxConnections?: number;
  /** Maximum number of idle connections to keep in the pool */
  maxIdleConnections?: number;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay between retries in milliseconds */
  baseDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Whether to use jitter to prevent retry storms */
  useJitter?: boolean;
  /** Journey type for journey-specific optimizations */
  journeyType?: JourneyType;
  /** Whether to enable query logging */
  enableLogging?: boolean;
  /** Whether to enable performance tracking */
  enablePerformanceTracking?: boolean;
  /** Whether to enable the circuit breaker pattern */
  enableCircuitBreaker?: boolean;
  /** Whether to enable query transformation */
  enableTransformation?: boolean;
  /** Whether to automatically apply database migrations on module init */
  autoApplyMigrations?: boolean;
}

/**
 * Interface for connection pool load test configuration
 */
export interface ConnectionPoolLoadTestConfig {
  /** Number of concurrent connections to request */
  concurrentConnections: number;
  /** Number of operations to perform per connection */
  operationsPerConnection: number;
  /** Delay between operations in milliseconds */
  operationDelayMs?: number;
  /** Whether to release connections between operations */
  releaseConnectionsBetweenOperations?: boolean;
  /** Whether to validate connections before operations */
  validateConnections?: boolean;
  /** Whether to simulate errors during operations */
  simulateErrors?: boolean;
  /** Error rate (0-1) if simulating errors */
  errorRate?: number;
  /** Whether to use transactions for operations */
  useTransactions?: boolean;
  /** Query pattern to use for connections */
  queryPattern?: QueryPattern;
  /** Journey type to use for connections */
  journeyType?: JourneyType;
}

/**
 * Interface for connection timeout test configuration
 */
export interface ConnectionTimeoutTestConfig {
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Number of concurrent connection requests */
  concurrentRequests: number;
  /** Delay to simulate in connection acquisition (ms) */
  acquisitionDelayMs: number;
  /** Whether to use retry logic for timeouts */
  useRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to use circuit breaker pattern */
  useCircuitBreaker?: boolean;
  /** Whether to prioritize requests */
  usePriorities?: boolean;
}

/**
 * Interface for connection cleanup test configuration
 */
export interface ConnectionCleanupTestConfig {
  /** Maximum idle time before connection cleanup (ms) */
  maxIdleTimeMs: number;
  /** Maximum connection lifetime (ms) */
  maxLifetimeMs?: number;
  /** Number of connections to create */
  connectionCount: number;
  /** Percentage of connections to mark as idle (0-1) */
  idleConnectionPercentage: number;
  /** Whether to simulate unhealthy connections */
  simulateUnhealthyConnections?: boolean;
  /** Percentage of connections to mark as unhealthy (0-1) */
  unhealthyConnectionPercentage?: number;
  /** Whether to force cleanup of in-use connections */
  forceCleanupInUseConnections?: boolean;
}

/**
 * Interface for connection retry test configuration
 */
export interface ConnectionRetryTestConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Whether to use jitter to prevent retry storms */
  useJitter?: boolean;
  /** Types of errors to simulate */
  errorTypes: DatabaseErrorType[];
  /** Whether to use circuit breaker pattern */
  useCircuitBreaker?: boolean;
  /** Number of failures before circuit breaker opens */
  circuitBreakerFailureThreshold?: number;
  /** Reset timeout for circuit breaker in milliseconds */
  circuitBreakerResetTimeoutMs?: number;
}

/**
 * Interface for connection health test configuration
 */
export interface ConnectionHealthTestConfig {
  /** Interval in milliseconds for health check probes */
  healthCheckInterval: number;
  /** Threshold in milliseconds for slow query detection */
  slowQueryThreshold: number;
  /** Number of consecutive failures before marking connection as unhealthy */
  failureThreshold: number;
  /** Whether to enable automatic recovery for unhealthy connections */
  enableAutoRecovery?: boolean;
  /** Types of health issues to simulate */
  healthIssueTypes: ('slow' | 'error' | 'timeout')[];
  /** Frequency of health issues (0-1) */
  healthIssueFrequency: number;
}

/**
 * Class containing test scenarios for connection pool initialization
 */
export class ConnectionPoolInitializationScenarios {
  /**
   * Creates a basic PrismaService with default configuration
   * @returns A configured PrismaService instance
   */
  static createBasicPrismaService(): PrismaService {
    return new PrismaService();
  }

  /**
   * Creates a PrismaService with custom configuration
   * @param config Custom configuration for the PrismaService
   * @returns A configured PrismaService instance
   */
  static createCustomPrismaService(config: ConnectionPoolScenarioConfig): PrismaService {
    return new PrismaService({
      journeyType: config.journeyType,
      connectionPool: {
        minConnections: config.minConnections,
        maxConnections: config.maxConnections,
        maxIdleConnections: config.maxIdleConnections,
        connectionTimeout: config.connectionTimeout,
      },
      retry: {
        maxRetries: config.maxRetries,
        baseDelay: config.baseDelay,
        maxDelay: config.maxDelay,
        useJitter: config.useJitter,
      },
      enableLogging: config.enableLogging,
      enablePerformanceTracking: config.enablePerformanceTracking,
      enableCircuitBreaker: config.enableCircuitBreaker,
      enableTransformation: config.enableTransformation,
      autoApplyMigrations: config.autoApplyMigrations,
    });
  }

  /**
   * Creates a PrismaService optimized for the Health journey
   * @returns A PrismaService configured for the Health journey
   */
  static createHealthJourneyPrismaService(): PrismaService {
    return new PrismaService({
      journeyType: JourneyType.HEALTH,
      connectionPool: {
        minConnections: 5,
        maxConnections: 20,
        maxIdleConnections: 10,
        connectionTimeout: 5000,
      },
      retry: {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 5000,
        useJitter: true,
      },
      enableLogging: true,
      enablePerformanceTracking: true,
      enableCircuitBreaker: true,
      enableTransformation: true,
    });
  }

  /**
   * Creates a PrismaService optimized for the Care journey
   * @returns A PrismaService configured for the Care journey
   */
  static createCareJourneyPrismaService(): PrismaService {
    return new PrismaService({
      journeyType: JourneyType.CARE,
      connectionPool: {
        minConnections: 3,
        maxConnections: 15,
        maxIdleConnections: 7,
        connectionTimeout: 3000, // Lower timeout for better responsiveness
      },
      retry: {
        maxRetries: 2, // Fewer retries for faster failure detection
        baseDelay: 50,
        maxDelay: 2000,
        useJitter: true,
      },
      enableLogging: true,
      enablePerformanceTracking: true,
      enableCircuitBreaker: true,
      enableTransformation: true,
    });
  }

  /**
   * Creates a PrismaService optimized for the Plan journey
   * @returns A PrismaService configured for the Plan journey
   */
  static createPlanJourneyPrismaService(): PrismaService {
    return new PrismaService({
      journeyType: JourneyType.PLAN,
      connectionPool: {
        minConnections: 4,
        maxConnections: 18,
        maxIdleConnections: 8,
        connectionTimeout: 7000, // Higher timeout for complex transactions
      },
      retry: {
        maxRetries: 5, // More retries for critical financial operations
        baseDelay: 200,
        maxDelay: 10000,
        useJitter: true,
      },
      enableLogging: true,
      enablePerformanceTracking: true,
      enableCircuitBreaker: true,
      enableTransformation: true,
    });
  }

  /**
   * Creates a PrismaService with minimal configuration for testing
   * @returns A minimally configured PrismaService instance
   */
  static createMinimalPrismaService(): PrismaService {
    return new PrismaService({
      connectionPool: {
        minConnections: 1,
        maxConnections: 3,
        maxIdleConnections: 1,
        connectionTimeout: 1000,
      },
      retry: {
        maxRetries: 1,
        baseDelay: 50,
        maxDelay: 1000,
        useJitter: false,
      },
      enableLogging: false,
      enablePerformanceTracking: false,
      enableCircuitBreaker: false,
      enableTransformation: false,
      autoApplyMigrations: false,
    });
  }

  /**
   * Creates a PrismaService with high-availability configuration
   * @returns A PrismaService configured for high availability
   */
  static createHighAvailabilityPrismaService(): PrismaService {
    return new PrismaService({
      connectionPool: {
        minConnections: 10,
        maxConnections: 50,
        maxIdleConnections: 20,
        connectionTimeout: 10000,
      },
      retry: {
        maxRetries: 10,
        baseDelay: 100,
        maxDelay: 30000,
        useJitter: true,
      },
      enableLogging: true,
      enablePerformanceTracking: true,
      enableCircuitBreaker: true,
      enableTransformation: true,
    });
  }
}

/**
 * Class containing test scenarios for connection acquisition and reuse
 */
export class ConnectionAcquisitionScenarios {
  /**
   * Simulates acquiring and releasing a single connection
   * @param prismaService The PrismaService to use
   * @returns Promise that resolves when the operation is complete
   */
  static async singleConnectionAcquisition(prismaService: PrismaService): Promise<void> {
    // Get a connection from the pool
    const connection = await prismaService.getConnection();
    
    // Perform a simple operation
    await this.simulateOperation(connection);
    
    // Release the connection back to the pool
    prismaService.releaseConnection(connection);
  }

  /**
   * Simulates acquiring and releasing multiple connections sequentially
   * @param prismaService The PrismaService to use
   * @param count Number of connections to acquire sequentially
   * @returns Promise that resolves when all operations are complete
   */
  static async sequentialConnectionAcquisition(prismaService: PrismaService, count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      // Get a connection from the pool
      const connection = await prismaService.getConnection();
      
      // Perform a simple operation
      await this.simulateOperation(connection);
      
      // Release the connection back to the pool
      prismaService.releaseConnection(connection);
    }
  }

  /**
   * Simulates acquiring and releasing multiple connections concurrently
   * @param prismaService The PrismaService to use
   * @param count Number of connections to acquire concurrently
   * @returns Promise that resolves when all operations are complete
   */
  static async concurrentConnectionAcquisition(prismaService: PrismaService, count: number): Promise<void> {
    const operations = Array(count).fill(0).map(async () => {
      // Get a connection from the pool
      const connection = await prismaService.getConnection();
      
      // Perform a simple operation
      await this.simulateOperation(connection);
      
      // Release the connection back to the pool
      prismaService.releaseConnection(connection);
    });
    
    await Promise.all(operations);
  }

  /**
   * Simulates acquiring connections beyond the pool maximum
   * @param prismaService The PrismaService to use
   * @param maxConnections Maximum number of connections in the pool
   * @param requestCount Number of connection requests to make
   * @returns Promise that resolves when all operations are complete or rejected
   */
  static async overflowConnectionAcquisition(
    prismaService: PrismaService,
    maxConnections: number,
    requestCount: number
  ): Promise<{ successful: number; timedOut: number; errors: Error[] }> {
    const connections: any[] = [];
    const errors: Error[] = [];
    let timedOut = 0;
    
    // Try to acquire more connections than the pool maximum
    for (let i = 0; i < requestCount; i++) {
      try {
        const connection = await prismaService.getConnection();
        connections.push(connection);
        
        // Perform a simple operation
        await this.simulateOperation(connection);
      } catch (error) {
        errors.push(error);
        
        // Check if it's a timeout error
        if (error instanceof DatabaseException && 
            error.type === DatabaseErrorType.TIMEOUT) {
          timedOut++;
        }
      }
    }
    
    // Release all acquired connections
    for (const connection of connections) {
      prismaService.releaseConnection(connection);
    }
    
    return {
      successful: connections.length,
      timedOut,
      errors,
    };
  }

  /**
   * Simulates connection reuse by acquiring and releasing connections in a pattern
   * that encourages reuse
   * @param prismaService The PrismaService to use
   * @param iterations Number of acquisition iterations
   * @param connectionsPerIteration Number of connections to acquire in each iteration
   * @returns Promise that resolves when all operations are complete
   */
  static async connectionReusePattern(
    prismaService: PrismaService,
    iterations: number,
    connectionsPerIteration: number
  ): Promise<{ totalAcquisitions: number; uniqueConnections: number }> {
    const connectionIds = new Set<string>();
    let totalAcquisitions = 0;
    
    for (let i = 0; i < iterations; i++) {
      const connections: any[] = [];
      
      // Acquire connections
      for (let j = 0; j < connectionsPerIteration; j++) {
        const connection = await prismaService.getConnection();
        connections.push(connection);
        totalAcquisitions++;
        
        // Track unique connections (using a property that would be set in a real implementation)
        // In a real test, we would use a property of the connection object
        const connectionId = connection._id || `conn_${Math.random()}`;
        connectionIds.add(connectionId);
      }
      
      // Perform operations
      await Promise.all(connections.map(conn => this.simulateOperation(conn)));
      
      // Release connections
      for (const connection of connections) {
        prismaService.releaseConnection(connection);
      }
      
      // Small delay to allow pool management to occur
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return {
      totalAcquisitions,
      uniqueConnections: connectionIds.size,
    };
  }

  /**
   * Simulates a database operation
   * @param connection The database connection
   * @param durationMs Optional duration to simulate operation time
   * @returns Promise that resolves when the operation is complete
   */
  private static async simulateOperation(connection: any, durationMs: number = 50): Promise<void> {
    // Simulate a database operation with the given duration
    await new Promise(resolve => setTimeout(resolve, durationMs));
  }
}

/**
 * Class containing test scenarios for connection pool performance under load
 */
export class ConnectionPoolLoadScenarios {
  /**
   * Simulates a high-load scenario with many concurrent connections and operations
   * @param prismaService The PrismaService to use
   * @param config Configuration for the load test
   * @returns Promise that resolves to performance metrics
   */
  static async highConcurrencyLoadTest(
    prismaService: PrismaService,
    config: ConnectionPoolLoadTestConfig
  ): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageOperationTimeMs: number;
    maxOperationTimeMs: number;
    minOperationTimeMs: number;
    totalTimeMs: number;
    operationsPerSecond: number;
    errors: Error[];
  }> {
    const startTime = Date.now();
    const operationTimes: number[] = [];
    const errors: Error[] = [];
    let successfulOperations = 0;
    let failedOperations = 0;
    
    // Create concurrent workers
    const workers = Array(config.concurrentConnections).fill(0).map(async (_, workerIndex) => {
      try {
        // Get a connection for this worker
        const connection = await prismaService.getConnection({
          journeyType: config.journeyType,
          queryPattern: config.queryPattern,
          validate: config.validateConnections,
        });
        
        // Perform operations
        for (let i = 0; i < config.operationsPerConnection; i++) {
          try {
            const operationStartTime = Date.now();
            
            // Perform operation, optionally in a transaction
            if (config.useTransactions) {
              await this.simulateTransactionalOperation(
                connection,
                config.operationDelayMs || 50,
                config.simulateErrors && Math.random() < (config.errorRate || 0.1)
              );
            } else {
              await this.simulateOperation(
                connection,
                config.operationDelayMs || 50,
                config.simulateErrors && Math.random() < (config.errorRate || 0.1)
              );
            }
            
            const operationTime = Date.now() - operationStartTime;
            operationTimes.push(operationTime);
            successfulOperations++;
            
            // Release and reacquire connection between operations if configured
            if (config.releaseConnectionsBetweenOperations && i < config.operationsPerConnection - 1) {
              prismaService.releaseConnection(connection);
              await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
              await prismaService.getConnection({
                journeyType: config.journeyType,
                queryPattern: config.queryPattern,
                validate: config.validateConnections,
              });
            }
          } catch (error) {
            failedOperations++;
            errors.push(error);
          }
        }
        
        // Release the connection
        prismaService.releaseConnection(connection);
      } catch (error) {
        // Connection acquisition failed
        failedOperations += config.operationsPerConnection;
        errors.push(error);
      }
    });
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    const totalTimeMs = Date.now() - startTime;
    const totalOperations = successfulOperations + failedOperations;
    
    // Calculate statistics
    const averageOperationTimeMs = operationTimes.length > 0
      ? operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length
      : 0;
    
    const maxOperationTimeMs = operationTimes.length > 0
      ? Math.max(...operationTimes)
      : 0;
    
    const minOperationTimeMs = operationTimes.length > 0
      ? Math.min(...operationTimes)
      : 0;
    
    const operationsPerSecond = totalTimeMs > 0
      ? (successfulOperations / totalTimeMs) * 1000
      : 0;
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTimeMs,
      maxOperationTimeMs,
      minOperationTimeMs,
      totalTimeMs,
      operationsPerSecond,
      errors,
    };
  }

  /**
   * Simulates a sustained load over time to test connection pool stability
   * @param prismaService The PrismaService to use
   * @param config Configuration for the load test
   * @param durationMs Total duration of the test in milliseconds
   * @param rampUpMs Time to ramp up to full load in milliseconds
   * @param rampDownMs Time to ramp down from full load in milliseconds
   * @returns Promise that resolves to performance metrics over time
   */
  static async sustainedLoadTest(
    prismaService: PrismaService,
    config: ConnectionPoolLoadTestConfig,
    durationMs: number,
    rampUpMs: number = 0,
    rampDownMs: number = 0
  ): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageOperationTimeMs: number;
    operationsPerSecond: number;
    timeSeriesData: Array<{
      timestamp: number;
      activeConnections: number;
      operationsPerSecond: number;
      averageResponseTime: number;
      errorRate: number;
    }>;
    errors: Error[];
  }> {
    const startTime = Date.now();
    const endTime = startTime + durationMs;
    const operationTimes: number[] = [];
    const errors: Error[] = [];
    const timeSeriesData: Array<{
      timestamp: number;
      activeConnections: number;
      operationsPerSecond: number;
      averageResponseTime: number;
      errorRate: number;
    }> = [];
    
    let successfulOperations = 0;
    let failedOperations = 0;
    let activeConnections = 0;
    let completedOperationsInInterval = 0;
    let failedOperationsInInterval = 0;
    let operationTimesInInterval: number[] = [];
    
    // Start metrics collection interval
    const metricsInterval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      const intervalDurationMs = 1000; // 1 second intervals
      
      // Calculate metrics for this interval
      const operationsPerSecond = completedOperationsInInterval / (intervalDurationMs / 1000);
      const averageResponseTime = operationTimesInInterval.length > 0
        ? operationTimesInInterval.reduce((sum, time) => sum + time, 0) / operationTimesInInterval.length
        : 0;
      const errorRate = (completedOperationsInInterval + failedOperationsInInterval) > 0
        ? failedOperationsInInterval / (completedOperationsInInterval + failedOperationsInInterval)
        : 0;
      
      // Record time series data
      timeSeriesData.push({
        timestamp: elapsedMs,
        activeConnections,
        operationsPerSecond,
        averageResponseTime,
        errorRate,
      });
      
      // Reset interval counters
      completedOperationsInInterval = 0;
      failedOperationsInInterval = 0;
      operationTimesInInterval = [];
    }, 1000);
    
    // Function to determine how many connections should be active at a given time
    const getTargetConnections = (elapsedMs: number): number => {
      const maxConnections = config.concurrentConnections;
      
      if (elapsedMs < rampUpMs) {
        // Ramp up phase
        return Math.floor((elapsedMs / rampUpMs) * maxConnections);
      } else if (elapsedMs > durationMs - rampDownMs) {
        // Ramp down phase
        const rampDownElapsed = elapsedMs - (durationMs - rampDownMs);
        return Math.floor(((rampDownMs - rampDownElapsed) / rampDownMs) * maxConnections);
      } else {
        // Sustained load phase
        return maxConnections;
      }
    };
    
    // Connection manager loop
    const connectionManagerPromise = (async () => {
      while (Date.now() < endTime) {
        const elapsedMs = Date.now() - startTime;
        const targetConnections = getTargetConnections(elapsedMs);
        
        // Adjust active connections to match target
        if (activeConnections < targetConnections) {
          // Need to start more workers
          const newWorkersCount = targetConnections - activeConnections;
          
          for (let i = 0; i < newWorkersCount; i++) {
            activeConnections++;
            this.startWorker(
              prismaService,
              config,
              endTime,
              (operationTime) => {
                operationTimes.push(operationTime);
                operationTimesInInterval.push(operationTime);
                successfulOperations++;
                completedOperationsInInterval++;
              },
              (error) => {
                errors.push(error);
                failedOperations++;
                failedOperationsInInterval++;
              },
              () => {
                activeConnections--;
              }
            );
          }
        }
        
        // Small delay before next adjustment
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    })();
    
    // Wait for test duration to complete
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    // Stop metrics collection
    clearInterval(metricsInterval);
    
    // Wait a bit longer for any in-progress operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for connection manager to finish
    await connectionManagerPromise;
    
    const totalTimeMs = Date.now() - startTime;
    const totalOperations = successfulOperations + failedOperations;
    
    // Calculate statistics
    const averageOperationTimeMs = operationTimes.length > 0
      ? operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length
      : 0;
    
    const operationsPerSecond = totalTimeMs > 0
      ? (successfulOperations / totalTimeMs) * 1000
      : 0;
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTimeMs,
      operationsPerSecond,
      timeSeriesData,
      errors,
    };
  }

  /**
   * Starts a worker that performs operations until the end time
   */
  private static async startWorker(
    prismaService: PrismaService,
    config: ConnectionPoolLoadTestConfig,
    endTime: number,
    onSuccess: (operationTime: number) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    // Start worker in background
    (async () => {
      try {
        // Get a connection for this worker
        const connection = await prismaService.getConnection({
          journeyType: config.journeyType,
          queryPattern: config.queryPattern,
          validate: config.validateConnections,
        });
        
        try {
          // Perform operations until end time
          while (Date.now() < endTime) {
            try {
              const operationStartTime = Date.now();
              
              // Perform operation, optionally in a transaction
              if (config.useTransactions) {
                await this.simulateTransactionalOperation(
                  connection,
                  config.operationDelayMs || 50,
                  config.simulateErrors && Math.random() < (config.errorRate || 0.1)
                );
              } else {
                await this.simulateOperation(
                  connection,
                  config.operationDelayMs || 50,
                  config.simulateErrors && Math.random() < (config.errorRate || 0.1)
                );
              }
              
              const operationTime = Date.now() - operationStartTime;
              onSuccess(operationTime);
              
              // Release and reacquire connection between operations if configured
              if (config.releaseConnectionsBetweenOperations) {
                prismaService.releaseConnection(connection);
                await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
                await prismaService.getConnection({
                  journeyType: config.journeyType,
                  queryPattern: config.queryPattern,
                  validate: config.validateConnections,
                });
              }
            } catch (error) {
              onError(error);
            }
          }
        } finally {
          // Release the connection
          prismaService.releaseConnection(connection);
        }
      } catch (error) {
        // Connection acquisition failed
        onError(error);
      } finally {
        onComplete();
      }
    })();
  }

  /**
   * Simulates a database operation
   * @param connection The database connection
   * @param durationMs Duration to simulate operation time
   * @param shouldFail Whether the operation should fail
   * @returns Promise that resolves when the operation is complete
   */
  private static async simulateOperation(
    connection: any,
    durationMs: number = 50,
    shouldFail: boolean = false
  ): Promise<void> {
    // Simulate a database operation with the given duration
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new DatabaseException(
            'Simulated database operation failure',
            DatabaseErrorType.QUERY
          ));
        } else {
          resolve(undefined);
        }
      }, durationMs);
    });
  }

  /**
   * Simulates a transactional database operation
   * @param connection The database connection
   * @param durationMs Duration to simulate operation time
   * @param shouldFail Whether the operation should fail
   * @returns Promise that resolves when the operation is complete
   */
  private static async simulateTransactionalOperation(
    connection: any,
    durationMs: number = 50,
    shouldFail: boolean = false
  ): Promise<void> {
    // Simulate beginning a transaction
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
      // Simulate the main operation
      await this.simulateOperation(connection, durationMs, shouldFail);
      
      // Simulate committing the transaction
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      // Simulate rolling back the transaction
      await new Promise(resolve => setTimeout(resolve, 10));
      throw error;
    }
  }
}

/**
 * Class containing test scenarios for connection timeout handling
 */
export class ConnectionTimeoutScenarios {
  /**
   * Simulates connection acquisition timeouts
   * @param prismaService The PrismaService to use
   * @param config Configuration for the timeout test
   * @returns Promise that resolves to timeout test results
   */
  static async connectionAcquisitionTimeouts(
    prismaService: PrismaService,
    config: ConnectionTimeoutTestConfig
  ): Promise<{
    successfulAcquisitions: number;
    timedOutAcquisitions: number;
    otherErrors: number;
    averageAcquisitionTimeMs: number;
    errors: Error[];
  }> {
    const acquisitionTimes: number[] = [];
    const errors: Error[] = [];
    let successfulAcquisitions = 0;
    let timedOutAcquisitions = 0;
    let otherErrors = 0;
    
    // Create a mock delay function that simulates slow connection acquisition
    const mockDelay = async () => {
      await new Promise(resolve => setTimeout(resolve, config.acquisitionDelayMs));
    };
    
    // Patch the connection manager to introduce delays
    const originalGetConnection = prismaService['connectionManager'].getConnection;
    prismaService['connectionManager'].getConnection = async (...args: any[]) => {
      await mockDelay();
      return originalGetConnection.apply(prismaService['connectionManager'], args);
    };
    
    try {
      // Create concurrent connection requests
      const requests = Array(config.concurrentRequests).fill(0).map(async (_, index) => {
        const startTime = Date.now();
        
        try {
          // Set priority if using priorities
          const options: any = {
            timeout: config.connectionTimeout,
          };
          
          if (config.usePriorities) {
            // Assign different priorities to simulate priority-based acquisition
            options.priority = index % 3; // 0, 1, or 2 priority levels
          }
          
          const connection = await prismaService.getConnection(options);
          
          const acquisitionTime = Date.now() - startTime;
          acquisitionTimes.push(acquisitionTime);
          successfulAcquisitions++;
          
          // Release the connection
          prismaService.releaseConnection(connection);
        } catch (error) {
          errors.push(error);
          
          // Check if it's a timeout error
          if (error instanceof DatabaseException && 
              error.type === DatabaseErrorType.TIMEOUT) {
            timedOutAcquisitions++;
          } else {
            otherErrors++;
          }
        }
      });
      
      await Promise.all(requests);
    } finally {
      // Restore original method
      prismaService['connectionManager'].getConnection = originalGetConnection;
    }
    
    // Calculate statistics
    const averageAcquisitionTimeMs = acquisitionTimes.length > 0
      ? acquisitionTimes.reduce((sum, time) => sum + time, 0) / acquisitionTimes.length
      : 0;
    
    return {
      successfulAcquisitions,
      timedOutAcquisitions,
      otherErrors,
      averageAcquisitionTimeMs,
      errors,
    };
  }

  /**
   * Simulates connection operation timeouts
   * @param prismaService The PrismaService to use
   * @param operationTimeoutMs Timeout for operations in milliseconds
   * @param operationDelayMs Delay to simulate in operations
   * @param concurrentOperations Number of concurrent operations
   * @returns Promise that resolves to operation timeout test results
   */
  static async connectionOperationTimeouts(
    prismaService: PrismaService,
    operationTimeoutMs: number,
    operationDelayMs: number,
    concurrentOperations: number
  ): Promise<{
    successfulOperations: number;
    timedOutOperations: number;
    otherErrors: number;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    let successfulOperations = 0;
    let timedOutOperations = 0;
    let otherErrors = 0;
    
    // Create concurrent operations
    const operations = Array(concurrentOperations).fill(0).map(async () => {
      try {
        // Get a connection
        const connection = await prismaService.getConnection();
        
        try {
          // Execute operation with timeout
          await Promise.race([
            this.simulateOperation(connection, operationDelayMs),
            new Promise((_, reject) => {
              setTimeout(() => {
                reject(new DatabaseException(
                  'Operation timed out',
                  DatabaseErrorType.TIMEOUT
                ));
              }, operationTimeoutMs);
            }),
          ]);
          
          successfulOperations++;
        } catch (error) {
          errors.push(error);
          
          // Check if it's a timeout error
          if (error instanceof DatabaseException && 
              error.type === DatabaseErrorType.TIMEOUT) {
            timedOutOperations++;
          } else {
            otherErrors++;
          }
        } finally {
          // Release the connection
          prismaService.releaseConnection(connection);
        }
      } catch (error) {
        errors.push(error);
        otherErrors++;
      }
    });
    
    await Promise.all(operations);
    
    return {
      successfulOperations,
      timedOutOperations,
      otherErrors,
      errors,
    };
  }

  /**
   * Simulates a database operation
   * @param connection The database connection
   * @param durationMs Duration to simulate operation time
   * @returns Promise that resolves when the operation is complete
   */
  private static async simulateOperation(connection: any, durationMs: number = 50): Promise<void> {
    // Simulate a database operation with the given duration
    await new Promise(resolve => setTimeout(resolve, durationMs));
  }
}

/**
 * Class containing test scenarios for connection cleanup
 */
export class ConnectionCleanupScenarios {
  /**
   * Simulates idle connection cleanup
   * @param prismaService The PrismaService to use
   * @param config Configuration for the cleanup test
   * @returns Promise that resolves to cleanup test results
   */
  static async idleConnectionCleanup(
    prismaService: PrismaService,
    config: ConnectionCleanupTestConfig
  ): Promise<{
    initialConnectionCount: number;
    remainingConnectionCount: number;
    cleanedUpConnectionCount: number;
    elapsedTimeMs: number;
  }> {
    const connections: any[] = [];
    
    // Create connections
    for (let i = 0; i < config.connectionCount; i++) {
      const connection = await prismaService.getConnection();
      connections.push(connection);
    }
    
    // Mark some connections as idle
    const idleCount = Math.floor(config.connectionCount * config.idleConnectionPercentage);
    for (let i = 0; i < idleCount; i++) {
      prismaService.releaseConnection(connections[i]);
    }
    
    const initialConnectionCount = connections.length;
    const startTime = Date.now();
    
    // Wait for idle timeout to trigger cleanup
    await new Promise(resolve => setTimeout(resolve, config.maxIdleTimeMs + 1000));
    
    // Check how many connections remain in the pool
    const remainingConnectionCount = prismaService.getConnectionStats().total;
    const elapsedTimeMs = Date.now() - startTime;
    
    // Release any remaining in-use connections
    for (let i = idleCount; i < connections.length; i++) {
      prismaService.releaseConnection(connections[i]);
    }
    
    return {
      initialConnectionCount,
      remainingConnectionCount,
      cleanedUpConnectionCount: initialConnectionCount - remainingConnectionCount,
      elapsedTimeMs,
    };
  }

  /**
   * Simulates connection lifetime management
   * @param prismaService The PrismaService to use
   * @param config Configuration for the cleanup test
   * @returns Promise that resolves to lifetime management test results
   */
  static async connectionLifetimeManagement(
    prismaService: PrismaService,
    config: ConnectionCleanupTestConfig
  ): Promise<{
    initialConnectionCount: number;
    remainingConnectionCount: number;
    replacedConnectionCount: number;
    elapsedTimeMs: number;
  }> {
    const connections: any[] = [];
    
    // Create connections
    for (let i = 0; i < config.connectionCount; i++) {
      const connection = await prismaService.getConnection();
      connections.push(connection);
    }
    
    const initialConnectionCount = connections.length;
    const startTime = Date.now();
    
    // Wait for lifetime limit to trigger replacement
    await new Promise(resolve => setTimeout(resolve, config.maxLifetimeMs + 1000));
    
    // Check how many connections remain in the pool
    const remainingConnectionCount = prismaService.getConnectionStats().total;
    const elapsedTimeMs = Date.now() - startTime;
    
    // Release connections
    for (const connection of connections) {
      prismaService.releaseConnection(connection);
    }
    
    return {
      initialConnectionCount,
      remainingConnectionCount,
      replacedConnectionCount: initialConnectionCount - remainingConnectionCount,
      elapsedTimeMs,
    };
  }

  /**
   * Simulates cleanup of unhealthy connections
   * @param prismaService The PrismaService to use
   * @param config Configuration for the cleanup test
   * @returns Promise that resolves to unhealthy connection cleanup test results
   */
  static async unhealthyConnectionCleanup(
    prismaService: PrismaService,
    config: ConnectionCleanupTestConfig
  ): Promise<{
    initialConnectionCount: number;
    unhealthyConnectionCount: number;
    remainingConnectionCount: number;
    cleanedUpConnectionCount: number;
    elapsedTimeMs: number;
  }> {
    const connections: any[] = [];
    
    // Create connections
    for (let i = 0; i < config.connectionCount; i++) {
      const connection = await prismaService.getConnection();
      connections.push(connection);
    }
    
    const initialConnectionCount = connections.length;
    
    // Mark some connections as unhealthy
    const unhealthyCount = Math.floor(
      config.connectionCount * (config.unhealthyConnectionPercentage || 0.3)
    );
    
    for (let i = 0; i < unhealthyCount; i++) {
      // In a real test, we would use the health monitor to mark connections as unhealthy
      // Here we're simulating by setting a property on the connection
      if (connections[i].health) {
        connections[i].health.status = ConnectionStatus.UNHEALTHY;
      }
      
      // Release the unhealthy connection
      prismaService.releaseConnection(connections[i]);
    }
    
    const startTime = Date.now();
    
    // Wait for health check to trigger cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check how many connections remain in the pool
    const remainingConnectionCount = prismaService.getConnectionStats().total;
    const elapsedTimeMs = Date.now() - startTime;
    
    // Release any remaining in-use connections
    for (let i = unhealthyCount; i < connections.length; i++) {
      prismaService.releaseConnection(connections[i]);
    }
    
    return {
      initialConnectionCount,
      unhealthyConnectionCount: unhealthyCount,
      remainingConnectionCount,
      cleanedUpConnectionCount: initialConnectionCount - remainingConnectionCount,
      elapsedTimeMs,
    };
  }

  /**
   * Simulates resource cleanup during shutdown
   * @param prismaService The PrismaService to use
   * @param connectionCount Number of connections to create before shutdown
   * @param inUsePercentage Percentage of connections to keep in use during shutdown
   * @param forceShutdown Whether to force shutdown without waiting for in-use connections
   * @returns Promise that resolves to shutdown cleanup test results
   */
  static async shutdownResourceCleanup(
    prismaService: PrismaService,
    connectionCount: number,
    inUsePercentage: number,
    forceShutdown: boolean
  ): Promise<{
    initialConnectionCount: number;
    inUseConnectionCount: number;
    cleanedUpConnectionCount: number;
    remainingConnectionCount: number;
    shutdownTimeMs: number;
  }> {
    const connections: any[] = [];
    
    // Create connections
    for (let i = 0; i < connectionCount; i++) {
      const connection = await prismaService.getConnection();
      connections.push(connection);
    }
    
    const initialConnectionCount = connections.length;
    
    // Release some connections
    const inUseCount = Math.floor(connectionCount * inUsePercentage);
    const releaseCount = connectionCount - inUseCount;
    
    for (let i = 0; i < releaseCount; i++) {
      prismaService.releaseConnection(connections[i]);
    }
    
    const startTime = Date.now();
    
    // Shutdown the PrismaService
    await prismaService.onModuleDestroy();
    
    const shutdownTimeMs = Date.now() - startTime;
    
    // Check how many connections remain (should be 0 after shutdown)
    const remainingConnectionCount = prismaService.getConnectionStats().total;
    
    return {
      initialConnectionCount,
      inUseConnectionCount: inUseCount,
      cleanedUpConnectionCount: initialConnectionCount - remainingConnectionCount,
      remainingConnectionCount,
      shutdownTimeMs,
    };
  }
}

/**
 * Class containing test scenarios for connection retry policies
 */
export class ConnectionRetryScenarios {
  /**
   * Simulates retrying failed database operations
   * @param prismaService The PrismaService to use
   * @param config Configuration for the retry test
   * @returns Promise that resolves to retry test results
   */
  static async operationRetryPolicy(
    prismaService: PrismaService,
    config: ConnectionRetryTestConfig
  ): Promise<{
    successfulOperations: number;
    failedOperations: number;
    totalRetryAttempts: number;
    averageRetryAttemptsPerOperation: number;
    maxRetryAttemptsForOperation: number;
    operationsExceedingMaxRetries: number;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    const retryAttempts: number[] = [];
    let successfulOperations = 0;
    let failedOperations = 0;
    let operationsExceedingMaxRetries = 0;
    
    // Create a function that simulates a failing operation with retries
    const executeWithRetry = async (errorType: DatabaseErrorType, shouldEventuallySucceed: boolean) => {
      let attempts = 0;
      
      try {
        await prismaService.executeWithRetry(
          async () => {
            attempts++;
            
            // Fail for a certain number of attempts, then succeed if configured
            if (!shouldEventuallySucceed || attempts <= config.maxRetries - 1) {
              throw new DatabaseException(
                `Simulated ${errorType} error`,
                errorType
              );
            }
            
            // Success on final attempt if shouldEventuallySucceed is true
            return true;
          },
          {
            maxRetries: config.maxRetries,
            baseDelay: config.baseDelay,
            maxDelay: config.maxDelay,
            useJitter: config.useJitter,
          }
        );
        
        successfulOperations++;
      } catch (error) {
        failedOperations++;
        errors.push(error);
        
        if (attempts > config.maxRetries) {
          operationsExceedingMaxRetries++;
        }
      }
      
      retryAttempts.push(attempts - 1); // Subtract 1 to get retry attempts (not including initial attempt)
    };
    
    // Execute operations with different error types
    const operations: Promise<void>[] = [];
    
    for (const errorType of config.errorTypes) {
      // Some operations will eventually succeed, others will always fail
      operations.push(executeWithRetry(errorType, true)); // Will succeed after retries
      operations.push(executeWithRetry(errorType, false)); // Will always fail
    }
    
    await Promise.all(operations);
    
    // Calculate statistics
    const totalRetryAttempts = retryAttempts.reduce((sum, attempts) => sum + attempts, 0);
    const averageRetryAttemptsPerOperation = operations.length > 0
      ? totalRetryAttempts / operations.length
      : 0;
    const maxRetryAttemptsForOperation = retryAttempts.length > 0
      ? Math.max(...retryAttempts)
      : 0;
    
    return {
      successfulOperations,
      failedOperations,
      totalRetryAttempts,
      averageRetryAttemptsPerOperation,
      maxRetryAttemptsForOperation,
      operationsExceedingMaxRetries,
      errors,
    };
  }

  /**
   * Simulates circuit breaker pattern for database operations
   * @param prismaService The PrismaService to use
   * @param config Configuration for the retry test
   * @param operationCount Number of operations to attempt
   * @returns Promise that resolves to circuit breaker test results
   */
  static async circuitBreakerPattern(
    prismaService: PrismaService,
    config: ConnectionRetryTestConfig,
    operationCount: number
  ): Promise<{
    successfulOperations: number;
    failedOperations: number;
    circuitOpenRejections: number;
    circuitHalfOpenAttempts: number;
    circuitClosedAfterRecovery: boolean;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    let successfulOperations = 0;
    let failedOperations = 0;
    let circuitOpenRejections = 0;
    let circuitHalfOpenAttempts = 0;
    let circuitClosedAfterRecovery = false;
    
    // Create a function that simulates a failing operation
    const executeOperation = async (shouldFail: boolean) => {
      try {
        await prismaService.executeWithRetry(
          async () => {
            if (shouldFail) {
              throw new DatabaseException(
                'Simulated database error',
                config.errorTypes[0] || DatabaseErrorType.QUERY
              );
            }
            return true;
          },
          {
            maxRetries: config.maxRetries,
            baseDelay: config.baseDelay,
            maxDelay: config.maxDelay,
            useJitter: config.useJitter,
          }
        );
        
        successfulOperations++;
      } catch (error) {
        failedOperations++;
        errors.push(error);
        
        // Check if it's a circuit open error
        if (error instanceof Error && 
            error.message.includes('Circuit breaker open')) {
          circuitOpenRejections++;
        }
      }
    };
    
    // Phase 1: Trigger circuit breaker by causing failures
    const failureThreshold = config.circuitBreakerFailureThreshold || 5;
    for (let i = 0; i < failureThreshold + 2; i++) {
      await executeOperation(true); // These should fail
    }
    
    // Phase 2: Verify circuit is open by attempting more operations
    for (let i = 0; i < 3; i++) {
      await executeOperation(false); // These should be rejected by circuit breaker
    }
    
    // Phase 3: Wait for circuit breaker timeout
    const resetTimeout = config.circuitBreakerResetTimeoutMs || 30000;
    await new Promise(resolve => setTimeout(resolve, resetTimeout + 100));
    
    // Phase 4: Test half-open state with a successful operation
    await executeOperation(false); // This should succeed and be counted as a half-open attempt
    circuitHalfOpenAttempts++;
    
    // Phase 5: Verify circuit is closed by running more operations
    for (let i = 0; i < operationCount - (failureThreshold + 2 + 3 + 1); i++) {
      await executeOperation(false); // These should succeed
    }
    
    // Check if circuit is closed after recovery
    circuitClosedAfterRecovery = successfulOperations > circuitHalfOpenAttempts;
    
    return {
      successfulOperations,
      failedOperations,
      circuitOpenRejections,
      circuitHalfOpenAttempts,
      circuitClosedAfterRecovery,
      errors,
    };
  }

  /**
   * Simulates exponential backoff with jitter for retries
   * @param prismaService The PrismaService to use
   * @param config Configuration for the retry test
   * @param operationCount Number of operations to attempt
   * @returns Promise that resolves to backoff test results
   */
  static async exponentialBackoffWithJitter(
    prismaService: PrismaService,
    config: ConnectionRetryTestConfig,
    operationCount: number
  ): Promise<{
    successfulOperations: number;
    failedOperations: number;
    retryDelays: number[][];
    averageFirstRetryDelayMs: number;
    averageFinalRetryDelayMs: number;
    jitterImpact: number;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    const retryDelays: number[][] = [];
    let successfulOperations = 0;
    let failedOperations = 0;
    
    // Override the sleep function to measure actual delays
    const originalSleep = global.setTimeout;
    const sleepTimes: number[] = [];
    
    // @ts-ignore - Mock setTimeout to capture delay times
    global.setTimeout = (callback: Function, ms: number) => {
      sleepTimes.push(ms);
      return originalSleep(callback, ms);
    };
    
    try {
      // Execute operations that will retry with backoff
      for (let i = 0; i < operationCount; i++) {
        sleepTimes.length = 0; // Reset for this operation
        
        try {
          await prismaService.executeWithRetry(
            async () => {
              // Fail for a certain number of attempts, then succeed
              const attemptCount = sleepTimes.length;
              if (attemptCount < config.maxRetries) {
                throw new DatabaseException(
                  'Simulated database error for backoff testing',
                  config.errorTypes[0] || DatabaseErrorType.QUERY
                );
              }
              return true;
            },
            {
              maxRetries: config.maxRetries,
              baseDelay: config.baseDelay,
              maxDelay: config.maxDelay,
              useJitter: config.useJitter,
            }
          );
          
          successfulOperations++;
          retryDelays.push([...sleepTimes]);
        } catch (error) {
          failedOperations++;
          errors.push(error);
          retryDelays.push([...sleepTimes]);
        }
      }
    } finally {
      // Restore original setTimeout
      global.setTimeout = originalSleep;
    }
    
    // Calculate statistics
    const firstRetryDelays = retryDelays
      .filter(delays => delays.length > 0)
      .map(delays => delays[0]);
    
    const finalRetryDelays = retryDelays
      .filter(delays => delays.length > 0)
      .map(delays => delays[delays.length - 1]);
    
    const averageFirstRetryDelayMs = firstRetryDelays.length > 0
      ? firstRetryDelays.reduce((sum, delay) => sum + delay, 0) / firstRetryDelays.length
      : 0;
    
    const averageFinalRetryDelayMs = finalRetryDelays.length > 0
      ? finalRetryDelays.reduce((sum, delay) => sum + delay, 0) / finalRetryDelays.length
      : 0;
    
    // Calculate jitter impact by comparing actual delays with theoretical exponential backoff
    let jitterImpact = 0;
    if (config.useJitter && retryDelays.length > 0) {
      const theoreticalDelays = Array(config.maxRetries)
        .fill(0)
        .map((_, i) => Math.min(config.baseDelay * Math.pow(2, i), config.maxDelay));
      
      const actualDelays = retryDelays
        .filter(delays => delays.length === config.maxRetries)
        .map(delays => delays.reduce((sum, delay) => sum + delay, 0) / delays.length);
      
      if (actualDelays.length > 0 && theoreticalDelays.length > 0) {
        const avgTheoretical = theoreticalDelays.reduce((sum, delay) => sum + delay, 0) / theoreticalDelays.length;
        const avgActual = actualDelays.reduce((sum, delay) => sum + delay, 0) / actualDelays.length;
        
        jitterImpact = Math.abs((avgActual - avgTheoretical) / avgTheoretical);
      }
    }
    
    return {
      successfulOperations,
      failedOperations,
      retryDelays,
      averageFirstRetryDelayMs,
      averageFinalRetryDelayMs,
      jitterImpact,
      errors,
    };
  }
}

/**
 * Class containing test scenarios for connection health monitoring
 */
export class ConnectionHealthScenarios {
  /**
   * Simulates health monitoring for database connections
   * @param prismaService The PrismaService to use
   * @param config Configuration for the health test
   * @param testDurationMs Duration of the test in milliseconds
   * @returns Promise that resolves to health monitoring test results
   */
  static async connectionHealthMonitoring(
    prismaService: PrismaService,
    config: ConnectionHealthTestConfig,
    testDurationMs: number
  ): Promise<{
    healthChecksPerformed: number;
    successfulHealthChecks: number;
    failedHealthChecks: number;
    slowHealthChecks: number;
    connectionStatusHistory: Array<{ timestamp: number; status: ConnectionStatus }>;
    finalConnectionStatus: ConnectionStatus;
    recoveryAttempts: number;
    successfulRecoveries: number;
    errors: Error[];
  }> {
    const errors: Error[] = [];
    const connectionStatusHistory: Array<{ timestamp: number; status: ConnectionStatus }> = [];
    let healthChecksPerformed = 0;
    let successfulHealthChecks = 0;
    let failedHealthChecks = 0;
    let slowHealthChecks = 0;
    let recoveryAttempts = 0;
    let successfulRecoveries = 0;
    
    // Create a connection health monitor
    const connectionHealth = new ConnectionHealth(
      new Logger('ConnectionHealth'),
      { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
      {
        getHealthOptions: () => ({
          healthCheckInterval: config.healthCheckInterval,
          slowQueryThreshold: config.slowQueryThreshold,
          failureThreshold: config.failureThreshold,
          enableAutoRecovery: config.enableAutoRecovery,
        }),
      }
    );
    
    // Override the health check query execution
    const originalExecuteHealthCheckQuery = connectionHealth['executeHealthCheckQuery'];
    connectionHealth['executeHealthCheckQuery'] = async () => {
      healthChecksPerformed++;
      
      // Determine if this health check should have issues
      const shouldHaveIssue = Math.random() < config.healthIssueFrequency;
      
      if (shouldHaveIssue && config.healthIssueTypes.length > 0) {
        // Select a random issue type
        const issueType = config.healthIssueTypes[
          Math.floor(Math.random() * config.healthIssueTypes.length)
        ];
        
        switch (issueType) {
          case 'slow':
            // Simulate a slow health check
            await new Promise(resolve => setTimeout(resolve, config.slowQueryThreshold * 2));
            slowHealthChecks++;
            break;
            
          case 'error':
            // Simulate a failed health check
            failedHealthChecks++;
            throw new DatabaseException(
              'Simulated database error during health check',
              DatabaseErrorType.QUERY
            );
            
          case 'timeout':
            // Simulate a timeout
            failedHealthChecks++;
            await new Promise(resolve => setTimeout(resolve, config.healthCheckInterval * 2));
            throw new DatabaseException(
              'Health check query timed out',
              DatabaseErrorType.TIMEOUT
            );
        }
      }
      
      // Successful health check
      successfulHealthChecks++;
      return originalExecuteHealthCheckQuery.call(connectionHealth);
    };
    
    // Override the recovery attempt method
    const originalAttemptRecovery = connectionHealth['attemptRecovery'];
    connectionHealth['attemptRecovery'] = async () => {
      recoveryAttempts++;
      
      try {
        await originalAttemptRecovery.call(connectionHealth);
        successfulRecoveries++;
      } catch (error) {
        errors.push(error);
      }
    };
    
    // Start monitoring
    connectionHealth.startMonitoring();
    
    // Record initial status
    connectionStatusHistory.push({
      timestamp: 0,
      status: connectionHealth.getMetrics().status,
    });
    
    // Set up status recording interval
    const statusInterval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      connectionStatusHistory.push({
        timestamp: elapsedMs,
        status: connectionHealth.getMetrics().status,
      });
    }, 500);
    
    // Run the test for the specified duration
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, testDurationMs));
    
    // Clean up
    clearInterval(statusInterval);
    connectionHealth.stopMonitoring();
    
    // Record final status
    const finalConnectionStatus = connectionHealth.getMetrics().status;
    
    return {
      healthChecksPerformed,
      successfulHealthChecks,
      failedHealthChecks,
      slowHealthChecks,
      connectionStatusHistory,
      finalConnectionStatus,
      recoveryAttempts,
      successfulRecoveries,
      errors,
    };
  }

  /**
   * Simulates degraded connection performance detection
   * @param prismaService The PrismaService to use
   * @param slowQueryThreshold Threshold in milliseconds for slow query detection
   * @param degradedResponseTimeThreshold Threshold in milliseconds for degraded response time
   * @param operationCount Number of operations to perform
   * @param slowOperationPercentage Percentage of operations that should be slow
   * @returns Promise that resolves to degraded performance test results
   */
  static async degradedPerformanceDetection(
    prismaService: PrismaService,
    slowQueryThreshold: number,
    degradedResponseTimeThreshold: number,
    operationCount: number,
    slowOperationPercentage: number
  ): Promise<{
    totalOperations: number;
    slowOperations: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    finalConnectionStatus: ConnectionStatus;
    statusTransitions: Array<{ fromStatus: ConnectionStatus; toStatus: ConnectionStatus; timestamp: number }>;
  }> {
    const responseTimes: number[] = [];
    const statusTransitions: Array<{
      fromStatus: ConnectionStatus;
      toStatus: ConnectionStatus;
      timestamp: number;
    }> = [];
    
    let slowOperations = 0;
    let currentStatus = ConnectionStatus.HEALTHY;
    
    // Create a connection health monitor
    const connectionHealth = new ConnectionHealth(
      new Logger('ConnectionHealth'),
      { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
      {
        getHealthOptions: () => ({
          slowQueryThreshold,
          degradedResponseTimeThreshold,
          healthCheckInterval: 1000,
          failureThreshold: 3,
          enableAutoRecovery: false,
        }),
      }
    );
    
    // Start monitoring
    connectionHealth.startMonitoring();
    
    // Execute operations
    const startTime = Date.now();
    
    for (let i = 0; i < operationCount; i++) {
      // Determine if this operation should be slow
      const shouldBeSlow = Math.random() < slowOperationPercentage;
      
      // Execute the operation
      const operationStartTime = Date.now();
      
      // Simulate operation time
      const operationTime = shouldBeSlow
        ? slowQueryThreshold + Math.random() * 500 // Slow operation
        : 10 + Math.random() * 50; // Normal operation
      
      await new Promise(resolve => setTimeout(resolve, operationTime));
      
      const responseTime = Date.now() - operationStartTime;
      responseTimes.push(responseTime);
      
      // Record slow operations
      if (responseTime > slowQueryThreshold) {
        slowOperations++;
        connectionHealth.recordSuccessfulQuery(responseTime);
      } else {
        connectionHealth.recordSuccessfulQuery(responseTime);
      }
      
      // Check for status changes
      const newStatus = connectionHealth.getMetrics().status;
      if (newStatus !== currentStatus) {
        statusTransitions.push({
          fromStatus: currentStatus,
          toStatus: newStatus,
          timestamp: Date.now() - startTime,
        });
        currentStatus = newStatus;
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Clean up
    connectionHealth.stopMonitoring();
    
    // Calculate statistics
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    const maxResponseTime = responseTimes.length > 0
      ? Math.max(...responseTimes)
      : 0;
    
    const minResponseTime = responseTimes.length > 0
      ? Math.min(...responseTimes)
      : 0;
    
    return {
      totalOperations: operationCount,
      slowOperations,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      finalConnectionStatus: connectionHealth.getMetrics().status,
      statusTransitions,
    };
  }

  /**
   * Simulates connection failure detection and recovery
   * @param prismaService The PrismaService to use
   * @param failureThreshold Number of consecutive failures before marking connection as failed
   * @param enableAutoRecovery Whether to enable automatic recovery attempts
   * @param failureCount Number of consecutive failures to simulate
   * @param recoverAfterFailures Whether to simulate recovery after failures
   * @returns Promise that resolves to failure detection test results
   */
  static async connectionFailureDetection(
    prismaService: PrismaService,
    failureThreshold: number,
    enableAutoRecovery: boolean,
    failureCount: number,
    recoverAfterFailures: boolean
  ): Promise<{
    consecutiveFailures: number;
    finalConnectionStatus: ConnectionStatus;
    recoveryAttempted: boolean;
    recoverySuccessful: boolean;
    timeToDetectFailureMs: number;
    timeToRecoverMs: number | null;
    statusTransitions: Array<{ fromStatus: ConnectionStatus; toStatus: ConnectionStatus; timestamp: number }>;
  }> {
    const statusTransitions: Array<{
      fromStatus: ConnectionStatus;
      toStatus: ConnectionStatus;
      timestamp: number;
    }> = [];
    
    let currentStatus = ConnectionStatus.HEALTHY;
    let recoveryAttempted = false;
    let recoverySuccessful = false;
    let detectionTime: number | null = null;
    let recoveryTime: number | null = null;
    
    // Create a connection health monitor
    const connectionHealth = new ConnectionHealth(
      new Logger('ConnectionHealth'),
      { startSpan: () => ({ setAttributes: () => {}, recordException: () => {}, end: () => {} }) },
      {
        getHealthOptions: () => ({
          healthCheckInterval: 100, // Fast interval for testing
          slowQueryThreshold: 1000,
          failureThreshold,
          enableAutoRecovery,
        }),
      }
    );
    
    // Override the health check query execution
    const originalExecuteHealthCheckQuery = connectionHealth['executeHealthCheckQuery'];
    connectionHealth['executeHealthCheckQuery'] = async () => {
      // Simulate failures for the specified count
      if (connectionHealth['consecutiveFailures'] < failureCount) {
        throw new DatabaseException(
          'Simulated database error during health check',
          DatabaseErrorType.CONNECTION
        );
      }
      
      // Recover after failures if configured
      if (recoverAfterFailures) {
        return originalExecuteHealthCheckQuery.call(connectionHealth);
      }
      
      // Continue failing if not configured to recover
      throw new DatabaseException(
        'Simulated persistent database error',
        DatabaseErrorType.CONNECTION
      );
    };
    
    // Override the recovery attempt method
    const originalAttemptRecovery = connectionHealth['attemptRecovery'];
    connectionHealth['attemptRecovery'] = async () => {
      recoveryAttempted = true;
      
      if (recoverAfterFailures) {
        await originalAttemptRecovery.call(connectionHealth);
        recoverySuccessful = true;
        recoveryTime = Date.now() - startTime;
      } else {
        throw new Error('Simulated recovery failure');
      }
    };
    
    // Start monitoring
    connectionHealth.startMonitoring();
    
    // Start the test
    const startTime = Date.now();
    
    // Wait for status changes
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const newStatus = connectionHealth.getMetrics().status;
        
        // Record status transitions
        if (newStatus !== currentStatus) {
          const timestamp = Date.now() - startTime;
          
          statusTransitions.push({
            fromStatus: currentStatus,
            toStatus: newStatus,
            timestamp,
          });
          
          // Record detection time when status changes to FAILED
          if (newStatus === ConnectionStatus.FAILED && detectionTime === null) {
            detectionTime = timestamp;
          }
          
          currentStatus = newStatus;
        }
        
        // Check if test is complete
        const testComplete = (
          // Failed and not recovering
          (currentStatus === ConnectionStatus.FAILED && !enableAutoRecovery) ||
          // Failed, attempted recovery, and recovery failed
          (currentStatus === ConnectionStatus.FAILED && recoveryAttempted && !recoverySuccessful) ||
          // Recovered successfully
          (recoverySuccessful && currentStatus === ConnectionStatus.HEALTHY) ||
          // Timeout after 10 seconds
          (Date.now() - startTime > 10000)
        );
        
        if (testComplete) {
          clearInterval(checkInterval);
          connectionHealth.stopMonitoring();
          
          resolve({
            consecutiveFailures: connectionHealth['consecutiveFailures'],
            finalConnectionStatus: connectionHealth.getMetrics().status,
            recoveryAttempted,
            recoverySuccessful,
            timeToDetectFailureMs: detectionTime || 0,
            timeToRecoverMs: recoveryTime,
            statusTransitions,
          });
        }
      }, 50);
    });
  }
}