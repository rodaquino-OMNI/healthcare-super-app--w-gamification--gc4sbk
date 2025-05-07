import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { LoggerService } from '@app/logging';
import { TracingService } from '@app/tracing';
import { FilterDto, PaginationDto } from '@app/shared/dto';
import { CareContext } from '@app/database/contexts';
import { ITreatmentPlan } from '@austa/interfaces/journey/care';
import { 
  TreatmentPlanNotFoundError,
  TreatmentPersistenceError 
} from '@austa/errors/journey/care';
import { CARE_TREATMENT_PLAN_NOT_FOUND } from '@app/errors/constants';

/**
 * Provides the core business logic for managing treatment plans.
 * Handles CRUD operations for treatment plans in the Care Journey.
 */
@Injectable()
export class TreatmentsService {
  private readonly careContext: CareContext;

  /**
   * Initializes the TreatmentsService with required dependencies.
   * 
   * @param prisma - Service for database operations
   * @param logger - Service for logging
   * @param tracing - Service for request tracing
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService
  ) {
    this.careContext = this.prisma.getCareContext();
  }

  /**
   * Creates a new treatment plan.
   * 
   * @param createTreatmentDto - Data for creating the treatment plan
   * @returns A promise resolving to the newly created treatment plan
   */
  async create(createTreatmentDto: any): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.create', async (span) => {
      this.logger.log('Creating new treatment plan', { 
        context: 'TreatmentsService',
        journey: 'care',
        operation: 'create'
      });
      
      span.setAttributes({
        'treatment.name': createTreatmentDto.name,
        'treatment.careActivityId': createTreatmentDto.careActivityId,
        'journey': 'care'
      });
      
      try {
        // Create the treatment plan using the Care Context
        const treatmentPlan = await this.careContext.withRetry(() => 
          this.prisma.treatmentPlan.create({
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
          })
        );
        
        this.logger.log('Successfully created treatment plan', { 
          context: 'TreatmentsService',
          journey: 'care',
          treatmentId: treatmentPlan.id
        });
        
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        this.logger.error(`Failed to create treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          stack: error.stack,
          treatmentData: createTreatmentDto
        });
        
        throw new TreatmentPersistenceError(
          'Failed to create treatment plan due to database error',
          { cause: error, data: { treatmentName: createTreatmentDto.name } }
        );
      }
    });
  }

  /**
   * Retrieves all treatment plans based on the filter and pagination parameters.
   * 
   * @param filter - Filter criteria for the query
   * @param pagination - Pagination parameters
   * @returns A promise resolving to a list of treatment plans
   */
  async findAll(filter: FilterDto, pagination: PaginationDto): Promise<ITreatmentPlan[]> {
    return this.tracing.createSpan('treatments.findAll', async (span) => {
      this.logger.log('Retrieving treatment plans with filter and pagination', { 
        context: 'TreatmentsService',
        journey: 'care',
        operation: 'findAll',
        filter,
        pagination
      });
      
      span.setAttributes({
        'query.filter': JSON.stringify(filter || {}),
        'query.pagination': JSON.stringify(pagination || {}),
        'journey': 'care'
      });
      
      try {
        // Calculate skip value from pagination parameters
        const skip = pagination?.skip || 
          (pagination?.page && pagination?.limit ? (pagination.page - 1) * pagination.limit : undefined);
        
        // Get treatment plans with filtering and pagination using the Care Context
        const treatmentPlans = await this.careContext.withRetry(() => 
          this.prisma.treatmentPlan.findMany({
            where: filter?.where,
            orderBy: filter?.orderBy,
            include: filter?.include,
            select: filter?.select,
            skip,
            take: pagination?.limit
          })
        );
        
        span.setAttributes({
          'result.count': treatmentPlans.length
        });
        
        this.logger.log(`Retrieved ${treatmentPlans.length} treatment plans`, { 
          context: 'TreatmentsService',
          journey: 'care',
          count: treatmentPlans.length
        });
        
        return treatmentPlans as unknown as ITreatmentPlan[];
      } catch (error) {
        this.logger.error(`Failed to retrieve treatment plans: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          stack: error.stack,
          filter,
          pagination
        });
        
