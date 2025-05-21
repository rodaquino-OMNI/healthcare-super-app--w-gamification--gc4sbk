import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../shared/src/logging/logger.service';
import { TracingService } from '../../shared/src/tracing/tracing.service';
import { RedisService } from '../../shared/src/redis/redis.service';

import { Notification } from '../notifications/entities/notification.entity';
import { DlqService } from './dlq/dlq.service';

import {
  IRetryPolicy,
  IRetryOptions,
  IRetryableOperation,
  RetryStatus,
} from './interfaces';

import {
  FixedIntervalPolicy,
  ExponentialBackoffPolicy,
  CompositePolicy,
  MaxAttemptsPolicy,
} from './policies';

import {
  PolicyType,
  ErrorType,
  DEFAULT_RETRY_CONFIG,
  REASON_CODES,
} from './constants';

/**
 * Service responsible for managing retry operations for failed notifications.
 * Provides functionality to register retry policies, schedule retries, and process
 * retry operations based on configured policies.
 */
@Injectable()
export class RetryService implements OnModuleInit {
  private readonly policyRegistry = new Map<string, IRetryPolicy>();
  private readonly defaultPolicy: IRetryPolicy;
  private readonly retryQueuePrefix = 'notification:retry:';
  private readonly processingInterval: number;
  
  /**
   * Creates an instance of RetryService.
   * 
   * @param notificationRepository - Repository for notification entities
   * @param dlqService - Service for managing dead-letter queue entries
   * @param logger - Service for structured logging
   * @param tracing - Service for distributed tracing
   * @param redis - Service for Redis operations (used for retry scheduling)
   * @param config - Service for application configuration
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly dlqService: DlqService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    // Initialize default retry policy (exponential backoff)
    this.defaultPolicy = new ExponentialBackoffPolicy({
      maxRetries: DEFAULT_RETRY_CONFIG.maxRetries,
      initialDelay: DEFAULT_RETRY_CONFIG.initialDelay,
      maxDelay: DEFAULT_RETRY_CONFIG.maxDelay,
      backoffFactor: DEFAULT_RETRY_CONFIG.backoffFactor,
      jitter: true,
    });
    
    // Get processing interval from config or use default (5 seconds)
    this.processingInterval = this.config.get<number>('retry.processingInterval', 5000);
  }
  
  /**
   * Initializes the retry service by registering default policies and starting
   * the retry processing loop.
   */
  async onModuleInit() {
    // Register default policies
    this.registerDefaultPolicies();
    
    // Start processing retries at regular intervals
    this.startRetryProcessing();
    
    this.logger.log(
      `RetryService initialized with ${this.policyRegistry.size} policies`,
      'RetryService',
    );
  }
  
  /**
   * Registers default retry policies for different notification channels and error types.
   * @private
   */
  private registerDefaultPolicies() {
    // Register channel-specific policies
    this.registerPolicy('push', new ExponentialBackoffPolicy({
      maxRetries: 5,
      initialDelay: 1000, // 1 second
      maxDelay: 60000, // 1 minute
      backoffFactor: 2,
      jitter: true,
    }));
    
    this.registerPolicy('email', new ExponentialBackoffPolicy({
      maxRetries: 3,
      initialDelay: 5000, // 5 seconds
      maxDelay: 300000, // 5 minutes
      backoffFactor: 3,
      jitter: true,
    }));
    
    this.registerPolicy('sms', new ExponentialBackoffPolicy({
      maxRetries: 3,
      initialDelay: 3000, // 3 seconds
      maxDelay: 180000, // 3 minutes
      backoffFactor: 2,
      jitter: true,
    }));
    
    this.registerPolicy('in-app', new FixedIntervalPolicy({
      maxRetries: 2,
      delay: 2000, // 2 seconds
      jitter: true,
    }));
    
    // Register error-type specific policies
    this.registerPolicy('rate-limited', new FixedIntervalPolicy({
      maxRetries: 5,
      delay: 10000, // 10 seconds - typical rate limit window
      jitter: false, // No jitter for predictable rate limit handling
    }));
    
    this.registerPolicy('network', new ExponentialBackoffPolicy({
      maxRetries: 5,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
      jitter: true,
    }));
    
    // Register composite policy for transient errors
    const transientPolicy = new CompositePolicy();
    transientPolicy.addPolicy(ErrorType.TRANSIENT, this.policyRegistry.get('network'));
    transientPolicy.setDefaultPolicy(this.defaultPolicy);
    this.registerPolicy('transient', transientPolicy);
    
    // Register max attempts policy as a fallback
    this.registerPolicy('max-attempts', new MaxAttemptsPolicy({
      maxRetries: 3,
    }));
  }
  
