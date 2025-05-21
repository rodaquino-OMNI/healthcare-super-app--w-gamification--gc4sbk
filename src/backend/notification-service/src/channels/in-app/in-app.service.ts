import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Updated imports using standardized path aliases
import { LoggerService } from '@app/shared/logging';
import { TracingService } from '@app/shared/tracing';
import { RedisService } from '@app/shared/redis';

// Import interfaces from the new @austa/interfaces package
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  NotificationJourney
} from '@austa/interfaces/notification/types';

import { WebsocketsGateway } from '../../websockets/websockets.gateway';
import { RetryService } from '../../retry/retry.service';
import { IRetryOptions } from '../../retry/interfaces';
import { NotificationEntity } from '../../notifications/entities/notification.entity';

/**
 * Handles the sending of in-app notifications within the AUSTA SuperApp.
 * This service is responsible for checking user connection status and
 * either delivering notifications via WebSockets or storing them for later delivery.
 * Includes enhanced retry and fallback mechanisms for improved reliability.
 */
@Injectable()
export class InAppService {
  /**
   * Initializes the InAppService with required dependencies.
   * 
   * @param websocketsGateway - Service for sending WebSocket messages
   * @param redisService - Service for Redis operations and checking connection status
   * @param logger - Service for logging
   * @param configService - Service for accessing configuration
   * @param tracingService - Service for distributed tracing
   * @param retryService - Service for handling retry operations for failed notifications
   */
  constructor(
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Sends an in-app notification to a user.
   * If the user is connected, sends the notification via WebSocket.
   * If the user is not connected, stores the notification for later delivery.
   * Includes retry and fallback mechanisms for improved reliability.
   * 
   * @param userId - The ID of the user to send the notification to
   * @param notification - The notification entity to send
   * @param correlationId - Optional correlation ID for request tracing
   * @returns A promise that resolves with a boolean indicating whether the notification was sent successfully
   */
  async send(userId: string, notification: NotificationEntity, correlationId?: string): Promise<boolean> {
    const span = this.tracingService.startSpan('InAppService.send');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.id': notification.id,
        'notification.type': notification.type,
        'notification.channel': NotificationChannel.IN_APP,
        'correlation.id': correlationId || 'not-provided'
      });
      
      this.logger.log(
        `Attempting to send in-app notification to user ${userId}`,
        'InAppService',
        { correlationId, notificationId: notification.id }
      );

      // Check if user is connected to WebSocket server
      const isConnected = await this.checkUserConnection(userId, correlationId);

