import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker, CircuitBreakerOptions } from '@app/shared/circuit-breaker';
import { PrismaService } from '@app/shared/database';
import { RetryOptions, withRetry } from '@app/shared/retry';
import { CorrelationIdService } from '@app/shared/tracing';
import { 
  AppException, 
  ErrorCategory, 
  ErrorType, 
  isTransientError 
} from '@app/shared/errors';
import { 
  CLIENT_ERROR, 
  ENTITY_NOT_FOUND, 
  EXTERNAL_SERVICE_ERROR, 
  SYS_INTERNAL_SERVER_ERROR, 
  TRANSIENT_ERROR 
} from '@app/shared/constants';
import { Repository } from '@app/shared/interfaces';
import { I{{ pascalCase name }} } from '@austa/interfaces';

@Injectable()
export class {{ pascalCase name }}Service {
  private readonly logger = new Logger({{ pascalCase name }}Service.name);
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    private readonly {{ camelCase name }}Repository: Repository<I{{ pascalCase name }}>,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly correlationService: CorrelationIdService
  ) {
    // Initialize circuit breaker for external service calls
    const circuitBreakerOptions: CircuitBreakerOptions = {
      failureThreshold: this.configService.get<number>('circuitBreaker.failureThreshold', 5),
      resetTimeout: this.configService.get<number>('circuitBreaker.resetTimeout', 30000),
      fallbackFunction: async () => {
        throw new AppException(
          'External service is currently unavailable',
          ErrorType.EXTERNAL,
          ErrorCategory.DEPENDENCY_FAILURE,
          EXTERNAL_SERVICE_ERROR,
          { service: '{{ pascalCase name }}Service' }
        );
      }
    };
    this.circuitBreaker = new CircuitBreaker(circuitBreakerOptions);
  }

  /**
   * Creates a new {{ pascalCase name }}.
   * 
   * @param create{{ pascalCase name }}Dto - The DTO for creating a {{ pascalCase name }}
   * @returns The created {{ pascalCase name }}
   */
  async create(create{{ pascalCase name }}Dto: I{{ pascalCase name }}.Create{{ pascalCase name }}Dto): Promise<I{{ pascalCase name }}.{{ pascalCase name }}> {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger.log({
      message: `Creating new {{ camelCase name }}`,
      correlationId,
      data: { dto: create{{ pascalCase name }}Dto }
    });
    
    // Use transaction for data consistency
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created{{ pascalCase name }} = await this.{{ camelCase name }}Repository.create(create{{ pascalCase name }}Dto, { prisma: tx });
        
        this.logger.log({
          message: `Successfully created {{ camelCase name }}`,
          correlationId,
          data: { id: created{{ pascalCase name }}.id }
        });
        
        return created{{ pascalCase name }};
      });
    } catch (error) {
      this.handleError(error, `Failed to create {{ camelCase name }}`, correlationId);
    }
  }

  /**
   * Finds all {{ pascalCase name }}s with optional filtering and pagination.
   * 
   * @param options - Optional filtering and pagination options
   * @returns A list of {{ pascalCase name }}s
   */
  async findAll(options?: I{{ pascalCase name }}.Find{{ pascalCase name }}Options): Promise<I{{ pascalCase name }}.{{ pascalCase name }}[]> {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger.log({
      message: 'Finding all {{ camelCase name }}s',
      correlationId,
      data: { options }
    });
    
    // Use retry mechanism for database operations that might experience transient failures
    const retryOptions: RetryOptions = {
      maxRetries: this.configService.get<number>('retry.maxRetries', 3),
      initialDelay: this.configService.get<number>('retry.initialDelay', 100),
      maxDelay: this.configService.get<number>('retry.maxDelay', 1000),
      factor: this.configService.get<number>('retry.factor', 2),
      shouldRetry: (error) => isTransientError(error)
    };
    
    try {
      return await withRetry(
        () => this.{{ camelCase name }}Repository.findAll(options),
        retryOptions
      );
    } catch (error) {
      this.handleError(error, `Failed to find all {{ camelCase name }}s`, correlationId);
    }
  }

  /**
   * Finds a {{ pascalCase name }} by ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns The found {{ pascalCase name }}
   */
  async findOne(id: string): Promise<I{{ pascalCase name }}.{{ pascalCase name }}> {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger.log({
      message: `Finding {{ camelCase name }} by id`,
      correlationId,
      data: { id }
    });
    
    try {
      const {{ camelCase name }} = await withRetry(
        () => this.{{ camelCase name }}Repository.findById(id),
        {
          maxRetries: 3,
          initialDelay: 100,
          maxDelay: 1000,
          factor: 2,
          shouldRetry: (error) => isTransientError(error)
        }
      );
      
      if (!{{ camelCase name }}) {
        throw new AppException(
          `{{ pascalCase name }} with id ${id} not found`,
          ErrorType.CLIENT,
          ErrorCategory.NOT_FOUND,
          ENTITY_NOT_FOUND,
          { id }
        );
      }
      
      return {{ camelCase name }};
    } catch (error) {
      this.handleError(error, `Failed to find {{ camelCase name }}`, correlationId);
    }
  }

  /**
   * Updates a {{ pascalCase name }}.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param update{{ pascalCase name }}Dto - The DTO for updating the {{ pascalCase name }}
   * @returns The updated {{ pascalCase name }}
   */
  async update(id: string, update{{ pascalCase name }}Dto: I{{ pascalCase name }}.Update{{ pascalCase name }}Dto): Promise<I{{ pascalCase name }}.{{ pascalCase name }}> {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger.log({
      message: `Updating {{ camelCase name }}`,
      correlationId,
      data: { id, dto: update{{ pascalCase name }}Dto }
    });
    
    try {
      // Use transaction for data consistency
      return await this.prisma.$transaction(async (tx) => {
        // First check if entity exists
        const existing = await this.{{ camelCase name }}Repository.findById(id, { prisma: tx });
        if (!existing) {
          throw new AppException(
            `{{ pascalCase name }} with id ${id} not found`,
            ErrorType.CLIENT,
            ErrorCategory.NOT_FOUND,
            ENTITY_NOT_FOUND,
            { id }
          );
        }
        
        const updated{{ pascalCase name }} = await this.{{ camelCase name }}Repository.update(id, update{{ pascalCase name }}Dto, { prisma: tx });
        
        this.logger.log({
          message: `Successfully updated {{ camelCase name }}`,
          correlationId,
          data: { id }
        });
        
        return updated{{ pascalCase name }};
      });
    } catch (error) {
      this.handleError(error, `Failed to update {{ camelCase name }}`, correlationId);
    }
  }

  /**
   * Removes a {{ pascalCase name }}.
   * 
   * @param id - The ID of the {{ pascalCase name }} to remove
   */
  async remove(id: string): Promise<void> {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger.log({
      message: `Removing {{ camelCase name }}`,
      correlationId,
      data: { id }
    });
    
    try {
      // Use transaction for data consistency
      await this.prisma.$transaction(async (tx) => {
        // First check if entity exists
        const existing = await this.{{ camelCase name }}Repository.findById(id, { prisma: tx });
        if (!existing) {
          throw new AppException(
            `{{ pascalCase name }} with id ${id} not found`,
            ErrorType.CLIENT,
            ErrorCategory.NOT_FOUND,
            ENTITY_NOT_FOUND,
            { id }
          );
        }
        
        const deleted = await this.{{ camelCase name }}Repository.delete(id, { prisma: tx });
        if (!deleted) {
          throw new AppException(
            `Failed to delete {{ camelCase name }} with id ${id}`,
            ErrorType.SYSTEM,
            ErrorCategory.DATABASE_ERROR,
            SYS_INTERNAL_SERVER_ERROR,
            { id }
          );
        }
        
        this.logger.log({
          message: `Successfully removed {{ camelCase name }}`,
          correlationId,
          data: { id }
        });
      });
    } catch (error) {
      this.handleError(error, `Failed to remove {{ camelCase name }}`, correlationId);
    }
  }

  /**
   * Executes an operation with an external service using circuit breaker pattern.
   * 
   * @param operation - The operation to execute
   * @returns The result of the operation
   */
  async executeExternalOperation<T>(operation: () => Promise<T>): Promise<T> {
    const correlationId = this.correlationService.getCorrelationId();
    try {
      return await this.circuitBreaker.execute(operation);
    } catch (error) {
      this.logger.error({
        message: `External service operation failed`,
        correlationId,
        error: error instanceof Error ? error.stack : String(error),
        data: { service: '{{ pascalCase name }}Service' }
      });
      
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        'External service operation failed',
        ErrorType.EXTERNAL,
        ErrorCategory.DEPENDENCY_FAILURE,
        EXTERNAL_SERVICE_ERROR,
        { service: '{{ pascalCase name }}Service' },
        error
      );
    }
  }

  /**
   * Handles errors in a standardized way across the service.
   * 
   * @param error - The error to handle
   * @param defaultMessage - Default error message if not an AppException
   * @param correlationId - The correlation ID for tracing
   */
  private handleError(error: unknown, defaultMessage: string, correlationId: string): never {
    this.logger.error({
      message: error instanceof Error ? error.message : defaultMessage,
      correlationId,
      error: error instanceof Error ? error.stack : String(error)
    });
    
    if (error instanceof AppException) {
      throw error;
    }
    
    // Determine error type based on error characteristics
    let errorType = ErrorType.SYSTEM;
    let errorCategory = ErrorCategory.UNKNOWN;
    let errorCode = SYS_INTERNAL_SERVER_ERROR;
    
    if (isTransientError(error)) {
      errorType = ErrorType.TRANSIENT;
      errorCategory = ErrorCategory.TEMPORARY_FAILURE;
      errorCode = TRANSIENT_ERROR;
    } else if (error instanceof Error && error.message.includes('not found')) {
      errorType = ErrorType.CLIENT;
      errorCategory = ErrorCategory.NOT_FOUND;
      errorCode = ENTITY_NOT_FOUND;
    }
    
    throw new AppException(
      defaultMessage,
      errorType,
      errorCategory,
      errorCode,
      { correlationId },
      error
    );
  }
}