/**
 * @file configuration.ts
 * @description Configuration provider for the notification service using NestJS's registerAs factory pattern.
 * Loads environment variables for server settings, notification channels, Kafka integration, and retry policies.
 * Applies sensible defaults, performs type conversions, and enforces a strongly typed configuration object structure.
 */

import { registerAs } from '@nestjs/config';
import { KafkaOptions } from '@nestjs/microservices';
import { NotificationChannel } from '@austa/interfaces/notification/types';
import { RetryPolicyType } from '@app/shared/retry/constants';

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /** Node environment (development, production, test, provision) */
  nodeEnv: string;
  /** HTTP server port */
  port: number;
  /** WebSocket server port */
  websocketPort: number;
  /** Base URL for the service */
  baseUrl: string;
}

/**
 * Email channel configuration interface
 */
export interface EmailChannelConfig {
  /** Email service provider (sendgrid, mailgun, etc.) */
  provider: string;
  /** API key for the email service */
  apiKey: string;
  /** Default sender email address */
  defaultFrom: string;
  /** Maximum retries for failed email deliveries */
  maxRetries: number;
}

/**
 * SMS channel configuration interface
 */
export interface SmsChannelConfig {
  /** Twilio account SID */
  accountSid: string;
  /** Twilio auth token */
  authToken: string;
  /** Default sender phone number */
  defaultFrom: string;
  /** Maximum retries for failed SMS deliveries */
  maxRetries: number;
}

/**
 * Push notification channel configuration interface
 */
export interface PushChannelConfig {
  /** Firebase Cloud Messaging API key */
  apiKey: string;
  /** Maximum retries for failed push deliveries */
  maxRetries: number;
  /** TTL for push notifications in seconds */
  ttl: number;
}

/**
 * In-app notification channel configuration interface
 */
export interface InAppChannelConfig {
  /** Maximum number of unread notifications to keep per user */
  maxUnreadNotifications: number;
  /** Time in days to keep notifications before archiving */
  retentionDays: number;
}

/**
 * Notification channels configuration interface
 */
export interface NotificationChannelsConfig {
  /** Email channel configuration */
  email: EmailChannelConfig;
  /** SMS channel configuration */
  sms: SmsChannelConfig;
  /** Push notification channel configuration */
  push: PushChannelConfig;
  /** In-app notification channel configuration */
  inApp: InAppChannelConfig;
  /** Default channels to use for each notification type */
  defaultChannels: Record<string, NotificationChannel[]>;
  /** Fallback channels to use when primary channel fails */
  fallbackChannels: Record<NotificationChannel, NotificationChannel[]>;
}

/**
 * Fixed delay retry policy configuration interface
 */
export interface FixedDelayRetryConfig {
  /** Type of retry policy */
  type: RetryPolicyType.FIXED_DELAY;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  delayMs: number;
}

/**
 * Exponential backoff retry policy configuration interface
 */
export interface ExponentialBackoffRetryConfig {
  /** Type of retry policy */
  type: RetryPolicyType.EXPONENTIAL_BACKOFF;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay for first retry in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Backoff factor to multiply delay by after each attempt */
  backoffFactor: number;
  /** Jitter factor to add randomness to delay (0-1) */
  jitter: number;
}

/**
 * Dead letter queue configuration interface
 */
export interface DlqConfig {
  /** Whether to enable the dead letter queue */
  enabled: boolean;
  /** Kafka topic for the dead letter queue */
  topic: string;
  /** Time in days to retain messages in the DLQ */
  retentionDays: number;
}

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  /** Default retry policy for all channels */
  defaultPolicy: FixedDelayRetryConfig | ExponentialBackoffRetryConfig;
  /** Channel-specific retry policies */
  channelPolicies: {
    [key in NotificationChannel]?: FixedDelayRetryConfig | ExponentialBackoffRetryConfig;
  };
  /** Dead letter queue configuration */
  dlq: DlqConfig;
}

/**
 * Kafka configuration interface
 */
export interface KafkaConfig {
  /** Kafka client options */
  options: KafkaOptions['options'];
  /** Consumer group ID */
  consumerGroup: string;
  /** Topics configuration */
  topics: {
    /** Notification requests topic */
    notificationRequests: string;
    /** Notification status updates topic */
    notificationStatus: string;
    /** Journey events topic */
    journeyEvents: string;
    /** Gamification events topic */
    gamificationEvents: string;
  };
}

/**
 * Complete notification service configuration interface
 */
export interface NotificationServiceConfig {
  /** Server configuration */
  server: ServerConfig;
  /** Notification channels configuration */
  channels: NotificationChannelsConfig;
  /** Retry configuration */
  retry: RetryConfig;
  /** Kafka configuration */
  kafka: KafkaConfig;
}

/**
 * Configuration factory function that loads environment variables and returns a strongly typed configuration object.
 * Uses the NestJS registerAs pattern to make the configuration available through the ConfigService.
 * 
 * @returns The complete notification service configuration object
 */
