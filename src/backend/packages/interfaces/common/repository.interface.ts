import { FilterDto, PaginationDto, SortDto } from '@austa/interfaces/common/dto';

/**
 * Generic repository interface that provides standardized data access methods
 * across all journey services in the AUSTA SuperApp.
 * 
 * This interface abstracts the underlying data storage implementation details
 * and provides a consistent API for performing CRUD operations. It ensures
 * type safety and standardized error handling across all journey services.
 * 
 * @typeParam T - The entity type this repository manages (must include an 'id' property)
 */
export interface Repository<T extends { id: string }> {
  /**
   * Finds an entity by its unique identifier
   * 
   * @param id - The unique identifier of the entity
   * @returns A promise that resolves to the found entity or null if not found
   * @throws DatabaseError - If a database operation fails
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Finds all entities that match the given filter criteria
   * 
   * @param filter - Optional filtering criteria for the query
   * @param pagination - Optional pagination parameters
   * @param sort - Optional sorting parameters
   * @returns A promise that resolves to an array of entities and total count
   * @throws ValidationError - If filter parameters are invalid
   * @throws DatabaseError - If a database operation fails
   */
  findAll(filter?: FilterDto, pagination?: PaginationDto, sort?: SortDto): Promise<{
    items: T[];
    total: number;
  }>;

  /**
   * Creates a new entity
   * 
   * @param entity - The entity to create (without an ID)
   * @returns A promise that resolves to the created entity with an assigned ID
   * @throws ValidationError - If entity data is invalid
   * @throws DatabaseError - If a database operation fails
   * @throws ConflictError - If a unique constraint is violated
   */
  create(entity: Omit<T, 'id'>): Promise<T>;

  /**
   * Updates an existing entity
   * 
   * @param id - The unique identifier of the entity to update
   * @param entity - The partial entity containing fields to update
   * @returns A promise that resolves to the updated entity or null if not found
   * @throws ValidationError - If entity data is invalid
   * @throws DatabaseError - If a database operation fails
   * @throws NotFoundError - If the entity with the given ID doesn't exist
   * @throws ConflictError - If a unique constraint is violated
   */
  update(id: string, entity: Partial<Omit<T, 'id'>>): Promise<T | null>;

  /**
   * Deletes an entity by its unique identifier
   * 
   * @param id - The unique identifier of the entity to delete
   * @returns A promise that resolves to true if deletion was successful, false if entity not found
   * @throws DatabaseError - If a database operation fails
   * @throws ForeignKeyError - If the entity cannot be deleted due to foreign key constraints
   */
  delete(id: string): Promise<boolean>;

  /**
   * Checks if an entity with the given ID exists
   * 
   * @param id - The unique identifier of the entity to check
   * @returns A promise that resolves to true if the entity exists, false otherwise
   * @throws DatabaseError - If a database operation fails
   */
  exists(id: string): Promise<boolean>;

  /**
   * Counts entities that match the given filter criteria
   * 
   * @param filter - Optional filtering criteria for the query
   * @returns A promise that resolves to the count of matching entities
   * @throws ValidationError - If filter parameters are invalid
   * @throws DatabaseError - If a database operation fails
   */
  count(filter?: FilterDto): Promise<number>;
}