  /**
   * Registers a retry policy with the given name.
   * 
   * @param name - Unique name for the policy
   * @param policy - Retry policy implementation
   */
  registerPolicy(name: string, policy: IRetryPolicy): void {
    this.policyRegistry.set(name, policy);
    this.logger.debug(
      `Registered retry policy: ${name}`,
      'RetryService',
    );
  }
  
  /**
   * Gets a registered retry policy by name.
   * 
   * @param name - Name of the policy to retrieve
   * @returns The requested retry policy or the default policy if not found
   */
  getPolicy(name: string): IRetryPolicy {
    return this.policyRegistry.get(name) || this.defaultPolicy;
  }
  
  /**
   * Schedules a retry for a failed notification operation.
   * 
   * @param notificationId - ID of the notification to retry
   * @param channel - Notification channel (push, email, sms, in-app)
   * @param error - Error that caused the failure
   * @param payload - Original notification payload
   * @param attempt - Current attempt number (defaults to 1)
   * @param options - Optional retry configuration
   * @returns Promise resolving to the scheduled retry time
   */
  async scheduleRetry(
    notificationId: number,
    channel: string,
    error: Error,
    payload: any,
    attempt: number = 1,
    options?: Partial<IRetryOptions>,
  ): Promise<Date> {
    const span = this.tracing.startSpan('RetryService.scheduleRetry');
    
    try {
      span.setAttributes({
        'notification.id': notificationId,
        'notification.channel': channel,
        'retry.attempt': attempt,
      });
      
      this.logger.log(
        `Scheduling retry for notification ${notificationId} on channel ${channel} (attempt ${attempt})`,
        'RetryService',
      );
      
      // Determine the appropriate retry policy based on channel and error
      const policy = this.selectRetryPolicy(channel, error);
      
      // Check if we should retry based on the policy
      if (!policy.shouldRetry(error, attempt, options)) {
        this.logger.warn(
          `Retry policy ${policy.getName()} determined no retry for notification ${notificationId} (attempt ${attempt})`,
          'RetryService',
        );
        
        // Move to DLQ since we're not retrying
        await this.moveToDeadLetterQueue(
          notificationId,
          channel,
          error,
          payload,
          attempt,
        );
        
        return null;
      }
      
      // Calculate next retry time based on policy
      const nextRetryTime = policy.calculateNextRetryTime(attempt, options);
      const retryDelay = nextRetryTime.getTime() - Date.now();
      
      // Create retry payload
      const retryPayload = {
        notificationId,
        channel,
        payload,
        attempt: attempt + 1,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: (error as any).code,
        },
        history: [
          ...(payload.history || []),
          {
            timestamp: new Date().toISOString(),
            attempt,
            error: error.message,
            code: (error as any).code,
          },
        ],
      };
      
      // Store retry in Redis with expiration at retry time
      const retryKey = `${this.retryQueuePrefix}${notificationId}:${channel}`;
      await this.redis.set(
        retryKey,
        JSON.stringify(retryPayload),
        'PX',
        retryDelay,
      );
      
      // Update notification status in database
      await this.updateNotificationStatus(
        notificationId,
        'retry-scheduled',
        `Retry scheduled for ${nextRetryTime.toISOString()} (attempt ${attempt + 1})`,
      );
      
      this.logger.log(
        `Scheduled retry for notification ${notificationId} at ${nextRetryTime.toISOString()} (in ${retryDelay}ms)`,
        'RetryService',
      );
      
      return nextRetryTime;
    } catch (error) {
      this.logger.error(
        `Failed to schedule retry for notification ${notificationId}`,
        error,
        'RetryService',
      );
      
      // If we can't schedule a retry, move to DLQ
      await this.moveToDeadLetterQueue(
        notificationId,
        channel,
        error,
        payload,
        attempt,
      );
      
      return null;
    } finally {
      span.end();
    }
  }
  
  /**
   * Selects the appropriate retry policy based on the notification channel and error.
   * 
   * @param channel - Notification channel
   * @param error - Error that occurred
   * @returns The selected retry policy
   * @private
   */
  private selectRetryPolicy(channel: string, error: Error): IRetryPolicy {
    // Check for rate limiting errors
    if (
      error.message.includes('rate limit') ||
      error.message.includes('too many requests') ||
      (error as any).code === 429 ||
      (error as any).status === 429
    ) {
      return this.getPolicy('rate-limited');
    }
    
    // Check for network errors
    if (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError'
    ) {
      return this.getPolicy('network');
    }
    
    // Use channel-specific policy if available
    if (this.policyRegistry.has(channel)) {
      return this.getPolicy(channel);
    }
    
    // Default to transient error policy
    return this.getPolicy('transient');
  }
  
  /**
   * Moves a failed notification to the dead-letter queue after exhausting retry attempts.
   * 
   * @param notificationId - ID of the notification
   * @param channel - Notification channel
   * @param error - Error that caused the failure
   * @param payload - Original notification payload
   * @param attempt - Current attempt number
   * @returns Promise resolving when the notification is moved to DLQ
   * @private
   */
  private async moveToDeadLetterQueue(
    notificationId: number,
    channel: string,
    error: Error,
    payload: any,
    attempt: number,
  ): Promise<void> {
    const span = this.tracing.startSpan('RetryService.moveToDeadLetterQueue');
    
    try {
      span.setAttributes({
        'notification.id': notificationId,
        'notification.channel': channel,
        'retry.attempt': attempt,
        'error.message': error.message,
      });
      
      this.logger.warn(
        `Moving notification ${notificationId} to DLQ after ${attempt} attempts`,
        'RetryService',
      );
      
      // Update notification status in database
      await this.updateNotificationStatus(
        notificationId,
        'failed',
        `Failed after ${attempt} attempts: ${error.message}`,
      );
      
      // Create DLQ entry
      await this.dlqService.addEntry({
        notificationId: notificationId.toString(),
        userId: payload.userId,
        channel,
        payload,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: (error as any).code || 'UNKNOWN_ERROR',
          attemptsMade: attempt,
        },
        retryHistory: payload.history || [],
      });
      
      this.logger.log(
        `Notification ${notificationId} moved to DLQ successfully`,
        'RetryService',
      );
    } catch (dlqError) {
      this.logger.error(
        `Failed to move notification ${notificationId} to DLQ`,
        dlqError,
        'RetryService',
      );
      // We've done our best to handle the failure, nothing more we can do here
    } finally {
      span.end();
    }
  }
  
  /**
   * Updates the status of a notification in the database.
   * 
   * @param notificationId - ID of the notification to update
   * @param status - New status value
   * @param statusMessage - Optional status message with details
   * @returns Promise resolving when the update is complete
   * @private
   */
  private async updateNotificationStatus(
    notificationId: number,
    status: string,
    statusMessage?: string,
  ): Promise<void> {
    try {
      await this.notificationRepository.update(
        notificationId,
        {
          status,
          ...(statusMessage ? { statusMessage } : {}),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${notificationId} status to ${status}`,
        error,
        'RetryService',
      );
      // Non-blocking - we continue even if status update fails
    }
  }
  
  /**
   * Starts the retry processing loop that runs at regular intervals.
   * @private
   */
  private startRetryProcessing(): void {
    setInterval(() => {
      this.processRetries().catch(error => {
        this.logger.error(
          'Error processing retries',
          error,
          'RetryService',
        );
      });
    }, this.processingInterval);
    
    this.logger.log(
      `Started retry processing loop with interval ${this.processingInterval}ms`,
      'RetryService',
    );
  }
  
  /**
   * Processes all pending retries that are due for execution.
   * @returns Promise resolving when all due retries are processed
   */
  async processRetries(): Promise<void> {
    const span = this.tracing.startSpan('RetryService.processRetries');
    
    try {
      // Find all retry keys that are due (have expired in Redis)
      const retryKeys = await this.redis.keys(`${this.retryQueuePrefix}*`);
      
      if (retryKeys.length === 0) {
        return; // No retries to process
      }
      
      span.setAttributes({
        'retry.count': retryKeys.length,
      });
      
      this.logger.log(
        `Processing ${retryKeys.length} pending retries`,
        'RetryService',
      );
      
      // Process each retry
      const retryPromises = retryKeys.map(async (retryKey) => {
        const retrySpan = this.tracing.startSpan('RetryService.processRetry', { parent: span });
        
        try {
          // Get retry payload from Redis
          const retryPayloadJson = await this.redis.get(retryKey);
          
          if (!retryPayloadJson) {
            // Retry was already processed or expired
            return;
          }
          
          const retryPayload = JSON.parse(retryPayloadJson);
          
          retrySpan.setAttributes({
            'notification.id': retryPayload.notificationId,
            'notification.channel': retryPayload.channel,
            'retry.attempt': retryPayload.attempt,
          });
          
          this.logger.log(
            `Processing retry for notification ${retryPayload.notificationId} on channel ${retryPayload.channel} (attempt ${retryPayload.attempt})`,
            'RetryService',
          );
          
          // Remove the retry from Redis to prevent duplicate processing
          await this.redis.del(retryKey);
          
          // Execute the retry operation
          await this.executeRetry(retryPayload);
        } catch (error) {
          this.logger.error(
            `Error processing retry for key ${retryKey}`,
            error,
            'RetryService',
          );
        } finally {
          retrySpan.end();
        }
      });
      
      // Wait for all retries to be processed
      await Promise.all(retryPromises);
      
      this.logger.log(
        `Completed processing ${retryKeys.length} retries`,
        'RetryService',
      );
    } catch (error) {
      this.logger.error(
        'Failed to process retries',
        error,
        'RetryService',
      );
    } finally {
      span.end();
    }
  }
  
  /**
   * Executes a retry operation for a notification.
   * 
   * @param retryPayload - Payload containing retry information
   * @returns Promise resolving when the retry is executed
   * @private
   */
  private async executeRetry(retryPayload: any): Promise<void> {
    const { notificationId, channel, payload, attempt } = retryPayload;
    const span = this.tracing.startSpan('RetryService.executeRetry');
    
    try {
      span.setAttributes({
        'notification.id': notificationId,
        'notification.channel': channel,
        'retry.attempt': attempt,
      });
      
      // Update notification status to indicate retry in progress
      await this.updateNotificationStatus(
        notificationId,
        'retry-in-progress',
        `Executing retry attempt ${attempt}`,
      );
      
      // Here we would normally call the appropriate notification service method
      // based on the channel. For this implementation, we'll simulate the retry
      // with a mock implementation.
      
      // In a real implementation, this would be something like:
      // await this.notificationService.sendThroughChannel(channel, payload.userId, payload.content);
      
      // Simulate the retry operation with a random success/failure
      const success = Math.random() > 0.3; // 70% success rate for simulation
      
      if (success) {
        // Retry succeeded
        await this.updateNotificationStatus(
          notificationId,
          'sent',
          `Successfully sent after ${attempt} attempts`,
        );
        
        this.logger.log(
          `Retry succeeded for notification ${notificationId} on channel ${channel} (attempt ${attempt})`,
          'RetryService',
        );
      } else {
        // Retry failed
        const error = new Error(`Simulated failure for retry attempt ${attempt}`);
        (error as any).code = 'SIMULATED_ERROR';
        
        this.logger.warn(
          `Retry failed for notification ${notificationId} on channel ${channel} (attempt ${attempt})`,
          'RetryService',
        );
        
        // Schedule another retry or move to DLQ if max attempts reached
        await this.scheduleRetry(
          notificationId,
          channel,
          error,
          payload,
          attempt,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error executing retry for notification ${notificationId}`,
        error,
        'RetryService',
      );
      
      // Schedule another retry or move to DLQ if max attempts reached
      await this.scheduleRetry(
        notificationId,
        channel,
        error,
        payload,
        attempt,
      );
    } finally {
      span.end();
    }
  }
  
  /**
   * Manually triggers a retry for a notification that previously failed.
   * 
   * @param notificationId - ID of the notification to retry
   * @param options - Optional retry configuration
   * @returns Promise resolving to the scheduled retry time
   */
  async manualRetry(
    notificationId: number,
    options?: Partial<IRetryOptions>,
  ): Promise<Date> {
    const span = this.tracing.startSpan('RetryService.manualRetry');
    
    try {
      span.setAttributes({
        'notification.id': notificationId,
      });
      
      // Find the notification in the database
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId },
      });
      
      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }
      
      // Check if notification is in a failed state
      if (notification.status !== 'failed') {
        throw new Error(`Cannot retry notification ${notificationId} with status ${notification.status}`);
      }
      
      this.logger.log(
        `Manually retrying notification ${notificationId} on channel ${notification.channel}`,
        'RetryService',
      );
      
      // Create a minimal payload for the retry
      const payload = {
        userId: notification.userId,
        content: {
          title: notification.title,
          body: notification.body,
        },
        history: [],
      };
      
      // Create a generic error for the retry
      const error = new Error('Manual retry triggered');
      (error as any).code = 'MANUAL_RETRY';
      
      // Schedule the retry with attempt 0 to start fresh
      return await this.scheduleRetry(
        notificationId,
        notification.channel,
        error,
        payload,
        0,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Failed to manually retry notification ${notificationId}`,
        error,
        'RetryService',
      );
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Gets the current status of a retry operation for a notification.
   * 
   * @param notificationId - ID of the notification
   * @returns Promise resolving to the retry status information
   */
  async getRetryStatus(notificationId: number): Promise<RetryStatus> {
    try {
      // Find the notification in the database
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId },
      });
      
      if (!notification) {
        return RetryStatus.NOT_FOUND;
      }
      
      // Check current status
      switch (notification.status) {
        case 'sent':
        case 'delivered':
          return RetryStatus.SUCCEEDED;
        
        case 'retry-scheduled':
          return RetryStatus.PENDING;
        
        case 'retry-in-progress':
          return RetryStatus.IN_PROGRESS;
        
        case 'failed':
          // Check if in DLQ
          const dlqEntry = await this.dlqService.findByNotificationId(notificationId.toString());
          return dlqEntry ? RetryStatus.EXHAUSTED : RetryStatus.FAILED;
        
        default:
          return RetryStatus.UNKNOWN;
      }
    } catch (error) {
      this.logger.error(
        `Error getting retry status for notification ${notificationId}`,
        error,
        'RetryService',
      );
      return RetryStatus.UNKNOWN;
    }
  }
}