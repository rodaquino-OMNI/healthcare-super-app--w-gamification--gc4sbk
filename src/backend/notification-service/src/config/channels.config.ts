import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from @austa/interfaces package for standardized schemas
import { NotificationChannel, NotificationType, NotificationPriority } from '@austa/interfaces/notification/types';

// Import local interfaces
import {
  IChannelConfig,
  IEmailChannelConfig,
  ISmsChannelConfig,
  IPushChannelConfig,
  IInAppChannelConfig,
  IChannelCapabilities,
  IEmailChannelCapabilities,
  ISmsChannelCapabilities,
  IPushChannelCapabilities,
  IInAppChannelCapabilities,
  FailureClassification,
} from '../interfaces/notification-channel.interface';

/**
 * Configuration provider for notification channels
 * 
 * This service centralizes the configuration for all notification delivery channels
 * including email, SMS, push notifications, and in-app messages. It provides
 * channel-specific settings, fallback strategies, and rate limiting configuration.
 */
@Injectable()
export class ChannelsConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get configuration for all notification channels
   * @returns Record of channel configurations indexed by channel type
   */
  getAllChannelsConfig(): Record<NotificationChannel, IChannelConfig> {
    return {
      [NotificationChannel.EMAIL]: this.getEmailConfig(),
      [NotificationChannel.SMS]: this.getSmsConfig(),
      [NotificationChannel.PUSH]: this.getPushConfig(),
      [NotificationChannel.IN_APP]: this.getInAppConfig(),
    };
  }

  /**
   * Get configuration for email notification channel
   * @returns Email channel configuration
   */
  getEmailConfig(): IEmailChannelConfig {
    return {
      enabled: true,
      maxRetryAttempts: 3,
      retryOptions: {
        initialDelay: 30000, // 30 seconds
        maxDelay: 3600000, // 1 hour
        backoffFactor: 2, // Exponential backoff
        retryableErrors: [
          FailureClassification.TRANSIENT,
          FailureClassification.RATE_LIMITED,
          FailureClassification.SERVICE_UNAVAILABLE,
        ],
      },
      defaultSender: this.configService.get<string>('EMAIL_DEFAULT_FROM'),
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
      providerConfig: {
        host: this.configService.get<string>('EMAIL_HOST', 'smtp.sendgrid.net'),
        port: this.configService.get<number>('EMAIL_PORT', 587),
        secure: this.configService.get<boolean>('EMAIL_SECURE', false),
        auth: {
          user: this.configService.get<string>('EMAIL_USER', 'apikey'),
          pass: this.configService.get<string>('EMAIL_API_KEY'),
        },
        from: this.configService.get<string>('EMAIL_DEFAULT_FROM'),
      },
      fallbackChannel: NotificationChannel.IN_APP,
    };
  }

  /**
   * Get configuration for SMS notification channel
   * @returns SMS channel configuration
   */
  getSmsConfig(): ISmsChannelConfig {
    return {
      enabled: true,
      maxRetryAttempts: 2,
      retryOptions: {
        initialDelay: 60000, // 1 minute
        maxDelay: 1800000, // 30 minutes
        backoffFactor: 3, // Exponential backoff
        retryableErrors: [
          FailureClassification.TRANSIENT,
          FailureClassification.RATE_LIMITED,
          FailureClassification.SERVICE_UNAVAILABLE,
        ],
      },
      defaultSender: this.configService.get<string>('SMS_DEFAULT_FROM'),
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 500,
        requestsPerDay: 5000,
      },
      providerConfig: {
        accountSid: this.configService.get<string>('SMS_ACCOUNT_SID'),
        authToken: this.configService.get<string>('SMS_AUTH_TOKEN'),
        defaultFrom: this.configService.get<string>('SMS_DEFAULT_FROM'),
      },
      fallbackChannel: NotificationChannel.EMAIL,
    };
  }

  /**
   * Get configuration for push notification channel
   * @returns Push channel configuration
   */
  getPushConfig(): IPushChannelConfig {
    return {
      enabled: true,
      maxRetryAttempts: 3,
      retryOptions: {
        initialDelay: 15000, // 15 seconds
        maxDelay: 900000, // 15 minutes
        backoffFactor: 2, // Exponential backoff
        retryableErrors: [
          FailureClassification.TRANSIENT,
          FailureClassification.RATE_LIMITED,
          FailureClassification.SERVICE_UNAVAILABLE,
        ],
      },
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerHour: 2000,
        requestsPerDay: 20000,
      },
      providerConfig: {
        apiKey: this.configService.get<string>('PUSH_API_KEY'),
        projectId: this.configService.get<string>('PUSH_PROJECT_ID', 'austa-superapp'),
        appId: this.configService.get<string>('PUSH_APP_ID'),
      },
      fallbackChannel: NotificationChannel.IN_APP,
    };
  }

  /**
   * Get configuration for in-app notification channel
   * @returns In-app channel configuration
   */
  getInAppConfig(): IInAppChannelConfig {
    return {
      enabled: true,
      maxRetryAttempts: 2,
      retryOptions: {
        initialDelay: 5000, // 5 seconds
        maxDelay: 300000, // 5 minutes
        backoffFactor: 2, // Exponential backoff
        retryableErrors: [
          FailureClassification.TRANSIENT,
          FailureClassification.SERVICE_UNAVAILABLE,
        ],
      },
      rateLimits: {
        requestsPerMinute: 500,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
      },
      providerConfig: {
        ttl: this.configService.get<number>('IN_APP_TTL', 604800), // 7 days in seconds
        maxNotificationsPerUser: this.configService.get<number>('IN_APP_MAX_NOTIFICATIONS', 100),
        persistForOfflineUsers: true,
      },
      // No fallback for in-app as it's typically the fallback itself
    };
  }

  /**
   * Get capabilities for all notification channels
   * @returns Record of channel capabilities indexed by channel type
   */
  getAllChannelsCapabilities(): Record<NotificationChannel, IChannelCapabilities> {
    return {
      [NotificationChannel.EMAIL]: this.getEmailCapabilities(),
      [NotificationChannel.SMS]: this.getSmsCapabilities(),
      [NotificationChannel.PUSH]: this.getPushCapabilities(),
      [NotificationChannel.IN_APP]: this.getInAppCapabilities(),
    };
  }

  /**
   * Get capabilities for email notification channel
   * @returns Email channel capabilities
   */
  getEmailCapabilities(): IEmailChannelCapabilities {
    return {
      supportsRichContent: true,
      supportsAttachments: true,
      supportsDeliveryConfirmation: false,
      supportsReadReceipts: false,
      maxContentSize: 10 * 1024 * 1024, // 10 MB
      supportedPriorities: [
        NotificationPriority.LOW,
        NotificationPriority.MEDIUM,
        NotificationPriority.HIGH,
      ],
      supportedTypes: [
        NotificationType.SYSTEM,
        NotificationType.ACHIEVEMENT,
        NotificationType.APPOINTMENT,
        NotificationType.MEDICATION,
        NotificationType.CLAIM,
        NotificationType.PLAN,
        NotificationType.HEALTH,
      ],
      supportsHtml: true,
      supportsInlineCSS: true,
      maxAttachmentSize: 5 * 1024 * 1024, // 5 MB
      supportedAttachmentTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    };
  }

  /**
   * Get capabilities for SMS notification channel
   * @returns SMS channel capabilities
   */
  getSmsCapabilities(): ISmsChannelCapabilities {
    return {
      supportsRichContent: false,
      supportsAttachments: false,
      supportsDeliveryConfirmation: true,
      supportsReadReceipts: false,
      maxContentSize: 1600, // Characters
      supportedPriorities: [
        NotificationPriority.HIGH,
        NotificationPriority.CRITICAL,
      ],
      supportedTypes: [
        NotificationType.SYSTEM,
        NotificationType.APPOINTMENT,
        NotificationType.MEDICATION,
        NotificationType.CLAIM,
      ],
      maxMessageLength: 160,
      supportsUnicode: true,
      supportsConcatenation: true,
    };
  }

  /**
   * Get capabilities for push notification channel
   * @returns Push channel capabilities
   */
  getPushCapabilities(): IPushChannelCapabilities {
    return {
      supportsRichContent: true,
      supportsAttachments: false,
      supportsDeliveryConfirmation: true,
      supportsReadReceipts: false,
      maxContentSize: 4 * 1024, // 4 KB
      supportedPriorities: [
        NotificationPriority.LOW,
        NotificationPriority.MEDIUM,
        NotificationPriority.HIGH,
        NotificationPriority.CRITICAL,
      ],
      supportedTypes: [
        NotificationType.SYSTEM,
        NotificationType.ACHIEVEMENT,
        NotificationType.APPOINTMENT,
        NotificationType.MEDICATION,
        NotificationType.CLAIM,
        NotificationType.PLAN,
        NotificationType.HEALTH,
      ],
      supportsActionButtons: true,
      supportsBadges: true,
      supportsSounds: true,
      supportsImages: true,
      maxActionButtons: 3,
    };
  }

  /**
   * Get capabilities for in-app notification channel
   * @returns In-app channel capabilities
   */
  getInAppCapabilities(): IInAppChannelCapabilities {
    return {
      supportsRichContent: true,
      supportsAttachments: false,
      supportsDeliveryConfirmation: true,
      supportsReadReceipts: true,
      supportedPriorities: [
        NotificationPriority.LOW,
        NotificationPriority.MEDIUM,
        NotificationPriority.HIGH,
        NotificationPriority.CRITICAL,
      ],
      supportedTypes: [
        NotificationType.SYSTEM,
        NotificationType.ACHIEVEMENT,
        NotificationType.APPOINTMENT,
        NotificationType.MEDICATION,
        NotificationType.CLAIM,
        NotificationType.PLAN,
        NotificationType.HEALTH,
      ],
      supportsPersistence: true,
      supportsActions: true,
      supportsGrouping: true,
      supportsDismissal: true,
    };
  }

  /**
   * Get default channel for a notification type
   * @param notificationType The notification type
   * @returns The default channel for the notification type
   */
  getDefaultChannelForType(notificationType: NotificationType): NotificationChannel {
    switch (notificationType) {
      case NotificationType.ACHIEVEMENT:
        return NotificationChannel.IN_APP;
      case NotificationType.APPOINTMENT:
        return NotificationChannel.PUSH;
      case NotificationType.MEDICATION:
        return NotificationChannel.PUSH;
      case NotificationType.CLAIM:
        return NotificationChannel.EMAIL;
      case NotificationType.PLAN:
        return NotificationChannel.EMAIL;
      case NotificationType.HEALTH:
        return NotificationChannel.PUSH;
      case NotificationType.SYSTEM:
      default:
        return NotificationChannel.IN_APP;
    }
  }

  /**
   * Get fallback channel sequence for a notification type
   * This defines the order in which channels should be tried if the primary channel fails
   * @param notificationType The notification type
   * @returns Array of channels in fallback order
   */
  getFallbackChannelSequence(notificationType: NotificationType): NotificationChannel[] {
    switch (notificationType) {
      case NotificationType.ACHIEVEMENT:
        return [NotificationChannel.IN_APP, NotificationChannel.PUSH];
      case NotificationType.APPOINTMENT:
        return [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.IN_APP];
      case NotificationType.MEDICATION:
        return [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.IN_APP];
      case NotificationType.CLAIM:
        return [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP];
      case NotificationType.PLAN:
        return [NotificationChannel.EMAIL, NotificationChannel.IN_APP];
      case NotificationType.HEALTH:
        return [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL];
      case NotificationType.SYSTEM:
      default:
        return [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL];
    }
  }

  /**
   * Get journey-specific channel preferences
   * This defines the preferred channels for each journey
   * @param journeyType The journey type (health, care, plan)
   * @returns Record of preferred channels by notification type
   */
  getJourneyChannelPreferences(journeyType: 'health' | 'care' | 'plan'): Record<NotificationType, NotificationChannel[]> {
    switch (journeyType) {
      case 'health':
        return {
          [NotificationType.ACHIEVEMENT]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          [NotificationType.HEALTH]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          [NotificationType.SYSTEM]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          [NotificationType.APPOINTMENT]: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
          [NotificationType.MEDICATION]: [NotificationChannel.PUSH, NotificationChannel.SMS],
          [NotificationType.CLAIM]: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          [NotificationType.PLAN]: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        };
      case 'care':
        return {
          [NotificationType.ACHIEVEMENT]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          [NotificationType.HEALTH]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
          [NotificationType.SYSTEM]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          [NotificationType.APPOINTMENT]: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
          [NotificationType.MEDICATION]: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
          [NotificationType.CLAIM]: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          [NotificationType.PLAN]: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        };
      case 'plan':
        return {
          [NotificationType.ACHIEVEMENT]: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          [NotificationType.HEALTH]: [NotificationChannel.IN_APP],
          [NotificationType.SYSTEM]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          [NotificationType.APPOINTMENT]: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          [NotificationType.MEDICATION]: [NotificationChannel.IN_APP],
          [NotificationType.CLAIM]: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
          [NotificationType.PLAN]: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        };
      default:
        return {
          [NotificationType.ACHIEVEMENT]: [NotificationChannel.IN_APP],
          [NotificationType.HEALTH]: [NotificationChannel.IN_APP],
          [NotificationType.SYSTEM]: [NotificationChannel.IN_APP],
          [NotificationType.APPOINTMENT]: [NotificationChannel.IN_APP],
          [NotificationType.MEDICATION]: [NotificationChannel.IN_APP],
          [NotificationType.CLAIM]: [NotificationChannel.IN_APP],
          [NotificationType.PLAN]: [NotificationChannel.IN_APP],
        };
    }
  }

  /**
   * Get channel-specific rate limiting configuration
   * @param channelType The notification channel type
   * @returns Rate limiting configuration for the channel
   */
  getChannelRateLimits(channelType: NotificationChannel): {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  } {
    const allConfigs = this.getAllChannelsConfig();
    return allConfigs[channelType]?.rateLimits || {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    };
  }

  /**
   * Check if a channel is enabled
   * @param channelType The notification channel type
   * @returns True if the channel is enabled
   */
  isChannelEnabled(channelType: NotificationChannel): boolean {
    const allConfigs = this.getAllChannelsConfig();
    return allConfigs[channelType]?.enabled || false;
  }

  /**
   * Get retry configuration for a channel
   * @param channelType The notification channel type
   * @returns Retry configuration for the channel
   */
  getChannelRetryOptions(channelType: NotificationChannel): {
    maxRetryAttempts: number;
    retryOptions: {
      initialDelay: number;
      maxDelay: number;
      backoffFactor: number;
      retryableErrors: FailureClassification[];
    };
  } {
    const allConfigs = this.getAllChannelsConfig();
    return {
      maxRetryAttempts: allConfigs[channelType]?.maxRetryAttempts || 0,
      retryOptions: allConfigs[channelType]?.retryOptions || {
        initialDelay: 30000,
        maxDelay: 3600000,
        backoffFactor: 2,
        retryableErrors: [
          FailureClassification.TRANSIENT,
          FailureClassification.RATE_LIMITED,
          FailureClassification.SERVICE_UNAVAILABLE,
        ],
      },
    };
  }
}