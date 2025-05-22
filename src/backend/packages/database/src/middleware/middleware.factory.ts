import { Injectable, Logger } from '@nestjs/common';
import { 
  DatabaseMiddleware, 
  MiddlewareChain, 
  MiddlewareContext, 
  MiddlewareFactory as IMiddlewareFactory 
} from './middleware.interface';
import { MiddlewareRegistry } from './middleware.registry';

/**
 * Implementation of the middleware chain that executes multiple middleware components
 */
class MiddlewareChainImpl implements MiddlewareChain {
  private readonly logger = new Logger(MiddlewareChainImpl.name);

  /**
   * Creates a new instance of MiddlewareChainImpl
   * @param middlewares Array of middleware components to execute
   * @param context Context for the operation
   */
  constructor(
    private readonly middlewares: DatabaseMiddleware[],
    private readonly context: MiddlewareContext,
  ) {}

  /**
   * Executes all beforeExecute hooks in the chain
   * @returns Promise that resolves when all hooks have executed
   */
  async executeBeforeHooks(): Promise<void> {
    let params = {
      args: {},
      dataPath: [],
      runInTransaction: false,
      context: this.context,
    };

    for (const middleware of this.middlewares) {
      try {
        params = await middleware.beforeExecute(params);
      } catch (error) {
        this.logger.error(
          `Error executing beforeExecute hook for ${middleware.constructor.name}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Executes all afterExecute hooks in the chain
   * @param error Error that occurred during operation, if any
   * @param result Result of the operation, if successful
   * @returns Promise that resolves when all hooks have executed
   */
  async executeAfterHooks(error: Error | null, result: any): Promise<void> {
    let params = {
      args: {},
      dataPath: [],
      runInTransaction: false,
      context: this.context,
      result,
    };

    // Execute afterExecute hooks in reverse order
    for (const middleware of [...this.middlewares].reverse()) {
      try {
        params = await middleware.afterExecute(params);
      } catch (hookError) {
        this.logger.error(
          `Error executing afterExecute hook for ${middleware.constructor.name}: ${hookError.message}`,
          hookError.stack,
        );
      }
    }
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

  /**
   * Creates a new instance of MiddlewareFactory
   * @param registry Registry containing middleware components
   */
  constructor(private readonly registry: MiddlewareRegistry) {
    this.logger.log('Initializing middleware factory');
  }

  /**
   * Creates a middleware chain for a specific operation context
   * @param context Context for the operation
   * @returns Middleware chain for the operation
   */
  createMiddlewareChain(context: Partial<MiddlewareContext>): MiddlewareChain {
    // Create a complete context with defaults for missing values
    const completeContext: MiddlewareContext = {
      timestamp: Date.now(),
      operation: context.operation || 'findMany',
      model: context.model || 'Unknown',
      ...context,
    };

    // Get all registered middleware components
    const middlewares = this.registry.getAll();

    // Create a new middleware chain with the complete context
    return new MiddlewareChainImpl(middlewares, completeContext);
  }

  /**
   * Creates a middleware chain optimized for a specific journey
   * @param journeyType Type of journey
   * @param context Additional context for the operation
   * @returns Middleware chain optimized for the journey
   */
  createJourneyMiddlewareChain(
    journeyType: string,
    context: Partial<MiddlewareContext>,
  ): MiddlewareChain {
    return this.createMiddlewareChain({
      ...context,
      journeyType,
    });
  }

  /**
   * Creates a middleware chain optimized for a specific operation type
   * @param operation Type of operation
   * @param context Additional context for the operation
   * @returns Middleware chain optimized for the operation
   */
  createOperationMiddlewareChain(
    operation: string,
    context: Partial<MiddlewareContext>,
  ): MiddlewareChain {
    return this.createMiddlewareChain({
      ...context,
      operation,
    });
  }

  /**
   * Creates a middleware chain with only specific middleware types
   * @param middlewareTypes Types of middleware to include
   * @param context Context for the operation
   * @returns Middleware chain with only the specified middleware types
   */
  createCustomMiddlewareChain(
    middlewareTypes: Array<new (...args: any[]) => DatabaseMiddleware>,
    context: Partial<MiddlewareContext>,
  ): MiddlewareChain {
    // Create a complete context with defaults for missing values
    const completeContext: MiddlewareContext = {
      timestamp: Date.now(),
      operation: context.operation || 'findMany',
      model: context.model || 'Unknown',
      ...context,
    };

    // Get only the specified middleware types
    const middlewares = middlewareTypes.flatMap(type => this.registry.getByType(type));

    // Create a new middleware chain with the complete context
    return new MiddlewareChainImpl(middlewares, completeContext);
  }
}