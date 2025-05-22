import { Injectable, Logger, Type } from '@nestjs/common';
import { DatabaseMiddleware, MiddlewareRegistry as IMiddlewareRegistry } from './middleware.interface';

/**
 * Registry for managing global middleware configuration across the application.
 * 
 * This registry maintains middleware instances and configurations, allowing for
 * centralized management and dynamic updates at runtime. It enables global middleware
 * policies like mandatory logging and performance tracking while allowing journey-specific
 * overrides.
 */
@Injectable()
export class MiddlewareRegistry implements IMiddlewareRegistry {
  private readonly logger = new Logger(MiddlewareRegistry.name);
  private readonly middlewares: DatabaseMiddleware[] = [];

  /**
   * Creates a new instance of MiddlewareRegistry
   */
  constructor() {
    this.logger.log('Initializing middleware registry');
  }

  /**
   * Registers a middleware component
   * @param middleware Middleware component to register
   */
  register(middleware: DatabaseMiddleware): void {
    this.middlewares.push(middleware);
    this.logger.debug(`Registered middleware: ${middleware.constructor.name}`);
  }

  /**
   * Gets all registered middleware components
   * @returns Array of registered middleware components
   */
  getAll(): DatabaseMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * Gets middleware components by type
   * @param type Type of middleware to retrieve
   * @returns Array of middleware components of the specified type
   */
  getByType<T extends DatabaseMiddleware>(type: Type<T>): T[] {
    return this.middlewares.filter(middleware => middleware instanceof type) as T[];
  }

  /**
   * Clears all registered middleware components
   */
  clear(): void {
    this.middlewares.length = 0;
    this.logger.debug('Cleared all middleware components');
  }

  /**
   * Removes a specific middleware component
   * @param middleware Middleware component to remove
   * @returns True if the middleware was removed, false otherwise
   */
  remove(middleware: DatabaseMiddleware): boolean {
    const initialLength = this.middlewares.length;
    this.middlewares.splice(this.middlewares.indexOf(middleware), 1);
    const removed = initialLength > this.middlewares.length;
    
    if (removed) {
      this.logger.debug(`Removed middleware: ${middleware.constructor.name}`);
    }
    
    return removed;
  }

  /**
   * Removes middleware components by type
   * @param type Type of middleware to remove
   * @returns Number of middleware components removed
   */
  removeByType<T extends DatabaseMiddleware>(type: Type<T>): number {
    const initialLength = this.middlewares.length;
    const newMiddlewares = this.middlewares.filter(middleware => !(middleware instanceof type));
    const removedCount = initialLength - newMiddlewares.length;
    
    this.middlewares.length = 0;
    this.middlewares.push(...newMiddlewares);
    
    if (removedCount > 0) {
      this.logger.debug(`Removed ${removedCount} middleware components of type ${type.name}`);
    }
    
    return removedCount;
  }
}