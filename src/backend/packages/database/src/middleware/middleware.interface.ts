import { Prisma } from '@prisma/client';
import { JourneyType } from '../types/journey.types';

/**
 * Context information for middleware execution
 */
export interface MiddlewareContext {
  /**
   * Unique identifier for the operation
   */
  operationId?: string;
  
  /**
   * Timestamp when the operation started
   */
  timestamp: number;
  
  /**
   * Name of the query or operation
   */
  queryName?: string;
  
  /**
   * Type of Prisma operation being performed
   */
  operation: Prisma.PrismaAction;
  
  /**
   * Name of the model being operated on
   */
  model: string;
  
  /**
   * Journey type for journey-specific operations
   */
  journeyType?: JourneyType;
  
  /**
   * User ID for operations that require user context
   */
  userId?: string;
  
  /**
   * Tenant ID for multi-tenant operations
   */
  tenantId?: string;
  
  /**
   * Whether to include soft-deleted records
   */
  includeDeleted?: boolean;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Interface for database middleware components
 */
export interface DatabaseMiddleware {
  /**
   * Executes before the database operation
   * @param params Parameters for the middleware
   * @returns Modified parameters or a promise resolving to modified parameters
   */
  beforeExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
  }): Promise<any> | any;
  
  /**
   * Executes after the database operation
   * @param params Parameters for the middleware including the operation result
   * @returns Modified result or a promise resolving to modified result
   */
  afterExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
    result: any;
  }): Promise<any> | any;
}

/**
 * Interface for middleware chain that executes multiple middleware components
 */
export interface MiddlewareChain {
  /**
   * Executes all beforeExecute hooks in the chain
   * @returns Promise that resolves when all hooks have executed
   */
  executeBeforeHooks(): Promise<void>;
  
  /**
   * Executes all afterExecute hooks in the chain
   * @param error Error that occurred during operation, if any
   * @param result Result of the operation, if successful
   * @returns Promise that resolves when all hooks have executed
   */
  executeAfterHooks(error: Error | null, result: any): Promise<void>;
}

/**
 * Interface for middleware factory that creates middleware chains
 */
export interface MiddlewareFactory {
  /**
   * Creates a middleware chain for a specific operation context
   * @param context Context for the operation
   * @returns Middleware chain for the operation
   */
  createMiddlewareChain(context: Partial<MiddlewareContext>): MiddlewareChain;
}

/**
 * Interface for middleware registry that manages middleware components
 */
export interface MiddlewareRegistry {
  /**
   * Registers a middleware component
   * @param middleware Middleware component to register
   */
  register(middleware: DatabaseMiddleware): void;
  
  /**
   * Gets all registered middleware components
   * @returns Array of registered middleware components
   */
  getAll(): DatabaseMiddleware[];
  
  /**
   * Gets middleware components by type
   * @param type Type of middleware to retrieve
   * @returns Array of middleware components of the specified type
   */
  getByType<T extends DatabaseMiddleware>(type: new (...args: any[]) => T): T[];
}