import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../../shared/src/logging/logger.service';
import { TracingService } from '../../../shared/src/tracing/tracing.service';
import { MetricsService } from '../../../shared/src/metrics/metrics.service';
import { NotificationsService } from '../../notifications/notifications.service';

import { DlqEntry } from './dlq-entry.entity';
import { ErrorType } from '../constants/error-types.constants';
import { QueryDlqEntriesDto } from './dto/query-dlq-entries.dto';
import { ProcessDlqEntryDto } from './dto/process-dlq-entry.dto';
import { DlqStatisticsResponseDto } from './dto/dlq-statistics-response.dto';

/**
 * Service responsible for managing the Dead Letter Queue (DLQ) for failed notifications
 * that have exhausted their retry attempts.
 * 
 * The DLQ service provides functionality to:
 * - Add entries to the DLQ when notifications fail permanently
 * - Query DLQ entries with filtering and pagination
 * - Support manual resolution or reprocessing of failed notifications
 * - Track metrics for DLQ entries and resolution rates
 */
@Injectable()
export class DlqService {
  private readonly metricsPrefix = 'notification_dlq_';
  
  /**
   * Creates an instance of DlqService.
   * 
   * @param dlqRepository - Repository for DLQ entries
   * @param logger - Service for structured logging
   * @param tracing - Service for distributed tracing
   * @param metrics - Service for tracking metrics
   * @param config - Service for application configuration
   * @param notificationsService - Service for sending notifications (used for reprocessing)
   */
  constructor(
    @InjectRepository(DlqEntry)
    private readonly dlqRepository: Repository<DlqEntry>,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
    private readonly metrics: MetricsService,
    private readonly config: ConfigService,
    private readonly notificationsService?: NotificationsService, // Optional to avoid circular dependency
  ) {}
  
