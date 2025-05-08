import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Span } from '@nestjs/opentelemetry';

import { LoggerService } from '../../shared/src/logging/logger.service';
import { TracingService } from '../../shared/src/tracing/tracing.service';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DlqService } from './dlq/dlq.service';
import { RetryStatus } from './interfaces/retry-status.enum';
import { IRetryPolicy } from './interfaces/retry-policy.interface';
import { IRetryableOperation } from './interfaces/retryable-operation.interface';
import { IRetryOptions, IExponentialBackoffOptions, IFixedDelayOptions } from './interfaces/retry-options.interface';
import { FixedIntervalPolicy, ExponentialBackoffPolicy, CompositePolicy, MaxAttemptsPolicy } from './policies';

/**
 * Core service that implements the retry logic for failed notifications.
 * It manages multiple retry policies (fixed and exponential backoff),
 * handles scheduling and processing of retries, and integrates with the dead-letter queue.
 */
@Injectable()
export class RetryService implements OnModuleInit {
  private readonly policyRegistry = new Map<string, IRetryPolicy>();
  private readonly defaultPolicy: string = 'exponential-backoff';
  
  // Default retry options for different notification channels
  private readonly channelRetryOptions: Record<string, IRetryOptions> = {
    'push': {
      maxRetries: 5,
      initialDelay: 1000, // 1 second
      maxDelay: 60000, // 1 minute
      jitter: true
    } as IExponentialBackoffOptions,
    'email': {
      maxRetries: 3,
      initialDelay: 5000, // 5 seconds
      maxDelay: 3600000, // 1 hour
      jitter: true,
      backoffFactor: 2
    } as IExponentialBackoffOptions,
    'sms': {
      maxRetries: 3,
      initialDelay: 5000, // 5 seconds
      maxDelay: 1800000, // 30 minutes
      jitter: true,
      backoffFactor: 2
    } as IExponentialBackoffOptions,
    'in-app': {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      jitter: false
    } as IFixedDelayOptions
  };

  /**
   * Creates an instance of RetryService.
   * 
   * @param notificationRepository - Repository for notification entities
   * @param notificationsService - Service for sending notifications
   * @param dlqService - Service for managing the dead-letter queue
   * @param logger - Service for structured logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
    private readonly dlqService: DlqService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Initializes the retry service by registering default retry policies.
   */
  onModuleInit() {
    this.registerDefaultPolicies();
    this.logger.log('RetryService initialized with default policies', 'RetryService');
  }

  /**
   * Registers the default retry policies.
   * 
   * @private
   */
  private registerDefaultPolicies(): void {
    // Register fixed interval policy
    const fixedPolicy = new FixedIntervalPolicy({
      maxRetries: 3,
      initialDelay: 5000, // 5 seconds
      jitter: true
    });
    this.registerPolicy('fixed-interval', fixedPolicy);

    // Register exponential backoff policy
    const exponentialPolicy = new ExponentialBackoffPolicy({
      maxRetries: 5,
      initialDelay: 1000, // 1 second
      maxDelay: 3600000, // 1 hour
      backoffFactor: 2,
      jitter: true
    });
    this.registerPolicy('exponential-backoff', exponentialPolicy);

    // Register max attempts policy
    const maxAttemptsPolicy = new MaxAttemptsPolicy({
      maxRetries: 3
    });
    this.registerPolicy('max-attempts', maxAttemptsPolicy);

    // Register a composite policy for sophisticated retry strategies
    const compositePolicy = new CompositePolicy();
    compositePolicy.addPolicy('network', exponentialPolicy);
    compositePolicy.addPolicy('rate-limit', fixedPolicy);
    compositePolicy.setDefaultPolicy(exponentialPolicy);
    this.registerPolicy('composite', compositePolicy);
  }

  /**
   * Registers a retry policy with the service.
   * 
   * @param name - Unique name for the policy
   * @param policy - Policy implementation
   */
  registerPolicy(name: string, policy: IRetryPolicy): void {
    this.policyRegistry.set(name, policy);
    this.logger.debug(`Registered retry policy: ${name}`, 'RetryService');
  }

