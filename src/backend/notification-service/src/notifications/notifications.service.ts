import { Injectable } from '@nestjs/common'; // @nestjs/common v10.3.0+
import { InjectRepository } from '@nestjs/typeorm'; // @nestjs/typeorm v10.3.0+
import { Repository } from 'typeorm'; // typeorm v0.3.0+
import { Span } from '@nestjs/opentelemetry'; // @nestjs/opentelemetry v1.0.0+

// Import standardized interfaces from @austa/interfaces
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus, 
  NotificationPriority,
  INotification,
  INotificationContent,
  INotificationDeliveryResult
} from '@austa/interfaces/notification/types';
import { INotificationPreference } from '@austa/interfaces/notification/preferences';
import { INotificationTemplate } from '@austa/interfaces/notification/templates';

// Import DTOs and entities
import { SendNotificationDto } from './dto/send-notification.dto';
import { Notification } from './entities/notification.entity';

// Import services
import { PreferencesService } from '../preferences/preferences.service';
import { TemplatesService } from '../templates/templates.service';
import { RetryService } from '../retry/retry.service';
import { DlqService } from '../retry/dlq/dlq.service';
import { KafkaService } from '../../shared/src/kafka/kafka.service';
import { LoggerService } from '../../shared/src/logging/logger.service';
import { RedisService } from '../../shared/src/redis/redis.service';
import { TracingService } from '../../shared/src/tracing/tracing.service';

// Import interfaces and types
import { IRetryableOperation } from '../retry/interfaces/retryable-operation.interface';
import { RetryStatus } from '../retry/interfaces/retry-status.enum';

/**
 * Provides the core logic for sending notifications within the AUSTA SuperApp.
 * It supports sending notifications via multiple channels, including push notifications,
 * SMS, and email. The service retrieves user preferences and templates to personalize
 * notifications and ensures reliable delivery with retry policies and fallback mechanisms.
 */
@Injectable()
export class NotificationsService {
  // Map of fallback channels for each primary channel
  private readonly channelFallbacks: Record<NotificationChannel, NotificationChannel[]> = {
    [NotificationChannel.PUSH]: [NotificationChannel.IN_APP],
    [NotificationChannel.EMAIL]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    [NotificationChannel.SMS]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    [NotificationChannel.IN_APP]: [] // No fallback for in-app notifications
  };

