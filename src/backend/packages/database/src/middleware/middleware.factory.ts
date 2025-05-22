import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MetricsService } from '@austa/tracing';

import {
  DatabaseMiddleware,
  MiddlewareChain,
  MiddlewareContext,
  MiddlewareFactory as IMiddlewareFactory,
} from './middleware.interface';
import { MiddlewareRegistry } from './middleware.registry';
import { JourneyType } from '../types/journey.types';
import { CircuitBreakerMiddleware } from './circuit-breaker.middleware';
import { LoggingMiddleware } from './logging.middleware';
import { PerformanceMiddleware } from './performance.middleware';
import { TransformationMiddleware } from './transformation.middleware';

/**
 * Configuration options for middleware chains
 */
export interface MiddlewareChainOptions {
  /**
   * Whether to enable circuit breaker middleware
   */
  enableCircuitBreaker?: boolean;

  /**
   * Whether to enable logging middleware
   */
  enableLogging?: boolean;

  /**
   * Whether to enable performance monitoring middleware
   */
  enablePerformanceMonitoring?: boolean;

  /**
   * Whether to enable query transformation middleware
   */
  enableTransformation?: boolean;

  /**
   * Whether to skip middleware for simple operations
   */
  skipForSimpleOperations?: boolean;

  /**
   * Custom middleware to include in the chain
   */
  customMiddleware?: DatabaseMiddleware[];

  /**
   * Execution order for middleware (middleware will be executed in this order)
   */
  executionOrder?: string[];
}

/**
 * Default middleware chain options
 */
const DEFAULT_OPTIONS: MiddlewareChainOptions = {
  enableCircuitBreaker: true,
  enableLogging: true,
  enablePerformanceMonitoring: true,
  enableTransformation: true,
  skipForSimpleOperations: true,
  customMiddleware: [],
  executionOrder: [
    CircuitBreakerMiddleware.name,
    LoggingMiddleware.name,
    PerformanceMiddleware.name,
    TransformationMiddleware.name,
  ],
};

/**
 * Implementation of the middleware chain that executes multiple middleware components
 */
class DatabaseMiddlewareChain implements MiddlewareChain {
  private readonly logger = new Logger(DatabaseMiddlewareChain.name);
  private readonly middlewares: DatabaseMiddleware[];
  private readonly context: MiddlewareContext;

  /**
   * Creates a new middleware chain
   * @param middlewares Array of middleware components to execute
   * @param context Context for the operation
   */
  constructor(middlewares: DatabaseMiddleware[], context: MiddlewareContext) {
    this.middlewares = middlewares;
    this.context = context;
  }

