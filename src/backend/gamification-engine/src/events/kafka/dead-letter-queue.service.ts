import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { MetricsService } from '@app/shared/metrics/metrics.service';
import { AlertService } from '@app/shared/alert/alert.service';
import { IBaseEvent } from '../interfaces/event.interface';
import { EventDeadLetterQueueException } from '../exceptions/event-dead-letter-queue.exception';
import { DlqEntry } from './entities/dlq-entry.entity';
import { JourneyType } from '@austa/interfaces';
import { EventType } from '@austa/interfaces/gamification';
import { ErrorType } from '@app/shared/errors/error-type.enum';

/**
 * Service that handles failed events by routing them to specialized dead-letter queues (DLQs).
 * It preserves the original message along with error details, maintains retry metadata,
 * implements alerting for critical failures, and provides tools for manual message recovery and reprocessing.
 */
@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private readonly dlqTopicPrefix: string;
  private readonly alertThreshold: number;
  private readonly enableMetrics: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly metricsService: MetricsService,
    private readonly alertService: AlertService,
    @InjectRepository(DlqEntry)
    private readonly dlqRepository: Repository<DlqEntry>,
  ) {
    this.dlqTopicPrefix = this.configService.get<string>(
      'gamificationEngine.kafka.dlqTopicPrefix',
      'gamification.dlq',
    );
    this.alertThreshold = this.configService.get<number>(
      'gamificationEngine.dlq.alertThreshold',
      10,
    );
    this.enableMetrics = this.configService.get<boolean>(
      'gamificationEngine.dlq.enableMetrics',
      true,
    );
  }

  /**
   * Adds a failed event to the appropriate journey-specific dead-letter queue
   * @param event The original event that failed processing
   * @param error The error that caused the failure
   * @param retryCount Number of retry attempts made before sending to DLQ
   * @param metadata Additional context information about the failure
   */
  async addToDlq(
    event: IBaseEvent,
    error: Error,
    retryCount: number,
    metadata?: Record<string, any>,
  ): Promise<DlqEntry> {
    try {
      // Determine the journey type from the event
      const journeyType = this.getJourneyTypeFromEvent(event);
      
      // Create DLQ entry for database
      const dlqEntry = new DlqEntry();
      dlqEntry.eventId = event.id;
      dlqEntry.userId = event.userId;
      dlqEntry.eventType = event.type;
      dlqEntry.journeyType = journeyType;
      dlqEntry.payload = event;
      dlqEntry.errorType = this.classifyError(error);
      dlqEntry.errorMessage = error.message;
      dlqEntry.errorStack = error.stack;
      dlqEntry.retryCount = retryCount;
      dlqEntry.metadata = metadata || {};

      // Save to database
      const savedEntry = await this.dlqRepository.save(dlqEntry);

      // Send to Kafka DLQ topic
      const dlqTopic = `${this.dlqTopicPrefix}.${journeyType.toLowerCase()}`;
      await this.kafkaService.produce({
        topic: dlqTopic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              originalEvent: event,
              error: {
                message: error.message,
                stack: error.stack,
                type: this.classifyError(error),
              },
              retryCount,
              metadata,
              dlqEntryId: savedEntry.id,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      // Log the DLQ event
      this.loggerService.error(
        `Event sent to DLQ: ${event.type} for user ${event.userId}`,
        {
          eventId: event.id,
          eventType: event.type,
          userId: event.userId,
          journeyType,
          errorType: this.classifyError(error),
          errorMessage: error.message,
          retryCount,
          dlqEntryId: savedEntry.id,
        },
      );

      // Record metrics
      if (this.enableMetrics) {
        this.recordDlqMetrics(journeyType, event.type, this.classifyError(error));
      }

      // Check if alert threshold is reached
      await this.checkAlertThreshold(journeyType);

      return savedEntry;
    } catch (dlqError) {
      // Handle errors in the DLQ process itself
      this.logger.error(
        `Failed to add event to DLQ: ${dlqError.message}`,
        dlqError.stack,
      );
      throw new EventDeadLetterQueueException(
        'Failed to process dead letter queue entry',
        {
          originalError: error,
          dlqError,
          event,
        },
      );
    }
  }

  /**
   * Retrieves DLQ entries with filtering options
   * @param filters Optional filters to apply to the query
   * @param page Page number for pagination
   * @param limit Number of items per page
   */
  async getDlqEntries(
    filters?: {
      userId?: string;
      eventType?: string;
      journeyType?: JourneyType;
      errorType?: ErrorType;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 20,
  ): Promise<{ entries: DlqEntry[]; total: number; page: number; limit: number }> {
    try {
      const queryBuilder = this.dlqRepository.createQueryBuilder('dlq');

      // Apply filters
      if (filters) {
        if (filters.userId) {
          queryBuilder.andWhere('dlq.userId = :userId', {
            userId: filters.userId,
          });
        }

        if (filters.eventType) {
          queryBuilder.andWhere('dlq.eventType = :eventType', {
            eventType: filters.eventType,
          });
        }

        if (filters.journeyType) {
          queryBuilder.andWhere('dlq.journeyType = :journeyType', {
            journeyType: filters.journeyType,
          });
        }

        if (filters.errorType) {
          queryBuilder.andWhere('dlq.errorType = :errorType', {
            errorType: filters.errorType,
          });
        }

        if (filters.startDate) {
          queryBuilder.andWhere('dlq.createdAt >= :startDate', {
            startDate: filters.startDate,
          });
        }

        if (filters.endDate) {
          queryBuilder.andWhere('dlq.createdAt <= :endDate', {
            endDate: filters.endDate,
          });
        }
      }

      // Add sorting
      queryBuilder.orderBy('dlq.createdAt', 'DESC');

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute query
      const [entries, total] = await queryBuilder.getManyAndCount();

      return {
        entries,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve DLQ entries: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException('Failed to retrieve DLQ entries', {
        originalError: error,
        filters,
        page,
        limit,
      });
    }
  }

  /**
   * Retrieves a single DLQ entry by ID
   * @param id The ID of the DLQ entry to retrieve
   */
  async getDlqEntryById(id: string): Promise<DlqEntry> {
    try {
      const entry = await this.dlqRepository.findOne({ where: { id } });
      if (!entry) {
        throw new Error(`DLQ entry with ID ${id} not found`);
      }
      return entry;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve DLQ entry: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException(
        'Failed to retrieve DLQ entry',
        {
          originalError: error,
          entryId: id,
        },
      );
    }
  }

  /**
   * Reprocesses a failed event from the DLQ
   * @param id The ID of the DLQ entry to reprocess
   * @param options Optional processing options
   */
  async reprocessDlqEntry(
    id: string,
    options?: { modifyEvent?: (event: IBaseEvent) => IBaseEvent },
  ): Promise<boolean> {
    try {
      // Get the DLQ entry
      const entry = await this.getDlqEntryById(id);

      // Get the original event
      let event = entry.payload as IBaseEvent;

      // Apply modifications if provided
      if (options?.modifyEvent) {
        event = options.modifyEvent(event);
      }

      // Determine the original topic based on journey type
      const journeyType = entry.journeyType.toLowerCase();
      const topic = `${journeyType}.events`;

      // Send the event back to the original topic
      await this.kafkaService.produce({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
          },
        ],
      });

      // Update the DLQ entry status
      entry.status = 'REPROCESSED';
      entry.resolvedAt = new Date();
      entry.resolutionNotes = 'Reprocessed via admin action';
      await this.dlqRepository.save(entry);

      // Log the reprocessing
      this.loggerService.info(
        `Reprocessed DLQ entry: ${id} for event ${event.type}`,
        {
          dlqEntryId: id,
          eventId: event.id,
          eventType: event.type,
          userId: event.userId,
          journeyType: entry.journeyType,
        },
      );

      // Record metrics
      if (this.enableMetrics) {
        this.metricsService.increment('gamification.dlq.reprocessed', 1, {
          journeyType: entry.journeyType,
          eventType: entry.eventType,
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reprocess DLQ entry: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException(
        'Failed to reprocess DLQ entry',
        {
          originalError: error,
          entryId: id,
        },
      );
    }
  }

  /**
   * Marks a DLQ entry as resolved without reprocessing
   * @param id The ID of the DLQ entry to resolve
   * @param resolutionNotes Optional notes about the resolution
   */
  async resolveDlqEntry(
    id: string,
    resolutionNotes?: string,
  ): Promise<boolean> {
    try {
      // Get the DLQ entry
      const entry = await this.getDlqEntryById(id);

      // Update the DLQ entry status
      entry.status = 'RESOLVED';
      entry.resolvedAt = new Date();
      entry.resolutionNotes = resolutionNotes || 'Resolved via admin action';
      await this.dlqRepository.save(entry);

      // Log the resolution
      this.loggerService.info(`Resolved DLQ entry: ${id}`, {
        dlqEntryId: id,
        eventId: entry.eventId,
        eventType: entry.eventType,
        userId: entry.userId,
        journeyType: entry.journeyType,
        resolutionNotes: entry.resolutionNotes,
      });

      // Record metrics
      if (this.enableMetrics) {
        this.metricsService.increment('gamification.dlq.resolved', 1, {
          journeyType: entry.journeyType,
          eventType: entry.eventType,
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to resolve DLQ entry: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException('Failed to resolve DLQ entry', {
        originalError: error,
        entryId: id,
      });
    }
  }

  /**
   * Gets DLQ statistics for monitoring and alerting
   */
  async getDlqStatistics(): Promise<{
    totalEntries: number;
    entriesByJourney: Record<string, number>;
    entriesByErrorType: Record<string, number>;
    entriesByStatus: Record<string, number>;
    entriesByTimeRange: {
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
  }> {
    try {
      // Get total entries
      const totalEntries = await this.dlqRepository.count();

      // Get entries by journey
      const entriesByJourneyQuery = await this.dlqRepository
        .createQueryBuilder('dlq')
        .select('dlq.journeyType', 'journeyType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('dlq.journeyType')
        .getRawMany();

      const entriesByJourney = entriesByJourneyQuery.reduce(
        (acc, { journeyType, count }) => {
          acc[journeyType] = parseInt(count, 10);
          return acc;
        },
        {} as Record<string, number>,
      );

      // Get entries by error type
      const entriesByErrorTypeQuery = await this.dlqRepository
        .createQueryBuilder('dlq')
        .select('dlq.errorType', 'errorType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('dlq.errorType')
        .getRawMany();

      const entriesByErrorType = entriesByErrorTypeQuery.reduce(
        (acc, { errorType, count }) => {
          acc[errorType] = parseInt(count, 10);
          return acc;
        },
        {} as Record<string, number>,
      );

      // Get entries by status
      const entriesByStatusQuery = await this.dlqRepository
        .createQueryBuilder('dlq')
        .select('dlq.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('dlq.status')
        .getRawMany();

      const entriesByStatus = entriesByStatusQuery.reduce(
        (acc, { status, count }) => {
          acc[status] = parseInt(count, 10);
          return acc;
        },
        {} as Record<string, number>,
      );

      // Get entries by time range
      const now = new Date();
      const last24Hours = new Date(now);
      last24Hours.setHours(now.getHours() - 24);

      const last7Days = new Date(now);
      last7Days.setDate(now.getDate() - 7);

      const last30Days = new Date(now);
      last30Days.setDate(now.getDate() - 30);

      const entriesLast24Hours = await this.dlqRepository.count({
        where: {
          createdAt: { $gte: last24Hours },
        },
      });

      const entriesLast7Days = await this.dlqRepository.count({
        where: {
          createdAt: { $gte: last7Days },
        },
      });

      const entriesLast30Days = await this.dlqRepository.count({
        where: {
          createdAt: { $gte: last30Days },
        },
      });

      return {
        totalEntries,
        entriesByJourney,
        entriesByErrorType,
        entriesByStatus,
        entriesByTimeRange: {
          last24Hours: entriesLast24Hours,
          last7Days: entriesLast7Days,
          last30Days: entriesLast30Days,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get DLQ statistics: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException('Failed to get DLQ statistics', {
        originalError: error,
      });
    }
  }

  /**
   * Purges resolved DLQ entries older than the specified retention period
   * @param retentionDays Number of days to retain resolved entries (default: 30)
   */
  async purgeResolvedEntries(retentionDays = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.dlqRepository
        .createQueryBuilder()
        .delete()
        .from(DlqEntry)
        .where('status IN (:...statuses)', {
          statuses: ['RESOLVED', 'REPROCESSED'],
        })
        .andWhere('resolvedAt < :cutoffDate', { cutoffDate })
        .execute();

      const purgedCount = result.affected || 0;

      // Log the purge operation
      this.loggerService.info(
        `Purged ${purgedCount} resolved DLQ entries older than ${retentionDays} days`,
        {
          purgedCount,
          retentionDays,
          cutoffDate,
        },
      );

      // Record metrics
      if (this.enableMetrics) {
        this.metricsService.increment('gamification.dlq.purged', purgedCount);
      }

      return purgedCount;
    } catch (error) {
      this.logger.error(
        `Failed to purge resolved DLQ entries: ${error.message}`,
        error.stack,
      );
      throw new EventDeadLetterQueueException(
        'Failed to purge resolved DLQ entries',
        {
          originalError: error,
          retentionDays,
        },
      );
    }
  }

  /**
   * Determines the journey type from an event
   * @param event The event to classify
   * @private
   */
  private getJourneyTypeFromEvent(event: IBaseEvent): JourneyType {
    // Extract journey from event type if possible
    const eventType = event.type as EventType;
    
    if (eventType.startsWith('HEALTH_')) {
      return JourneyType.HEALTH;
    }
    
    if (eventType.startsWith('CARE_')) {
      return JourneyType.CARE;
    }
    
    if (eventType.startsWith('PLAN_')) {
      return JourneyType.PLAN;
    }
    
    // Check event payload for journey context
    if (event.data && typeof event.data === 'object') {
      if ('journeyType' in event.data) {
        return event.data.journeyType as JourneyType;
      }
      
      if ('journey' in event.data) {
        return event.data.journey as JourneyType;
      }
    }
    
    // Default to HEALTH if we can't determine
    return JourneyType.HEALTH;
  }

  /**
   * Classifies an error to determine appropriate handling
   * @param error The error to classify
   * @private
   */
  private classifyError(error: Error): ErrorType {
    // Check if the error has a type property
    if ('type' in error && typeof error['type'] === 'string') {
      return error['type'] as ErrorType;
    }

    // Check for network or connection errors
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('Connection error') ||
      error.message.includes('Network error')
    ) {
      return ErrorType.TRANSIENT;
    }

    // Check for Kafka-specific errors
    if (
      error.message.includes('Kafka') ||
      error.message.includes('broker') ||
      error.message.includes('topic')
    ) {
      return ErrorType.EXTERNAL;
    }

    // Check for validation errors
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      error.message.includes('required field')
    ) {
      return ErrorType.CLIENT;
    }

    // Default to system error
    return ErrorType.SYSTEM;
  }

  /**
   * Records metrics for DLQ entries
   * @param journeyType The journey type of the event
   * @param eventType The type of event
   * @param errorType The type of error
   * @private
   */
  private recordDlqMetrics(
    journeyType: JourneyType,
    eventType: string,
    errorType: ErrorType,
  ): void {
    try {
      // Increment total DLQ entries counter
      this.metricsService.increment('gamification.dlq.entries.total', 1);

      // Increment journey-specific counter
      this.metricsService.increment(
        `gamification.dlq.entries.journey.${journeyType.toLowerCase()}`,
        1,
      );

      // Increment error type counter
      this.metricsService.increment(
        `gamification.dlq.entries.error.${errorType.toLowerCase()}`,
        1,
      );

      // Increment event type counter
      this.metricsService.increment(
        'gamification.dlq.entries.by_event_type',
        1,
        { eventType },
      );

      // Record with all dimensions for detailed analysis
      this.metricsService.increment('gamification.dlq.entries', 1, {
        journeyType: journeyType.toLowerCase(),
        eventType,
        errorType: errorType.toLowerCase(),
      });
    } catch (error) {
      // Don't let metrics recording failures affect the main flow
      this.logger.warn(
        `Failed to record DLQ metrics: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Checks if the alert threshold has been reached and sends an alert if needed
   * @param journeyType The journey type to check
   * @private
   */
  private async checkAlertThreshold(journeyType: JourneyType): Promise<void> {
    try {
      // Count recent entries for this journey
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentCount = await this.dlqRepository.count({
        where: {
          journeyType,
          createdAt: { $gte: oneHourAgo },
          status: 'PENDING',
        },
      });

      // Check if threshold is exceeded
      if (recentCount >= this.alertThreshold) {
        // Get statistics for the alert
        const stats = await this.getDlqStatistics();

        // Send alert
        await this.alertService.sendAlert({
          name: 'GamificationDlqThresholdExceeded',
          severity: 'WARNING',
          message: `DLQ threshold exceeded for ${journeyType} journey: ${recentCount} entries in the last hour`,
          details: {
            journeyType,
            recentCount,
            threshold: this.alertThreshold,
            statistics: stats,
          },
        });

        this.logger.warn(
          `DLQ alert threshold exceeded for ${journeyType}: ${recentCount} entries in the last hour`,
        );
      }
    } catch (error) {
      // Don't let alert failures affect the main flow
      this.logger.warn(
        `Failed to check DLQ alert threshold: ${error.message}`,
        error.stack,
      );
    }
  }
}