import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { LoggerService } from '@app/logging';
import { TracingService } from '@app/tracing';
import { ITreatmentPlan } from '@austa/interfaces/journey/care';
import { FilterDto, PaginationDto } from '@app/shared/dto';
import { 
  TreatmentPlanNotFoundError,
  TreatmentPersistenceError 
} from '@app/errors/journey/care';
import { Prisma } from '@prisma/client';
import { DatabaseErrorRecoverability } from '@app/database/errors';
import { RetryOptions } from '@app/database/connection';

/**
 * Provides the core business logic for managing treatment plans.
 * Handles CRUD operations for treatment plans in the Care Journey.
 */
@Injectable()
export class TreatmentsService {
  // Default retry options for database operations
  private readonly defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2,
    timeout: 5000
  };

  /**
   * Initializes the TreatmentsService with required dependencies.
   * 
   * @param prisma - Service for database operations with connection pooling and retry mechanisms
   * @param logger - Service for structured logging with correlation IDs
   * @param tracing - Service for distributed request tracing with OpenTelemetry
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService
  ) {}

  /**
   * Creates a new treatment plan with retry mechanisms for transient database errors.
   * 
   * @param createTreatmentDto - Data for creating the treatment plan
   * @returns A promise resolving to the newly created treatment plan
   * @throws TreatmentPersistenceError if database operation fails after retries
   */
  async create(createTreatmentDto: any): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.create', async (span) => {
      this.logger.log('Creating new treatment plan', { 
        context: 'TreatmentsService',
        journey: 'care',
        treatmentName: createTreatmentDto.name
      });
      
      span.setAttribute('treatment.name', createTreatmentDto.name);
      span.setAttribute('journey', 'care');
      
      try {
        // Create the treatment plan using Prisma with retry for transient errors
        const treatmentPlan = await this.prisma.withRetry(() => {
          return this.prisma.treatmentPlan.create({
            data: {
              name: createTreatmentDto.name,
              description: createTreatmentDto.description,
              startDate: createTreatmentDto.startDate,
              endDate: createTreatmentDto.endDate,
              progress: createTreatmentDto.progress || 0,
              careActivity: {
                connect: { id: createTreatmentDto.careActivityId }
              }
            }
          });
        }, this.defaultRetryOptions);
        
        span.setAttribute('treatment.id', treatmentPlan.id);
        span.setStatus({ code: 0 }); // SUCCESS
        
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        span.setStatus({ code: 1 }); // ERROR
        span.recordException(error);
        
        this.logger.error(`Failed to create treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          treatmentName: createTreatmentDto.name
        });
        
        // Transform database errors into domain-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new TreatmentPersistenceError(
            'Failed to create treatment plan due to database error',
            { cause: error, recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE }
          );
        }
        
        throw error;
      }
    });
  }

  /**
   * Retrieves all treatment plans based on the filter and pagination parameters.
   * Implements retry mechanisms for resilience against transient database errors.
   * 
   * @param filter - Filter criteria for the query
   * @param pagination - Pagination parameters
   * @returns A promise resolving to a list of treatment plans
   * @throws TreatmentPersistenceError if database operation fails after retries
   */
  async findAll(filter: FilterDto, pagination: PaginationDto): Promise<ITreatmentPlan[]> {
    return this.tracing.createSpan('treatments.findAll', async (span) => {
      this.logger.log('Retrieving treatment plans with filter and pagination', { 
        context: 'TreatmentsService',
        journey: 'care',
        filter,
        pagination
      });
      
      span.setAttribute('journey', 'care');
      if (pagination?.limit) {
        span.setAttribute('pagination.limit', pagination.limit);
      }
      
      try {
        // Calculate skip value from pagination parameters
        const skip = pagination?.skip || 
          (pagination?.page && pagination?.limit ? (pagination.page - 1) * pagination.limit : undefined);
        
        // Get treatment plans with filtering and pagination, with retry for transient errors
        const treatmentPlans = await this.prisma.withRetry(() => {
          return this.prisma.treatmentPlan.findMany({
            where: filter?.where,
            orderBy: filter?.orderBy,
            include: filter?.include,
            select: filter?.select,
            skip,
            take: pagination?.limit
          });
        }, this.defaultRetryOptions);
        
        span.setAttribute('treatment.count', treatmentPlans.length);
        span.setStatus({ code: 0 }); // SUCCESS
        
        return treatmentPlans as unknown as ITreatmentPlan[];
      } catch (error) {
        span.setStatus({ code: 1 }); // ERROR
        span.recordException(error);
        
        this.logger.error(`Failed to retrieve treatment plans: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          filter,
          pagination
        });
        
        // Transform database errors into domain-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new TreatmentPersistenceError(
            'Failed to retrieve treatment plans due to database error',
            { cause: error, recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE }
          );
        }
        
        throw error;
      }
    });
  }

  /**
   * Retrieves a treatment plan by its ID with retry mechanisms for resilience.
   * 
   * @param id - The ID of the treatment plan to retrieve
   * @returns A promise resolving to the treatment plan, if found
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   * @throws TreatmentPersistenceError if database operation fails after retries
   */
  async findOne(id: string): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.findOne', async (span) => {
      this.logger.log(`Retrieving treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        treatmentId: id
      });
      
      span.setAttribute('journey', 'care');
      span.setAttribute('treatment.id', id);
      
      try {
        // Find the treatment plan by ID with retry for transient errors
        const treatmentPlan = await this.prisma.withRetry(() => {
          return this.prisma.treatmentPlan.findUnique({
            where: { id },
            include: { careActivity: true }
          });
        }, this.defaultRetryOptions);
        
        // Throw a domain-specific error if the treatment plan is not found
        if (!treatmentPlan) {
          throw new TreatmentPlanNotFoundError(`Treatment plan with ID ${id} not found`);
        }
        
        span.setStatus({ code: 0 }); // SUCCESS
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        span.setStatus({ code: 1 }); // ERROR
        span.recordException(error);
        
        // Re-throw domain-specific errors
        if (error instanceof TreatmentPlanNotFoundError) {
          throw error;
        }
        
        this.logger.error(`Failed to retrieve treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          treatmentId: id
        });
        
        // Transform database errors into domain-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new TreatmentPersistenceError(
            'Failed to retrieve treatment plan due to database error',
            { cause: error, recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE }
          );
        }
        
        throw error;
      }
    });
  }

  /**
   * Updates an existing treatment plan with retry mechanisms for resilience.
   * 
   * @param id - The ID of the treatment plan to update
   * @param updateTreatmentDto - The data to update the treatment plan with
   * @returns A promise resolving to the updated treatment plan
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   * @throws TreatmentPersistenceError if database operation fails after retries
   */
  async update(id: string, updateTreatmentDto: any): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.update', async (span) => {
      this.logger.log(`Updating treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        treatmentId: id,
        updateData: updateTreatmentDto
      });
      
      span.setAttribute('journey', 'care');
      span.setAttribute('treatment.id', id);
      
      try {
        // Prepare the data for update
        const data: any = {};
        if (updateTreatmentDto.name !== undefined) data.name = updateTreatmentDto.name;
        if (updateTreatmentDto.description !== undefined) data.description = updateTreatmentDto.description;
        if (updateTreatmentDto.startDate !== undefined) data.startDate = updateTreatmentDto.startDate;
        if (updateTreatmentDto.endDate !== undefined) data.endDate = updateTreatmentDto.endDate;
        if (updateTreatmentDto.progress !== undefined) data.progress = updateTreatmentDto.progress;
        
        // Update the treatment plan with retry for transient errors
        const treatmentPlan = await this.prisma.withRetry(() => {
          return this.prisma.treatmentPlan.update({
            where: { id },
            data,
            include: { careActivity: true }
          });
        }, this.defaultRetryOptions);
        
        span.setStatus({ code: 0 }); // SUCCESS
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        span.setStatus({ code: 1 }); // ERROR
        span.recordException(error);
        
        // Handle Prisma's "not found" error with domain-specific error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          const notFoundError = new TreatmentPlanNotFoundError(`Treatment plan with ID ${id} not found`);
          throw notFoundError;
        }
        
        this.logger.error(`Failed to update treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          treatmentId: id,
          updateData: updateTreatmentDto
        });
        
        // Transform database errors into domain-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new TreatmentPersistenceError(
            'Failed to update treatment plan due to database error',
            { cause: error, recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE }
          );
        }
        
        throw error;
      }
    });
  }

  /**
   * Deletes a treatment plan by its ID with retry mechanisms for resilience.
   * 
   * @param id - The ID of the treatment plan to delete
   * @returns A promise resolving to the deleted treatment plan
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   * @throws TreatmentPersistenceError if database operation fails after retries
   */
  async remove(id: string): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.remove', async (span) => {
      this.logger.log(`Removing treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        treatmentId: id
      });
      
      span.setAttribute('journey', 'care');
      span.setAttribute('treatment.id', id);
      
      try {
        // Delete the treatment plan with retry for transient errors
        const treatmentPlan = await this.prisma.withRetry(() => {
          return this.prisma.treatmentPlan.delete({
            where: { id },
            include: { careActivity: true }
          });
        }, this.defaultRetryOptions);
        
        span.setStatus({ code: 0 }); // SUCCESS
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        span.setStatus({ code: 1 }); // ERROR
        span.recordException(error);
        
        // Handle Prisma's "not found" error with domain-specific error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          const notFoundError = new TreatmentPlanNotFoundError(`Treatment plan with ID ${id} not found`);
          throw notFoundError;
        }
        
        this.logger.error(`Failed to delete treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          treatmentId: id
        });
        
        // Transform database errors into domain-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new TreatmentPersistenceError(
            'Failed to delete treatment plan due to database error',
            { cause: error, recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE }
          );
        }
        
        throw error;
      }
    });
  }
}