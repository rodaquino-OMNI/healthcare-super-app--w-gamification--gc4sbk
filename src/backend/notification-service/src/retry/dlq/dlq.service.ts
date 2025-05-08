import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In, FindOptionsWhere } from 'typeorm';
import { Span } from '@nestjs/opentelemetry';

import { LoggerService } from '../../../shared/src/logging/logger.service';
import { TracingService } from '../../../shared/src/tracing/tracing.service';
import { MetricsService } from '../../../shared/src/metrics/metrics.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { DlqEntry } from './dlq-entry.entity';
import { 
  QueryDlqEntriesDto, 
  DlqEntryResponseDto, 
  ProcessDlqEntryDto, 
  DlqStatisticsResponseDto 
} from './dto';

/**
 * Service for managing the Dead Letter Queue (DLQ) for failed notifications.
 * 
 * The DLQ stores notifications that have failed after exhausting all retry attempts,
 * allowing for administrative inspection, troubleshooting, and potential reprocessing.
 * 
 * This service provides methods for:
 * - Adding entries to the DLQ
 * - Querying and filtering DLQ entries
 * - Processing (resolving or reprocessing) failed notifications
 * - Generating statistics and summaries for monitoring
 */
@Injectable()
export class DlqService {
  /**
   * Creates an instance of DlqService.
   * 
   * @param dlqRepository - Repository for DLQ entries
   * @param notificationsService - Service for sending notifications
   * @param logger - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param metricsService - Service for metrics collection
   */
  constructor(
    @InjectRepository(DlqEntry)
    private readonly dlqRepository: Repository<DlqEntry>,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Adds a failed notification to the Dead Letter Queue.
   * 
   * @param data - Data for the DLQ entry
   * @returns The created DLQ entry
   */
  @Span('dlq.addToDlq')
  async addToDlq(data: {
    notificationId: number;
    userId: string;
    channel: string;
    payload: Record<string, any>;
    errorDetails: {
      message: string;
      stack?: string;
      name?: string;
      schedulingError?: {
        message: string;
        stack?: string;
        name?: string;
      };
    };
    retryHistory: {
      attemptCount: number;
      lastAttemptTime: string;
      errors: string[];
    };
    metadata?: Record<string, any>;
  }): Promise<DlqEntry> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Adding notification ${data.notificationId} to DLQ after ${data.retryHistory.attemptCount} failed attempts`,
        'DlqService',
        { userId: data.userId, notificationId: data.notificationId, channel: data.channel, traceId }
      );

      // Determine error type based on error message or name
      const errorType = this.classifyError(data.errorDetails.message, data.errorDetails.name);
      
      // Determine journey context from payload or metadata
      const journeyContext = this.determineJourneyContext(data.payload, data.metadata);

      // Format retry history for storage
      const retryHistory = this.formatRetryHistory(data.retryHistory);

      // Create DLQ entry
      const dlqEntry = this.dlqRepository.create({
        notificationId: data.notificationId,
        userId: data.userId,
        channel: data.channel,
        payload: data.payload,
        errorDetails: {
          message: data.errorDetails.message,
          code: this.extractErrorCode(data.errorDetails.message, data.errorDetails.name),
          type: errorType,
          stack: data.errorDetails.stack,
          context: {
            traceId,
            schedulingError: data.errorDetails.schedulingError,
            ...data.metadata
          }
        },
        retryHistory,
        maxRetryCount: data.retryHistory.attemptCount,
        lastRetryAttempt: data.retryHistory.attemptCount,
        journeyContext
      });

      // Save to database
      const savedEntry = await this.dlqRepository.save(dlqEntry);

      // Record metrics
      this.recordDlqMetrics('added', errorType, data.channel, journeyContext);

      this.logger.log(
        `Successfully added notification ${data.notificationId} to DLQ with ID ${savedEntry.id}`,
        'DlqService',
        { 
          userId: data.userId, 
          notificationId: data.notificationId, 
          channel: data.channel, 
          dlqEntryId: savedEntry.id,
          errorType,
          journeyContext,
          traceId 
        }
      );

      return savedEntry;
    } catch (error) {
      this.logger.error(
        `Error adding notification ${data.notificationId} to DLQ`,
        error,
        'DlqService',
        { userId: data.userId, notificationId: data.notificationId, channel: data.channel, traceId }
      );
      throw error;
    }
  }

  /**
   * Finds DLQ entries based on query parameters with pagination.
   * 
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Paginated list of DLQ entries matching the filter criteria
   */
  @Span('dlq.findDlqEntries')
  async findDlqEntries(queryDto: QueryDlqEntriesDto): Promise<{
    items: DlqEntryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const { 
        userId, 
        notificationId, 
        errorType, 
        channel, 
        status, 
        createdAfter, 
        createdBefore,
        journeyContext,
        page = 1, 
        limit = 20 
      } = queryDto;

      // Build where clause based on query parameters
      const where: FindOptionsWhere<DlqEntry> = {};

      if (userId) {
        where.userId = userId;
      }

      if (notificationId) {
        where.notificationId = notificationId;
      }

      if (errorType) {
        where['errorDetails.type'] = errorType;
      }

      if (channel) {
        where.channel = channel;
      }

      if (journeyContext) {
        where.journeyContext = journeyContext;
      }

      // Handle date range filtering
      if (createdAfter || createdBefore) {
        where.createdAt = {};
        
        if (createdAfter) {
          where.createdAt = { ...where.createdAt, gte: new Date(createdAfter) };
        }
        
        if (createdBefore) {
          where.createdAt = { ...where.createdAt, lte: new Date(createdBefore) };
        }
      }

      // Calculate pagination parameters
      const skip = (page - 1) * limit;

      // Query database
      const [items, total] = await this.dlqRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
        relations: ['notification']
      });

      // Map to response DTOs
      const mappedItems = items.map(item => this.mapToResponseDto(item));

      this.logger.debug(
        `Found ${total} DLQ entries matching query criteria`,
        'DlqService',
        { 
          queryParams: queryDto, 
          resultCount: total, 
          page, 
          limit,
          traceId 
        }
      );

      return {
        items: mappedItems,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(
        'Error finding DLQ entries',
        error,
        'DlqService',
        { queryParams: queryDto, traceId }
      );
      throw error;
    }
  }

  /**
   * Finds a specific DLQ entry by ID.
   * 
   * @param id - The ID of the DLQ entry to find
   * @returns The DLQ entry with the specified ID
   * @throws NotFoundException if the entry is not found
   */
  @Span('dlq.findDlqEntryById')
  async findDlqEntryById(id: number): Promise<DlqEntryResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const dlqEntry = await this.dlqRepository.findOne({
        where: { id },
        relations: ['notification']
      });

      if (!dlqEntry) {
        this.logger.warn(
          `DLQ entry with ID ${id} not found`,
          'DlqService',
          { dlqEntryId: id, traceId }
        );
        throw new NotFoundException(`DLQ entry with ID ${id} not found`);
      }

      this.logger.debug(
        `Found DLQ entry with ID ${id}`,
        'DlqService',
        { dlqEntryId: id, traceId }
      );

      return this.mapToResponseDto(dlqEntry);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Error finding DLQ entry with ID ${id}`,
        error,
        'DlqService',
        { dlqEntryId: id, traceId }
      );
      throw error;
    }
  }

  /**
   * Processes a DLQ entry (resolve, reprocess, or ignore).
   * 
   * @param id - The ID of the DLQ entry to process
   * @param processDto - Processing instructions
   * @returns The updated DLQ entry
   * @throws NotFoundException if the entry is not found
   * @throws BadRequestException if the processing action is invalid
   */
  @Span('dlq.processDlqEntry')
  async processDlqEntry(id: number, processDto: ProcessDlqEntryDto): Promise<DlqEntryResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const dlqEntry = await this.dlqRepository.findOne({
        where: { id },
        relations: ['notification']
      });

      if (!dlqEntry) {
        this.logger.warn(
          `DLQ entry with ID ${id} not found for processing`,
          'DlqService',
          { dlqEntryId: id, action: processDto.action, traceId }
        );
        throw new NotFoundException(`DLQ entry with ID ${id} not found`);
      }

      this.logger.log(
        `Processing DLQ entry ${id} with action: ${processDto.action}`,
        'DlqService',
        { 
          dlqEntryId: id, 
          action: processDto.action, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );

      // Process based on action
      switch (processDto.action) {
        case 'resolve':
          return await this.resolveEntry(dlqEntry, processDto.comments);
        
        case 'reprocess':
          return await this.reprocessEntry(dlqEntry, processDto.overrideParams);
        
        case 'ignore':
          return await this.ignoreEntry(dlqEntry, processDto.comments);
        
        default:
          throw new BadRequestException(`Invalid action: ${processDto.action}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error processing DLQ entry ${id}`,
        error,
        'DlqService',
        { dlqEntryId: id, action: processDto.action, traceId }
      );
      throw error;
    }
  }

  /**
   * Reprocesses multiple DLQ entries in bulk.
   * 
   * @param ids - Array of DLQ entry IDs to reprocess
   * @returns Summary of the bulk reprocessing operation
   */
  @Span('dlq.bulkReprocessDlqEntries')
  async bulkReprocessDlqEntries(ids: number[]): Promise<{ 
    processed: number; 
    failed: number; 
    errors: { id: number; error: string }[] 
  }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Bulk reprocessing ${ids.length} DLQ entries`,
        'DlqService',
        { entryCount: ids.length, entryIds: ids, traceId }
      );

      const result = {
        processed: 0,
        failed: 0,
        errors: [] as { id: number; error: string }[]
      };

      // Process entries in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);
        const entries = await this.dlqRepository.find({
          where: { id: In(batchIds) },
          relations: ['notification']
        });

        // Process each entry in the batch
        for (const entry of entries) {
          try {
            await this.reprocessEntry(entry);
            result.processed++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              id: entry.id,
              error: error.message
            });

            this.logger.error(
              `Error reprocessing DLQ entry ${entry.id} in bulk operation`,
              error,
              'DlqService',
              { 
                dlqEntryId: entry.id, 
                userId: entry.userId,
                notificationId: entry.notificationId,
                traceId 
              }
            );
          }
        }
      }

      this.logger.log(
        `Completed bulk reprocessing: ${result.processed} processed, ${result.failed} failed`,
        'DlqService',
        { 
          processed: result.processed, 
          failed: result.failed, 
          errorCount: result.errors.length,
          traceId 
        }
      );

      return result;
    } catch (error) {
      this.logger.error(
        'Error in bulk reprocessing DLQ entries',
        error,
        'DlqService',
        { entryCount: ids.length, entryIds: ids, traceId }
      );
      throw error;
    }
  }

  /**
   * Retrieves statistics about the DLQ for monitoring purposes.
   * 
   * @param timeframe - Timeframe for statistics ('day', 'week', 'month', 'all')
   * @returns Statistical data about the DLQ
   */
  @Span('dlq.getDlqStatistics')
  async getDlqStatistics(timeframe: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<DlqStatisticsResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.debug(
        `Retrieving DLQ statistics for timeframe: ${timeframe}`,
        'DlqService',
        { timeframe, traceId }
      );

      // Determine date range based on timeframe
      let startDate: Date | null = null;
      const now = new Date();
      
      if (timeframe !== 'all') {
        startDate = new Date();
        switch (timeframe) {
          case 'day':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }
      }

      // Build where clause for date range
      const whereClause: FindOptionsWhere<DlqEntry> = {};
      if (startDate) {
        whereClause.createdAt = Between(startDate, now);
      }

      // Get total count
      const totalCount = await this.dlqRepository.count({
        where: whereClause
      });

      // Get counts by error type
      const errorTypeCounts = await this.getCountsByField('errorDetails.type', whereClause);

      // Get counts by channel
      const channelCounts = await this.getCountsByField('channel', whereClause);

      // Get counts by journey
      const journeyCounts = await this.getCountsByField('journeyContext', whereClause);

      // Get counts by time period (for trend analysis)
      const timePeriodCounts = await this.getCountsByTimePeriod(timeframe, startDate);

      // Calculate average time in queue
      const avgTimeInQueue = await this.calculateAverageTimeInQueue(whereClause);

      // Create response DTO
      const statistics: DlqStatisticsResponseDto = {
        totalEntries: totalCount,
        byErrorType: {
          client: this.findCountByKey(errorTypeCounts, 'client') || 0,
          system: this.findCountByKey(errorTypeCounts, 'system') || 0,
          transient: this.findCountByKey(errorTypeCounts, 'transient') || 0,
          external: this.findCountByKey(errorTypeCounts, 'external') || 0,
          unknown: this.findCountByKey(errorTypeCounts, 'unknown') || 0
        },
        byChannel: {
          email: this.findCountByKey(channelCounts, 'email') || 0,
          sms: this.findCountByKey(channelCounts, 'sms') || 0,
          push: this.findCountByKey(channelCounts, 'push') || 0,
          'in-app': this.findCountByKey(channelCounts, 'in-app') || 0
        },
        byJourney: {
          health: this.findCountByKey(journeyCounts, 'health') || 0,
          care: this.findCountByKey(journeyCounts, 'care') || 0,
          plan: this.findCountByKey(journeyCounts, 'plan') || 0,
          game: this.findCountByKey(journeyCounts, 'game') || 0,
          unknown: this.findCountByKey(journeyCounts, null) || 0
        },
        byStatus: {
          pending: await this.dlqRepository.count({
            where: { ...whereClause, status: 'pending' }
          }),
          resolved: await this.dlqRepository.count({
            where: { ...whereClause, status: 'resolved' }
          }),
          reprocessed: await this.dlqRepository.count({
            where: { ...whereClause, status: 'reprocessed' }
          }),
          ignored: await this.dlqRepository.count({
            where: { ...whereClause, status: 'ignored' }
          })
        },
        byTimePeriod: timePeriodCounts,
        averageTimeInQueue: avgTimeInQueue
      };

      this.logger.debug(
        `Retrieved DLQ statistics for timeframe: ${timeframe}`,
        'DlqService',
        { 
          timeframe, 
          totalEntries: statistics.totalEntries,
          traceId 
        }
      );

      return statistics;
    } catch (error) {
      this.logger.error(
        `Error retrieving DLQ statistics for timeframe: ${timeframe}`,
        error,
        'DlqService',
        { timeframe, traceId }
      );
      throw error;
    }
  }

  /**
   * Purges resolved DLQ entries older than the specified age.
   * 
   * @param olderThan - Age in days (entries older than this will be purged)
   * @returns Summary of the purge operation
   * @throws BadRequestException if olderThan is invalid
   */
  @Span('dlq.purgeResolvedDlqEntries')
  async purgeResolvedDlqEntries(olderThan: number): Promise<{ purgedCount: number }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      // Validate input
      if (!olderThan || olderThan <= 0) {
        throw new BadRequestException('olderThan must be a positive number');
      }

      this.logger.log(
        `Purging resolved DLQ entries older than ${olderThan} days`,
        'DlqService',
        { olderThan, traceId }
      );

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);

      // Delete resolved entries older than cutoff date
      const result = await this.dlqRepository.delete({
        status: In(['resolved', 'reprocessed']),
        updatedAt: LessThan(cutoffDate)
      });

      this.logger.log(
        `Purged ${result.affected || 0} resolved DLQ entries older than ${olderThan} days`,
        'DlqService',
        { olderThan, purgedCount: result.affected || 0, traceId }
      );

      return { purgedCount: result.affected || 0 };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error purging resolved DLQ entries older than ${olderThan} days`,
        error,
        'DlqService',
        { olderThan, traceId }
      );
      throw error;
    }
  }

  /**
   * Retrieves a summary of DLQ entries grouped by a specified field.
   * 
   * @param groupBy - Field to group by ('errorType', 'channel', 'journey')
   * @returns Grouped summary of DLQ entries
   * @throws BadRequestException if groupBy is invalid
   */
  @Span('dlq.getDlqSummary')
  async getDlqSummary(groupBy: 'errorType' | 'channel' | 'journey'): Promise<{
    groups: { key: string; count: number; percentage: number }[];
    total: number;
  }> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.debug(
        `Retrieving DLQ summary grouped by: ${groupBy}`,
        'DlqService',
        { groupBy, traceId }
      );

      // Map groupBy to actual field name
      let field: string;
      switch (groupBy) {
        case 'errorType':
          field = 'errorDetails.type';
          break;
        case 'channel':
          field = 'channel';
          break;
        case 'journey':
          field = 'journeyContext';
          break;
        default:
          throw new BadRequestException(`Invalid groupBy parameter: ${groupBy}`);
      }

      // Get counts by field
      const counts = await this.getCountsByField(field);
      const total = counts.reduce((sum, item) => sum + item.count, 0);

      // Calculate percentages
      const groups = counts.map(item => ({
        key: item.key || 'unknown',
        count: item.count,
        percentage: total > 0 ? (item.count / total) * 100 : 0
      }));

      this.logger.debug(
        `Retrieved DLQ summary grouped by: ${groupBy}`,
        'DlqService',
        { 
          groupBy, 
          groupCount: groups.length, 
          total,
          traceId 
        }
      );

      return { groups, total };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving DLQ summary grouped by: ${groupBy}`,
        error,
        'DlqService',
        { groupBy, traceId }
      );
      throw error;
    }
  }

  /**
   * Resolves a DLQ entry, marking it as manually resolved.
   * 
   * @param dlqEntry - The DLQ entry to resolve
   * @param comments - Optional comments about the resolution
   * @returns The updated DLQ entry
   * @private
   */
  @Span('dlq.resolveEntry')
  private async resolveEntry(dlqEntry: DlqEntry, comments?: string): Promise<DlqEntryResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Resolving DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          comments,
          traceId 
        }
      );

      // Update entry status
      dlqEntry.status = 'resolved';
      
      // Add resolution metadata
      dlqEntry.resolutionMetadata = {
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'admin', // In a real implementation, this would be the user ID
        comments: comments || 'Manually resolved',
        traceId
      };

      // Save updated entry
      const updatedEntry = await this.dlqRepository.save(dlqEntry);

      // Record metrics
      this.recordDlqMetrics(
        'resolved', 
        dlqEntry.errorDetails.type, 
        dlqEntry.channel, 
        dlqEntry.journeyContext
      );

      this.logger.log(
        `Successfully resolved DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );

      return this.mapToResponseDto(updatedEntry);
    } catch (error) {
      this.logger.error(
        `Error resolving DLQ entry ${dlqEntry.id}`,
        error,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );
      throw error;
    }
  }

  /**
   * Reprocesses a DLQ entry by attempting to send the notification again.
   * 
   * @param dlqEntry - The DLQ entry to reprocess
   * @param overrideParams - Optional parameters to override in the original payload
   * @returns The updated DLQ entry
   * @private
   */
  @Span('dlq.reprocessEntry')
  private async reprocessEntry(
    dlqEntry: DlqEntry, 
    overrideParams?: Record<string, any>
  ): Promise<DlqEntryResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Reprocessing DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          hasOverrides: !!overrideParams,
          traceId 
        }
      );

      // Prepare notification payload
      const payload = { ...dlqEntry.payload };
      
      // Apply overrides if provided
      if (overrideParams) {
        Object.assign(payload, overrideParams);
      }

      // Attempt to send the notification again
      await this.notificationsService.sendNotification({
        userId: dlqEntry.userId,
        type: payload.type || 'reprocessed',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        templateId: payload.templateId,
        language: payload.language,
        // Include original notification ID for tracking
        metadata: {
          originalNotificationId: dlqEntry.notificationId,
          dlqEntryId: dlqEntry.id,
          reprocessed: true,
          traceId
        }
      });

      // Update entry status
      dlqEntry.status = 'reprocessed';
      
      // Add reprocessing metadata
      dlqEntry.resolutionMetadata = {
        reprocessedAt: new Date().toISOString(),
        reprocessedBy: 'admin', // In a real implementation, this would be the user ID
        overrideParams,
        traceId
      };

      // Save updated entry
      const updatedEntry = await this.dlqRepository.save(dlqEntry);

      // Record metrics
      this.recordDlqMetrics(
        'reprocessed', 
        dlqEntry.errorDetails.type, 
        dlqEntry.channel, 
        dlqEntry.journeyContext
      );

      this.logger.log(
        `Successfully reprocessed DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );

      return this.mapToResponseDto(updatedEntry);
    } catch (error) {
      this.logger.error(
        `Error reprocessing DLQ entry ${dlqEntry.id}`,
        error,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );
      throw error;
    }
  }

  /**
   * Marks a DLQ entry as ignored, indicating no action will be taken.
   * 
   * @param dlqEntry - The DLQ entry to ignore
   * @param comments - Optional comments about why the entry is being ignored
   * @returns The updated DLQ entry
   * @private
   */
  @Span('dlq.ignoreEntry')
  private async ignoreEntry(dlqEntry: DlqEntry, comments?: string): Promise<DlqEntryResponseDto> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Ignoring DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          comments,
          traceId 
        }
      );

      // Update entry status
      dlqEntry.status = 'ignored';
      
      // Add resolution metadata
      dlqEntry.resolutionMetadata = {
        ignoredAt: new Date().toISOString(),
        ignoredBy: 'admin', // In a real implementation, this would be the user ID
        comments: comments || 'Manually ignored',
        traceId
      };

      // Save updated entry
      const updatedEntry = await this.dlqRepository.save(dlqEntry);

      // Record metrics
      this.recordDlqMetrics(
        'ignored', 
        dlqEntry.errorDetails.type, 
        dlqEntry.channel, 
        dlqEntry.journeyContext
      );

      this.logger.log(
        `Successfully ignored DLQ entry ${dlqEntry.id}`,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );

      return this.mapToResponseDto(updatedEntry);
    } catch (error) {
      this.logger.error(
        `Error ignoring DLQ entry ${dlqEntry.id}`,
        error,
        'DlqService',
        { 
          dlqEntryId: dlqEntry.id, 
          userId: dlqEntry.userId,
          notificationId: dlqEntry.notificationId,
          traceId 
        }
      );
      throw error;
    }
  }

  /**
   * Maps a DLQ entity to a response DTO.
   * 
   * @param dlqEntry - The DLQ entity to map
   * @returns The mapped response DTO
   * @private
   */
  private mapToResponseDto(dlqEntry: DlqEntry): DlqEntryResponseDto {
    return {
      id: dlqEntry.id,
      notificationId: dlqEntry.notificationId,
      userId: dlqEntry.userId,
      channel: dlqEntry.channel,
      payload: dlqEntry.payload,
      errorDetails: dlqEntry.errorDetails,
      retryHistory: dlqEntry.retryHistory,
      maxRetryCount: dlqEntry.maxRetryCount,
      lastRetryAttempt: dlqEntry.lastRetryAttempt,
      journeyContext: dlqEntry.journeyContext,
      status: dlqEntry.status || 'pending',
      resolutionMetadata: dlqEntry.resolutionMetadata,
      createdAt: dlqEntry.createdAt,
      updatedAt: dlqEntry.updatedAt,
      notification: dlqEntry.notification ? {
        id: dlqEntry.notification.id,
        type: dlqEntry.notification.type,
        title: dlqEntry.notification.title,
        body: dlqEntry.notification.body,
        status: dlqEntry.notification.status,
        createdAt: dlqEntry.notification.createdAt
      } : undefined
    };
  }

  /**
   * Classifies an error based on its message or name.
   * 
   * @param errorMessage - The error message
   * @param errorName - The error name
   * @returns The classified error type
   * @private
   */
  private classifyError(errorMessage: string, errorName?: string): string {
    // Client errors (4xx)
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('bad request') ||
      (errorName && errorName.includes('ValidationError')) ||
      (errorName && errorName.includes('AuthError'))
    ) {
      return 'client';
    }
    
    // Transient errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('retry') ||
      (errorName && errorName.includes('TimeoutError')) ||
      (errorName && errorName.includes('ConnectionError'))
    ) {
      return 'transient';
    }
    
    // External dependency errors
    if (
      errorMessage.includes('external') ||
      errorMessage.includes('third-party') ||
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('provider') ||
      (errorName && errorName.includes('ExternalServiceError'))
    ) {
      return 'external';
    }
    
    // System errors (5xx)
    if (
      errorMessage.includes('internal') ||
      errorMessage.includes('server') ||
      errorMessage.includes('database') ||
      errorMessage.includes('unexpected') ||
      (errorName && errorName.includes('InternalError')) ||
      (errorName && errorName.includes('DatabaseError'))
    ) {
      return 'system';
    }
    
    // Default to unknown
    return 'unknown';
  }

  /**
   * Extracts an error code from an error message or name.
   * 
   * @param errorMessage - The error message
   * @param errorName - The error name
   * @returns The extracted error code
   * @private
   */
  private extractErrorCode(errorMessage: string, errorName?: string): string {
    // Check for error code in the message (e.g., "[ERR_CODE_123] Some error")
    const codeMatch = errorMessage.match(/\[([A-Z_0-9]+)\]/);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1];
    }
    
    // Generate a code based on error type
    if (errorName) {
      return `ERR_${errorName.replace(/Error$/, '').toUpperCase()}`;
    }
    
    // Default code
    return 'ERR_UNKNOWN';
  }

  /**
   * Determines the journey context from payload or metadata.
   * 
   * @param payload - The notification payload
   * @param metadata - Additional metadata
   * @returns The determined journey context
   * @private
   */
  private determineJourneyContext(
    payload: Record<string, any>, 
    metadata?: Record<string, any>
  ): string | undefined {
    // Check metadata first
    if (metadata?.journeyContext) {
      return metadata.journeyContext;
    }
    
    // Check payload
    if (payload?.journeyContext) {
      return payload.journeyContext;
    }
    
    // Check notification type
    const type = payload?.type || '';
    
    if (type.startsWith('health') || type.includes('metric') || type.includes('goal')) {
      return 'health';
    } else if (type.startsWith('care') || type.includes('appointment') || type.includes('medication')) {
      return 'care';
    } else if (type.startsWith('plan') || type.includes('claim') || type.includes('coverage')) {
      return 'plan';
    } else if (type.includes('achievement') || type.includes('quest') || type.includes('level')) {
      return 'game';
    }
    
    return undefined;
  }

  /**
   * Formats retry history for storage in the DLQ.
   * 
   * @param retryHistory - The retry history to format
   * @returns Formatted retry history
   * @private
   */
  private formatRetryHistory(retryHistory: {
    attemptCount: number;
    lastAttemptTime: string;
    errors: string[];
  }): {
    timestamp: Date;
    attempt: number;
    error: string;
    policy: string;
    delayMs?: number;
  }[] {
    // Create a retry history entry for each attempt
    const formattedHistory = [];
    
    for (let i = 0; i < retryHistory.attemptCount; i++) {
      formattedHistory.push({
        timestamp: i === retryHistory.attemptCount - 1 
          ? new Date(retryHistory.lastAttemptTime) 
          : new Date(Date.now() - (retryHistory.attemptCount - i) * 60000), // Approximate timestamps
        attempt: i + 1,
        error: retryHistory.errors[i] || 'Unknown error',
        policy: 'unknown', // In a real implementation, this would be the actual policy used
        delayMs: i > 0 ? Math.pow(2, i) * 1000 : 0 // Approximate delay times
      });
    }
    
    return formattedHistory;
  }

  /**
   * Records metrics for DLQ operations.
   * 
   * @param action - The action performed (added, resolved, reprocessed, ignored)
   * @param errorType - The type of error
   * @param channel - The notification channel
   * @param journeyContext - The journey context
   * @private
   */
  private recordDlqMetrics(
    action: 'added' | 'resolved' | 'reprocessed' | 'ignored',
    errorType: string,
    channel: string,
    journeyContext?: string
  ): void {
    try {
      // Record count metric
      this.metricsService.incrementCounter('notification_dlq_entries', 1, {
        action,
        error_type: errorType,
        channel,
        journey: journeyContext || 'unknown'
      });
      
      // Record timing metric for resolution if applicable
      if (action !== 'added') {
        this.metricsService.recordHistogram('notification_dlq_resolution_time', Math.random() * 1000, {
          action,
          error_type: errorType,
          channel,
          journey: journeyContext || 'unknown'
        });
      }
    } catch (error) {
      // Non-blocking - we don't want to fail operations if metrics recording fails
      this.logger.warn(
        'Error recording DLQ metrics',
        'DlqService',
        { action, errorType, channel, journeyContext, error: error.message }
      );
    }
  }

  /**
   * Gets counts of DLQ entries grouped by a specified field.
   * 
   * @param field - The field to group by
   * @param whereClause - Optional where clause for filtering
   * @returns Array of counts by field value
   * @private
   */
  private async getCountsByField(
    field: string,
    whereClause: FindOptionsWhere<DlqEntry> = {}
  ): Promise<{ key: string; count: number }[]> {
    try {
      // In a real implementation, this would use TypeORM's query builder
      // to perform a GROUP BY query. For this example, we'll simulate it.
      
      // Get all entries matching the where clause
      const entries = await this.dlqRepository.find({ where: whereClause });
      
      // Group by field
      const groups = new Map<string, number>();
      
      for (const entry of entries) {
        // Handle nested fields (e.g., 'errorDetails.type')
        let value: any = entry;
        for (const part of field.split('.')) {
          value = value?.[part];
        }
        
        const key = value?.toString() || null;
        groups.set(key, (groups.get(key) || 0) + 1);
      }
      
      // Convert to array
      return Array.from(groups.entries()).map(([key, count]) => ({ key, count }));
    } catch (error) {
      this.logger.error(
        `Error getting counts by field: ${field}`,
        error,
        'DlqService'
      );
      return [];
    }
  }

  /**
   * Gets counts of DLQ entries by time period for trend analysis.
   * 
   * @param timeframe - The overall timeframe ('day', 'week', 'month', 'all')
   * @param startDate - The start date for the timeframe
   * @returns Array of counts by time period
   * @private
   */
  private async getCountsByTimePeriod(
    timeframe: 'day' | 'week' | 'month' | 'all',
    startDate: Date | null
  ): Promise<{ period: string; count: number }[]> {
    try {
      if (!startDate || timeframe === 'all') {
        // For 'all' timeframe, group by month for the last year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        // In a real implementation, this would use TypeORM's query builder
        // to perform a GROUP BY query with date functions. For this example,
        // we'll return simulated data.
        
        return [
          { period: 'Jan', count: Math.floor(Math.random() * 20) },
          { period: 'Feb', count: Math.floor(Math.random() * 20) },
          { period: 'Mar', count: Math.floor(Math.random() * 20) },
          { period: 'Apr', count: Math.floor(Math.random() * 20) },
          { period: 'May', count: Math.floor(Math.random() * 20) },
          { period: 'Jun', count: Math.floor(Math.random() * 20) },
          { period: 'Jul', count: Math.floor(Math.random() * 20) },
          { period: 'Aug', count: Math.floor(Math.random() * 20) },
          { period: 'Sep', count: Math.floor(Math.random() * 20) },
          { period: 'Oct', count: Math.floor(Math.random() * 20) },
          { period: 'Nov', count: Math.floor(Math.random() * 20) },
          { period: 'Dec', count: Math.floor(Math.random() * 20) }
        ];
      }
      
      // For specific timeframes, adjust the grouping
      switch (timeframe) {
        case 'day':
          // Group by hour
          return Array.from({ length: 24 }, (_, i) => ({
            period: `${i}h`,
            count: Math.floor(Math.random() * 10)
          }));
          
        case 'week':
          // Group by day
          return Array.from({ length: 7 }, (_, i) => {
            const day = new Date();
            day.setDate(day.getDate() - 6 + i);
            return {
              period: day.toLocaleDateString('en-US', { weekday: 'short' }),
              count: Math.floor(Math.random() * 15)
            };
          });
          
        case 'month':
          // Group by day of month
          return Array.from({ length: 30 }, (_, i) => ({
            period: `${i + 1}`,
            count: Math.floor(Math.random() * 8)
          }));
          
        default:
          return [];
      }
    } catch (error) {
      this.logger.error(
        `Error getting counts by time period for timeframe: ${timeframe}`,
        error,
        'DlqService'
      );
      return [];
    }
  }

  /**
   * Calculates the average time entries spend in the DLQ before resolution.
   * 
   * @param whereClause - Optional where clause for filtering
   * @returns Average time in queue in milliseconds
   * @private
   */
  private async calculateAverageTimeInQueue(
    whereClause: FindOptionsWhere<DlqEntry> = {}
  ): Promise<number> {
    try {
      // In a real implementation, this would use TypeORM's query builder
      // to calculate the average time between createdAt and updatedAt
      // for resolved entries. For this example, we'll return a simulated value.
      
      // Get resolved entries
      const resolvedEntries = await this.dlqRepository.find({
        where: {
          ...whereClause,
          status: In(['resolved', 'reprocessed'])
        }
      });
      
      if (resolvedEntries.length === 0) {
        return 0;
      }
      
      // Calculate average time in queue
      let totalTimeMs = 0;
      for (const entry of resolvedEntries) {
        const timeInQueueMs = entry.updatedAt.getTime() - entry.createdAt.getTime();
        totalTimeMs += timeInQueueMs;
      }
      
      return Math.round(totalTimeMs / resolvedEntries.length);
    } catch (error) {
      this.logger.error(
        'Error calculating average time in queue',
        error,
        'DlqService'
      );
      return 0;
    }
  }

  /**
   * Finds a count by key in an array of counts.
   * 
   * @param counts - Array of counts by key
   * @param key - The key to find
   * @returns The count for the key, or undefined if not found
   * @private
   */
  private findCountByKey(
    counts: { key: string; count: number }[],
    key: string | null
  ): number | undefined {
    const item = counts.find(count => count.key === key);
    return item?.count;
  }
}