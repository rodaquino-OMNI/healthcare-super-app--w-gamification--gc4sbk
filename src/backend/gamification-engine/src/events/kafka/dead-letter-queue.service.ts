import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { MetricsService } from '@app/shared/metrics/metrics.service';
import { EventsService } from '../events.service';
import { ProcessEventDto } from '../dto/process-event.dto';
import { DlqEntryEntity } from './entities/dlq-entry.entity';
import { IDlqEntry, DlqEntryStatus, ErrorType, DlqProcessAction } from './interfaces';
import { AlertService } from '@app/shared/alert/alert.service';

/**
 * Service that handles failed events by routing them to specialized dead-letter queues (DLQs).
 * It preserves the original message along with error details, maintains retry metadata,
 * implements alerting for critical failures, and provides tools for manual message recovery and reprocessing.
 */
@Injectable()
export class DeadLetterQueueService implements OnModuleInit {
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private readonly dlqTopicPrefix: string;
  private readonly maxRetryAttempts: number;
  private readonly alertThreshold: number;
  private readonly journeyDlqTopics: Map<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly metricsService: MetricsService,
    private readonly alertService: AlertService,
    private readonly eventsService: EventsService,
    @InjectRepository(DlqEntryEntity)
    private readonly dlqRepository: Repository<DlqEntryEntity>,
  ) {
    this.dlqTopicPrefix = this.configService.get<string>('gamificationEngine.kafka.dlqTopicPrefix', 'gamification.dlq');
    this.maxRetryAttempts = this.configService.get<number>('gamificationEngine.kafka.maxRetryAttempts', 3);
    this.alertThreshold = this.configService.get<number>('gamificationEngine.kafka.dlqAlertThreshold', 10);
    
    // Initialize journey-specific DLQ topics
    this.journeyDlqTopics = new Map<string, string>([
      ['health', `${this.dlqTopicPrefix}.health`],
      ['care', `${this.dlqTopicPrefix}.care`],
      ['plan', `${this.dlqTopicPrefix}.plan`],
      ['default', `${this.dlqTopicPrefix}.default`],
    ]);
  }

  async onModuleInit() {
    this.logger.log('Initializing Dead Letter Queue Service');
    
    // Initialize metrics collectors
    this.initializeMetrics();
    
    // Check for DLQ entries that exceed alert threshold
    await this.checkAlertThreshold();
    
    this.logger.log('Dead Letter Queue Service initialized successfully');
  }

  /**
   * Adds a failed event to the appropriate dead-letter queue based on its journey
   * @param event The original event that failed processing
   * @param error The error that occurred during processing
   * @param retryCount The number of retry attempts made
   * @returns The created DLQ entry
   */
  async addToDlq(event: ProcessEventDto, error: Error, retryCount = 0): Promise<DlqEntryEntity> {
    const traceId = this.tracingService.getCurrentTraceId();
    const journey = event.journey || 'default';
    const errorType = this.classifyError(error);
    
    this.loggerService.error(
      `Adding event to DLQ: ${event.type} for user ${event.userId} (journey: ${journey})`,
      {
        error: error.message,
        stack: error.stack,
        eventType: event.type,
        userId: event.userId,
        journey,
        retryCount,
        errorType,
        traceId,
      },
    );

    // Create DLQ entry in database
    const dlqEntry = new DlqEntryEntity();
    dlqEntry.eventType = event.type;
    dlqEntry.userId = event.userId;
    dlqEntry.journey = journey;
    dlqEntry.payload = event;
    dlqEntry.errorMessage = error.message;
    dlqEntry.errorStack = error.stack;
    dlqEntry.errorType = errorType;
    dlqEntry.retryCount = retryCount;
    dlqEntry.status = DlqEntryStatus.PENDING;
    dlqEntry.traceId = traceId;
    
    const savedEntry = await this.dlqRepository.save(dlqEntry);
    
    // Publish to journey-specific DLQ topic
    await this.publishToDlqTopic(savedEntry);
    
    // Update metrics
    this.updateDlqMetrics(journey, errorType);
    
    // Check if we need to send an alert
    await this.checkAlertThreshold(journey);
    
    return savedEntry;
  }

  /**
   * Publishes a DLQ entry to the appropriate Kafka topic based on journey
   * @param dlqEntry The DLQ entry to publish
   */
  private async publishToDlqTopic(dlqEntry: DlqEntryEntity): Promise<void> {
    const journey = dlqEntry.journey || 'default';
    const topic = this.journeyDlqTopics.get(journey) || this.journeyDlqTopics.get('default');
    
    try {
      await this.kafkaService.produce({
        topic,
        messages: [
          {
            key: dlqEntry.id,
            value: JSON.stringify({
              id: dlqEntry.id,
              eventType: dlqEntry.eventType,
              userId: dlqEntry.userId,
              journey: dlqEntry.journey,
              errorType: dlqEntry.errorType,
              errorMessage: dlqEntry.errorMessage,
              retryCount: dlqEntry.retryCount,
              createdAt: dlqEntry.createdAt,
              payload: dlqEntry.payload,
            }),
          },
        ],
      });
      
      this.loggerService.log(
        `Published DLQ entry to topic ${topic}`,
        {
          dlqEntryId: dlqEntry.id,
          eventType: dlqEntry.eventType,
          userId: dlqEntry.userId,
          journey: dlqEntry.journey,
        },
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to publish DLQ entry to topic ${topic}`,
        {
          error: error.message,
          stack: error.stack,
          dlqEntryId: dlqEntry.id,
          eventType: dlqEntry.eventType,
          userId: dlqEntry.userId,
          journey: dlqEntry.journey,
        },
      );
    }
  }

  /**
   * Classifies an error to determine its type for appropriate handling
   * @param error The error to classify
   * @returns The classified error type
   */
  private classifyError(error: Error): ErrorType {
    // Check for network or connection errors (transient)
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('Connection error') ||
      error.message.includes('Network error')
    ) {
      return ErrorType.TRANSIENT;
    }
    
    // Check for validation errors (client)
    if (
      error.message.includes('Validation failed') ||
      error.message.includes('Invalid input') ||
      error.name === 'ValidationError' ||
      error.name === 'BadRequestException'
    ) {
      return ErrorType.CLIENT;
    }
    
    // Check for external dependency errors
    if (
      error.message.includes('External service unavailable') ||
      error.message.includes('Third-party API error')
    ) {
      return ErrorType.EXTERNAL;
    }
    
    // Default to system error
    return ErrorType.SYSTEM;
  }

  /**
   * Retrieves DLQ entries based on various filters
   * @param filters Filters to apply to the query
   * @param page Page number for pagination
   * @param limit Number of items per page
   * @returns Paginated list of DLQ entries
   */
  async getDlqEntries(
    filters: {
      userId?: string;
      journey?: string;
      eventType?: string;
      errorType?: ErrorType;
      status?: DlqEntryStatus;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page = 1,
    limit = 20,
  ): Promise<{ entries: DlqEntryEntity[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.dlqRepository.createQueryBuilder('dlq');
    
    // Apply filters
    if (filters.userId) {
      queryBuilder.andWhere('dlq.userId = :userId', { userId: filters.userId });
    }
    
    if (filters.journey) {
      queryBuilder.andWhere('dlq.journey = :journey', { journey: filters.journey });
    }
    
    if (filters.eventType) {
      queryBuilder.andWhere('dlq.eventType = :eventType', { eventType: filters.eventType });
    }
    
    if (filters.errorType) {
      queryBuilder.andWhere('dlq.errorType = :errorType', { errorType: filters.errorType });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('dlq.status = :status', { status: filters.status });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere('dlq.createdAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('dlq.createdAt <= :endDate', { endDate: filters.endDate });
    }
    
    // Add pagination
    queryBuilder.skip(skip).take(limit);
    
    // Order by creation date (newest first)
    queryBuilder.orderBy('dlq.createdAt', 'DESC');
    
    const [entries, total] = await queryBuilder.getManyAndCount();
    
    return {
      entries,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves a single DLQ entry by ID
   * @param id The ID of the DLQ entry to retrieve
   * @returns The DLQ entry if found, null otherwise
   */
  async getDlqEntryById(id: string): Promise<DlqEntryEntity | null> {
    return this.dlqRepository.findOne({ where: { id } });
  }

  /**
   * Processes a DLQ entry based on the specified action
   * @param id The ID of the DLQ entry to process
   * @param action The action to perform (REPROCESS, RESOLVE, IGNORE)
   * @param comment Optional comment explaining the action
   * @returns The updated DLQ entry
   */
  async processDlqEntry(
    id: string,
    action: DlqProcessAction,
    comment?: string,
  ): Promise<DlqEntryEntity> {
    const dlqEntry = await this.getDlqEntryById(id);
    
    if (!dlqEntry) {
      throw new Error(`DLQ entry with ID ${id} not found`);
    }
    
    // Create a span for tracing this operation
    const span = this.tracingService.createSpan('processDlqEntry');
    span.setTag('dlqEntryId', id);
    span.setTag('action', action);
    
    try {
      switch (action) {
        case DlqProcessAction.REPROCESS:
          return await this.reprocessDlqEntry(dlqEntry, comment);
        
        case DlqProcessAction.RESOLVE:
          return await this.resolveDlqEntry(dlqEntry, comment);
        
        case DlqProcessAction.IGNORE:
          return await this.ignoreDlqEntry(dlqEntry, comment);
        
        default:
          throw new Error(`Unknown DLQ process action: ${action}`);
      }
    } finally {
      span.finish();
    }
  }

  /**
   * Reprocesses a failed event from the DLQ
   * @param dlqEntry The DLQ entry to reprocess
   * @param comment Optional comment explaining the reprocessing
   * @returns The updated DLQ entry
   */
  private async reprocessDlqEntry(
    dlqEntry: DlqEntryEntity,
    comment?: string,
  ): Promise<DlqEntryEntity> {
    this.loggerService.log(
      `Reprocessing DLQ entry: ${dlqEntry.id}`,
      {
        dlqEntryId: dlqEntry.id,
        eventType: dlqEntry.eventType,
        userId: dlqEntry.userId,
        journey: dlqEntry.journey,
        comment,
      },
    );
    
    // Update status to REPROCESSING
    dlqEntry.status = DlqEntryStatus.REPROCESSING;
    dlqEntry.processedAt = new Date();
    dlqEntry.processingComment = comment;
    await this.dlqRepository.save(dlqEntry);
    
    try {
      // Attempt to reprocess the event
      const result = await this.eventsService.processEvent(dlqEntry.payload as ProcessEventDto);
      
      // Update DLQ entry with success status
      dlqEntry.status = DlqEntryStatus.REPROCESSED;
      dlqEntry.resolutionDetails = JSON.stringify(result);
      dlqEntry.resolvedAt = new Date();
      
      // Update metrics
      this.metricsService.increment('gamification_dlq_reprocessed_total', {
        journey: dlqEntry.journey || 'default',
        event_type: dlqEntry.eventType,
      });
      
      return await this.dlqRepository.save(dlqEntry);
    } catch (error) {
      // Update DLQ entry with failure status
      dlqEntry.status = DlqEntryStatus.REPROCESS_FAILED;
      dlqEntry.errorMessage = error.message;
      dlqEntry.errorStack = error.stack;
      dlqEntry.retryCount += 1;
      
      // Update metrics
      this.metricsService.increment('gamification_dlq_reprocess_failed_total', {
        journey: dlqEntry.journey || 'default',
        event_type: dlqEntry.eventType,
        error_type: this.classifyError(error),
      });
      
      return await this.dlqRepository.save(dlqEntry);
    }
  }

  /**
   * Marks a DLQ entry as resolved without reprocessing
   * @param dlqEntry The DLQ entry to resolve
   * @param comment Optional comment explaining the resolution
   * @returns The updated DLQ entry
   */
  private async resolveDlqEntry(
    dlqEntry: DlqEntryEntity,
    comment?: string,
  ): Promise<DlqEntryEntity> {
    this.loggerService.log(
      `Resolving DLQ entry: ${dlqEntry.id}`,
      {
        dlqEntryId: dlqEntry.id,
        eventType: dlqEntry.eventType,
        userId: dlqEntry.userId,
        journey: dlqEntry.journey,
        comment,
      },
    );
    
    // Update DLQ entry with resolved status
    dlqEntry.status = DlqEntryStatus.RESOLVED;
    dlqEntry.processedAt = new Date();
    dlqEntry.resolvedAt = new Date();
    dlqEntry.processingComment = comment;
    
    // Update metrics
    this.metricsService.increment('gamification_dlq_resolved_total', {
      journey: dlqEntry.journey || 'default',
      event_type: dlqEntry.eventType,
    });
    
    return await this.dlqRepository.save(dlqEntry);
  }

  /**
   * Marks a DLQ entry as ignored (will not be reprocessed or resolved)
   * @param dlqEntry The DLQ entry to ignore
   * @param comment Optional comment explaining why the entry is being ignored
   * @returns The updated DLQ entry
   */
  private async ignoreDlqEntry(
    dlqEntry: DlqEntryEntity,
    comment?: string,
  ): Promise<DlqEntryEntity> {
    this.loggerService.log(
      `Ignoring DLQ entry: ${dlqEntry.id}`,
      {
        dlqEntryId: dlqEntry.id,
        eventType: dlqEntry.eventType,
        userId: dlqEntry.userId,
        journey: dlqEntry.journey,
        comment,
      },
    );
    
    // Update DLQ entry with ignored status
    dlqEntry.status = DlqEntryStatus.IGNORED;
    dlqEntry.processedAt = new Date();
    dlqEntry.processingComment = comment;
    
    // Update metrics
    this.metricsService.increment('gamification_dlq_ignored_total', {
      journey: dlqEntry.journey || 'default',
      event_type: dlqEntry.eventType,
    });
    
    return await this.dlqRepository.save(dlqEntry);
  }

  /**
   * Initializes metrics collectors for DLQ monitoring
   */
  private initializeMetrics(): void {
    // Register gauges for current DLQ counts
    this.metricsService.registerGauge('gamification_dlq_entries_total', 'Total number of entries in the DLQ');
    this.metricsService.registerGauge('gamification_dlq_entries_by_journey', 'Number of DLQ entries by journey');
    this.metricsService.registerGauge('gamification_dlq_entries_by_error_type', 'Number of DLQ entries by error type');
    
    // Register counters for DLQ operations
    this.metricsService.registerCounter('gamification_dlq_added_total', 'Total number of entries added to the DLQ');
    this.metricsService.registerCounter('gamification_dlq_reprocessed_total', 'Total number of DLQ entries reprocessed');
    this.metricsService.registerCounter('gamification_dlq_reprocess_failed_total', 'Total number of DLQ entries that failed reprocessing');
    this.metricsService.registerCounter('gamification_dlq_resolved_total', 'Total number of DLQ entries resolved');
    this.metricsService.registerCounter('gamification_dlq_ignored_total', 'Total number of DLQ entries ignored');
    
    // Schedule periodic updates of gauge metrics
    setInterval(() => this.updateDlqGaugeMetrics(), 60000); // Update every minute
  }

  /**
   * Updates gauge metrics with current DLQ counts
   */
  private async updateDlqGaugeMetrics(): Promise<void> {
    try {
      // Update total DLQ entries gauge
      const totalCount = await this.dlqRepository.count();
      this.metricsService.setGauge('gamification_dlq_entries_total', totalCount);
      
      // Update DLQ entries by journey
      const journeyCounts = await this.dlqRepository
        .createQueryBuilder('dlq')
        .select('dlq.journey', 'journey')
        .addSelect('COUNT(*)', 'count')
        .groupBy('dlq.journey')
        .getRawMany();
      
      journeyCounts.forEach((row) => {
        this.metricsService.setGauge('gamification_dlq_entries_by_journey', parseInt(row.count, 10), {
          journey: row.journey || 'default',
        });
      });
      
      // Update DLQ entries by error type
      const errorTypeCounts = await this.dlqRepository
        .createQueryBuilder('dlq')
        .select('dlq.errorType', 'errorType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('dlq.errorType')
        .getRawMany();
      
      errorTypeCounts.forEach((row) => {
        this.metricsService.setGauge('gamification_dlq_entries_by_error_type', parseInt(row.count, 10), {
          error_type: row.errorType,
        });
      });
    } catch (error) {
      this.loggerService.error(
        'Failed to update DLQ gauge metrics',
        {
          error: error.message,
          stack: error.stack,
        },
      );
    }
  }

  /**
   * Updates DLQ metrics when a new entry is added
   * @param journey The journey of the failed event
   * @param errorType The type of error that occurred
   */
  private updateDlqMetrics(journey: string, errorType: ErrorType): void {
    this.metricsService.increment('gamification_dlq_added_total', {
      journey: journey || 'default',
      error_type: errorType,
    });
  }

  /**
   * Checks if the number of DLQ entries exceeds the alert threshold
   * @param journey Optional journey to check specifically
   */
  private async checkAlertThreshold(journey?: string): Promise<void> {
    try {
      let queryBuilder = this.dlqRepository.createQueryBuilder('dlq');
      
      // If journey is specified, filter by it
      if (journey) {
        queryBuilder = queryBuilder.where('dlq.journey = :journey', { journey });
      }
      
      // Count entries in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      queryBuilder = queryBuilder.andWhere('dlq.createdAt >= :oneHourAgo', { oneHourAgo });
      
      const count = await queryBuilder.getCount();
      
      // If count exceeds threshold, send an alert
      if (count >= this.alertThreshold) {
        const alertMessage = journey
          ? `High number of DLQ entries (${count}) for journey ${journey} in the last hour`
          : `High number of DLQ entries (${count}) across all journeys in the last hour`;
        
        this.alertService.sendAlert({
          name: 'GamificationDlqThresholdExceeded',
          message: alertMessage,
          severity: 'warning',
          tags: {
            journey: journey || 'all',
            count: count.toString(),
            threshold: this.alertThreshold.toString(),
          },
        });
        
        this.loggerService.warn(
          alertMessage,
          {
            count,
            threshold: this.alertThreshold,
            journey: journey || 'all',
          },
        );
      }
    } catch (error) {
      this.loggerService.error(
        'Failed to check DLQ alert threshold',
        {
          error: error.message,
          stack: error.stack,
          journey: journey || 'all',
        },
      );
    }
  }

  /**
   * Gets statistics about the DLQ entries
   * @returns Statistics about DLQ entries
   */
  async getDlqStatistics(): Promise<{
    total: number;
    byJourney: Record<string, number>;
    byErrorType: Record<string, number>;
    byStatus: Record<string, number>;
    byTimeRange: {
      lastHour: number;
      last24Hours: number;
      last7Days: number;
    };
  }> {
    // Get total count
    const total = await this.dlqRepository.count();
    
    // Get counts by journey
    const journeyCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.journey', 'journey')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dlq.journey')
      .getRawMany();
    
    const byJourney: Record<string, number> = {};
    journeyCounts.forEach((row) => {
      byJourney[row.journey || 'default'] = parseInt(row.count, 10);
    });
    
    // Get counts by error type
    const errorTypeCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.errorType', 'errorType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dlq.errorType')
      .getRawMany();
    
    const byErrorType: Record<string, number> = {};
    errorTypeCounts.forEach((row) => {
      byErrorType[row.errorType] = parseInt(row.count, 10);
    });
    
    // Get counts by status
    const statusCounts = await this.dlqRepository
      .createQueryBuilder('dlq')
      .select('dlq.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dlq.status')
      .getRawMany();
    
    const byStatus: Record<string, number> = {};
    statusCounts.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });
    
    // Get counts by time range
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const lastHour = await this.dlqRepository.count({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });
    
    const last24Hours = await this.dlqRepository.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });
    
    const last7Days = await this.dlqRepository.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });
    
    return {
      total,
      byJourney,
      byErrorType,
      byStatus,
      byTimeRange: {
        lastHour,
        last24Hours,
        last7Days,
      },
    };
  }
}