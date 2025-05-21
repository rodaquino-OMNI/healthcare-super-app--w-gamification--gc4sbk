/**
 * @file Service Interface
 * @description Defines a generic service interface providing standardized CRUD operations
 * that can be extended by all service classes in the gamification engine. This interface
 * ensures consistent implementation of service methods across modules, improving code
 * quality and maintainability through standardized patterns.
 */

import { IRetryPolicy } from './retry-policy.interface';
import { IErrorResponse } from './error.interface';
import { 
  IPaginationRequest,
  IPaginationResponse 
} from '@austa/interfaces/common';

/**
 * Generic service interface that defines standard CRUD operations.
 * This interface can be extended by specific service interfaces to ensure
 * consistent implementation patterns across the gamification engine.
 * 
 * @template T - The entity type that the service manages
 * @template CreateDto - The DTO type used for creating entities
 * @template UpdateDto - The DTO type used for updating entities
 * @template FilterDto - The DTO type used for filtering entities
 */
export interface IService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  FilterDto = Record<string, any>
> {
  /**
   * Creates a new entity.
   * 
   * @param data - The data for creating the entity
   * @param options - Optional parameters for the create operation
   * @returns A promise that resolves to the created entity
   * @throws Will throw an error if creation fails
   */
  create(data: CreateDto, options?: ServiceOptions): Promise<T>;

  /**
   * Retrieves an entity by its unique identifier.
   * 
   * @param id - The unique identifier of the entity
   * @param options - Optional parameters for the findById operation
   * @returns A promise that resolves to the found entity or null if not found
   * @throws Will throw an error if retrieval fails
   */
  findById(id: string, options?: ServiceOptions): Promise<T | null>;

  /**
   * Retrieves all entities with optional filtering and pagination.
   * 
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @param options - Optional parameters for the findAll operation
   * @returns A promise that resolves to a paginated response containing entities
   * @throws Will throw an error if retrieval fails
   */
  findAll(
    pagination?: IPaginationRequest,
    filter?: FilterDto,
    options?: ServiceOptions
  ): Promise<IPaginationResponse<T>>;

  /**
   * Updates an existing entity by its unique identifier.
   * 
   * @param id - The unique identifier of the entity to update
   * @param data - The data to update the entity with
   * @param options - Optional parameters for the update operation
   * @returns A promise that resolves to the updated entity
   * @throws Will throw an error if the entity is not found or update fails
   */
  update(id: string, data: UpdateDto, options?: ServiceOptions): Promise<T>;

  /**
   * Deletes an entity by its unique identifier.
   * 
   * @param id - The unique identifier of the entity to delete
   * @param options - Optional parameters for the delete operation
   * @returns A promise that resolves to true if deleted, false otherwise
   * @throws Will throw an error if the entity is not found or deletion fails
   */
  delete(id: string, options?: ServiceOptions): Promise<boolean>;

  /**
   * Counts entities matching the provided filter.
   * 
   * @param filter - Optional filtering criteria
   * @param options - Optional parameters for the count operation
   * @returns A promise that resolves to the count of matching entities
   * @throws Will throw an error if counting fails
   */
  count(filter?: FilterDto, options?: ServiceOptions): Promise<number>;
}

/**
 * Options that can be passed to service methods to modify their behavior.
 * 
 * @property {boolean} [withDeleted] - Whether to include soft-deleted entities
 * @property {boolean} [withRelations] - Whether to include related entities
 * @property {string[]} [relations] - Specific relations to include
 * @property {IRetryPolicy} [retryPolicy] - Custom retry policy for the operation
 * @property {boolean} [useTransaction] - Whether to use a transaction for the operation
 * @property {any} [transactionManager] - Custom transaction manager to use
 * @property {boolean} [skipEvents] - Whether to skip event emission
 * @property {boolean} [skipValidation] - Whether to skip validation
 * @property {Record<string, any>} [metadata] - Additional metadata for the operation
 */
