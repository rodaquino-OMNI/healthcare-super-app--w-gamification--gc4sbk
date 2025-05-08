import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';

import {
  DatabaseMiddleware,
  LoggingMiddleware,
  PerformanceMiddleware,
  TransformationMiddleware,
  CircuitBreakerMiddleware,
  MiddlewareContext,
} from './middleware.interface';
import { LoggingMiddleware as LoggingMiddlewareImpl } from './logging.middleware';
import { PerformanceMiddleware as PerformanceMiddlewareImpl } from './performance.middleware';
import { QueryTransformationMiddleware } from './transformation.middleware';
import { CircuitBreakerMiddleware as CircuitBreakerMiddlewareImpl } from './circuit-breaker.middleware';
import { MiddlewareRegistry, JourneyContext } from './middleware.registry';
import { OperationType } from '../types/circuit-breaker.types';

/**
 * Enum representing the different journey types in the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global',
}

/**
 * Configuration options for middleware chains
 */
export interface MiddlewareChainOptions {
  /**
   * Whether to include logging middleware
   * @default true
   */
  enableLogging?: boolean;

  /**
   * Whether to include performance monitoring middleware
   * @default true
   */
  enablePerformance?: boolean;

  /**
   * Whether to include query transformation middleware
   * @default true
   */
  enableTransformation?: boolean;

  /**
   * Whether to include circuit breaker middleware
   * @default true
   */
  enableCircuitBreaker?: boolean;

  /**
   * Journey context for journey-specific middleware configuration
   */
  journeyContext?: JourneyType;

  /**
   * Operation type for operation-specific middleware configuration
   */
  operationType?: OperationType;

  /**
   * Whether to optimize the middleware chain for performance
   * @default true
   */
  optimizeForPerformance?: boolean;

  /**
   * Custom middleware to include in the chain
   */
  customMiddleware?: DatabaseMiddleware[];
}

/**
 * Factory class that creates and configures middleware instances for database operations.
 * 
 * This factory provides methods for creating standard middleware chains optimized for
 * different journey services and operation types. It implements smart middleware selection
 * based on operation context and configuration, allowing for performance optimizations
 * like skipping middleware for certain operations.
 *
 * Features:
 * - Journey-specific middleware configuration
 * - Operation-type-specific middleware optimization
 * - Conditional middleware application based on context
 * - Middleware chain composition with proper execution order
 * - Performance optimization for high-throughput operations
 *
 * @example
 * // Create a middleware chain for the health journey
 * const healthMiddleware = middlewareFactory.createJourneyMiddlewareChain(JourneyType.HEALTH);
 *
 * // Create an optimized middleware chain for read operations
 * const readMiddleware = middlewareFactory.createOperationTypeMiddlewareChain(OperationType.READ);
 *
 * // Create a custom middleware chain with specific options
 * const customMiddleware = middlewareFactory.createMiddlewareChain({
 *   enableLogging: true,
 *   enablePerformance: true,
 *   enableTransformation: false,
 *   journeyContext: JourneyType.CARE,
 *   operationType: OperationType.WRITE,
 * });
 */
@Injectable()
export class MiddlewareFactory {
  private readonly logger = new Logger(MiddlewareFactory.name);
  private readonly loggingMiddleware: LoggingMiddleware;
  private readonly performanceMiddleware: PerformanceMiddleware;
  private readonly transformationMiddleware: TransformationMiddleware;
  private readonly circuitBreakerMiddleware: CircuitBreakerMiddleware;