  /**
   * Gets a retry policy by name.
   * 
   * @param name - Name of the policy to retrieve
   * @returns The requested retry policy or the default policy if not found
   */
  getPolicy(name: string): IRetryPolicy {
    const policy = this.policyRegistry.get(name);
    if (!policy) {
      this.logger.warn(`Retry policy '${name}' not found, using default policy`, 'RetryService');
      return this.policyRegistry.get(this.defaultPolicy);
    }
    return policy;
  }

  /**
   * Schedules a retry for a failed notification operation.
   * 
   * @param operation - The operation to retry
   * @param error - The error that caused the failure
   * @param metadata - Additional metadata for the retry
   * @returns Promise resolving to the retry status
   */
  @Span('retry.scheduleRetry')
  async scheduleRetry(
    operation: IRetryableOperation,
    error: Error,
    metadata: { 
      notificationId: number; 
      userId: string; 
      channel: string; 
      attemptCount?: number;
    }
  ): Promise<RetryStatus> {
    const traceId = this.tracingService.getCurrentTraceId();
    const { notificationId, userId, channel, attemptCount = 0 } = metadata;

    try {
      this.logger.log(
        `Scheduling retry for notification ${notificationId} on channel ${channel} (attempt ${attemptCount + 1})`,
        'RetryService',
        { userId, notificationId, channel, attemptCount, traceId, errorMessage: error.message }
      );

      // Get the appropriate retry policy based on the channel
      const policyName = this.determinePolicyForChannel(channel, error);
      const policy = this.getPolicy(policyName);
      const retryOptions = this.channelRetryOptions[channel] || this.channelRetryOptions['push'];

      // Check if we should retry based on the policy and error
      if (!policy.shouldRetry(error, attemptCount, retryOptions)) {
        this.logger.warn(
          `Retry policy ${policyName} determined no more retries for notification ${notificationId}`,
          'RetryService',
          { userId, notificationId, channel, attemptCount, traceId, errorMessage: error.message }
        );

        // Move to DLQ if we've exhausted retries
        await this.moveToDlq(operation, error, metadata);
        return RetryStatus.EXHAUSTED;
      }

      // Calculate next retry time
      const nextRetryTime = policy.calculateNextRetryTime(attemptCount, retryOptions);
      const delayMs = nextRetryTime - Date.now();

      this.logger.debug(
        `Next retry for notification ${notificationId} scheduled in ${delayMs}ms`,
        'RetryService',
        { userId, notificationId, channel, attemptCount, nextRetryTime, delayMs, traceId }
      );

      // Update notification status in database
      await this.updateNotificationRetryStatus(
        notificationId,
        'retry-scheduled',
        {
          attemptCount: attemptCount + 1,
          nextRetryTime,
          lastError: error.message,
          policyUsed: policyName,
          traceId
        }
      );

      // Schedule the retry
      setTimeout(() => {
        this.executeRetry(operation, metadata, error, traceId).catch(retryError => {
          this.logger.error(
            `Error executing retry for notification ${notificationId}`,
            retryError,
            'RetryService',
            { userId, notificationId, channel, attemptCount: attemptCount + 1, traceId }
          );
        });
      }, delayMs);

      return RetryStatus.PENDING;
    } catch (schedulingError) {
      this.logger.error(
        `Error scheduling retry for notification ${notificationId}`,
        schedulingError,
        'RetryService',
        { userId, notificationId, channel, attemptCount, traceId }
      );

      // If we can't even schedule the retry, move to DLQ
      await this.moveToDlq(operation, error, metadata, schedulingError);
      return RetryStatus.FAILED;
    }
  }

