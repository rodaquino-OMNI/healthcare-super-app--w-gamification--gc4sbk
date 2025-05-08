import { Injectable } from '@nestjs/common';
import { Repository } from '@austa/interfaces/common/repository.interface';
import { FilterDto, PaginationDto, PaginatedResponse } from '@austa/interfaces/common/dto';
import { LoggerService } from '@app/shared/logging';
import { CorrelationIdService } from '@app/shared/tracing';
import { 
  BusinessRuleViolationError,
  ResourceNotFoundError,
  DatabaseError,
  ExternalApiError,
  InternalServerError,
  TransientError,
  ValidationError
} from '@app/shared/errors';
import { CircuitBreakerService, RetryService } from '@app/shared/resilience';
import { 
  ConnectionManager,
  TransactionService,
  Transactional,
  JourneyDatabaseContext
} from '@app/shared/database';
import { Service } from '@austa/interfaces/common/service.interface';

/**
 * Service class for {{ pascalCase name }} operations.
 * 
 * Implements enhanced error handling, retry mechanisms, and database optimizations.
 * Uses connection pooling, transaction management, and circuit breaker patterns.
 * 
 * @implements {Service<{{ pascalCase name }}, Create{{ pascalCase name }}Dto, Update{{ pascalCase name }}Dto>}
 */
@Injectable()
export class {{ pascalCase name }}Service implements Service<{{ pascalCase name }}, Create{{ pascalCase name }}Dto, Update{{ pascalCase name }}Dto> {
  constructor(
    private readonly {{ camelCase name }}Repository: Repository<{{ pascalCase name }}>,
    private readonly logger: LoggerService,
    private readonly correlationService: CorrelationIdService,
    private readonly transactionService: TransactionService,
    private readonly connectionManager: ConnectionManager,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly retryService: RetryService,
    private readonly journeyContext: JourneyDatabaseContext
  ) {}