  /**
   * Creates a new middleware factory
   * 
   * @param loggerService Logger service for structured logging
   * @param tracingService Tracing service for distributed tracing
   * @param configService Configuration service for environment settings
   * @param middlewareRegistry Registry for middleware management
   */
  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
    private readonly middlewareRegistry: MiddlewareRegistry,
  ) {
    // Create default middleware instances
    this.loggingMiddleware = this.createLoggingMiddleware();
    this.performanceMiddleware = this.createPerformanceMiddleware();
    this.transformationMiddleware = this.createTransformationMiddleware();
    this.circuitBreakerMiddleware = this.createCircuitBreakerMiddleware();

    // Register middleware with the registry
    this.registerDefaultMiddleware();

    this.logger.log('Middleware factory initialized');
  }

  /**
   * Creates a middleware chain with the specified options
   * 
   * @param options Configuration options for the middleware chain
   * @returns Array of middleware instances in the correct execution order
   */
  createMiddlewareChain(options: MiddlewareChainOptions = {}): DatabaseMiddleware[] {
    const {
      enableLogging = true,
      enablePerformance = true,
      enableTransformation = true,
      enableCircuitBreaker = true,
      journeyContext,
      operationType,
      optimizeForPerformance = true,
      customMiddleware = [],
    } = options;

    const middlewareChain: DatabaseMiddleware[] = [];

    // Add circuit breaker first (if enabled) to prevent unnecessary operations when circuit is open
    if (enableCircuitBreaker) {
      middlewareChain.push(this.circuitBreakerMiddleware);
    }

    // Add transformation middleware next to modify parameters before other middleware
    if (enableTransformation) {
      middlewareChain.push(this.transformationMiddleware);
    }

    // Add performance middleware before logging to capture accurate timings
    if (enablePerformance) {
      middlewareChain.push(this.performanceMiddleware);
    }

    // Add logging middleware last in the "before" chain to capture all modifications
    if (enableLogging) {
      middlewareChain.push(this.loggingMiddleware);
    }

    // Add custom middleware at the end
    middlewareChain.push(...customMiddleware);

    // Apply journey-specific optimizations if a journey context is provided
    if (journeyContext) {
      this.applyJourneySpecificOptimizations(middlewareChain, journeyContext);
    }

    // Apply operation-type-specific optimizations if an operation type is provided
    if (operationType) {
      this.applyOperationTypeOptimizations(middlewareChain, operationType, optimizeForPerformance);
    }

    return middlewareChain;
  }

  /**
   * Creates a middleware chain optimized for a specific journey
   * 
   * @param journeyType The journey type to optimize for
   * @param options Additional configuration options
   * @returns Array of middleware instances optimized for the journey
   */
  createJourneyMiddlewareChain(
    journeyType: JourneyType,
    options: Omit<MiddlewareChainOptions, 'journeyContext'> = {},
  ): DatabaseMiddleware[] {
    return this.createMiddlewareChain({
      ...options,
      journeyContext: journeyType,
    });
  }

  /**
   * Creates a middleware chain optimized for a specific operation type
   * 
   * @param operationType The operation type to optimize for
   * @param options Additional configuration options
   * @returns Array of middleware instances optimized for the operation type
   */
  createOperationTypeMiddlewareChain(
    operationType: OperationType,
    options: Omit<MiddlewareChainOptions, 'operationType'> = {},
  ): DatabaseMiddleware[] {
    return this.createMiddlewareChain({
      ...options,
      operationType,
    });
  }

  /**
   * Creates a middleware chain optimized for high-throughput operations
   * This chain minimizes overhead by including only essential middleware
   * 
   * @param journeyType Optional journey type for journey-specific optimizations
   * @returns Array of middleware instances optimized for high throughput
   */
  createHighThroughputMiddlewareChain(journeyType?: JourneyType): DatabaseMiddleware[] {
    return this.createMiddlewareChain({
      enableLogging: false, // Disable logging for performance
      enablePerformance: true, // Keep performance monitoring
      enableTransformation: true, // Keep transformations for data integrity
      enableCircuitBreaker: true, // Keep circuit breaker for system protection
      journeyContext: journeyType,
      optimizeForPerformance: true,
    });
  }

  /**
   * Creates a middleware chain for read-only operations
   * 
   * @param journeyType Optional journey type for journey-specific optimizations
   * @returns Array of middleware instances optimized for read operations
   */
  createReadOperationMiddlewareChain(journeyType?: JourneyType): DatabaseMiddleware[] {
    return this.createOperationTypeMiddlewareChain(OperationType.READ, {
      journeyContext: journeyType,
    });
  }

  /**
   * Creates a middleware chain for write operations
   * 
   * @param journeyType Optional journey type for journey-specific optimizations
   * @returns Array of middleware instances optimized for write operations
   */
  createWriteOperationMiddlewareChain(journeyType?: JourneyType): DatabaseMiddleware[] {
    return this.createOperationTypeMiddlewareChain(OperationType.WRITE, {
      journeyContext: journeyType,
    });
  }

  /**
   * Creates a middleware chain for transaction operations
   * 
   * @param journeyType Optional journey type for journey-specific optimizations
   * @returns Array of middleware instances optimized for transaction operations
   */
  createTransactionMiddlewareChain(journeyType?: JourneyType): DatabaseMiddleware[] {
    return this.createOperationTypeMiddlewareChain(OperationType.TRANSACTION, {
      journeyContext: journeyType,
    });
  }

  /**
   * Creates a middleware chain for migration operations
   * 
   * @returns Array of middleware instances optimized for migration operations
   */
  createMigrationMiddlewareChain(): DatabaseMiddleware[] {
    return this.createOperationTypeMiddlewareChain(OperationType.MIGRATION, {
      // Migrations need special handling
      enableTransformation: false, // Disable transformations for migrations
      optimizeForPerformance: false, // Prioritize reliability over performance
    });
  }

  /**
   * Creates a minimal middleware chain with only essential middleware
   * 
   * @returns Array of middleware instances with minimal overhead
   */
  createMinimalMiddlewareChain(): DatabaseMiddleware[] {
    return this.createMiddlewareChain({
      enableLogging: false,
      enablePerformance: false,
      enableTransformation: true, // Keep transformations for data integrity
      enableCircuitBreaker: true, // Keep circuit breaker for system protection
      optimizeForPerformance: true,
    });
  }

  /**
   * Executes a database operation with the specified middleware chain
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @param operation Function to execute the database operation
   * @param middlewareChain Middleware chain to use
   * @returns Result of the operation after middleware processing
   */
  async executeWithMiddleware<T, R>(
    params: T,
    context: MiddlewareContext,
    operation: (params: T) => Promise<R>,
    middlewareChain: DatabaseMiddleware[],
  ): Promise<R> {
    // Apply beforeExecute hooks in order
    let modifiedParams = params;
    for (const middleware of middlewareChain) {
      if (middleware.beforeExecute) {
        try {
          modifiedParams = await Promise.resolve(middleware.beforeExecute(modifiedParams, context));
        } catch (error) {
          this.logger.error(
            `Error in beforeExecute hook of middleware: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }
    }

    // Execute the operation
    let result: R;
    try {
      result = await operation(modifiedParams);
    } catch (error) {
      // Apply onError hooks in reverse order
      let modifiedError = error;
      for (const middleware of [...middlewareChain].reverse()) {
        if (middleware.onError) {
          try {
            modifiedError = await Promise.resolve(middleware.onError(modifiedError, context));
          } catch (hookError) {
            this.logger.error(
              `Error in onError hook of middleware: ${hookError.message}`,
              hookError.stack,
            );
          }
        }
      }
      throw modifiedError;
    }

    // Apply afterExecute hooks in reverse order
    let modifiedResult = result;
    for (const middleware of [...middlewareChain].reverse()) {
      if (middleware.afterExecute) {
        try {
          modifiedResult = await Promise.resolve(middleware.afterExecute(modifiedResult, context));
        } catch (error) {
          this.logger.error(
            `Error in afterExecute hook of middleware: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }
    }

    return modifiedResult;
  }

  /**
   * Executes a database operation with middleware optimized for the specified journey
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @param operation Function to execute the database operation
   * @param journeyType Journey type for journey-specific optimizations
   * @returns Result of the operation after middleware processing
   */
  async executeWithJourneyMiddleware<T, R>(
    params: T,
    context: MiddlewareContext,
    operation: (params: T) => Promise<R>,
    journeyType: JourneyType,
  ): Promise<R> {
    const middlewareChain = this.createJourneyMiddlewareChain(journeyType);
    return this.executeWithMiddleware(params, context, operation, middlewareChain);
  }

  /**
   * Executes a database operation with middleware optimized for the specified operation type
   * 
   * @param params Operation parameters
   * @param context Operation context
   * @param operation Function to execute the database operation
   * @param operationType Operation type for operation-specific optimizations
   * @returns Result of the operation after middleware processing
   */
  async executeWithOperationTypeMiddleware<T, R>(
    params: T,
    context: MiddlewareContext,
    operation: (params: T) => Promise<R>,
    operationType: OperationType,
  ): Promise<R> {
    const middlewareChain = this.createOperationTypeMiddlewareChain(operationType);
    return this.executeWithMiddleware(params, context, operation, middlewareChain);
  }

  /**
   * Creates a new logging middleware instance with default configuration
   * 
   * @returns Configured logging middleware instance
   */
  private createLoggingMiddleware(): LoggingMiddleware {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    return new LoggingMiddlewareImpl(this.loggerService, this.tracingService, {
      logLevel: isProduction ? 'info' : 'debug',
      logParameters: true,
      logResults: !isProduction,
      maxLogSize: 2000,
      includeStackTrace: !isProduction,
      journeyLogLevels: {
        [JourneyType.HEALTH]: 'debug',
        [JourneyType.CARE]: 'debug',
        [JourneyType.PLAN]: 'debug',
      },
      enableTracing: true,
      highlightSlowQueries: true,
      slowQueryThreshold: isProduction ? 1000 : 500,
    });
  }

  /**
   * Creates a new performance middleware instance with default configuration
   * 
   * @returns Configured performance middleware instance
   */
  private createPerformanceMiddleware(): PerformanceMiddleware {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    return new PerformanceMiddlewareImpl({
      slowQueryThreshold: isProduction ? 1000 : 500,
      enableMetrics: true,
      trackStackTrace: !isProduction,
      maxSlowQueries: 100,
      suggestOptimizations: true,
      degradationDetectionInterval: 60000, // 1 minute
      logSlowQueries: true,
      emitMetrics: true,
    });
  }

  /**
   * Creates a new transformation middleware instance with default configuration
   * 
   * @returns Configured transformation middleware instance
   */
  private createTransformationMiddleware(): TransformationMiddleware {
    return new QueryTransformationMiddleware();
  }

  /**
   * Creates a new circuit breaker middleware instance with default configuration
   * 
   * @returns Configured circuit breaker middleware instance
   */
  private createCircuitBreakerMiddleware(): CircuitBreakerMiddleware {
    return new CircuitBreakerMiddlewareImpl(this.loggerService, {
      failureThreshold: {
        [OperationType.READ]: 5,
        [OperationType.WRITE]: 3,
        [OperationType.TRANSACTION]: 2,
        [OperationType.MIGRATION]: 1,
      },
      resetTimeout: 30000, // 30 seconds
      halfOpenMaxOperations: 3,
      monitoringEnabled: true,
      journeySpecificThresholds: {
        [JourneyType.HEALTH]: {
          [OperationType.READ]: 8, // Health journey can tolerate more read failures
          [OperationType.WRITE]: 4,
        },
        [JourneyType.CARE]: {
          [OperationType.READ]: 6,
          [OperationType.WRITE]: 3,
        },
        [JourneyType.PLAN]: {
          [OperationType.READ]: 7,
          [OperationType.WRITE]: 3,
        },
      },
    });
  }

  /**
   * Registers default middleware instances with the middleware registry
   */
  private registerDefaultMiddleware(): void {
    // Register logging middleware
    this.middlewareRegistry.registerLoggingMiddleware(this.loggingMiddleware, {
      id: 'default-logging',
      enabled: true,
      priority: 80,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    // Register performance middleware
    this.middlewareRegistry.registerPerformanceMiddleware(this.performanceMiddleware, {
      id: 'default-performance',
      enabled: true,
      priority: 90,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    // Register transformation middleware
    this.middlewareRegistry.registerTransformationMiddleware(this.transformationMiddleware, {
      id: 'default-transformation',
      enabled: true,
      priority: 100,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    // Register circuit breaker middleware
    this.middlewareRegistry.registerCircuitBreakerMiddleware(this.circuitBreakerMiddleware, {
      id: 'default-circuit-breaker',
      enabled: true,
      priority: 110,
      journeyContexts: ['global', 'health', 'care', 'plan'],
      environmentProfiles: ['development', 'test', 'production'],
    });

    this.logger.log('Default middleware registered with registry');
  }

  /**
   * Applies journey-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   * @param journeyType Journey type to optimize for
   */
  private applyJourneySpecificOptimizations(
    middlewareChain: DatabaseMiddleware[],
    journeyType: JourneyType,
  ): void {
    // Apply journey-specific optimizations based on journey type
    switch (journeyType) {
      case JourneyType.HEALTH:
        this.applyHealthJourneyOptimizations(middlewareChain);
        break;
      case JourneyType.CARE:
        this.applyCareJourneyOptimizations(middlewareChain);
        break;
      case JourneyType.PLAN:
        this.applyPlanJourneyOptimizations(middlewareChain);
        break;
      default:
        // No specific optimizations for global context
        break;
    }
  }

  /**
   * Applies Health journey-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   */
  private applyHealthJourneyOptimizations(middlewareChain: DatabaseMiddleware[]): void {
    // Find the performance middleware in the chain
    const performanceMiddleware = middlewareChain.find(
      middleware => middleware instanceof PerformanceMiddlewareImpl,
    ) as PerformanceMiddlewareImpl | undefined;

    // Configure performance middleware for health journey
    if (performanceMiddleware) {
      performanceMiddleware.setSlowQueryThreshold(800); // Health metrics can be more intensive
    }

    // Find the logging middleware in the chain
    const loggingMiddleware = middlewareChain.find(
      middleware => middleware instanceof LoggingMiddlewareImpl,
    ) as LoggingMiddlewareImpl | undefined;

    // Configure logging middleware for health journey
    if (loggingMiddleware) {
      // Health journey may have sensitive health data, so configure accordingly
      loggingMiddleware.setSensitiveFields([
        'password',
        'token',
        'secret',
        'key',
        'credential',
        'ssn',
        'creditCard',
        'healthMetric', // Health-specific sensitive field
        'medicalRecord', // Health-specific sensitive field
        'diagnosis', // Health-specific sensitive field
      ]);
    }
  }

  /**
   * Applies Care journey-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   */
  private applyCareJourneyOptimizations(middlewareChain: DatabaseMiddleware[]): void {
    // Find the performance middleware in the chain
    const performanceMiddleware = middlewareChain.find(
      middleware => middleware instanceof PerformanceMiddlewareImpl,
    ) as PerformanceMiddlewareImpl | undefined;

    // Configure performance middleware for care journey
    if (performanceMiddleware) {
      performanceMiddleware.setSlowQueryThreshold(600); // Care operations need to be responsive
    }

    // Find the logging middleware in the chain
    const loggingMiddleware = middlewareChain.find(
      middleware => middleware instanceof LoggingMiddlewareImpl,
    ) as LoggingMiddlewareImpl | undefined;

    // Configure logging middleware for care journey
    if (loggingMiddleware) {
      // Care journey may have sensitive medical data, so configure accordingly
      loggingMiddleware.setSensitiveFields([
        'password',
        'token',
        'secret',
        'key',
        'credential',
        'ssn',
        'creditCard',
        'medicalNotes', // Care-specific sensitive field
        'prescription', // Care-specific sensitive field
        'treatmentPlan', // Care-specific sensitive field
      ]);
    }
  }

  /**
   * Applies Plan journey-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   */
  private applyPlanJourneyOptimizations(middlewareChain: DatabaseMiddleware[]): void {
    // Find the performance middleware in the chain
    const performanceMiddleware = middlewareChain.find(
      middleware => middleware instanceof PerformanceMiddlewareImpl,
    ) as PerformanceMiddlewareImpl | undefined;

    // Configure performance middleware for plan journey
    if (performanceMiddleware) {
      performanceMiddleware.setSlowQueryThreshold(700); // Plan operations have moderate performance requirements
    }

    // Find the logging middleware in the chain
    const loggingMiddleware = middlewareChain.find(
      middleware => middleware instanceof LoggingMiddlewareImpl,
    ) as LoggingMiddlewareImpl | undefined;

    // Configure logging middleware for plan journey
    if (loggingMiddleware) {
      // Plan journey may have sensitive financial data, so configure accordingly
      loggingMiddleware.setSensitiveFields([
        'password',
        'token',
        'secret',
        'key',
        'credential',
        'ssn',
        'creditCard',
        'policyNumber', // Plan-specific sensitive field
        'claimAmount', // Plan-specific sensitive field
        'benefitDetails', // Plan-specific sensitive field
      ]);
    }
  }

  /**
   * Applies operation-type-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   * @param operationType Operation type to optimize for
   * @param optimizeForPerformance Whether to optimize for performance
   */
  private applyOperationTypeOptimizations(
    middlewareChain: DatabaseMiddleware[],
    operationType: OperationType,
    optimizeForPerformance: boolean,
  ): void {
    // Apply operation-type-specific optimizations based on operation type
    switch (operationType) {
      case OperationType.READ:
        this.applyReadOperationOptimizations(middlewareChain, optimizeForPerformance);
        break;
      case OperationType.WRITE:
        this.applyWriteOperationOptimizations(middlewareChain, optimizeForPerformance);
        break;
      case OperationType.TRANSACTION:
        this.applyTransactionOperationOptimizations(middlewareChain, optimizeForPerformance);
        break;
      case OperationType.MIGRATION:
        this.applyMigrationOperationOptimizations(middlewareChain);
        break;
      default:
        // No specific optimizations for unknown operation types
        break;
    }
  }

  /**
   * Applies read operation-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   * @param optimizeForPerformance Whether to optimize for performance
   */
  private applyReadOperationOptimizations(
    middlewareChain: DatabaseMiddleware[],
    optimizeForPerformance: boolean,
  ): void {
    if (optimizeForPerformance) {
      // For high-throughput read operations, we can potentially skip some middleware
      // Find the logging middleware in the chain
      const loggingIndex = middlewareChain.findIndex(
        middleware => middleware instanceof LoggingMiddlewareImpl,
      );

      // If logging middleware exists and we're optimizing for performance, configure it for minimal logging
      if (loggingIndex !== -1) {
        const loggingMiddleware = middlewareChain[loggingIndex] as LoggingMiddlewareImpl;
        loggingMiddleware.setLogLevel('info'); // Use higher log level for read operations
        loggingMiddleware.setLogResults(false); // Don't log results for read operations
      }
    }
  }

  /**
   * Applies write operation-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   * @param optimizeForPerformance Whether to optimize for performance
   */
  private applyWriteOperationOptimizations(
    middlewareChain: DatabaseMiddleware[],
    optimizeForPerformance: boolean,
  ): void {
    // Write operations need more careful handling
    // Find the logging middleware in the chain
    const loggingIndex = middlewareChain.findIndex(
      middleware => middleware instanceof LoggingMiddlewareImpl,
    );

    // For write operations, ensure we log parameters but not results
    if (loggingIndex !== -1) {
      const loggingMiddleware = middlewareChain[loggingIndex] as LoggingMiddlewareImpl;
      loggingMiddleware.setLogLevel('debug'); // Use detailed logging for write operations
      loggingMiddleware.setLogResults(false); // Don't log results for write operations
    }
  }

  /**
   * Applies transaction operation-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   * @param optimizeForPerformance Whether to optimize for performance
   */
  private applyTransactionOperationOptimizations(
    middlewareChain: DatabaseMiddleware[],
    optimizeForPerformance: boolean,
  ): void {
    // Transactions need special handling
    // Find the circuit breaker middleware in the chain
    const circuitBreakerIndex = middlewareChain.findIndex(
      middleware => middleware instanceof CircuitBreakerMiddlewareImpl,
    );

    // Ensure circuit breaker is configured properly for transactions
    if (circuitBreakerIndex !== -1) {
      // We can't modify the circuit breaker configuration directly,
      // but we can ensure it's present for transaction operations
      // The circuit breaker is already configured with appropriate thresholds in createCircuitBreakerMiddleware
    }
  }

  /**
   * Applies migration operation-specific optimizations to a middleware chain
   * 
   * @param middlewareChain Middleware chain to optimize
   */
  private applyMigrationOperationOptimizations(middlewareChain: DatabaseMiddleware[]): void {
    // Migrations need special handling
    // Find the transformation middleware in the chain and remove it
    const transformationIndex = middlewareChain.findIndex(
      middleware => middleware instanceof QueryTransformationMiddleware,
    );

    if (transformationIndex !== -1) {
      // Remove transformation middleware for migrations to prevent interference
      middlewareChain.splice(transformationIndex, 1);
    }

    // Find the logging middleware in the chain
    const loggingIndex = middlewareChain.findIndex(
      middleware => middleware instanceof LoggingMiddlewareImpl,
    );

    // For migrations, ensure detailed logging
    if (loggingIndex !== -1) {
      const loggingMiddleware = middlewareChain[loggingIndex] as LoggingMiddlewareImpl;
      loggingMiddleware.setLogLevel('debug'); // Use detailed logging for migrations
      loggingMiddleware.setLogResults(true); // Log results for migrations
    }
  }
}