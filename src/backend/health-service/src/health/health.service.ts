import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from @austa/interfaces package for type-safe data models
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { IHealthGoal } from '@austa/interfaces/journey/health';

// Import from @app path aliases for consistent code organization
import { PrismaService } from '@app/database/connection/prisma.service';
import { LoggerService } from '@app/logging/logger.service';
import { EventService } from '@app/events/event.service';
import { RetryService } from '@app/utils/retry.service';

// Import from local paths with proper structure
import { CreateHealthMetricDto } from './dto/create-health-metric.dto';
import { UpdateHealthMetricDto } from './dto/update-health-metric.dto';
import { HealthMetric } from './entities/health-metric.entity';
import { HealthGoal } from './entities/health-goal.entity';

// Import from other services with proper path aliases
import { FhirService } from '@app/health/integrations/fhir/fhir.service';
import { WearablesService } from '@app/health/integrations/wearables/wearables.service';
import { InsightsService } from '@app/health/insights/insights.service';

// Import journey-specific error classes
import { Health } from '@app/errors/journey/health';

/**
 * Handles the business logic for managing health data.
 * Orchestrates database operations, event emission, and error handling
 * for health metrics and goals.
 */
@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  /**
   * Initializes the HealthService with required dependencies.
   * @param prisma Enhanced PrismaService with connection pooling and journey-specific contexts
   * @param logger Structured logging service with context tracking
   * @param eventService Event publishing service with retry capabilities
   * @param retryService Utility for implementing retry logic with exponential backoff
   * @param configService Configuration service for environment-specific settings
   * @param fhirService Service for FHIR integration
   * @param wearablesService Service for wearable device integration
   * @param insightsService Service for health insights generation
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly eventService: EventService,
    private readonly retryService: RetryService,
    private readonly configService: ConfigService,
    private readonly fhirService: FhirService,
    private readonly wearablesService: WearablesService,
    private readonly insightsService: InsightsService,
  ) {
    this.logger.setContext(HealthService.name);
  }

  /**
   * Lifecycle hook that runs when the module is initialized.
   * Sets up database connections and event listeners.
   */
  async onModuleInit() {
    this.logger.log('Initializing HealthService');
    // Initialize any required resources or connections
    await this.prisma.enableShutdownHooks();
  }

  /**
   * Lifecycle hook that runs when the module is being destroyed.
   * Ensures proper cleanup of resources.
   */
  async onModuleDestroy() {
    this.logger.log('Cleaning up HealthService resources');
    // Perform cleanup operations
  }

  /**
   * Creates a new health metric for a user with retry logic and proper error handling.
   * @param recordId The ID of the health record to associate with the metric
   * @param createMetricDto The data for creating the new health metric
   * @returns The newly created HealthMetric entity
   * @throws Health.Metrics.InvalidMetricValueError if the metric value is invalid
   * @throws Health.Metrics.MetricCreationFailedError if the metric creation fails
   */
  async createHealthMetric(recordId: string, createMetricDto: CreateHealthMetricDto): Promise<HealthMetric> {
    this.logger.log(`Creating health metric for record ${recordId}`, { recordId, metricType: createMetricDto.type });
    
    try {
      // Validate the metric data before attempting to create
      this.validateMetricData(createMetricDto);
      
      // Use the enhanced PrismaService with the health context
      const healthMetric = await this.prisma.$transaction(async (tx) => {
        // Creates a new health metric in the database with the transaction
        const metric = await tx.healthMetric.create({
          data: {
            recordId,
            ...createMetricDto,
          },
        });
        
        this.logger.debug(`Created health metric with ID ${metric.id}`, { metricId: metric.id });
        return metric;
      });

      // Publish event with retry logic for gamification integration
      await this.retryService.executeWithRetry(
        async () => {
          await this.eventService.publish('health.metric.created', {
            userId: healthMetric.userId,
            metricId: healthMetric.id,
            metricType: healthMetric.type,
            timestamp: new Date().toISOString(),
          });
        },
        {
          maxRetries: 3,
          baseDelay: 300,
          exponentialFactor: 2,
          shouldRetry: (error) => {
            this.logger.warn(`Failed to publish metric creation event, will retry`, { error: error.message });
            return true;
          },
        }
      );

      // Trigger insights generation if configured
      if (this.configService.get('features.autoGenerateInsights')) {
        this.insightsService.generateInsightsForMetric(healthMetric.id)
          .catch(error => {
            this.logger.error(`Failed to generate insights for metric ${healthMetric.id}`, { error: error.message });
          });
      }

      // Returns the created metric
      return healthMetric;
    } catch (error) {
      // Handle specific error types with proper classification
      if (error instanceof Health.Metrics.InvalidMetricValueError) {
        throw error; // Re-throw already classified errors
      }
      
      if (error.code === 'P2002') {
        this.logger.error(`Duplicate metric detected for record ${recordId}`, { 
          recordId, 
          error: error.message,
          constraint: error.meta?.target
        });
        throw new Health.Metrics.DuplicateMetricError(
          'A metric with these parameters already exists',
          { recordId, metricType: createMetricDto.type }
        );
      }

      this.logger.error(`Failed to create health metric for record ${recordId}`, { 
        recordId, 
        error: error.message,
        stack: error.stack
      });
      
      throw new Health.Metrics.MetricCreationFailedError(
        'Failed to create health metric',
        { recordId, metricType: createMetricDto.type },
        error
      );
    }
  }

  /**
   * Updates an existing health metric with retry logic and proper error handling.
   * @param id The ID of the health metric to update
   * @param updateMetricDto The data for updating the health metric
   * @returns The updated HealthMetric entity
   * @throws Health.Metrics.MetricNotFoundError if the metric doesn't exist
   * @throws Health.Metrics.InvalidMetricValueError if the updated value is invalid
   * @throws Health.Metrics.MetricUpdateFailedError if the update operation fails
   */
  async updateHealthMetric(id: string, updateMetricDto: UpdateHealthMetricDto): Promise<HealthMetric> {
    this.logger.log(`Updating health metric with ID ${id}`, { metricId: id });
    
    try {
      // Check if the metric exists before attempting to update
      const existingMetric = await this.prisma.healthMetric.findUnique({
        where: { id },
      });
      
      if (!existingMetric) {
        throw new Health.Metrics.MetricNotFoundError('Health metric not found', { metricId: id });
      }
      
      // Validate the updated metric data
      if (updateMetricDto.value) {
        this.validateMetricValue(updateMetricDto.type || existingMetric.type, updateMetricDto.value);
      }
      
      // Use the enhanced PrismaService with proper error handling
      const healthMetric = await this.prisma.$transaction(async (tx) => {
        // Updates an existing health metric in the database
        const metric = await tx.healthMetric.update({
          where: { id },
          data: updateMetricDto,
        });
        
        this.logger.debug(`Updated health metric with ID ${metric.id}`, { metricId: metric.id });
        return metric;
      });

      // Publish event with retry logic
      await this.retryService.executeWithRetry(
        async () => {
          await this.eventService.publish('health.metric.updated', {
            userId: healthMetric.userId,
            metricId: healthMetric.id,
            metricType: healthMetric.type,
            timestamp: new Date().toISOString(),
          });
        },
        {
          maxRetries: 3,
          baseDelay: 300,
          exponentialFactor: 2,
          shouldRetry: (error) => {
            this.logger.warn(`Failed to publish metric update event, will retry`, { error: error.message });
            return true;
          },
        }
      );

      // Trigger insights update if configured
      if (this.configService.get('features.autoUpdateInsights')) {
        this.insightsService.updateInsightsForMetric(healthMetric.id)
          .catch(error => {
            this.logger.error(`Failed to update insights for metric ${healthMetric.id}`, { error: error.message });
          });
      }

      // Returns the updated metric
      return healthMetric;
    } catch (error) {
      // Handle specific error types with proper classification
      if (error instanceof Health.Metrics.MetricNotFoundError ||
          error instanceof Health.Metrics.InvalidMetricValueError) {
        throw error; // Re-throw already classified errors
      }
      
      this.logger.error(`Failed to update health metric with ID ${id}`, { 
        metricId: id, 
        error: error.message,
        stack: error.stack
      });
      
      throw new Health.Metrics.MetricUpdateFailedError(
        'Failed to update health metric',
        { metricId: id },
        error
      );
    }
  }

  /**
   * Retrieves health metrics for a user with filtering and pagination.
   * @param userId The ID of the user
   * @param filters Optional filters for the metrics query
   * @param pagination Optional pagination parameters
   * @returns A paginated list of health metrics
   */
  async getHealthMetrics(
    userId: string,
    filters?: { type?: MetricType; startDate?: Date; endDate?: Date; source?: MetricSource },
    pagination?: { page: number; limit: number }
  ): Promise<{ data: HealthMetric[]; total: number; page: number; limit: number }> {
    this.logger.log(`Retrieving health metrics for user ${userId}`, { userId, filters });
    
    try {
      // Build the where clause based on filters
      const where: any = { userId };
      
      if (filters?.type) {
        where.type = filters.type;
      }
      
      if (filters?.source) {
        where.source = filters.source;
      }
      
      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }
      
      // Set up pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;
      
      // Execute the query with the enhanced PrismaService
      const [data, total] = await Promise.all([
        this.prisma.healthMetric.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.healthMetric.count({ where }),
      ]);
      
      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve health metrics for user ${userId}`, { 
        userId, 
        error: error.message,
        stack: error.stack
      });
      
      throw new Health.Metrics.MetricRetrievalFailedError(
        'Failed to retrieve health metrics',
        { userId },
        error
      );
    }
  }

  /**
   * Validates metric data before creation or update.
   * @param metricData The metric data to validate
   * @throws Health.Metrics.InvalidMetricValueError if validation fails
   */
  private validateMetricData(metricData: Partial<IHealthMetric>): void {
    if (metricData.value !== undefined && metricData.type) {
      this.validateMetricValue(metricData.type, metricData.value);
    }
  }

  /**
   * Validates a metric value based on its type.
   * @param type The type of the metric
   * @param value The value to validate
   * @throws Health.Metrics.InvalidMetricValueError if validation fails
   */
  private validateMetricValue(type: MetricType, value: number): void {
    switch (type) {
      case MetricType.HEART_RATE:
        if (value < 30 || value > 220) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Heart rate must be between 30 and 220 bpm',
            { type, value }
          );
        }
        break;
      case MetricType.BLOOD_PRESSURE_SYSTOLIC:
        if (value < 70 || value > 250) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Systolic blood pressure must be between 70 and 250 mmHg',
            { type, value }
          );
        }
        break;
      case MetricType.BLOOD_PRESSURE_DIASTOLIC:
        if (value < 40 || value > 150) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Diastolic blood pressure must be between 40 and 150 mmHg',
            { type, value }
          );
        }
        break;
      case MetricType.BLOOD_GLUCOSE:
        if (value < 30 || value > 600) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Blood glucose must be between 30 and 600 mg/dL',
            { type, value }
          );
        }
        break;
      case MetricType.WEIGHT:
        if (value < 1 || value > 500) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Weight must be between 1 and 500 kg',
            { type, value }
          );
        }
        break;
      case MetricType.HEIGHT:
        if (value < 30 || value > 300) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Height must be between 30 and 300 cm',
            { type, value }
          );
        }
        break;
      case MetricType.TEMPERATURE:
        if (value < 30 || value > 45) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Temperature must be between 30 and 45 °C',
            { type, value }
          );
        }
        break;
      case MetricType.OXYGEN_SATURATION:
        if (value < 50 || value > 100) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Oxygen saturation must be between 50 and 100%',
            { type, value }
          );
        }
        break;
      default:
        // For other metric types, just ensure the value is positive
        if (value < 0) {
          throw new Health.Metrics.InvalidMetricValueError(
            'Metric value cannot be negative',
            { type, value }
          );
        }
    }
  }
}