  /**
   * Executes all beforeExecute hooks in the chain
   * @param params Parameters for the middleware
   * @returns Modified parameters after all middleware execution
   */
  async executeBeforeHooks(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
  }): Promise<any> {
    let modifiedParams = { ...params, context: this.context };

    // Execute each middleware's beforeExecute hook in sequence
    for (const middleware of this.middlewares) {
      try {
        modifiedParams = await middleware.beforeExecute(modifiedParams);
      } catch (error) {
        this.logger.error(
          `Error in ${middleware.constructor.name}.beforeExecute: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    return modifiedParams;
  }

  /**
   * Executes all afterExecute hooks in the chain
   * @param params Parameters for the middleware including the operation result
   * @returns Modified result after all middleware execution
   */
  async executeAfterHooks(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    result: any;
    error?: Error | null;
  }): Promise<any> {
    let modifiedParams = { ...params, context: this.context };

    // Execute each middleware's afterExecute hook in reverse sequence
    // This ensures that the middleware that executed first gets to process the result last
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const middleware = this.middlewares[i];
      try {
        modifiedParams = await middleware.afterExecute(modifiedParams);
      } catch (error) {
        this.logger.error(
          `Error in ${middleware.constructor.name}.afterExecute: ${error.message}`,
          error.stack,
        );
        // Continue executing other middleware even if one fails
      }
    }

    return modifiedParams.result;
  }

  /**
   * Gets the middleware context
   * @returns The middleware context
   */
  getContext(): MiddlewareContext {
    return this.context;
  }

  /**
   * Gets the middleware components in this chain
   * @returns Array of middleware components
   */
  getMiddlewares(): DatabaseMiddleware[] {
    return [...this.middlewares];
  }
}

/**
 * Factory class that creates and configures middleware instances for database operations.
 * 
 * This factory provides methods for creating standard middleware chains optimized for
 * different journey services and operation types. It implements smart middleware selection
 * based on operation context and configuration, allowing for performance optimizations
 * like skipping middleware for certain operations.
 */
@Injectable()
export class MiddlewareFactory implements IMiddlewareFactory {
  private readonly logger = new Logger(MiddlewareFactory.name);
  private readonly defaultOptions: MiddlewareChainOptions;
  private readonly journeyOptions = new Map<JourneyType, MiddlewareChainOptions>();
  private readonly operationTypeOptions = new Map<Prisma.PrismaAction, MiddlewareChainOptions>();

  /**
   * Creates a new instance of MiddlewareFactory
   * @param middlewareRegistry Registry for retrieving middleware components
   * @param configService Configuration service for loading middleware settings
   * @param metricsService Optional metrics service for monitoring middleware usage
   */
  constructor(
    private readonly middlewareRegistry: MiddlewareRegistry,
    private readonly configService: ConfigService,
    private readonly metricsService?: MetricsService,
  ) {
    this.defaultOptions = this.loadDefaultOptions();
    this.loadJourneyOptions();
    this.loadOperationTypeOptions();
    this.logger.log('Middleware factory initialized');
  }

  /**
   * Loads default middleware options from configuration
   * @returns Default middleware options
   */
  private loadDefaultOptions(): MiddlewareChainOptions {
    const configOptions = this.configService.get<Partial<MiddlewareChainOptions>>(
      'database.middleware.defaultOptions',
      {},
    );
    return { ...DEFAULT_OPTIONS, ...configOptions };
  }

  /**
   * Loads journey-specific middleware options from configuration
   */
  private loadJourneyOptions(): void {
    const journeyOptions = this.configService.get<Record<string, Partial<MiddlewareChainOptions>>>(
      'database.middleware.journeyOptions',
      {},
    );

    // Load options for each journey type
    Object.entries(journeyOptions).forEach(([journeyType, options]) => {
      if (Object.values(JourneyType).includes(journeyType as JourneyType)) {
        this.journeyOptions.set(
          journeyType as JourneyType,
          { ...this.defaultOptions, ...options },
        );
        this.logger.debug(`Loaded middleware options for journey: ${journeyType}`);
      }
    });
  }

  /**
   * Loads operation-specific middleware options from configuration
   */
  private loadOperationTypeOptions(): void {
    const operationOptions = this.configService.get<Record<string, Partial<MiddlewareChainOptions>>>(
      'database.middleware.operationOptions',
      {},
    );

    // Load options for each operation type
    Object.entries(operationOptions).forEach(([operationType, options]) => {
      if (Object.values(Prisma.PrismaAction).includes(operationType as Prisma.PrismaAction)) {
        this.operationTypeOptions.set(
          operationType as Prisma.PrismaAction,
          { ...this.defaultOptions, ...options },
        );
        this.logger.debug(`Loaded middleware options for operation: ${operationType}`);
      }
    });
  }

  /**
   * Creates a middleware chain for a specific operation context
   * @param context Context for the operation
   * @returns Middleware chain for the operation
   */
  createMiddlewareChain(context: Partial<MiddlewareContext>): MiddlewareChain {
    // Create a complete context with defaults
    const fullContext: MiddlewareContext = {
      timestamp: Date.now(),
      operation: context.operation || Prisma.PrismaAction.findFirst,
      model: context.model || 'unknown',
      ...context,
    };

    // Get middleware options for this operation
    const options = this.getOptionsForContext(fullContext);

    // Select middleware components based on options
    const middlewares = this.selectMiddleware(fullContext, options);

    // Create and return the middleware chain
    const chain = new DatabaseMiddlewareChain(middlewares, fullContext);

    // Track middleware chain creation in metrics if available
    if (this.metricsService) {
      this.metricsService.incrementCounter('database_middleware_chain_created', 1, {
        journey: fullContext.journeyType || 'unknown',
        operation: fullContext.operation,
        model: fullContext.model,
        middleware_count: middlewares.length.toString(),
      });
    }

    return chain;
  }

  /**
   * Creates a middleware chain optimized for a specific journey
   * @param journeyType Type of journey
   * @param context Additional context for the operation
   * @returns Middleware chain optimized for the journey
   */
  createJourneyMiddlewareChain(
    journeyType: JourneyType,
    context: Partial<MiddlewareContext> = {},
  ): MiddlewareChain {
    return this.createMiddlewareChain({
      ...context,
      journeyType,
    });
  }

  /**
   * Creates a middleware chain for a read operation
   * @param context Context for the operation
   * @returns Middleware chain optimized for read operations
   */
  createReadMiddlewareChain(context: Partial<MiddlewareContext> = {}): MiddlewareChain {
    // Read operations typically need less middleware
    const readOptions: Partial<MiddlewareChainOptions> = {
      enableCircuitBreaker: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      enableTransformation: true,
      skipForSimpleOperations: true,
    };

    return this.createMiddlewareChain({
      ...context,
      operation: context.operation || Prisma.PrismaAction.findFirst,
      customOptions: readOptions,
    });
  }

  /**
   * Creates a middleware chain for a write operation
   * @param context Context for the operation
   * @returns Middleware chain optimized for write operations
   */
  createWriteMiddlewareChain(context: Partial<MiddlewareContext> = {}): MiddlewareChain {
    // Write operations typically need more middleware
    const writeOptions: Partial<MiddlewareChainOptions> = {
      enableCircuitBreaker: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      enableTransformation: true,
      skipForSimpleOperations: false, // Don't skip for write operations
    };

    return this.createMiddlewareChain({
      ...context,
      operation: context.operation || Prisma.PrismaAction.create,
      customOptions: writeOptions,
    });
  }

  /**
   * Creates a middleware chain for a transaction
   * @param context Context for the operation
   * @returns Middleware chain optimized for transactions
   */
  createTransactionMiddlewareChain(context: Partial<MiddlewareContext> = {}): MiddlewareChain {
    // Transactions need comprehensive middleware
    const transactionOptions: Partial<MiddlewareChainOptions> = {
      enableCircuitBreaker: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      enableTransformation: true,
      skipForSimpleOperations: false, // Don't skip for transactions
    };

    return this.createMiddlewareChain({
      ...context,
      operation: Prisma.PrismaAction.executeRaw, // Use executeRaw as a proxy for transactions
      customOptions: transactionOptions,
    });
  }

  /**
   * Creates a minimal middleware chain with only essential middleware
   * @param context Context for the operation
   * @returns Minimal middleware chain
   */
  createMinimalMiddlewareChain(context: Partial<MiddlewareContext> = {}): MiddlewareChain {
    // Minimal middleware for performance-critical operations
    const minimalOptions: Partial<MiddlewareChainOptions> = {
      enableCircuitBreaker: true, // Keep circuit breaker for safety
      enableLogging: false,       // Disable logging for performance
      enablePerformanceMonitoring: false, // Disable performance monitoring
      enableTransformation: false, // Disable transformation
      skipForSimpleOperations: true,
    };

    return this.createMiddlewareChain({
      ...context,
      customOptions: minimalOptions,
    });
  }

  /**
   * Gets middleware options for a specific context
   * @param context Context for the operation
   * @returns Middleware options for the context
   */
  private getOptionsForContext(context: MiddlewareContext): MiddlewareChainOptions {
    // Start with default options
    let options = { ...this.defaultOptions };

    // Apply journey-specific options if available
    if (context.journeyType && this.journeyOptions.has(context.journeyType)) {
      options = { ...options, ...this.journeyOptions.get(context.journeyType) };
    }

    // Apply operation-specific options if available
    if (this.operationTypeOptions.has(context.operation)) {
      options = { ...options, ...this.operationTypeOptions.get(context.operation) };
    }

    // Apply custom options if provided in the context
    if (context.customOptions) {
      options = { ...options, ...context.customOptions };
    }

    return options;
  }

  /**
   * Selects middleware components based on context and options
   * @param context Context for the operation
   * @param options Middleware options
   * @returns Array of middleware components
   */
  private selectMiddleware(
    context: MiddlewareContext,
    options: MiddlewareChainOptions,
  ): DatabaseMiddleware[] {
    const selectedMiddleware: DatabaseMiddleware[] = [];
    const middlewareMap = new Map<string, DatabaseMiddleware>();

    // Get journey-specific middleware if available
    let availableMiddleware: DatabaseMiddleware[] = [];
    if (context.journeyType) {
      availableMiddleware = this.middlewareRegistry.getForJourney(context.journeyType);
    } else {
      availableMiddleware = this.middlewareRegistry.getAll();
    }

    // Create a map of middleware by name for easier lookup
    availableMiddleware.forEach(middleware => {
      middlewareMap.set(middleware.constructor.name, middleware);
    });

    // Check if we should skip middleware for simple operations
    if (options.skipForSimpleOperations && this.isSimpleOperation(context)) {
      // For simple operations, only include essential middleware
      if (options.enableCircuitBreaker) {
        const circuitBreaker = middlewareMap.get(CircuitBreakerMiddleware.name);
        if (circuitBreaker) {
          selectedMiddleware.push(circuitBreaker);
        }
      }

      // Add custom middleware if specified
      if (options.customMiddleware && options.customMiddleware.length > 0) {
        selectedMiddleware.push(...options.customMiddleware);
      }

      return this.orderMiddleware(selectedMiddleware, options.executionOrder);
    }

    // Add middleware based on options
    if (options.enableCircuitBreaker) {
      const circuitBreaker = middlewareMap.get(CircuitBreakerMiddleware.name);
      if (circuitBreaker) {
        selectedMiddleware.push(circuitBreaker);
      }
    }

    if (options.enableLogging) {
      const logging = middlewareMap.get(LoggingMiddleware.name);
      if (logging) {
        selectedMiddleware.push(logging);
      }
    }

    if (options.enablePerformanceMonitoring) {
      const performance = middlewareMap.get(PerformanceMiddleware.name);
      if (performance) {
        selectedMiddleware.push(performance);
      }
    }

    if (options.enableTransformation) {
      const transformation = middlewareMap.get(TransformationMiddleware.name);
      if (transformation) {
        selectedMiddleware.push(transformation);
      }
    }

    // Add custom middleware if specified
    if (options.customMiddleware && options.customMiddleware.length > 0) {
      selectedMiddleware.push(...options.customMiddleware);
    }

    // Order middleware based on execution order
    return this.orderMiddleware(selectedMiddleware, options.executionOrder);
  }

  /**
   * Orders middleware components based on execution order
   * @param middleware Array of middleware components
   * @param executionOrder Execution order for middleware
   * @returns Ordered array of middleware components
   */
  private orderMiddleware(
    middleware: DatabaseMiddleware[],
    executionOrder: string[] = [],
  ): DatabaseMiddleware[] {
    if (!executionOrder || executionOrder.length === 0) {
      return middleware;
    }

    // Create a map of middleware by name for easier lookup
    const middlewareMap = new Map<string, DatabaseMiddleware>();
    middleware.forEach(m => {
      middlewareMap.set(m.constructor.name, m);
    });

    // Create ordered array based on execution order
    const orderedMiddleware: DatabaseMiddleware[] = [];

    // First add middleware in the specified order
    executionOrder.forEach(name => {
      const m = middlewareMap.get(name);
      if (m) {
        orderedMiddleware.push(m);
        middlewareMap.delete(name);
      }
    });

    // Then add any remaining middleware not specified in the execution order
    middlewareMap.forEach(m => {
      orderedMiddleware.push(m);
    });

    return orderedMiddleware;
  }

  /**
   * Checks if an operation is considered "simple"
   * Simple operations are typically read operations on a single record
   * that don't require extensive middleware processing
   * @param context Context for the operation
   * @returns True if the operation is simple, false otherwise
   */
  private isSimpleOperation(context: MiddlewareContext): boolean {
    // Read operations on a single record are considered simple
    const simpleOperations = [
      Prisma.PrismaAction.findUnique,
      Prisma.PrismaAction.findFirst,
    ];

    // Check if the operation is in the list of simple operations
    if (!simpleOperations.includes(context.operation)) {
      return false;
    }

    // Check if the operation has any complex arguments
    // This is a simplified check and could be expanded based on your needs
    if (context.args) {
      // Check for complex query features
      const hasComplexFeatures = [
        'include',
        'select',
        'orderBy',
        'groupBy',
        'having',
      ].some(feature => feature in context.args);

      if (hasComplexFeatures) {
        return false;
      }

      // Check for complex where conditions
      if (context.args.where) {
        // If where has more than 3 conditions, consider it complex
        const whereKeys = Object.keys(context.args.where);
        if (whereKeys.length > 3) {
          return false;
        }

        // Check for nested conditions or OR/AND operators
        const hasNestedConditions = whereKeys.some(key => {
          const value = context.args.where[key];
          return (
            key === 'OR' ||
            key === 'AND' ||
            key === 'NOT' ||
            (typeof value === 'object' && value !== null && !('equals' in value))
          );
        });

        if (hasNestedConditions) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Updates journey-specific middleware options
   * @param journeyType Type of journey
   * @param options Middleware options for the journey
   */
  updateJourneyOptions(journeyType: JourneyType, options: Partial<MiddlewareChainOptions>): void {
    const currentOptions = this.journeyOptions.get(journeyType) || { ...this.defaultOptions };
    this.journeyOptions.set(journeyType, { ...currentOptions, ...options });
    this.logger.log(`Updated middleware options for journey: ${journeyType}`);
  }

  /**
   * Updates operation-specific middleware options
   * @param operationType Type of operation
   * @param options Middleware options for the operation
   */
  updateOperationOptions(
    operationType: Prisma.PrismaAction,
    options: Partial<MiddlewareChainOptions>,
  ): void {
    const currentOptions = this.operationTypeOptions.get(operationType) || { ...this.defaultOptions };
    this.operationTypeOptions.set(operationType, { ...currentOptions, ...options });
    this.logger.log(`Updated middleware options for operation: ${operationType}`);
  }

  /**
   * Updates default middleware options
   * @param options Default middleware options
   */
  updateDefaultOptions(options: Partial<MiddlewareChainOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.logger.log('Updated default middleware options');
  }

  /**
   * Gets the current default middleware options
   * @returns Default middleware options
   */
  getDefaultOptions(): MiddlewareChainOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Gets journey-specific middleware options
   * @param journeyType Type of journey
   * @returns Middleware options for the journey
   */
  getJourneyOptions(journeyType: JourneyType): MiddlewareChainOptions | undefined {
    return this.journeyOptions.get(journeyType);
  }

  /**
   * Gets operation-specific middleware options
   * @param operationType Type of operation
   * @returns Middleware options for the operation
   */
  getOperationOptions(operationType: Prisma.PrismaAction): MiddlewareChainOptions | undefined {
    return this.operationTypeOptions.get(operationType);
  }
}