import { FilterDto } from '@austa/interfaces/common/dto/filter.dto';
import { PaginationDto } from '@austa/interfaces/common/dto/pagination.dto';

/**
 * Generic repository interface that provides standardized data access methods
 * across all journey services in the AUSTA SuperApp.
 * 
 * This interface abstracts the underlying data storage implementation details
 * and provides a consistent API for performing CRUD operations on entities
 * within each journey context.
 * 
 * @typeParam T - The entity type this repository manages
 * @typeParam ID - The type of the entity's unique identifier (defaults to string)
 */
export interface Repository<T extends { id: ID }, ID = string> {
  /**
   * Finds an entity by its unique identifier
   * 
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves to the found entity or null if not found
   * @throws RepositoryError if the operation fails due to a database error
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * Finds all entities that match the given filter criteria
   * 
   * @param filter - Optional filtering criteria for querying entities
   * @param pagination - Optional pagination parameters for limiting results
   * @returns A promise that resolves to an array of entities matching the criteria
   * @throws RepositoryError if the operation fails due to a database error
   */
  findAll(filter?: FilterDto, pagination?: PaginationDto): Promise<T[]>;

  /**
   * Creates a new entity in the repository
   * 
   * @param entity - The entity to create (without an ID, as it will be generated)
   * @returns A promise that resolves to the created entity with an assigned ID
   * @throws ValidationError if the entity fails validation
   * @throws RepositoryError if the operation fails due to a database error
   */
  create(entity: Omit<T, 'id'>): Promise<T>;

  /**
   * Updates an existing entity by its unique identifier
   * 
   * @param id - The unique identifier of the entity to update
   * @param entity - The partial entity containing only the fields to update
   * @returns A promise that resolves to the updated entity or null if not found
   * @throws ValidationError if the updated entity fails validation
   * @throws RepositoryError if the operation fails due to a database error
   */
  update(id: ID, entity: Partial<Omit<T, 'id'>>): Promise<T | null>;

  /**
   * Deletes an entity by its unique identifier
   * 
   * @param id - The unique identifier of the entity to delete
   * @returns A promise that resolves to true if deletion was successful, false if entity not found
   * @throws RepositoryError if the operation fails due to a database error
   */
  delete(id: ID): Promise<boolean>;

  /**
   * Counts entities that match the given filter criteria
   * 
   * @param filter - Optional filtering criteria for counting entities
   * @returns A promise that resolves to the count of matching entities
   * @throws RepositoryError if the operation fails due to a database error
   */
  count(filter?: FilterDto): Promise<number>;

  /**
   * Checks if an entity with the given ID exists
   * 
   * @param id - The unique identifier to check
   * @returns A promise that resolves to true if the entity exists, false otherwise
   * @throws RepositoryError if the operation fails due to a database error
   */
  exists(id: ID): Promise<boolean>;
}