export default registerAs('notification', (): NotificationServiceConfig => {
  return {
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      websocketPort: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    },
    channels: {
      email: {
        provider: process.env.EMAIL_PROVIDER || '',
        apiKey: process.env.EMAIL_API_KEY || '',
        defaultFrom: process.env.EMAIL_DEFAULT_FROM || '',
        maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
      },
      sms: {
        accountSid: process.env.SMS_ACCOUNT_SID || '',
        authToken: process.env.SMS_AUTH_TOKEN || '',
        defaultFrom: process.env.SMS_DEFAULT_FROM || '',
        maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3', 10),
      },
      push: {
        apiKey: process.env.PUSH_API_KEY || '',
        maxRetries: parseInt(process.env.PUSH_MAX_RETRIES || '3', 10),
        ttl: parseInt(process.env.PUSH_TTL || '86400', 10), // 24 hours
      },
      inApp: {
        maxUnreadNotifications: parseInt(process.env.IN_APP_MAX_UNREAD || '100', 10),
        retentionDays: parseInt(process.env.IN_APP_RETENTION_DAYS || '90', 10),
      },
      // Default channels for different notification types
      defaultChannels: {
        system: [NotificationChannel.IN_APP],
        achievement: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        appointment: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        medication: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        claim: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      },
      // Fallback channels when primary channel fails
      fallbackChannels: {
        [NotificationChannel.EMAIL]: [NotificationChannel.IN_APP],
        [NotificationChannel.SMS]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        [NotificationChannel.PUSH]: [NotificationChannel.IN_APP],
        [NotificationChannel.IN_APP]: [],
      },
    },
    retry: {
      defaultPolicy: {
        type: RetryPolicyType.EXPONENTIAL_BACKOFF,
        maxRetries: parseInt(process.env.DEFAULT_MAX_RETRIES || '3', 10),
        initialDelayMs: parseInt(process.env.DEFAULT_INITIAL_DELAY_MS || '1000', 10),
        maxDelayMs: parseInt(process.env.DEFAULT_MAX_DELAY_MS || '60000', 10),
        backoffFactor: parseFloat(process.env.DEFAULT_BACKOFF_FACTOR || '2.0'),
        jitter: parseFloat(process.env.DEFAULT_JITTER || '0.1'),
      },
      channelPolicies: {
        [NotificationChannel.EMAIL]: {
          type: RetryPolicyType.EXPONENTIAL_BACKOFF,
          maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '5', 10),
          initialDelayMs: parseInt(process.env.EMAIL_INITIAL_DELAY_MS || '2000', 10),
          maxDelayMs: parseInt(process.env.EMAIL_MAX_DELAY_MS || '300000', 10), // 5 minutes
          backoffFactor: parseFloat(process.env.EMAIL_BACKOFF_FACTOR || '2.0'),
          jitter: parseFloat(process.env.EMAIL_JITTER || '0.2'),
        },
        [NotificationChannel.SMS]: {
          type: RetryPolicyType.EXPONENTIAL_BACKOFF,
          maxRetries: parseInt(process.env.SMS_MAX_RETRIES || '3', 10),
          initialDelayMs: parseInt(process.env.SMS_INITIAL_DELAY_MS || '5000', 10),
          maxDelayMs: parseInt(process.env.SMS_MAX_DELAY_MS || '180000', 10), // 3 minutes
          backoffFactor: parseFloat(process.env.SMS_BACKOFF_FACTOR || '2.0'),
          jitter: parseFloat(process.env.SMS_JITTER || '0.2'),
        },
        [NotificationChannel.PUSH]: {
          type: RetryPolicyType.FIXED_DELAY,
          maxRetries: parseInt(process.env.PUSH_MAX_RETRIES || '2', 10),
          delayMs: parseInt(process.env.PUSH_RETRY_DELAY_MS || '10000', 10), // 10 seconds
        },
      },
      dlq: {
        enabled: process.env.DLQ_ENABLED !== 'false',
        topic: process.env.DLQ_TOPIC || 'notification-service-dlq',
        retentionDays: parseInt(process.env.DLQ_RETENTION_DAYS || '7', 10),
      },
    },
    kafka: {
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
          brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        },
        consumer: {
          groupId: process.env.KAFKA_CONSUMER_GROUP || 'notification-service-group',
          allowAutoTopicCreation: process.env.KAFKA_AUTO_TOPIC_CREATION !== 'false',
        },
      },
      consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'notification-service-group',
      topics: {
        notificationRequests: process.env.KAFKA_TOPIC_NOTIFICATION_REQUESTS || 'notification-requests',
        notificationStatus: process.env.KAFKA_TOPIC_NOTIFICATION_STATUS || 'notification-status',
        journeyEvents: process.env.KAFKA_TOPIC_JOURNEY_EVENTS || 'journey-events',
        gamificationEvents: process.env.KAFKA_TOPIC_GAMIFICATION_EVENTS || 'gamification-events',
      },
    },
  };
});