  /**
   * Executes a scheduled retry operation.
   * 
   * @param operation - The operation to retry
   * @param metadata - Metadata about the retry operation
   * @param originalError - The original error that caused the retry
   * @param parentTraceId - The trace ID from the parent operation for correlation
   * @private
   */
  @Span('retry.executeRetry')
  private async executeRetry(
    operation: IRetryableOperation,
    metadata: { notificationId: number; userId: string; channel: string; attemptCount?: number },
    originalError: Error,
    parentTraceId?: string
  ): Promise<void> {
    const { notificationId, userId, channel, attemptCount = 0 } = metadata;
    const updatedMetadata = { ...metadata, attemptCount: attemptCount + 1 };
    const traceId = this.tracingService.getCurrentTraceId();

    try {
      this.logger.log(
        `Executing retry for notification ${notificationId} on channel ${channel} (attempt ${attemptCount + 1})`,
        'RetryService',
        { userId, notificationId, channel, attemptCount: attemptCount + 1, traceId, parentTraceId }
      );

      // Update status to in-progress
      await this.updateNotificationRetryStatus(
        notificationId,
        'retry-in-progress',
        { attemptCount: attemptCount + 1, traceId, parentTraceId }
      );

      // Execute the operation
      await operation.execute();

      // Update status to succeeded
      await this.updateNotificationRetryStatus(
        notificationId,
        'sent',
        { attemptCount: attemptCount + 1, traceId, parentTraceId }
      );

      this.logger.log(
        `Retry succeeded for notification ${notificationId} on channel ${channel} (attempt ${attemptCount + 1})`,
        'RetryService',
        { userId, notificationId, channel, attemptCount: attemptCount + 1, traceId, parentTraceId }
      );
    } catch (error) {
      this.logger.error(
        `Retry failed for notification ${notificationId} on channel ${channel} (attempt ${attemptCount + 1})`,
        error,
        'RetryService',
        { userId, notificationId, channel, attemptCount: attemptCount + 1, traceId, parentTraceId }
      );

      // Update status to failed
      await this.updateNotificationRetryStatus(
        notificationId,
        'retry-failed',
        { 
          attemptCount: attemptCount + 1, 
          lastError: error.message,
          traceId,
          parentTraceId
        }
      );

      // Schedule another retry or move to DLQ
      await this.scheduleRetry(operation, error, updatedMetadata);
    }
  }

  /**
   * Processes all notifications that are due for retry.
   * This method is called periodically by a cron job.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  @Span('retry.processRetries')
  async processRetries(): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log('Processing scheduled retries', 'RetryService', { traceId });

      // Find all notifications with retry-scheduled status that are due
      const now = new Date();
      const retryableNotifications = await this.notificationRepository.find({
        where: {
          status: 'retry-scheduled',
          // Use TypeORM's query builder for more complex queries
          // This is a simplified example
        },
        order: {
          updatedAt: 'ASC' // Process oldest first
        },
        take: 100 // Process in batches to avoid overwhelming the system
      });

      this.logger.debug(
        `Found ${retryableNotifications.length} notifications due for retry`,
        'RetryService',
        { count: retryableNotifications.length, traceId }
      );

      // Process each notification
      for (const notification of retryableNotifications) {
        try {
          // Extract metadata from the notification
          const metadata = {
            notificationId: notification.id,
            userId: notification.userId,
            channel: notification.channel,
            // Extract attemptCount from notification metadata if available
            attemptCount: this.getAttemptCountFromNotification(notification)
          };

          // Create a retryable operation from the notification
          const operation = this.createRetryableOperationFromNotification(notification);

          // Execute the retry
          await this.executeRetry(
            operation,
            metadata,
            new Error('Scheduled retry from processRetries'),
            traceId
          );
        } catch (error) {
          this.logger.error(
            `Error processing retry for notification ${notification.id}`,
            error,
            'RetryService',
            { notificationId: notification.id, userId: notification.userId, traceId }
          );
        }
      }

      this.logger.log(
        `Completed processing ${retryableNotifications.length} scheduled retries`,
        'RetryService',
        { count: retryableNotifications.length, traceId }
      );
    } catch (error) {
      this.logger.error(
        'Error processing scheduled retries',
        error,
        'RetryService',
        { traceId }
      );
    }
  }

  /**
   * Moves a failed notification to the dead-letter queue after exhausting retries.
   * 
   * @param operation - The operation that failed
   * @param error - The error that caused the failure
   * @param metadata - Metadata about the operation
   * @param schedulingError - Optional error that occurred during retry scheduling
   * @private
   */
  @Span('retry.moveToDlq')
  private async moveToDlq(
    operation: IRetryableOperation,
    error: Error,
    metadata: { notificationId: number; userId: string; channel: string; attemptCount?: number },
    schedulingError?: Error
  ): Promise<void> {
    const { notificationId, userId, channel, attemptCount = 0 } = metadata;
    const traceId = this.tracingService.getCurrentTraceId();

    try {
      this.logger.log(
        `Moving notification ${notificationId} to DLQ after ${attemptCount} failed attempts`,
        'RetryService',
        { userId, notificationId, channel, attemptCount, traceId }
      );

      // Update notification status
      await this.updateNotificationRetryStatus(
        notificationId,
        'failed',
        { 
          attemptCount, 
          lastError: error.message,
          movedToDlq: true,
          traceId
        }
      );

      // Get the operation payload
      const payload = operation.getPayload();

      // Create DLQ entry
      await this.dlqService.addToDlq({
        notificationId,
        userId,
        channel,
        payload,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          schedulingError: schedulingError ? {
            message: schedulingError.message,
            stack: schedulingError.stack,
            name: schedulingError.name
          } : undefined
        },
        retryHistory: {
          attemptCount,
          lastAttemptTime: new Date().toISOString(),
          errors: [error.message]
        },
        metadata: operation.getMetadata()
      });

      this.logger.log(
        `Successfully moved notification ${notificationId} to DLQ`,
        'RetryService',
        { userId, notificationId, channel, attemptCount, traceId }
      );
    } catch (dlqError) {
      this.logger.error(
        `Error moving notification ${notificationId} to DLQ`,
        dlqError,
        'RetryService',
        { userId, notificationId, channel, attemptCount, traceId, originalError: error.message }
      );
      
      // Even if we can't move to DLQ, update the notification status
      try {
        await this.updateNotificationRetryStatus(
          notificationId,
          'failed',
          { 
            attemptCount, 
            lastError: error.message,
            dlqError: dlqError.message,
            traceId
          }
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update notification ${notificationId} status after DLQ error`,
          updateError,
          'RetryService',
          { userId, notificationId, channel, attemptCount, traceId }
        );
      }
    }
  }

  /**
   * Updates the status of a notification in the database.
   * 
   * @param notificationId - ID of the notification to update
   * @param status - New status for the notification
   * @param metadata - Additional metadata to store with the notification
   * @private
   */
  private async updateNotificationRetryStatus(
    notificationId: number,
    status: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.notificationRepository.update(
        notificationId,
        { 
          status,
          // In a real implementation, we would store metadata in a JSON column
          // For this example, we'll just update the status
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${notificationId} status to ${status}`,
        error,
        'RetryService',
        { notificationId, status, metadata }
      );
      throw error;
    }
  }