        throw new TreatmentPersistenceError(
          'Failed to retrieve treatment plans due to database error',
          { cause: error, data: { filter, pagination } }
        );
      }
    });
  }

  /**
   * Retrieves a treatment plan by its ID.
   * 
   * @param id - The ID of the treatment plan to retrieve
   * @returns A promise resolving to the treatment plan, if found
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   */
  async findOne(id: string): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.findOne', async (span) => {
      this.logger.log(`Retrieving treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        operation: 'findOne',
        treatmentId: id
      });
      
      span.setAttributes({
        'treatment.id': id,
        'journey': 'care'
      });
      
      try {
        // Find the treatment plan by ID using the Care Context
        const treatmentPlan = await this.careContext.withRetry(() => 
          this.prisma.treatmentPlan.findUnique({
            where: { id },
            include: { careActivity: true }
          })
        );
        
        // Throw an exception if the treatment plan is not found
        if (!treatmentPlan) {
          const error = new TreatmentPlanNotFoundError(
            `Treatment plan with ID ${id} not found`,
            { data: { treatmentId: id } }
          );
          
          span.recordException({
            name: error.name,
            message: error.message,
            code: CARE_TREATMENT_PLAN_NOT_FOUND
          });
          
          throw error;
        }
        
        this.logger.log(`Successfully retrieved treatment plan with ID: ${id}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          treatmentId: id
        });
        
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        // If it's already our custom error, just rethrow it
        if (error instanceof TreatmentPlanNotFoundError) {
          throw error;
        }
        
        this.logger.error(`Failed to retrieve treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          stack: error.stack,
          treatmentId: id
        });
        
        throw new TreatmentPersistenceError(
          `Failed to retrieve treatment plan with ID ${id} due to database error`,
          { cause: error, data: { treatmentId: id } }
        );
      }
    });
  }

  /**
   * Updates an existing treatment plan.
   * 
   * @param id - The ID of the treatment plan to update
   * @param updateTreatmentDto - The data to update the treatment plan with
   * @returns A promise resolving to the updated treatment plan
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   */
  async update(id: string, updateTreatmentDto: any): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.update', async (span) => {
      this.logger.log(`Updating treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        operation: 'update',
        treatmentId: id,
        updateData: updateTreatmentDto
      });
      
      span.setAttributes({
        'treatment.id': id,
        'journey': 'care',
        'update.fields': Object.keys(updateTreatmentDto).join(',')
      });
      
      try {
        // Prepare the data for update
        const data: any = {};
        if (updateTreatmentDto.name !== undefined) data.name = updateTreatmentDto.name;
        if (updateTreatmentDto.description !== undefined) data.description = updateTreatmentDto.description;
        if (updateTreatmentDto.startDate !== undefined) data.startDate = updateTreatmentDto.startDate;
        if (updateTreatmentDto.endDate !== undefined) data.endDate = updateTreatmentDto.endDate;
        if (updateTreatmentDto.progress !== undefined) data.progress = updateTreatmentDto.progress;
        
        // Update the treatment plan using the Care Context with transaction
        const treatmentPlan = await this.careContext.transaction(async (tx) => {
          try {
            return await tx.treatmentPlan.update({
              where: { id },
              data,
              include: { careActivity: true }
            });
          } catch (error) {
            // Handle Prisma's "not found" error
            if (error.code === 'P2025') {
              throw new TreatmentPlanNotFoundError(
                `Treatment plan with ID ${id} not found`,
                { data: { treatmentId: id } }
              );
            }
            throw error;
          }
        });
        
        this.logger.log(`Successfully updated treatment plan with ID: ${id}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          treatmentId: id,
          updatedFields: Object.keys(data)
        });
        
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        // If it's already our custom error, just rethrow it
        if (error instanceof TreatmentPlanNotFoundError) {
          span.recordException({
            name: error.name,
            message: error.message,
            code: CARE_TREATMENT_PLAN_NOT_FOUND
          });
          throw error;
        }
        
        this.logger.error(`Failed to update treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          stack: error.stack,
          treatmentId: id,
          updateData: updateTreatmentDto
        });
        
        throw new TreatmentPersistenceError(
          `Failed to update treatment plan with ID ${id} due to database error`,
          { cause: error, data: { treatmentId: id, updateData: updateTreatmentDto } }
        );
      }
    });
  }

  /**
   * Deletes a treatment plan by its ID.
   * 
   * @param id - The ID of the treatment plan to delete
   * @returns A promise resolving to the deleted treatment plan
   * @throws TreatmentPlanNotFoundError if the treatment plan is not found
   */
  async remove(id: string): Promise<ITreatmentPlan> {
    return this.tracing.createSpan('treatments.remove', async (span) => {
      this.logger.log(`Removing treatment plan with ID: ${id}`, { 
        context: 'TreatmentsService',
        journey: 'care',
        operation: 'remove',
        treatmentId: id
      });
      
      span.setAttributes({
        'treatment.id': id,
        'journey': 'care'
      });
      
      try {
        // Delete the treatment plan using the Care Context with transaction
        const treatmentPlan = await this.careContext.transaction(async (tx) => {
          try {
            return await tx.treatmentPlan.delete({
              where: { id },
              include: { careActivity: true }
            });
          } catch (error) {
            // Handle Prisma's "not found" error
            if (error.code === 'P2025') {
              throw new TreatmentPlanNotFoundError(
                `Treatment plan with ID ${id} not found`,
                { data: { treatmentId: id } }
              );
            }
            throw error;
          }
        });
        
        this.logger.log(`Successfully removed treatment plan with ID: ${id}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          treatmentId: id
        });
        
        return treatmentPlan as unknown as ITreatmentPlan;
      } catch (error) {
        // If it's already our custom error, just rethrow it
        if (error instanceof TreatmentPlanNotFoundError) {
          span.recordException({
            name: error.name,
            message: error.message,
            code: CARE_TREATMENT_PLAN_NOT_FOUND
          });
          throw error;
        }
        
        this.logger.error(`Failed to delete treatment plan: ${error.message}`, { 
          context: 'TreatmentsService',
          journey: 'care',
          error,
          stack: error.stack,
          treatmentId: id
        });
        
        throw new TreatmentPersistenceError(
          `Failed to delete treatment plan with ID ${id} due to database error`,
          { cause: error, data: { treatmentId: id } }
        );
      }
    });
  }
}