  /**
   * Adds a new entry to the Dead Letter Queue.
   * 
   * @param entry - DLQ entry data
   * @returns Promise resolving to the created DLQ entry
   */
  async addEntry(entry: {
    notificationId: string;
    userId: string;
    channel: string;
    payload: Record<string, any>;
    errorDetails: {
      message: string;
      stack?: string;
      name?: string;
      code?: string;
      attemptsMade?: number;
      providerDetails?: Record<string, any>;
    };
    retryHistory: Array<{
      timestamp: string;
      errorMessage: string;
      policyType?: string;
      attemptNumber: number;
      delay?: number;
    }>;
  }): Promise<DlqEntry> {
    const span = this.tracing.startSpan('DlqService.addEntry');
    
    try {
      span.setAttributes({
        'notification.id': entry.notificationId,
        'notification.channel': entry.channel,
        'user.id': entry.userId,
        'error.message': entry.errorDetails.message,
        'error.code': entry.errorDetails.code || 'UNKNOWN',
        'retry.attempts': entry.errorDetails.attemptsMade || entry.retryHistory.length,
      });
      
      this.logger.log(
        `Adding notification ${entry.notificationId} to DLQ after ${entry.errorDetails.attemptsMade || entry.retryHistory.length} attempts`,
        'DlqService',
      );
      
      // Determine error type for classification
      const errorType = this.classifyError(entry.errorDetails);
      
      // Create DLQ entry
      const dlqEntry = this.dlqRepository.create({
        notificationId: parseInt(entry.notificationId, 10),
        userId: entry.userId,
        channel: entry.channel,
        payload: entry.payload,
        errorDetails: {
          ...entry.errorDetails,
          type: errorType,
        },
        retryHistory: entry.retryHistory,
      });
      
      // Save to database
      const savedEntry = await this.dlqRepository.save(dlqEntry);
      
      // Track metrics
      this.incrementDlqMetrics(errorType, entry.channel);
      
      this.logger.log(
        `Successfully added notification ${entry.notificationId} to DLQ with ID ${savedEntry.id}`,
        'DlqService',
      );
      
      return savedEntry;
    } catch (error) {
      this.logger.error(
        `Failed to add notification ${entry.notificationId} to DLQ`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Finds all DLQ entries matching the provided query parameters.
   * 
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Promise resolving to an array of DLQ entries and total count
   */
  async findAll(queryDto: QueryDlqEntriesDto): Promise<[DlqEntry[], number]> {
    const span = this.tracing.startSpan('DlqService.findAll');
    
    try {
      span.setAttributes({
        'query.page': queryDto.page || 1,
        'query.limit': queryDto.limit || 20,
        'query.userId': queryDto.userId || 'not-specified',
        'query.channel': queryDto.channel || 'not-specified',
        'query.errorType': queryDto.errorType || 'not-specified',
      });
      
      // Build where clause based on query parameters
      const where: FindOptionsWhere<DlqEntry> = {};
      
      if (queryDto.userId) {
        where.userId = queryDto.userId;
      }
      
      if (queryDto.notificationId) {
        where.notificationId = parseInt(queryDto.notificationId, 10);
      }
      
      if (queryDto.channel) {
        where.channel = queryDto.channel;
      }
      
      if (queryDto.status) {
        where.resolutionStatus = queryDto.status;
      }
      
      // Handle date range filters
      if (queryDto.createdAfter || queryDto.createdBefore) {
        where.createdAt = {};
        
        if (queryDto.createdAfter) {
          where.createdAt = {
            ...where.createdAt,
            ...MoreThanOrEqual(new Date(queryDto.createdAfter)),
          };
        }
        
        if (queryDto.createdBefore) {
          where.createdAt = {
            ...where.createdAt,
            ...LessThanOrEqual(new Date(queryDto.createdBefore)),
          };
        }
      }
      
      // Handle error type filter (requires custom query for JSONB field)
      let query = this.dlqRepository.createQueryBuilder('dlq_entry');
      
      if (queryDto.errorType) {
        query = query
          .where('dlq_entry.error_details->>"type" = :errorType', { errorType: queryDto.errorType })
          .andWhere(where);
      } else {
        query = query.where(where);
      }
      
      // Add pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 20;
      const skip = (page - 1) * limit;
      
      query = query
        .orderBy('dlq_entry.created_at', 'DESC')
        .skip(skip)
        .take(limit);
      
      // Execute query
      const [entries, total] = await query.getManyAndCount();
      
      this.logger.log(
        `Found ${entries.length} DLQ entries (total: ${total})`,
        'DlqService',
      );
      
      return [entries, total];
    } catch (error) {
      this.logger.error(
        'Failed to query DLQ entries',
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Finds a DLQ entry by its ID.
   * 
   * @param id - DLQ entry ID
   * @returns Promise resolving to the DLQ entry or null if not found
   */
  async findById(id: string): Promise<DlqEntry> {
    const span = this.tracing.startSpan('DlqService.findById');
    
    try {
      span.setAttributes({
        'dlq.entry.id': id,
      });
      
      const entry = await this.dlqRepository.findOne({
        where: { id },
        relations: ['notification'],
      });
      
      if (!entry) {
        this.logger.warn(
          `DLQ entry with ID ${id} not found`,
          'DlqService',
        );
        return null;
      }
      
      return entry;
    } catch (error) {
      this.logger.error(
        `Failed to find DLQ entry with ID ${id}`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Finds DLQ entries for a specific notification ID.
   * 
   * @param notificationId - Notification ID
   * @returns Promise resolving to the DLQ entries
   */
  async findByNotificationId(notificationId: string): Promise<DlqEntry[]> {
    const span = this.tracing.startSpan('DlqService.findByNotificationId');
    
    try {
      span.setAttributes({
        'notification.id': notificationId,
      });
      
      const entries = await this.dlqRepository.find({
        where: { notificationId: parseInt(notificationId, 10) },
        order: { createdAt: 'DESC' },
      });
      
      this.logger.log(
        `Found ${entries.length} DLQ entries for notification ${notificationId}`,
        'DlqService',
      );
      
      return entries;
    } catch (error) {
      this.logger.error(
        `Failed to find DLQ entries for notification ${notificationId}`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Finds DLQ entries for a specific user ID.
   * 
   * @param userId - User ID
   * @param limit - Maximum number of entries to return
   * @returns Promise resolving to the DLQ entries
   */
  async findByUserId(userId: string, limit: number = 20): Promise<DlqEntry[]> {
    const span = this.tracing.startSpan('DlqService.findByUserId');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'query.limit': limit,
      });
      
      const entries = await this.dlqRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      
      this.logger.log(
        `Found ${entries.length} DLQ entries for user ${userId}`,
        'DlqService',
      );
      
      return entries;
    } catch (error) {
      this.logger.error(
        `Failed to find DLQ entries for user ${userId}`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Manually resolves a DLQ entry, marking it as handled.
   * 
   * @param id - DLQ entry ID
   * @param processDto - Processing instructions
   * @param resolvedBy - ID of the user performing the resolution
   * @returns Promise resolving to the updated DLQ entry
   */
  async resolve(
    id: string,
    processDto: ProcessDlqEntryDto,
    resolvedBy: string,
  ): Promise<DlqEntry> {
    const span = this.tracing.startSpan('DlqService.resolve');
    
    try {
      span.setAttributes({
        'dlq.entry.id': id,
        'resolution.action': processDto.action,
        'resolved.by': resolvedBy,
      });
      
      // Find the DLQ entry
      const entry = await this.findById(id);
      
      if (!entry) {
        throw new Error(`DLQ entry with ID ${id} not found`);
      }
      
      // Check if already resolved
      if (entry.resolutionStatus) {
        this.logger.warn(
          `DLQ entry ${id} is already resolved with status ${entry.resolutionStatus}`,
          'DlqService',
        );
        return entry;
      }
      
      this.logger.log(
        `Resolving DLQ entry ${id} with action ${processDto.action}`,
        'DlqService',
      );
      
      // Update the entry with resolution information
      entry.resolutionStatus = processDto.action;
      entry.resolutionNotes = processDto.comments || `Manually resolved with action: ${processDto.action}`;
      entry.resolvedAt = new Date();
      entry.resolvedBy = resolvedBy;
      
      // Save the updated entry
      const updatedEntry = await this.dlqRepository.save(entry);
      
      // Track metrics
      this.metrics.increment(`${this.metricsPrefix}resolved_total`, {
        action: processDto.action,
        channel: entry.channel,
        error_type: entry.errorDetails.type,
      });
      
      this.logger.log(
        `Successfully resolved DLQ entry ${id}`,
        'DlqService',
      );
      
      return updatedEntry;
    } catch (error) {
      this.logger.error(
        `Failed to resolve DLQ entry ${id}`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Reprocesses a failed notification from a DLQ entry.
   * 
   * @param id - DLQ entry ID
   * @param processDto - Processing instructions with optional overrides
   * @param resolvedBy - ID of the user performing the reprocessing
   * @returns Promise resolving to the updated DLQ entry
   */
  async reprocess(
    id: string,
    processDto: ProcessDlqEntryDto,
    resolvedBy: string,
  ): Promise<DlqEntry> {
    const span = this.tracing.startSpan('DlqService.reprocess');
    
    try {
      span.setAttributes({
        'dlq.entry.id': id,
        'resolved.by': resolvedBy,
      });
      
      // Find the DLQ entry
      const entry = await this.findById(id);
      
      if (!entry) {
        throw new Error(`DLQ entry with ID ${id} not found`);
      }
      
      // Check if already resolved
      if (entry.resolutionStatus) {
        this.logger.warn(
          `DLQ entry ${id} is already resolved with status ${entry.resolutionStatus}`,
          'DlqService',
        );
        return entry;
      }
      
      this.logger.log(
        `Reprocessing DLQ entry ${id} for notification ${entry.notificationId}`,
        'DlqService',
      );
      
      // Check if notifications service is available (to avoid circular dependency issues)
      if (!this.notificationsService) {
        throw new Error('NotificationsService is not available for reprocessing');
      }
      
      // Prepare payload for reprocessing
      const originalPayload = entry.payload;
      const reprocessPayload = {
        ...originalPayload,
        // Apply any overrides from the process DTO
        ...(processDto.overrides || {}),
      };
      
      // Attempt to resend the notification
      try {
        // In a real implementation, this would call the appropriate method on the notifications service
        // based on the original notification type and channel
        await this.notificationsService.sendNotification(reprocessPayload);
        
        // Update the entry with resolution information
        entry.resolutionStatus = 'reprocessed';
        entry.resolutionNotes = processDto.comments || 'Successfully reprocessed notification';
        entry.resolvedAt = new Date();
        entry.resolvedBy = resolvedBy;
        
        // Save the updated entry
        const updatedEntry = await this.dlqRepository.save(entry);
        
        // Track metrics
        this.metrics.increment(`${this.metricsPrefix}reprocessed_success_total`, {
          channel: entry.channel,
          error_type: entry.errorDetails.type,
        });
        
        this.logger.log(
          `Successfully reprocessed DLQ entry ${id}`,
          'DlqService',
        );
        
        return updatedEntry;
      } catch (error) {
        // Reprocessing failed
        this.logger.error(
          `Failed to reprocess notification for DLQ entry ${id}`,
          error,
          'DlqService',
        );
        
        // Update the entry with failure information
        entry.resolutionStatus = 'reprocess-failed';
        entry.resolutionNotes = processDto.comments || `Reprocessing failed: ${error.message}`;
        entry.resolvedAt = new Date();
        entry.resolvedBy = resolvedBy;
        
        // Add the new error to retry history
        entry.retryHistory.push({
          timestamp: new Date().toISOString(),
          errorMessage: error.message,
          attemptNumber: entry.retryHistory.length + 1,
          policyType: 'manual-reprocess',
        });
        
        // Save the updated entry
        const updatedEntry = await this.dlqRepository.save(entry);
        
        // Track metrics
        this.metrics.increment(`${this.metricsPrefix}reprocessed_failure_total`, {
          channel: entry.channel,
          error_type: entry.errorDetails.type,
        });
        
        return updatedEntry;
      }
    } catch (error) {
      this.logger.error(
        `Error in reprocess operation for DLQ entry ${id}`,
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Gets statistics about DLQ entries.
   * 
   * @returns Promise resolving to DLQ statistics
   */
  async getStatistics(): Promise<DlqStatisticsResponseDto> {
    const span = this.tracing.startSpan('DlqService.getStatistics');
    
    try {
      // Get total count
      const totalCount = await this.dlqRepository.count();
      
      // Get counts by error type
      const errorTypeCounts = await this.getCountsByErrorType();
      
      // Get counts by channel
      const channelCounts = await this.getCountsByChannel();
      
      // Get counts by status
      const statusCounts = await this.getCountsByStatus();
      
      // Get counts by time period
      const timePeriodCounts = await this.getCountsByTimePeriod();
      
      // Calculate average time in queue
      const avgTimeInQueue = await this.calculateAverageTimeInQueue();
      
      // Assemble statistics response
      const statistics: DlqStatisticsResponseDto = {
        totalEntries: totalCount,
        entriesByErrorType: {
          client: errorTypeCounts.CLIENT || 0,
          system: errorTypeCounts.SYSTEM || 0,
          transient: errorTypeCounts.TRANSIENT || 0,
          external: errorTypeCounts.EXTERNAL || 0,
          unknown: errorTypeCounts.UNKNOWN || 0,
        },
        entriesByChannel: {
          email: channelCounts.email || 0,
          sms: channelCounts.sms || 0,
          push: channelCounts.push || 0,
          'in-app': channelCounts['in-app'] || 0,
        },
        entriesByStatus: {
          pending: statusCounts.pending || 0,
          resolved: statusCounts.resolved || 0,
          reprocessed: statusCounts.reprocessed || 0,
          'reprocess-failed': statusCounts['reprocess-failed'] || 0,
          ignored: statusCounts.ignored || 0,
        },
        entriesByTimePeriod: {
          last24Hours: timePeriodCounts.last24Hours || 0,
          last7Days: timePeriodCounts.last7Days || 0,
          last30Days: timePeriodCounts.last30Days || 0,
        },
        averageTimeInQueueMinutes: avgTimeInQueue,
      };
      
      return statistics;
    } catch (error) {
      this.logger.error(
        'Failed to get DLQ statistics',
        error,
        'DlqService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Gets counts of DLQ entries by error type.
   * 
   * @returns Promise resolving to counts by error type
   * @private
   */
  private async getCountsByErrorType(): Promise<Record<string, number>> {
    try {
      const result = await this.dlqRepository.query(`
        SELECT 
          error_details->>'type' as error_type, 
          COUNT(*) as count 
        FROM 
          dlq_entries 
        GROUP BY 
          error_details->>'type'
      `);
      
      // Convert to record
      const counts: Record<string, number> = {};
      for (const row of result) {
        counts[row.error_type] = parseInt(row.count, 10);
      }
      
      return counts;
    } catch (error) {
      this.logger.error(
        'Failed to get DLQ counts by error type',
        error,
        'DlqService',
      );
      return {};
    }
  }
  
  /**
   * Gets counts of DLQ entries by channel.
   * 
   * @returns Promise resolving to counts by channel
   * @private
   */
  private async getCountsByChannel(): Promise<Record<string, number>> {
    try {
      const result = await this.dlqRepository.query(`
        SELECT 
          channel, 
          COUNT(*) as count 
        FROM 
          dlq_entries 
        GROUP BY 
          channel
      `);
      
      // Convert to record
      const counts: Record<string, number> = {};
      for (const row of result) {
        counts[row.channel] = parseInt(row.count, 10);
      }
      
      return counts;
    } catch (error) {
      this.logger.error(
        'Failed to get DLQ counts by channel',
        error,
        'DlqService',
      );
      return {};
    }
  }
  
  /**
   * Gets counts of DLQ entries by resolution status.
   * 
   * @returns Promise resolving to counts by status
   * @private
   */
  private async getCountsByStatus(): Promise<Record<string, number>> {
    try {
      // Count entries with no resolution status (pending)
      const pendingCount = await this.dlqRepository.count({
        where: { resolutionStatus: null },
      });
      
      // Count entries by resolution status
      const result = await this.dlqRepository.query(`
        SELECT 
          resolution_status, 
          COUNT(*) as count 
        FROM 
          dlq_entries 
        WHERE 
          resolution_status IS NOT NULL 
        GROUP BY 
          resolution_status
      `);
      
      // Convert to record
      const counts: Record<string, number> = {
        pending: pendingCount,
      };
      
      for (const row of result) {
        counts[row.resolution_status] = parseInt(row.count, 10);
      }
      
      return counts;
    } catch (error) {
      this.logger.error(
        'Failed to get DLQ counts by status',
        error,
        'DlqService',
      );
      return { pending: 0 };
    }
  }
  
  /**
   * Gets counts of DLQ entries by time period.
   * 
   * @returns Promise resolving to counts by time period
   * @private
   */
  private async getCountsByTimePeriod(): Promise<Record<string, number>> {
    try {
      const now = new Date();
      
      // Last 24 hours
      const last24Hours = new Date(now);
      last24Hours.setHours(now.getHours() - 24);
      
      // Last 7 days
      const last7Days = new Date(now);
      last7Days.setDate(now.getDate() - 7);
      
      // Last 30 days
      const last30Days = new Date(now);
      last30Days.setDate(now.getDate() - 30);
      
      // Count entries for each time period
      const [last24HoursCount, last7DaysCount, last30DaysCount] = await Promise.all([
        this.dlqRepository.count({
          where: {
            createdAt: MoreThanOrEqual(last24Hours),
          },
        }),
        this.dlqRepository.count({
          where: {
            createdAt: MoreThanOrEqual(last7Days),
          },
        }),
        this.dlqRepository.count({
          where: {
            createdAt: MoreThanOrEqual(last30Days),
          },
        }),
      ]);
      
      return {
        last24Hours: last24HoursCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
      };
    } catch (error) {
      this.logger.error(
        'Failed to get DLQ counts by time period',
        error,
        'DlqService',
      );
      return {
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0,
      };
    }
  }
  
  /**
   * Calculates the average time entries spend in the DLQ before resolution.
   * 
   * @returns Promise resolving to average time in queue in minutes
   * @private
   */
  private async calculateAverageTimeInQueue(): Promise<number> {
    try {
      // Get average time for resolved entries
      const result = await this.dlqRepository.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) as avg_minutes
        FROM 
          dlq_entries 
        WHERE 
          resolution_status IS NOT NULL 
          AND resolved_at IS NOT NULL
      `);
      
      if (result && result.length > 0 && result[0].avg_minutes) {
        return parseFloat(result[0].avg_minutes).toFixed(2);
      }
      
      return 0;
    } catch (error) {
      this.logger.error(
        'Failed to calculate average time in DLQ',
        error,
        'DlqService',
      );
      return 0;
    }
  }
  
  /**
   * Classifies an error based on its details to determine the error type.
   * 
   * @param errorDetails - Error details
   * @returns Classified error type
   * @private
   */
  private classifyError(errorDetails: {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
    attemptsMade?: number;
    providerDetails?: Record<string, any>;
  }): string {
    // Check for client errors
    if (
      errorDetails.code?.startsWith('4') ||
      errorDetails.message?.includes('invalid') ||
      errorDetails.message?.includes('not found') ||
      errorDetails.message?.includes('unauthorized') ||
      errorDetails.message?.includes('forbidden')
    ) {
      return ErrorType.CLIENT;
    }
    
    // Check for transient errors
    if (
      errorDetails.message?.includes('timeout') ||
      errorDetails.message?.includes('connection') ||
      errorDetails.message?.includes('network') ||
      errorDetails.message?.includes('temporary') ||
      errorDetails.message?.includes('retry') ||
      errorDetails.code === 'ETIMEDOUT' ||
      errorDetails.code === 'ECONNREFUSED' ||
      errorDetails.code === 'ECONNRESET'
    ) {
      return ErrorType.TRANSIENT;
    }
    
    // Check for external dependency errors
    if (
      errorDetails.message?.includes('provider') ||
      errorDetails.message?.includes('service unavailable') ||
      errorDetails.message?.includes('external') ||
      errorDetails.code === '503' ||
      errorDetails.providerDetails
    ) {
      return ErrorType.EXTERNAL;
    }
    
    // Default to system error
    return ErrorType.SYSTEM;
  }
  
  /**
   * Increments metrics for DLQ entries.
   * 
   * @param errorType - Type of error
   * @param channel - Notification channel
   * @private
   */
  private incrementDlqMetrics(errorType: string, channel: string): void {
    try {
      // Increment total count
      this.metrics.increment(`${this.metricsPrefix}entries_total`);
      
      // Increment by error type
      this.metrics.increment(`${this.metricsPrefix}entries_by_error_type`, {
        error_type: errorType,
      });
      
      // Increment by channel
      this.metrics.increment(`${this.metricsPrefix}entries_by_channel`, {
        channel,
      });
      
      // Increment by error type and channel
      this.metrics.increment(`${this.metricsPrefix}entries_by_error_type_and_channel`, {
        error_type: errorType,
        channel,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to increment DLQ metrics',
        'DlqService',
      );
      // Non-blocking - we don't want to fail DLQ operations if metrics fail
    }
  }
}