  /**
   * Determines the appropriate retry policy for a notification channel and error.
   * 
   * @param channel - The notification channel
   * @param error - The error that occurred
   * @returns The name of the policy to use
   * @private
   */
  private determinePolicyForChannel(channel: string, error: Error): string {
    // Determine policy based on channel and error type
    // This is a simplified example - in a real implementation, we would have
    // more sophisticated logic to select the appropriate policy

    // Check if error is a network error
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'exponential-backoff';
    }

    // Check if error is a rate limit error
    if (error.name === 'RateLimitError' || error.message.includes('rate limit')) {
      return 'fixed-interval';
    }

    // Default policies by channel
    switch (channel) {
      case 'push':
      case 'email':
        return 'exponential-backoff';
      case 'sms':
        return 'exponential-backoff';
      case 'in-app':
        return 'fixed-interval';
      default:
        return this.defaultPolicy;
    }
  }

  /**
   * Extracts the attempt count from a notification entity.
   * 
   * @param notification - The notification entity
   * @returns The current attempt count
   * @private
   */
  private getAttemptCountFromNotification(notification: Notification): number {
    // In a real implementation, this would extract the attempt count from
    // the notification metadata stored in the database
    // For this example, we'll return a default value
    return 0;
  }

  /**
   * Creates a retryable operation from a notification entity.
   * 
   * @param notification - The notification entity
   * @returns A retryable operation
   * @private
   */
  private createRetryableOperationFromNotification(notification: Notification): IRetryableOperation {
    // In a real implementation, this would create a retryable operation
    // that can execute the notification delivery
    // For this example, we'll return a simple operation that resolves immediately

    return {
      execute: async () => {
        // In a real implementation, this would call the appropriate method
        // on the NotificationsService to send the notification
        await this.notificationsService.sendThroughChannel(
          notification.channel,
          notification.userId,
          {
            title: notification.title,
            body: notification.body,
            // Additional data would be extracted from the notification
          }
        );
      },
      getPayload: () => ({
        userId: notification.userId,
        channel: notification.channel,
        title: notification.title,
        body: notification.body,
        // Additional data would be extracted from the notification
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        createdAt: notification.createdAt,
        // Additional metadata would be extracted from the notification
      })
    };
  }
}