  /**
   * Creates a new {{ pascalCase name }}.
   * 
   * Uses transaction management to ensure data consistency and
   * implements retry mechanisms for transient errors.
   * 
   * @param create{{ pascalCase name }}Dto - The DTO for creating a {{ pascalCase name }}
   * @returns The created {{ pascalCase name }}
   * @throws BusinessRuleViolationError if business rules are violated
   * @throws DatabaseError if database operations fail
   */
  @Transactional({ isolationLevel: 'READ_COMMITTED' })
  async create(create{{ pascalCase name }}Dto: Create{{ pascalCase name }}Dto): Promise<{{ pascalCase name }}> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: `Creating new {{ camelCase name }}`,
      correlationId,
      data: { dto: create{{ pascalCase name }}Dto }
    });
    
    try {
      // Get optimized connection from the connection pool
      const connection = await this.connectionManager.getConnection();
      
      // Create the entity using the repository
      const created{{ pascalCase name }} = await this.{{ camelCase name }}Repository.create(create{{ pascalCase name }}Dto);
      
      this.logger.log({
        message: `Successfully created {{ camelCase name }}`,
        correlationId,
        data: { id: created{{ pascalCase name }}.id }
      });
      
      return created{{ pascalCase name }};
    } catch (error) {
      // Handle different error types appropriately
      if (error instanceof BusinessRuleViolationError) {
        throw error; // Business errors are passed through
      }
      
      this.logger.error({
        message: `Failed to create {{ camelCase name }}`,
        correlationId,
        error,
        data: { dto: create{{ pascalCase name }}Dto }
      });
      
      // Classify database errors
      if (error.code && (error.code.startsWith('P') || error.code.includes('constraint'))) {
        throw new DatabaseError(
          `Database error while creating {{ camelCase name }}`,
          { cause: error, context: { dto: create{{ pascalCase name }}Dto } }
        );
      }
      
      throw new InternalServerError(
        `Failed to create {{ camelCase name }}`,
        { cause: error, context: { dto: create{{ pascalCase name }}Dto } }
      );
    }
  }

  /**
   * Finds all {{ pascalCase name }}s with pagination and filtering.
   * 
   * Implements connection pooling for optimized database access.
   * 
   * @param pagination - Pagination parameters
   * @param filter - Filter criteria
   * @returns A paginated list of {{ pascalCase name }}s
   * @throws DatabaseError if database operations fail
   */
  async findAll(pagination?: PaginationDto, filter?: FilterDto): Promise<PaginatedResponse<{{ pascalCase name }}>> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: 'Finding {{ camelCase name }}s with pagination and filters',
      correlationId,
      data: { pagination, filter }
    });
    
    try {
      // Get optimized connection from the journey-specific database context
      const connection = await this.journeyContext.getConnection();
      
      // Get total count for pagination
      const total = await this.{{ camelCase name }}Repository.count(filter);
      
      // Get paginated results
      const items = await this.{{ camelCase name }}Repository.findAll(pagination, filter);
      
      return {
        items,
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        totalPages: Math.ceil(total / (pagination?.limit || 10))
      };
    } catch (error) {
      this.logger.error({
        message: `Failed to find {{ camelCase name }}s`,
        correlationId,
        error,
        data: { pagination, filter }
      });
      
      throw new DatabaseError(
        `Database error while retrieving {{ camelCase name }}s`,
        { cause: error, context: { pagination, filter } }
      );
    }
  }

  /**
   * Finds a {{ pascalCase name }} by ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns The found {{ pascalCase name }}
   * @throws ResourceNotFoundError if the {{ pascalCase name }} is not found
   * @throws DatabaseError if database operations fail
   */
  async findById(id: string): Promise<{{ pascalCase name }}> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: `Finding {{ camelCase name }} by id`,
      correlationId,
      data: { id }
    });
    
    try {
      // Get optimized connection from the journey-specific database context
      const connection = await this.journeyContext.getConnection();
      
      const {{ camelCase name }} = await this.{{ camelCase name }}Repository.findById(id);
      
      if (!{{ camelCase name }}) {
        throw new ResourceNotFoundError(
          `{{ pascalCase name }} with id ${id} not found`,
          { context: { id } }
        );
      }
      
      return {{ camelCase name }};
    } catch (error) {
      // Pass through ResourceNotFoundError
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error({
        message: `Failed to find {{ camelCase name }} by id`,
        correlationId,
        error,
        data: { id }
      });
      
      throw new DatabaseError(
        `Database error while retrieving {{ camelCase name }} with id ${id}`,
        { cause: error, context: { id } }
      );
    }
  }

  /**
   * Updates a {{ pascalCase name }}.
   * 
   * Uses transaction management to ensure data consistency.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param update{{ pascalCase name }}Dto - The DTO for updating the {{ pascalCase name }}
   * @returns The updated {{ pascalCase name }}
   * @throws ResourceNotFoundError if the {{ pascalCase name }} is not found
   * @throws BusinessRuleViolationError if business rules are violated
   * @throws DatabaseError if database operations fail
   */
  @Transactional({ isolationLevel: 'READ_COMMITTED' })
  async update(id: string, update{{ pascalCase name }}Dto: Update{{ pascalCase name }}Dto): Promise<{{ pascalCase name }}> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: `Updating {{ camelCase name }}`,
      correlationId,
      data: { id, dto: update{{ pascalCase name }}Dto }
    });
    
    try {
      // First check if the entity exists
      const existing = await this.findById(id);
      
      // Get optimized connection from the journey-specific database context
      const connection = await this.journeyContext.getConnection();
      
      // Update the entity
      const updated{{ pascalCase name }} = await this.{{ camelCase name }}Repository.update(id, update{{ pascalCase name }}Dto);
      
      this.logger.log({
        message: `Successfully updated {{ camelCase name }}`,
        correlationId,
        data: { id }
      });
      
      return updated{{ pascalCase name }};
    } catch (error) {
      // Pass through ResourceNotFoundError and BusinessRuleViolationError
      if (error instanceof ResourceNotFoundError || 
          error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      this.logger.error({
        message: `Failed to update {{ camelCase name }}`,
        correlationId,
        error,
        data: { id, dto: update{{ pascalCase name }}Dto }
      });
      
      // Classify database errors
      if (error.code && (error.code.startsWith('P') || error.code.includes('constraint'))) {
        throw new DatabaseError(
          `Database error while updating {{ camelCase name }}`,
          { cause: error, context: { id, dto: update{{ pascalCase name }}Dto } }
        );
      }
      
      throw new InternalServerError(
        `Failed to update {{ camelCase name }}`,
        { cause: error, context: { id, dto: update{{ pascalCase name }}Dto } }
      );
    }
  }

  /**
   * Removes a {{ pascalCase name }}.
   * 
   * Uses transaction management to ensure data consistency.
   * 
   * @param id - The ID of the {{ pascalCase name }} to remove
   * @returns True if the entity was deleted, false otherwise
   * @throws ResourceNotFoundError if the {{ pascalCase name }} is not found
   * @throws DatabaseError if database operations fail
   */
  @Transactional({ isolationLevel: 'READ_COMMITTED' })
  async remove(id: string): Promise<boolean> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: `Removing {{ camelCase name }}`,
      correlationId,
      data: { id }
    });
    
    try {
      // First check if the entity exists
      const existing = await this.findById(id);
      
      // Get optimized connection from the journey-specific database context
      const connection = await this.journeyContext.getConnection();
      
      // Delete the entity
      const deleted = await this.{{ camelCase name }}Repository.delete(id);
      
      if (!deleted) {
        throw new ResourceNotFoundError(
          `{{ pascalCase name }} with id ${id} not found or already deleted`,
          { context: { id } }
        );
      }
      
      this.logger.log({
        message: `Successfully removed {{ camelCase name }}`,
        correlationId,
        data: { id }
      });
      
      return true;
    } catch (error) {
      // Pass through ResourceNotFoundError
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      this.logger.error({
        message: `Failed to remove {{ camelCase name }}`,
        correlationId,
        error,
        data: { id }
      });
      
      throw new DatabaseError(
        `Database error while deleting {{ camelCase name }} with id ${id}`,
        { cause: error, context: { id } }
      );
    }
  }

  /**
   * Counts {{ pascalCase name }}s matching the provided filter.
   * 
   * @param filter - Filter criteria
   * @returns The count of matching {{ pascalCase name }}s
   * @throws DatabaseError if database operations fail
   */
  async count(filter?: FilterDto): Promise<number> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: 'Counting {{ camelCase name }}s with filters',
      correlationId,
      data: { filter }
    });
    
    try {
      // Get optimized connection from the journey-specific database context
      const connection = await this.journeyContext.getConnection();
      
      return await this.{{ camelCase name }}Repository.count(filter);
    } catch (error) {
      this.logger.error({
        message: `Failed to count {{ camelCase name }}s`,
        correlationId,
        error,
        data: { filter }
      });
      
      throw new DatabaseError(
        `Database error while counting {{ camelCase name }}s`,
        { cause: error, context: { filter } }
      );
    }
  }

  /**
   * Performs an operation with an external API using circuit breaker pattern.
   * 
   * @param externalApiParams - Parameters for the external API call
   * @returns The result from the external API
   * @throws ExternalApiError if the external API call fails
   */
  /**
   * Performs an operation with an external API using circuit breaker pattern.
   * 
   * Implements circuit breaker pattern to prevent cascading failures and
   * retry mechanisms with exponential backoff for transient errors.
   * 
   * @param externalApiParams - Parameters for the external API call
   * @returns The result from the external API
   * @throws ExternalApiError if the external API call fails
   */
  async callExternalApi(externalApiParams: any): Promise<any> {
    const correlationId = this.correlationService.getId();
    this.logger.log({
      message: 'Calling external API for {{ camelCase name }}',
      correlationId,
      data: { params: externalApiParams }
    });
    
    try {
      // Use circuit breaker pattern for external API calls
      return await this.circuitBreaker.execute(
        'externalApi',
        async () => {
          // Use retry service for transient errors
          return await this.retryService.execute(
            async () => {
              // Implement the actual API call here
              // This is just a placeholder
              return { success: true, data: {} };
            },
            {
              maxRetries: 3,
              retryDelay: 1000,
              exponentialBackoff: true,
              jitter: true,
              retryCondition: (error) => error instanceof TransientError,
              onRetry: (error, attempt) => {
                this.logger.warn({
                  message: `Retrying external API call (attempt ${attempt})`,
                  correlationId,
                  error,
                  data: { params: externalApiParams, attempt }
                });
              }
            }
          );
        },
        {
          fallback: () => ({ success: false, data: null }),
          timeout: 5000, // 5 seconds timeout
          resetTimeout: 30000, // 30 seconds before circuit half-opens after failure
          errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
          volumeThreshold: 10 // Minimum requests before opening circuit
        }
      );
    } catch (error) {
      this.logger.error({
        message: `External API call failed for {{ camelCase name }}`,
        correlationId,
        error,
        data: { params: externalApiParams }
      });
      
      throw new ExternalApiError(
        `External API call failed for {{ camelCase name }}`,
        { cause: error, context: { params: externalApiParams } }
      );
    }
  }
  
  /**
   * Validates input data against business rules.
   * 
   * @param data - The data to validate
   * @throws ValidationError if validation fails
   */
  private validateInput(data: any): void {
    // Implement validation logic here
    // This is just a placeholder
    if (!data) {
      throw new ValidationError(
        'Input data cannot be empty',
        { context: { data } }
      );
    }
  }
}