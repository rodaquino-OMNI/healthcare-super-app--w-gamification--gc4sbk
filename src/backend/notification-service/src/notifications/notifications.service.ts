import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { RedisService } from '@app/shared/redis/redis.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

import { EmailService } from '../channels/email/email.service';
import { SmsService } from '../channels/sms/sms.service';
import { PushService } from '../channels/push/push.service';
import { InAppService } from '../channels/in-app/in-app.service';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { PreferencesService } from '../preferences/preferences.service';
import { TemplatesService } from '../templates/templates.service';
import { RetryService } from '../retry/retry.service';

import { Notification } from './entities/notification.entity';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ChannelsConfig, FallbackConfig } from '../config/channels.config';
import { NotificationChannel, NotificationStatus } from '@austa/interfaces/notification/types';

/**
 * Service responsible for managing notifications in the AUSTA SuperApp.
 * Handles sending notifications through multiple channels, tracking delivery status,
 * and implementing fallback strategies for improved reliability.
 */
@Injectable()
export class NotificationsService {
  /**
   * Creates an instance of NotificationsService.
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly inAppService: InAppService,
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly preferencesService: PreferencesService,
    private readonly templatesService: TemplatesService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Sends a notification to a user through the appropriate channels based on preferences.
   * Implements fallback strategies if the primary channel fails.
   * 
   * @param dto - The notification data to send
   * @returns The created notification entity
   */
  async sendNotification(dto: SendNotificationDto): Promise<Notification> {
    const span = this.tracingService.startSpan('NotificationsService.sendNotification');
    
    try {
      this.logger.log(`Sending notification to user ${dto.userId}`, 'NotificationsService');
      
      // Get user preferences to determine enabled channels
      const preferences = await this.preferencesService.findByUserId(dto.userId);
      
      // Apply template if templateId is provided
      let title = dto.title;
      let body = dto.body;
      
      if (dto.templateId) {
        const template = await this.templatesService.findByTemplateId(
          dto.templateId,
          dto.language || 'pt-BR',
        );
        
        if (template) {
          const data = dto.data || {};
          title = this.templatesService.applyTemplate(template.title, data);
          body = this.templatesService.applyTemplate(template.body, data);
        }
      }
      
      // Create notification entity
      const notification = this.notificationRepository.create({
        id: uuidv4(),
        userId: dto.userId,
        type: dto.type,
        title,
        body,
        status: NotificationStatus.SENT,
        channel: NotificationChannel.IN_APP, // Default channel, will be updated based on delivery
      });
      
      // Save notification to database
      await this.notificationRepository.save(notification);
      
      // Determine channels to use based on preferences and notification type
      const channels = this.determineChannels(dto.type, preferences);
      
      // Send notification through each channel with fallback strategy
      const deliveryResults = await this.sendThroughChannels(notification, channels);
      
      // Update notification status based on delivery results
      if (deliveryResults.some(result => result.success)) {
        notification.status = NotificationStatus.DELIVERED;
      } else {
        notification.status = NotificationStatus.FAILED;
        
        // Queue for retry if enabled
        if (this.configService.get<boolean>('channels.global.retryFailedDeliveries')) {
          await this.retryService.queueForRetry(notification);
        }
      }
      
      // Update notification with successful channel
      const successfulChannel = deliveryResults.find(result => result.success);
      if (successfulChannel) {
        notification.channel = successfulChannel.channel;
      }
      
      // Save updated notification status
      await this.notificationRepository.save(notification);
      
      // Publish notification event to Kafka for analytics
      await this.kafkaService.emit('notification.sent', {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        status: notification.status,
        channel: notification.channel,
        timestamp: new Date().toISOString(),
      });
      
      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
        'NotificationsService',
      );
      
      throw new AppException(
        'Failed to send notification',
        ErrorType.INTERNAL,
        'NOTIFICATION_001',
        { userId: dto.userId, type: dto.type },
        error,
      );
    } finally {
      span.end();
    }
  }

  /**
   * Determines which channels to use for sending a notification based on
   * notification type and user preferences.
   * 
   * @param type - The type of notification
   * @param preferences - The user's notification preferences
   * @returns Array of channels to use for sending the notification
   * @private
   */
  private determineChannels(type: string, preferences: any): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    
    // Always include in-app notifications
    if (preferences?.inAppEnabled !== false) {
      channels.push(NotificationChannel.IN_APP);
    }
    
    // Add push notifications if enabled
    if (preferences?.pushEnabled) {
      channels.push(NotificationChannel.PUSH);
    }
    
    // Add email notifications if enabled
    if (preferences?.emailEnabled) {
      channels.push(NotificationChannel.EMAIL);
    }
    
    // Add SMS notifications for critical notifications if enabled
    if (preferences?.smsEnabled && this.isCriticalNotification(type)) {
      channels.push(NotificationChannel.SMS);
    }
    
    // If no channels are enabled, default to in-app
    if (channels.length === 0) {
      channels.push(NotificationChannel.IN_APP);
    }
    
    return channels;
  }

  /**
   * Determines if a notification type is considered critical.
   * Critical notifications may be sent through additional channels like SMS.
   * 
   * @param type - The notification type to check
   * @returns True if the notification is critical, false otherwise
   * @private
   */
  private isCriticalNotification(type: string): boolean {
    const criticalTypes = [
      'appointment_reminder',
      'medication_reminder',
      'emergency_alert',
      'security_alert',
      'payment_failed',
      'account_locked',
    ];
    
    return criticalTypes.includes(type.toLowerCase());
  }

  /**
   * Sends a notification through multiple channels with fallback strategy.
   * If a channel fails, attempts to send through fallback channels based on configuration.
   * 
   * @param notification - The notification entity to send
   * @param channels - Array of channels to attempt delivery through
   * @returns Array of delivery results for each channel
   * @private
   */
  private async sendThroughChannels(
    notification: Notification,
    channels: NotificationChannel[],
  ): Promise<Array<{ channel: NotificationChannel; success: boolean }>> {
    const results: Array<{ channel: NotificationChannel; success: boolean }> = [];
    const enableFallback = this.configService.get<boolean>('channels.global.enableFallback');
    
    // Try each channel in order
    for (const channel of channels) {
      try {
        const success = await this.sendThroughChannel(notification, channel);
        
        results.push({ channel, success });
        
        // If successful and not configured to try all channels, stop here
        if (success) {
          break;
        }
        
        // If channel failed and fallback is enabled, try fallback channels
        if (!success && enableFallback) {
          const fallbackResult = await this.tryFallbackChannels(notification, channel);
          
          if (fallbackResult.success) {
            results.push(fallbackResult);
            break;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error sending through channel ${channel}: ${error.message}`,
          error.stack,
          'NotificationsService',
        );
        
        results.push({ channel, success: false });
        
        // Try fallback if enabled
        if (enableFallback) {
          const fallbackResult = await this.tryFallbackChannels(notification, channel);
          
          if (fallbackResult.success) {
            results.push(fallbackResult);
            break;
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Attempts to send a notification through fallback channels when the primary channel fails.
   * 
   * @param notification - The notification entity to send
   * @param failedChannel - The channel that failed to deliver the notification
   * @returns The result of the fallback attempt
   * @private
   */
  private async tryFallbackChannels(
    notification: Notification,
    failedChannel: NotificationChannel,
  ): Promise<{ channel: NotificationChannel; success: boolean }> {
    // Get fallback configuration for the failed channel
    const fallbackConfig = this.configService.get<FallbackConfig>(`channels.${this.getChannelConfigKey(failedChannel)}.fallback`);
    
    if (!fallbackConfig || !fallbackConfig.enabled || !fallbackConfig.channels.length) {
      return { channel: failedChannel, success: false };
    }
    
    // Try each fallback channel in order
    for (const fallbackChannel of fallbackConfig.channels) {
      // Skip if fallback channel is the same as the failed channel
      if (fallbackChannel === failedChannel) {
        continue;
      }
      
      try {
        this.logger.log(
          `Attempting fallback delivery via ${fallbackChannel} for failed ${failedChannel}`,
          'NotificationsService',
        );
        
        const success = await this.sendThroughChannel(notification, fallbackChannel);
        
        if (success) {
          return { channel: fallbackChannel, success: true };
        }
      } catch (error) {
        this.logger.error(
          `Fallback channel ${fallbackChannel} also failed: ${error.message}`,
          error.stack,
          'NotificationsService',
        );
      }
    }
    
    return { channel: failedChannel, success: false };
  }

  /**
   * Sends a notification through a specific channel.
   * 
   * @param notification - The notification entity to send
   * @param channel - The channel to send the notification through
   * @returns True if the notification was sent successfully, false otherwise
   * @private
   */
  private async sendThroughChannel(
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const span = this.tracingService.startSpan(`NotificationsService.sendThroughChannel.${channel}`);
    
    try {
      this.logger.log(`Sending notification ${notification.id} through ${channel}`, 'NotificationsService');
      
      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.emailService.sendEmail(
            notification.userId, // Assuming userId is an email address for simplicity
            notification.title,
            notification.body,
          );
          return true;
          
        case NotificationChannel.SMS:
          await this.smsService.sendSms(
            notification.userId, // Assuming userId is a phone number for simplicity
            notification.body,
          );
          return true;
          
        case NotificationChannel.PUSH:
          // In a real implementation, we would look up the user's device tokens
          const deviceToken = await this.redisService.get(`user:${notification.userId}:device_token`);
          
          if (!deviceToken) {
            this.logger.warn(`No device token found for user ${notification.userId}`, 'NotificationsService');
            return false;
          }
          
          await this.pushService.send(deviceToken, {
            title: notification.title,
            body: notification.body,
            data: {
              notificationId: notification.id,
              type: notification.type,
            },
          });
          return true;
          
        case NotificationChannel.IN_APP:
          return await this.inAppService.send(notification.userId, notification);
          
        default:
          this.logger.warn(`Unsupported channel: ${channel}`, 'NotificationsService');
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send through ${channel}: ${error.message}`,
        error.stack,
        'NotificationsService',
      );
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Gets a list of notifications for a specific user.
   * 
   * @param userId - The ID of the user to get notifications for
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns Array of notifications for the user
   */
  async getNotificationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Notification[]> {
    try {
      return await this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}: ${error.message}`,
        error.stack,
        'NotificationsService',
      );
      
      throw new AppException(
        'Failed to get notifications',
        ErrorType.INTERNAL,
        'NOTIFICATION_002',
        { userId },
        error,
      );
    }
  }

  /**
   * Marks a notification as read.
   * 
   * @param notificationId - The ID of the notification to mark as read
   * @param userId - The ID of the user who owns the notification
   * @returns The updated notification
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });
      
      if (!notification) {
        throw new AppException(
          'Notification not found',
          ErrorType.NOT_FOUND,
          'NOTIFICATION_003',
          { notificationId, userId },
        );
      }
      
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      
      await this.notificationRepository.save(notification);
      
      // Publish event for analytics
      await this.kafkaService.emit('notification.read', {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        timestamp: new Date().toISOString(),
      });
      
      return notification;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to mark notification ${notificationId} as read: ${error.message}`,
        error.stack,
        'NotificationsService',
      );
      
      throw new AppException(
        'Failed to mark notification as read',
        ErrorType.INTERNAL,
        'NOTIFICATION_004',
        { notificationId, userId },
        error,
      );
    }
  }

  /**
   * Marks all notifications for a user as read.
   * 
   * @param userId - The ID of the user whose notifications should be marked as read
   * @returns The number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationRepository.update(
        { userId, status: NotificationStatus.DELIVERED },
        { status: NotificationStatus.READ, readAt: new Date() },
      );
      
      // Publish event for analytics
      await this.kafkaService.emit('notification.all_read', {
        userId,
        count: result.affected,
        timestamp: new Date().toISOString(),
      });
      
      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}: ${error.message}`,
        error.stack,
        'NotificationsService',
      );
      
      throw new AppException(
        'Failed to mark all notifications as read',
        ErrorType.INTERNAL,
        'NOTIFICATION_005',
        { userId },
        error,
      );
    }
  }

  /**
   * Gets the configuration key for a notification channel.
   * 
   * @param channel - The notification channel
   * @returns The configuration key for the channel
   * @private
   */
  private getChannelConfigKey(channel: NotificationChannel): string {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return 'email';
      case NotificationChannel.SMS:
        return 'sms';
      case NotificationChannel.PUSH:
        return 'push';
      case NotificationChannel.IN_APP:
        return 'inApp';
      default:
        return 'inApp';
    }
  }
}