export interface ServiceOptions {
  withDeleted?: boolean;
  withRelations?: boolean;
  relations?: string[];
  retryPolicy?: IRetryPolicy;
  useTransaction?: boolean;
  transactionManager?: any;
  skipEvents?: boolean;
  skipValidation?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Extended service interface that includes error handling capabilities.
 * Provides methods for handling different types of errors and implementing
 * retry mechanisms and circuit breakers.
 * 
 * @template T - The entity type that the service manages
 * @template CreateDto - The DTO type used for creating entities
 * @template UpdateDto - The DTO type used for updating entities
 * @template FilterDto - The DTO type used for filtering entities
 */
export interface IErrorHandlingService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  FilterDto = Record<string, any>
> extends IService<T, CreateDto, UpdateDto, FilterDto> {
  /**
   * Handles an error that occurred during a service operation.
   * 
   * @param error - The error that occurred
   * @param context - Additional context about the operation
   * @returns A standardized error response
   */
  handleError(error: Error, context?: Record<string, any>): IErrorResponse;

  /**
   * Executes an operation with retry logic for transient errors.
   * 
   * @param operation - The operation to execute
   * @param retryPolicy - The retry policy to use
   * @param context - Additional context about the operation
   * @returns A promise that resolves to the operation result
   * @throws Will throw an error if all retries fail
   */
  executeWithRetry<R>(
    operation: () => Promise<R>,
    retryPolicy?: IRetryPolicy,
    context?: Record<string, any>
  ): Promise<R>;

  /**
   * Executes an operation with a circuit breaker to prevent cascading failures.
   * 
   * @param operation - The operation to execute
   * @param fallback - The fallback operation to execute if the circuit is open
   * @param context - Additional context about the operation
   * @returns A promise that resolves to the operation result or fallback result
   */
  executeWithCircuitBreaker<R>(
    operation: () => Promise<R>,
    fallback: () => Promise<R>,
    context?: Record<string, any>
  ): Promise<R>;
}

/**
 * Extended service interface that includes transaction support.
 * Provides methods for executing operations within a transaction.
 * 
 * @template T - The entity type that the service manages
 * @template CreateDto - The DTO type used for creating entities
 * @template UpdateDto - The DTO type used for updating entities
 * @template FilterDto - The DTO type used for filtering entities
 */
export interface ITransactionalService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  FilterDto = Record<string, any>
> extends IService<T, CreateDto, UpdateDto, FilterDto> {
  /**
   * Executes multiple operations within a single transaction.
   * 
   * @param operations - The operations to execute within the transaction
   * @returns A promise that resolves to the results of all operations
   * @throws Will throw an error if any operation fails, rolling back the transaction
   */
  executeTransaction<R>(
    operations: (transactionManager: any) => Promise<R>
  ): Promise<R>;

  /**
   * Creates multiple entities within a single transaction.
   * 
   * @param dataArray - Array of data for creating entities
   * @param options - Optional parameters for the createMany operation
   * @returns A promise that resolves to the created entities
   * @throws Will throw an error if creation fails for any entity
   */
  createMany(dataArray: CreateDto[], options?: ServiceOptions): Promise<T[]>;

  /**
   * Updates multiple entities within a single transaction.
   * 
   * @param updates - Array of updates with entity IDs and update data
   * @param options - Optional parameters for the updateMany operation
   * @returns A promise that resolves to the updated entities
   * @throws Will throw an error if update fails for any entity
   */
  updateMany(
    updates: Array<{ id: string; data: UpdateDto }>,
    options?: ServiceOptions
  ): Promise<T[]>;

  /**
   * Deletes multiple entities within a single transaction.
   * 
   * @param ids - Array of entity IDs to delete
   * @param options - Optional parameters for the deleteMany operation
   * @returns A promise that resolves to true if all entities were deleted
   * @throws Will throw an error if deletion fails for any entity
   */
  deleteMany(ids: string[], options?: ServiceOptions): Promise<boolean>;
}

/**
 * Extended service interface that includes caching capabilities.
 * Provides methods for caching and retrieving entities.
 * 
 * @template T - The entity type that the service manages
 * @template CreateDto - The DTO type used for creating entities
 * @template UpdateDto - The DTO type used for updating entities
 * @template FilterDto - The DTO type used for filtering entities
 */
export interface ICachingService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  FilterDto = Record<string, any>
> extends IService<T, CreateDto, UpdateDto, FilterDto> {
  /**
   * Retrieves an entity from cache or database.
   * 
   * @param id - The unique identifier of the entity
   * @param options - Optional parameters for the findByIdCached operation
   * @returns A promise that resolves to the found entity or null if not found
   */
  findByIdCached(id: string, options?: ServiceOptions): Promise<T | null>;

  /**
   * Retrieves entities from cache or database with optional filtering and pagination.
   * 
   * @param pagination - Optional pagination parameters
   * @param filter - Optional filtering criteria
   * @param options - Optional parameters for the findAllCached operation
   * @returns A promise that resolves to a paginated response containing entities
   */
  findAllCached(
    pagination?: IPaginationRequest,
    filter?: FilterDto,
    options?: ServiceOptions
  ): Promise<IPaginationResponse<T>>;

  /**
   * Invalidates cache for a specific entity.
   * 
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves when the cache is invalidated
   */
  invalidateCache(id: string): Promise<void>;

  /**
   * Invalidates cache for all entities matching the filter.
   * 
   * @param filter - Optional filtering criteria
   * @returns A promise that resolves when the cache is invalidated
   */
  invalidateCacheByFilter(filter?: FilterDto): Promise<void>;
}

/**
 * Comprehensive service interface that combines all extended service interfaces.
 * Provides a complete set of methods for managing entities with error handling,
 * transaction support, and caching capabilities.
 * 
 * @template T - The entity type that the service manages
 * @template CreateDto - The DTO type used for creating entities
 * @template UpdateDto - The DTO type used for updating entities
 * @template FilterDto - The DTO type used for filtering entities
 */
export interface ICompleteService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  FilterDto = Record<string, any>
> extends IErrorHandlingService<T, CreateDto, UpdateDto, FilterDto>,
          ITransactionalService<T, CreateDto, UpdateDto, FilterDto>,
          ICachingService<T, CreateDto, UpdateDto, FilterDto> {}

// Type alias for backward compatibility
export type Service<T, C = Partial<T>, U = Partial<T>, F = Record<string, any>> = 
  IService<T, C, U, F>;