      if (isConnected) {
        // If user is connected, send notification immediately
        const notificationPayload = this.createNotificationPayload(notification);
        
        const sent = await this.websocketsGateway.sendToUser(userId, notificationPayload);
        
        if (sent) {
          this.logger.debug(
            `In-app notification sent to connected user ${userId}`,
            'InAppService',
            { correlationId, notificationId: notification.id }
          );
          return true;
        } else {
          // If WebSocket delivery fails, try to store for later delivery as fallback
          this.logger.warn(
            `WebSocket delivery failed for user ${userId}, attempting to store for later delivery`,
            'InAppService',
            { correlationId, notificationId: notification.id }
          );
          
          return await this.handleFailedDelivery(userId, notification, correlationId);
        }
      } else {
        // If user is not connected, store notification for later delivery
        const stored = await this.storeNotificationForLaterDelivery(userId, notification, correlationId);
        
        this.logger.debug(
          `User ${userId} not connected. Notification stored for later delivery: ${stored}`,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
        
        return stored;
      }
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.type': error.name
      });
      
      this.logger.error(
        `Failed to send in-app notification to user ${userId}: ${error.message}`,
        error.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: error.code || 'UNKNOWN_ERROR' }
      );
      
      // Attempt to handle the failure with retry mechanism
      return await this.handleFailedDelivery(userId, notification, correlationId, error);
    } finally {
      span.end();
    }
  }

  /**
   * Checks if a user is connected to the WebSocket server.
   * Uses Redis to verify if the user has an active connection.
   * 
   * @param userId - The ID of the user to check
   * @param correlationId - Optional correlation ID for request tracing
   * @returns A promise that resolves with a boolean indicating whether the user is connected
   */
  async checkUserConnection(userId: string, correlationId?: string): Promise<boolean> {
    const span = this.tracingService.startSpan('InAppService.checkUserConnection');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'correlation.id': correlationId || 'not-provided'
      });
      
      // Check if user has an active WebSocket connection
      const connectionKey = `user:${userId}:connection`;
      const connectionExists = await this.redisService.exists(connectionKey);
      
      const isConnected = connectionExists > 0;
      
      span.setAttributes({
        'user.connected': isConnected
      });
      
      return isConnected;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.type': error.name
      });
      
      this.logger.error(
        `Error checking connection status for user ${userId}: ${error.message}`,
        error.stack,
        'InAppService',
        { correlationId, errorCode: error.code || 'UNKNOWN_ERROR' }
      );
      
      // Default to false if there's an error checking connection status
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Stores a notification for later delivery when the user connects.
   * Uses Redis to store the notification with an appropriate TTL based on journey context.
   * 
   * @param userId - The ID of the user to store the notification for
   * @param notification - The notification to store
   * @param correlationId - Optional correlation ID for request tracing
   * @returns A promise that resolves with a boolean indicating whether the notification was stored successfully
   */
  async storeNotificationForLaterDelivery(
    userId: string,
    notification: NotificationEntity,
    correlationId?: string,
  ): Promise<boolean> {
    const span = this.tracingService.startSpan('InAppService.storeNotificationForLaterDelivery');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.id': notification.id,
        'notification.type': notification.type,
        'correlation.id': correlationId || 'not-provided'
      });
      
      // Create a key for the user's pending notifications
      const pendingNotificationsKey = `user:${userId}:pending_notifications`;
      
      // Create notification payload
      const notificationPayload = this.createNotificationPayload(notification);
      
      // Serialize the notification
      const serializedNotification = JSON.stringify(notificationPayload);
      
      // Generate a unique ID for the notification
      const notificationId = notification.id.toString() || `${Date.now()}`;
      
      // Store the notification in a Redis hash
      await this.redisService.hset(
        pendingNotificationsKey,
        notificationId,
        serializedNotification
      );
      
      // Set an appropriate TTL for the pending notifications key
      const journey = this.getJourneyFromNotification(notification);
      const ttl = this.getJourneyTTL(journey);
      
      await this.redisService.expire(pendingNotificationsKey, ttl);
      
      this.logger.debug(
        `Stored notification ${notification.id} for user ${userId} with TTL ${ttl}s`,
        'InAppService',
        { correlationId, notificationId: notification.id, journey, ttl }
      );
      
      return true;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.type': error.name
      });
      
      this.logger.error(
        `Error storing notification for later delivery for user ${userId}: ${error.message}`,
        error.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: error.code || 'UNKNOWN_ERROR' }
      );
      
      // Attempt to schedule a retry for the storage operation
      return await this.scheduleRetryForStorage(userId, notification, correlationId, error);
    } finally {
      span.end();
    }
  }

  /**
   * Handles a failed notification delivery by attempting fallback strategies.
   * First tries to store for later delivery, then schedules a retry if that fails.
   * 
   * @param userId - The ID of the user
   * @param notification - The notification that failed to deliver
   * @param correlationId - Optional correlation ID for request tracing
   * @param error - Optional error that caused the failure
   * @returns A promise resolving to true if any fallback strategy succeeded, false otherwise
   * @private
   */
  private async handleFailedDelivery(
    userId: string,
    notification: NotificationEntity,
    correlationId?: string,
    error?: Error
  ): Promise<boolean> {
    const span = this.tracingService.startSpan('InAppService.handleFailedDelivery');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.id': notification.id,
        'correlation.id': correlationId || 'not-provided',
        'error.present': !!error
      });
      
      this.logger.log(
        `Handling failed delivery for notification ${notification.id} to user ${userId}`,
        'InAppService',
        { correlationId, notificationId: notification.id }
      );
      
      // First try to store the notification for later delivery
      try {
        const stored = await this.storeNotificationForLaterDelivery(userId, notification, correlationId);
        
        if (stored) {
          this.logger.log(
            `Successfully stored notification ${notification.id} for later delivery after failed immediate delivery`,
            'InAppService',
            { correlationId, notificationId: notification.id }
          );
          return true;
        }
      } catch (storageError) {
        this.logger.warn(
          `Failed to store notification ${notification.id} for later delivery: ${storageError.message}`,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
        // Continue to retry scheduling
      }
      
      // If storage fails or isn't available, schedule a retry
      const retryError = error || new Error('Failed to deliver notification');
      return await this.scheduleRetryForDelivery(userId, notification, correlationId, retryError);
    } catch (handlingError) {
      span.setAttributes({
        'error': true,
        'error.message': handlingError.message,
        'error.type': handlingError.name
      });
      
      this.logger.error(
        `Error handling failed delivery for notification ${notification.id} to user ${userId}: ${handlingError.message}`,
        handlingError.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: handlingError.code || 'UNKNOWN_ERROR' }
      );
      
      // Last resort: try to send to dead-letter queue
      try {
        await this.sendToDeadLetterQueue(userId, notification, correlationId, handlingError);
        return false;
      } catch (dlqError) {
        this.logger.error(
          `Failed to send notification ${notification.id} to DLQ: ${dlqError.message}`,
          dlqError.stack,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
        return false;
      }
    } finally {
      span.end();
    }
  }

  /**
   * Schedules a retry for a failed notification delivery.
   * 
   * @param userId - The ID of the user
   * @param notification - The notification to retry
   * @param correlationId - Optional correlation ID for request tracing
   * @param error - The error that caused the failure
   * @returns A promise resolving to true if retry was scheduled successfully, false otherwise
   * @private
   */
  private async scheduleRetryForDelivery(
    userId: string,
    notification: NotificationEntity,
    correlationId?: string,
    error?: Error
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Scheduling retry for notification ${notification.id} delivery to user ${userId}`,
        'InAppService',
        { correlationId, notificationId: notification.id }
      );
      
      // Create retry payload
      const retryPayload = {
        userId,
        notification: this.createNotificationPayload(notification),
        operation: 'send',
        correlationId,
        timestamp: new Date().toISOString(),
      };
      
      // Configure retry options based on notification priority
      const retryOptions: Partial<IRetryOptions> = {
        maxRetries: notification.priority === NotificationPriority.HIGH ? 5 : 3,
        initialDelay: 1000, // 1 second
        maxDelay: 60000, // 1 minute
      };
      
      // Schedule the retry
      const nextRetryTime = await this.retryService.scheduleRetry(
        notification.id,
        NotificationChannel.IN_APP,
        error || new Error('Failed to deliver notification'),
        retryPayload,
        1, // First attempt
        retryOptions
      );
      
      if (nextRetryTime) {
        this.logger.log(
          `Successfully scheduled retry for notification ${notification.id} at ${nextRetryTime.toISOString()}`,
          'InAppService',
          { correlationId, notificationId: notification.id, nextRetryTime: nextRetryTime.toISOString() }
        );
        return true;
      } else {
        this.logger.warn(
          `Failed to schedule retry for notification ${notification.id}`,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
        return false;
      }
    } catch (retryError) {
      this.logger.error(
        `Error scheduling retry for notification ${notification.id}: ${retryError.message}`,
        retryError.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: retryError.code || 'UNKNOWN_ERROR' }
      );
      
      // Try to send to dead-letter queue as last resort
      try {
        await this.sendToDeadLetterQueue(userId, notification, correlationId, retryError);
      } catch (dlqError) {
        this.logger.error(
          `Failed to send notification ${notification.id} to DLQ: ${dlqError.message}`,
          dlqError.stack,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
      }
      
      return false;
    }
  }

  /**
   * Schedules a retry for a failed notification storage operation.
   * 
   * @param userId - The ID of the user
   * @param notification - The notification to retry storing
   * @param correlationId - Optional correlation ID for request tracing
   * @param error - The error that caused the storage failure
   * @returns A promise resolving to true if retry was scheduled successfully, false otherwise
   * @private
   */
  private async scheduleRetryForStorage(
    userId: string,
    notification: NotificationEntity,
    correlationId?: string,
    error?: Error
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Scheduling retry for notification ${notification.id} storage for user ${userId}`,
        'InAppService',
        { correlationId, notificationId: notification.id }
      );
      
      // Create retry payload
      const retryPayload = {
        userId,
        notification: this.createNotificationPayload(notification),
        operation: 'store',
        correlationId,
        timestamp: new Date().toISOString(),
      };
      
      // Configure retry options
      const retryOptions: Partial<IRetryOptions> = {
        maxRetries: 3,
        initialDelay: 2000, // 2 seconds
        maxDelay: 30000, // 30 seconds
      };
      
      // Schedule the retry
      const nextRetryTime = await this.retryService.scheduleRetry(
        notification.id,
        NotificationChannel.IN_APP,
        error || new Error('Failed to store notification'),
        retryPayload,
        1, // First attempt
        retryOptions
      );
      
      if (nextRetryTime) {
        this.logger.log(
          `Successfully scheduled retry for notification ${notification.id} storage at ${nextRetryTime.toISOString()}`,
          'InAppService',
          { correlationId, notificationId: notification.id, nextRetryTime: nextRetryTime.toISOString() }
        );
        return true;
      } else {
        this.logger.warn(
          `Failed to schedule retry for notification ${notification.id} storage`,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
        return false;
      }
    } catch (retryError) {
      this.logger.error(
        `Error scheduling retry for notification ${notification.id} storage: ${retryError.message}`,
        retryError.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: retryError.code || 'UNKNOWN_ERROR' }
      );
      
      // Try to send to dead-letter queue as last resort
      try {
        await this.sendToDeadLetterQueue(userId, notification, correlationId, retryError);
      } catch (dlqError) {
        this.logger.error(
          `Failed to send notification ${notification.id} to DLQ: ${dlqError.message}`,
          dlqError.stack,
          'InAppService',
          { correlationId, notificationId: notification.id }
        );
      }
      
      return false;
    }
  }

  /**
   * Sends a failed notification to the dead-letter queue for later analysis and potential reprocessing.
   * 
   * @param userId - The ID of the user
   * @param notification - The notification that failed to deliver
   * @param correlationId - Optional correlation ID for request tracing
   * @param error - The error that caused the failure
   * @returns A promise resolving when the notification is sent to the DLQ
   * @private
   */
  private async sendToDeadLetterQueue(
    userId: string,
    notification: NotificationEntity,
    correlationId?: string,
    error?: Error
  ): Promise<void> {
    const span = this.tracingService.startSpan('InAppService.sendToDeadLetterQueue');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.id': notification.id,
        'correlation.id': correlationId || 'not-provided',
        'error.message': error?.message || 'Unknown error'
      });
      
      this.logger.log(
        `Sending notification ${notification.id} to DLQ for user ${userId}`,
        'InAppService',
        { correlationId, notificationId: notification.id }
      );
      
      // In a real implementation, this would call the DLQ service
      // For now, we'll simulate it with a log message
      this.logger.warn(
        `Notification ${notification.id} for user ${userId} sent to DLQ: ${error?.message || 'Unknown error'}`,
        'InAppService',
        {
          correlationId,
          notificationId: notification.id,
          errorCode: (error as any)?.code || 'UNKNOWN_ERROR',
          errorType: error?.name || 'Error',
          journey: this.getJourneyFromNotification(notification)
        }
      );
      
      // In a real implementation, we would call something like:
      // await this.dlqService.addEntry({
      //   notificationId: notification.id.toString(),
      //   userId,
      //   channel: NotificationChannel.IN_APP,
      //   payload: this.createNotificationPayload(notification),
      //   errorDetails: {
      //     message: error?.message || 'Unknown error',
      //     stack: error?.stack,
      //     name: error?.name || 'Error',
      //     code: (error as any)?.code || 'UNKNOWN_ERROR',
      //   },
      //   correlationId,
      //   journey: this.getJourneyFromNotification(notification)
      // });
    } catch (dlqError) {
      span.setAttributes({
        'error': true,
        'error.message': dlqError.message,
        'error.type': dlqError.name
      });
      
      this.logger.error(
        `Failed to send notification ${notification.id} to DLQ: ${dlqError.message}`,
        dlqError.stack,
        'InAppService',
        { correlationId, notificationId: notification.id, errorCode: dlqError.code || 'UNKNOWN_ERROR' }
      );
      
      throw dlqError;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a standardized notification payload from a notification entity.
   * 
   * @param notification - The notification entity
   * @returns A standardized notification payload
   * @private
   */
  private createNotificationPayload(notification: NotificationEntity): Notification {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      body: notification.body,
      timestamp: notification.createdAt || new Date().toISOString(),
      channel: NotificationChannel.IN_APP,
      status: notification.status as NotificationStatus,
      priority: notification.priority as NotificationPriority || NotificationPriority.NORMAL,
      data: notification.data || {},
      metadata: {
        journey: this.getJourneyFromNotification(notification),
        ...(notification.metadata || {})
      }
    };
  }

  /**
   * Determines the journey context from a notification.
   * Used to set appropriate cache TTLs based on journey type.
   * 
   * @param notification - The notification to analyze
   * @returns The journey identifier (health, care, plan, game)
   * @private
   */
  private getJourneyFromNotification(notification: NotificationEntity): NotificationJourney {
    // Default to health journey if no type is available
    if (!notification || !notification.type) return NotificationJourney.HEALTH;
    
    const type = notification.type.toLowerCase();
    
    if (type.includes('health') || type.includes('metric') || type.includes('goal')) {
      return NotificationJourney.HEALTH;
    } else if (type.includes('care') || type.includes('appointment') || type.includes('medication')) {
      return NotificationJourney.CARE;
    } else if (type.includes('plan') || type.includes('claim') || type.includes('coverage')) {
      return NotificationJourney.PLAN;
    } else if (type.includes('achievement') || type.includes('quest') || type.includes('level')) {
      return NotificationJourney.GAMIFICATION;
    }
    
    return NotificationJourney.HEALTH; // Default to health journey if type is unknown
  }

  /**
   * Gets the appropriate TTL for a notification based on its journey context.
   * Different journeys have different caching requirements.
   * 
   * @param journey - The journey context
   * @returns The TTL in seconds
   * @private
   */
  private getJourneyTTL(journey: NotificationJourney): number {
    // Get TTLs from configuration with defaults
    const ttlConfig = this.configService.get('notification.ttl', {
      health: 86400, // 24 hours
      care: 172800, // 48 hours
      plan: 604800, // 7 days
      game: 259200, // 3 days
      default: 86400, // 24 hours
    });
    
    switch (journey) {
      case NotificationJourney.HEALTH:
        return ttlConfig.health;
      case NotificationJourney.CARE:
        return ttlConfig.care;
      case NotificationJourney.PLAN:
        return ttlConfig.plan;
      case NotificationJourney.GAMIFICATION:
        return ttlConfig.game;
      default:
        return ttlConfig.default;
    }
  }
}