  /**
   * Initializes the NotificationsService.
   * 
   * @param notificationRepository - Repository for notification entities
   * @param preferencesService - Service for user notification preferences
   * @param templatesService - Service for notification templates
   * @param retryService - Service for retry policies and scheduling
   * @param dlqService - Service for dead-letter queue management
   * @param kafkaService - Service for event streaming 
   * @param logger - Service for logging
   * @param redisService - Service for caching and real-time communication
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly preferencesService: PreferencesService,
    private readonly templatesService: TemplatesService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Sends a notification to a user based on the provided DTO.
   * Implements retry policies and fallback mechanisms for reliable delivery.
   * 
   * @param sendNotificationDto - Data required to send the notification
   * @returns Promise that resolves when the notification is sent
   */
  @Span('notifications.sendNotification')
  async sendNotification(sendNotificationDto: SendNotificationDto): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Sending notification to user ${sendNotificationDto.userId} of type ${sendNotificationDto.type}`,
        'NotificationsService',
        { userId: sendNotificationDto.userId, type: sendNotificationDto.type, traceId }
      );

      // Get user notification preferences
      const userPreferences = await this.preferencesService.findOne(sendNotificationDto.userId);
      
      if (!userPreferences) {
        this.logger.log(
          `No notification preferences found for user ${sendNotificationDto.userId}, using defaults`,
          'NotificationsService',
          { userId: sendNotificationDto.userId, traceId }
        );
        // If no preferences found, create default preferences
        await this.preferencesService.create(sendNotificationDto.userId);
      }

      // Determine which channels to use based on user preferences and notification type
      const channels = this.determineNotificationChannels(
        userPreferences,
        sendNotificationDto.type,
      );

      if (channels.length === 0) {
        this.logger.log(
          `User ${sendNotificationDto.userId} has disabled all notification channels for type ${sendNotificationDto.type}`,
          'NotificationsService',
          { userId: sendNotificationDto.userId, type: sendNotificationDto.type, traceId }
        );
        return;
      }

      // Get notification template if templateId is provided
      let notificationContent: INotificationContent = {
        title: sendNotificationDto.title,
        body: sendNotificationDto.body,
        data: sendNotificationDto.data || {},
      };

      if (sendNotificationDto.templateId) {
        try {
          // Try to get the template by ID and language
          const templates = await this.templatesService.findAll({
            where: {
              templateId: sendNotificationDto.templateId,
              language: sendNotificationDto.language || 'pt-BR',
            },
          });

          if (templates && templates.length > 0) {
            const template = templates[0];
            // Format the template with the provided data
            const formattedTemplate = this.templatesService.formatTemplateWithData(
              template,
              sendNotificationDto.data || {},
            );
            notificationContent = {
              ...notificationContent,
              title: formattedTemplate.title,
              body: formattedTemplate.body,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Error fetching template ${sendNotificationDto.templateId}: ${error.message}`,
            'NotificationsService',
            { userId: sendNotificationDto.userId, templateId: sendNotificationDto.templateId, error: error.message, traceId }
          );
          // Continue with original content if template not found
        }
      }

      // Track successful and failed channels for Kafka event
      const deliveryResults: Record<string, INotificationDeliveryResult> = {};
      let anyChannelSucceeded = false;

      // Send notification through each enabled channel
      for (const channel of channels) {
        try {
          // Create a retryable operation for this notification channel
          const notificationOperation = this.createRetryableOperation(
            channel,
            sendNotificationDto.userId,
            notificationContent,
          );

          // Create notification record in database
          const notification = await this.createNotificationRecord(
            sendNotificationDto.userId,
            sendNotificationDto.type,
            notificationContent.title,
            notificationContent.body,
            channel,
            NotificationStatus.PENDING,
            { priority: this.determinePriority(sendNotificationDto.type) }
          );

          // Execute the operation with retry capability
          await notificationOperation.execute();

          // Update notification status to sent
          await this.updateNotificationStatus(
            notification.id,
            NotificationStatus.SENT,
            { deliveredAt: new Date().toISOString() }
          );

          // Record successful delivery
          deliveryResults[channel] = { 
            success: true, 
            timestamp: new Date().toISOString() 
          };
          anyChannelSucceeded = true;

          this.logger.log(
            `Successfully sent notification via ${channel} to user ${sendNotificationDto.userId}`,
            'NotificationsService',
            { userId: sendNotificationDto.userId, channel, notificationId: notification.id, traceId }
          );
        } catch (error) {
          this.logger.error(
            `Failed to send notification via ${channel} to user ${sendNotificationDto.userId}`,
            error,
            'NotificationsService',
            { userId: sendNotificationDto.userId, channel, error: error.message, traceId }
          );

          // Record failed notification
          const notification = await this.createNotificationRecord(
            sendNotificationDto.userId,
            sendNotificationDto.type,
            notificationContent.title,
            notificationContent.body,
            channel,
            NotificationStatus.FAILED,
            { 
              error: error.message,
              priority: this.determinePriority(sendNotificationDto.type)
            }
          );

          // Record failure in delivery results
          deliveryResults[channel] = { 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString() 
          };

          // Try fallback channels if primary channel fails
          const fallbackResult = await this.tryFallbackChannels(
            channel,
            sendNotificationDto.userId,
            notificationContent,
            sendNotificationDto.type,
            channels, // Skip channels already attempted
            notification.id
          );

          if (fallbackResult.success) {
            anyChannelSucceeded = true;
            deliveryResults[fallbackResult.channel] = { 
              success: true, 
              timestamp: fallbackResult.timestamp,
              fallbackFor: channel
            };
          }

          // Schedule retry for the failed channel
          const retryableOperation = this.createRetryableOperation(
            channel,
            sendNotificationDto.userId,
            notificationContent,
          );

          await this.retryService.scheduleRetry(
            retryableOperation,
            error,
            {
              notificationId: notification.id,
              userId: sendNotificationDto.userId,
              channel,
              attemptCount: 0
            }
          );
        }
      }

      // Publish notification event to Kafka for analytics and cross-service integration
      try {
        await this.kafkaService.produce(
          'notifications.events',
          {
            eventType: 'notification.processed',
            userId: sendNotificationDto.userId,
            type: sendNotificationDto.type,
            channels,
            title: notificationContent.title,
            deliveryResults,
            anyChannelSucceeded,
            timestamp: new Date().toISOString(),
            traceId
          },
          sendNotificationDto.userId, // Use userId as key for consistent partitioning
        );
      } catch (error) {
        this.logger.error(
          `Failed to publish notification event to Kafka`,
          error,
          'NotificationsService',
          { userId: sendNotificationDto.userId, error: error.message, traceId }
        );
        // Non-blocking - we continue even if Kafka publishing fails
      }

      this.logger.log(
        `Completed sending notification to user ${sendNotificationDto.userId}`,
        'NotificationsService',
        { userId: sendNotificationDto.userId, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Error in sendNotification for user ${sendNotificationDto.userId}`,
        error,
        'NotificationsService',
        { userId: sendNotificationDto.userId, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Tries to send a notification through fallback channels when the primary channel fails.
   * 
   * @param primaryChannel - The primary channel that failed
   * @param userId - User ID
   * @param content - Notification content
   * @param type - Notification type
   * @param skipChannels - Channels to skip (already attempted)
   * @param originalNotificationId - ID of the original failed notification
   * @returns Promise resolving to the result of the fallback attempt
   * @private
   */
  @Span('notifications.tryFallbackChannels')
  private async tryFallbackChannels(
    primaryChannel: string,
    userId: string,
    content: INotificationContent,
    type: string,
    skipChannels: string[],
    originalNotificationId: number
  ): Promise<{ success: boolean; channel?: string; timestamp?: string }> {
    const traceId = this.tracingService.getCurrentTraceId();
    const fallbackChannels = this.channelFallbacks[primaryChannel as NotificationChannel] || [];
    
    // Filter out channels that are already in the skip list
    const availableFallbacks = fallbackChannels.filter(
      channel => !skipChannels.includes(channel)
    );

    if (availableFallbacks.length === 0) {
      this.logger.log(
        `No fallback channels available for ${primaryChannel}`,
        'NotificationsService',
        { userId, primaryChannel, traceId }
      );
      return { success: false };
    }

    // Try each fallback channel in order
    for (const fallbackChannel of availableFallbacks) {
      try {
        this.logger.log(
          `Attempting fallback delivery via ${fallbackChannel} for failed ${primaryChannel} notification`,
          'NotificationsService',
          { userId, primaryChannel, fallbackChannel, originalNotificationId, traceId }
        );

        // Create notification record for the fallback attempt
        const fallbackNotification = await this.createNotificationRecord(
          userId,
          type,
          content.title,
          content.body,
          fallbackChannel,
          NotificationStatus.PENDING,
          { 
            fallbackFor: primaryChannel,
            originalNotificationId,
            priority: this.determinePriority(type)
          }
        );

        // Send through the fallback channel
        await this.sendThroughChannel(fallbackChannel, userId, content);

        // Update notification status
        await this.updateNotificationStatus(
          fallbackNotification.id,
          NotificationStatus.SENT,
          { 
            deliveredAt: new Date().toISOString(),
            fallbackFor: primaryChannel,
            originalNotificationId
          }
        );

        this.logger.log(
          `Successfully delivered notification via fallback channel ${fallbackChannel}`,
          'NotificationsService',
          { userId, primaryChannel, fallbackChannel, fallbackNotificationId: fallbackNotification.id, traceId }
        );

        return { 
          success: true, 
          channel: fallbackChannel,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(
          `Fallback channel ${fallbackChannel} also failed`,
          error,
          'NotificationsService',
          { userId, primaryChannel, fallbackChannel, error: error.message, traceId }
        );
        
        // Continue to the next fallback channel
      }
    }

    this.logger.warn(
      `All fallback channels failed for ${primaryChannel} notification`,
      'NotificationsService',
      { userId, primaryChannel, traceId }
    );

    return { success: false };
  }

  /**
   * Creates a notification record in the database.
   * 
   * @param userId - User ID
   * @param type - Notification type
   * @param title - Notification title
   * @param body - Notification body
   * @param channel - Delivery channel
   * @param status - Notification status
   * @param metadata - Additional metadata for the notification
   * @returns The created notification record
   * @private
   */
  @Span('notifications.createNotificationRecord')
  private async createNotificationRecord(
    userId: string,
    type: string,
    title: string,
    body: string,
    channel: string,
    status: NotificationStatus,
    metadata: Record<string, any> = {}
  ): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        userId,
        type,
        title,
        body,
        channel,
        status,
        // Additional fields for retry tracking
        retryCount: 0,
        priority: metadata.priority || NotificationPriority.MEDIUM,
        metadata: JSON.stringify(metadata)
      });

      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(
        `Failed to create notification record for user ${userId}`,
        error,
        'NotificationsService',
        { userId, type, channel, status, error: error.message }
      );
      // Non-blocking - we don't want to fail notification delivery if record creation fails
      return null;
    }
  }

  /**
   * Updates the status of a notification in the database.
   * 
   * @param id - Notification ID
   * @param status - New status
   * @param metadata - Additional metadata to update
   * @returns Promise that resolves when the update is complete
   * @private
   */
  @Span('notifications.updateNotificationStatus')
  private async updateNotificationStatus(
    id: number,
    status: NotificationStatus,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Get current notification to update metadata properly
      const notification = await this.notificationRepository.findOne({ where: { id } });
      if (!notification) {
        this.logger.warn(
          `Notification ${id} not found for status update`,
          'NotificationsService',
          { notificationId: id, status }
        );
        return;
      }

      // Parse existing metadata if any
      let existingMetadata = {};
      try {
        if (notification.metadata) {
          existingMetadata = JSON.parse(notification.metadata);
        }
      } catch (parseError) {
        this.logger.warn(
          `Error parsing existing metadata for notification ${id}`,
          'NotificationsService',
          { notificationId: id, error: parseError.message }
        );
      }

      // Merge existing and new metadata
      const updatedMetadata = { ...existingMetadata, ...metadata };

      await this.notificationRepository.update(
        id,
        { 
          status,
          metadata: JSON.stringify(updatedMetadata),
          updatedAt: new Date()
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update notification ${id} status to ${status}`,
        error,
        'NotificationsService',
        { notificationId: id, status, error: error.message }
      );
    }
  }

  /**
   * Determines which notification channels to use based on user preferences.
   * 
   * @param preferences - User notification preferences
   * @param type - Notification type
   * @returns Array of channels to use
   * @private
   */
  private determineNotificationChannels(preferences: INotificationPreference, type: string): string[] {
    const channels: string[] = [];

    // Default to in-app notifications if no preferences are found
    if (!preferences) {
      return [NotificationChannel.IN_APP, NotificationChannel.PUSH];
    }

    // Get journey context from notification type
    const journeyContext = this.getJourneyFromNotificationType(type);

    // Check journey-specific preferences if available
    const journeyPrefs = journeyContext && preferences.journeyPreferences?.[journeyContext];

    // Add channels based on user preferences
    if ((journeyPrefs?.pushEnabled ?? preferences.pushEnabled)) {
      channels.push(NotificationChannel.PUSH);
    }

    if ((journeyPrefs?.emailEnabled ?? preferences.emailEnabled)) {
      channels.push(NotificationChannel.EMAIL);
    }

    if ((journeyPrefs?.smsEnabled ?? preferences.smsEnabled)) {
      // SMS is typically used only for important notifications to manage costs
      const criticalTypes = ['emergency', 'appointment-reminder', 'medication-reminder'];
      if (criticalTypes.includes(type) || this.determinePriority(type) === NotificationPriority.CRITICAL) {
        channels.push(NotificationChannel.SMS);
      }
    }

    // In-app notifications are always enabled unless explicitly disabled
    if ((journeyPrefs?.inAppEnabled ?? preferences.inAppEnabled) !== false) {
      channels.push(NotificationChannel.IN_APP);
    }

    return channels;
  }

  /**
   * Determines the priority of a notification based on its type.
   * 
   * @param type - Notification type
   * @returns The priority level
   * @private
   */
  private determinePriority(type: string): NotificationPriority {
    // Critical notifications
    if (
      type.includes('emergency') || 
      type.includes('critical') ||
      type === 'medication-reminder'
    ) {
      return NotificationPriority.CRITICAL;
    }

    // High priority notifications
    if (
      type.includes('appointment') || 
      type.includes('payment-due') ||
      type.includes('claim-status')
    ) {
      return NotificationPriority.HIGH;
    }

    // Low priority notifications
    if (
      type.includes('newsletter') || 
      type.includes('promotion') ||
      type.includes('tip')
    ) {
      return NotificationPriority.LOW;
    }

    // Default to medium priority
    return NotificationPriority.MEDIUM;
  }

  /**
   * Creates a retryable operation for sending a notification through a specific channel.
   * 
   * @param channel - Delivery channel
   * @param userId - User ID
   * @param content - Notification content
   * @returns A retryable operation
   * @private
   */
  private createRetryableOperation(
    channel: string,
    userId: string,
    content: INotificationContent
  ): IRetryableOperation {
    return {
      execute: async () => {
        await this.sendThroughChannel(channel, userId, content);
      },
      getPayload: () => ({
        userId,
        channel,
        content
      }),
      getMetadata: () => ({
        userId,
        channel,
        contentType: 'notification',
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Sends a notification through a specific channel.
   * This method is exposed for use by the RetryService.
   * 
   * @param channel - Delivery channel
   * @param userId - User ID
   * @param content - Notification content
   * @returns Promise that resolves when the notification is sent
   */
  @Span('notifications.sendThroughChannel')
  async sendThroughChannel(
    channel: string,
    userId: string,
    content: INotificationContent
  ): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Sending notification through ${channel} channel to user ${userId}`,
      'NotificationsService',
      { userId, channel, traceId }
    );

    switch (channel) {
      case NotificationChannel.PUSH:
        await this.sendPushNotification(userId, content);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(userId, content);
        break;
      case NotificationChannel.SMS:
        await this.sendSmsNotification(userId, content);
        break;
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(userId, content);
        break;
      default:
        this.logger.warn(
          `Unknown notification channel: ${channel}`,
          'NotificationsService',
          { userId, channel, traceId }
        );
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  }

  /**
   * Sends a push notification.
   * 
   * @param userId - User ID
   * @param content - Notification content
   * @returns Promise that resolves when the notification is sent
   * @private
   */
  @Span('notifications.sendPushNotification')
  private async sendPushNotification(userId: string, content: INotificationContent): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Sending push notification to user ${userId}`,
      'NotificationsService',
      { userId, traceId }
    );

    // In a real implementation, this would integrate with FCM, APNs, or similar
    // For this implementation, we'll just log it
    this.logger.debug(
      `Push notification content: ${JSON.stringify(content)}`,
      'NotificationsService',
      { userId, contentLength: JSON.stringify(content).length, traceId }
    );

    // Simulate a delay for the external API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Sends an email notification.
   * 
   * @param userId - User ID
   * @param content - Notification content
   * @returns Promise that resolves when the notification is sent
   * @private
   */
  @Span('notifications.sendEmailNotification')
  private async sendEmailNotification(userId: string, content: INotificationContent): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Sending email notification to user ${userId}`,
      'NotificationsService',
      { userId, traceId }
    );

    // In a real implementation, this would integrate with SendGrid, SES, or similar
    // For this implementation, we'll just log it
    this.logger.debug(
      `Email notification content: ${JSON.stringify(content)}`,
      'NotificationsService',
      { userId, contentLength: JSON.stringify(content).length, traceId }
    );

    // Simulate a delay for the external API call
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  /**
   * Sends an SMS notification.
   * 
   * @param userId - User ID
   * @param content - Notification content
   * @returns Promise that resolves when the notification is sent
   * @private
   */
  @Span('notifications.sendSmsNotification')
  private async sendSmsNotification(userId: string, content: INotificationContent): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Sending SMS notification to user ${userId}`,
      'NotificationsService',
      { userId, traceId }
    );

    // In a real implementation, this would integrate with Twilio, SNS, or similar
    // For this implementation, we'll just log it
    this.logger.debug(
      `SMS notification content: ${JSON.stringify(content)}`,
      'NotificationsService',
      { userId, contentLength: JSON.stringify(content).length, traceId }
    );

    // Simulate a delay for the external API call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Sends an in-app notification through WebSocket.
   * 
   * @param userId - User ID
   * @param content - Notification content
   * @returns Promise that resolves when the notification is sent
   * @private
   */
  @Span('notifications.sendInAppNotification')
  private async sendInAppNotification(userId: string, content: INotificationContent): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Sending in-app notification to user ${userId}`,
      'NotificationsService',
      { userId, traceId }
    );

    try {
      // Create notification payload
      const notification: INotification = {
        userId,
        title: content.title,
        body: content.body,
        data: content.data || {},
        timestamp: new Date().toISOString(),
        id: Date.now().toString(), // Temporary ID for real-time delivery
        read: false,
        type: content.data?.type || 'general'
      };

      // Publish to Redis channel for real-time delivery to connected clients
      const userChannel = `user:${userId}:notifications`;
      await this.redisService.publish(
        userChannel,
        JSON.stringify(notification),
      );

      // Also store in Redis for retrieval when user reconnects
      const notificationListKey = `notifications:${userId}`;
      const notificationId = notification.id;
      
      await this.redisService.hset(
        notificationListKey,
        notificationId,
        JSON.stringify(notification),
      );

      // Set expiry for the notification list if it doesn't exist
      // Get appropriate TTL based on the journey context
      const journeyType = this.getJourneyFromNotificationType(content.data?.type) || 'health';
      const ttl = this.redisService.getJourneyTTL(journeyType);
      await this.redisService.expire(notificationListKey, ttl);

      this.logger.debug(
        `In-app notification sent via Redis to channel ${userChannel}`,
        'NotificationsService',
        { userId, channel: userChannel, notificationId, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification to user ${userId}`,
        error,
        'NotificationsService',
        { userId, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Determines the journey context from a notification type.
   * 
   * @param type - Notification type
   * @returns Journey identifier (health, care, plan)
   * @private
   */
  private getJourneyFromNotificationType(type: string): string | undefined {
    if (!type) return undefined;
    
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
   * Retrieves notifications for a user.
   * 
   * @param userId - User ID
   * @param limit - Maximum number of notifications to retrieve
   * @param offset - Offset for pagination
   * @returns Promise resolving to an array of notifications
   */
  @Span('notifications.getNotificationsForUser')
  async getNotificationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Notification[]> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      return this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(
        `Failed to retrieve notifications for user ${userId}`,
        error,
        'NotificationsService',
        { userId, limit, offset, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Marks a notification as read.
   * 
   * @param id - Notification ID
   * @returns Promise resolving to the updated notification
   */
  @Span('notifications.markAsRead')
  async markAsRead(id: number): Promise<Notification> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      await this.notificationRepository.update(id, { status: NotificationStatus.READ });
      return this.notificationRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${id} as read`,
        error,
        'NotificationsService',
        { notificationId: id, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Marks all notifications for a user as read.
   * 
   * @param userId - User ID
   * @returns Promise resolving to the number of notifications updated
   */
  @Span('notifications.markAllAsRead')
  async markAllAsRead(userId: string): Promise<number> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const result = await this.notificationRepository.update(
        { userId, status: NotificationStatus.SENT },
        { status: NotificationStatus.READ },
      );
      
      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}`,
        error,
        'NotificationsService',
        { userId, error: error.message, traceId }
      );
      throw error;
    }
  }

  /**
   * Processes failed notifications from the dead-letter queue.
   * This method is called by a scheduled job to retry notifications that were moved to the DLQ.
   * 
   * @param batchSize - Number of DLQ items to process in one batch
   * @returns Promise resolving to the number of successfully processed items
   */
  @Span('notifications.processDlqItems')
  async processDlqItems(batchSize: number = 10): Promise<number> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.logger.log(
        `Processing up to ${batchSize} items from notification DLQ`,
        'NotificationsService',
        { batchSize, traceId }
      );

      // Get items from DLQ
      const dlqItems = await this.dlqService.getDlqItems(batchSize);
      
      if (dlqItems.length === 0) {
        this.logger.log(
          'No items found in notification DLQ',
          'NotificationsService',
          { traceId }
        );
        return 0;
      }

      let successCount = 0;

      // Process each DLQ item
      for (const item of dlqItems) {
        try {
          // Extract notification details from DLQ item
          const { userId, channel, payload } = item;
          
          this.logger.log(
            `Processing DLQ item for user ${userId} on channel ${channel}`,
            'NotificationsService',
            { userId, channel, dlqItemId: item.id, traceId }
          );

          // Create a retryable operation
          const operation = {
            execute: async () => {
              await this.sendThroughChannel(channel, userId, payload.content);
            },
            getPayload: () => payload,
            getMetadata: () => item.metadata || {}
          };

          // Try to send the notification
          await operation.execute();

          // If successful, remove from DLQ and update notification status
          await this.dlqService.removeDlqItem(item.id);
          
          if (item.notificationId) {
            await this.updateNotificationStatus(
              item.notificationId,
              NotificationStatus.SENT,
              { 
                processedFromDlq: true,
                processedAt: new Date().toISOString(),
                dlqItemId: item.id
              }
            );
          }

          successCount++;
          
          this.logger.log(
            `Successfully processed DLQ item for user ${userId}`,
            'NotificationsService',
            { userId, channel, dlqItemId: item.id, traceId }
          );
        } catch (error) {
          this.logger.error(
            `Failed to process DLQ item ${item.id}`,
            error,
            'NotificationsService',
            { dlqItemId: item.id, error: error.message, traceId }
          );

          // Update retry count and last error in DLQ item
          await this.dlqService.updateDlqItem(item.id, {
            retryCount: (item.retryHistory?.attemptCount || 0) + 1,
            lastError: error.message,
            lastAttempt: new Date().toISOString()
          });
        }
      }

      this.logger.log(
        `Processed ${successCount}/${dlqItems.length} items from notification DLQ`,
        'NotificationsService',
        { successCount, totalProcessed: dlqItems.length, traceId }
      );

      return successCount;
    } catch (error) {
      this.logger.error(
        'Error processing notification DLQ items',
        error,
        'NotificationsService',
        { error: error.message, traceId }
      );
      throw error;
    }
  }
}