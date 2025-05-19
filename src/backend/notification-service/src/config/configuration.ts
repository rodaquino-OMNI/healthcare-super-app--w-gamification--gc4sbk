/**
 * Notification Service Configuration
 * 
 * This module provides the configuration for the notification service using NestJS's
 * registerAs factory pattern. It loads environment variables for server settings,
 * notification channels, Kafka integration, and retry policies.
 * 
 * The configuration is structured into logical sections:
 * - server: Basic server configuration (port, host, etc.)
 * - channels: Configuration for notification delivery channels (email, SMS, push, in-app)
 * - kafka: Kafka integration settings for event-based notifications
 * - retry: Retry policies for failed notification delivery attempts
 * - dlq: Dead Letter Queue configuration for notifications that exceed retry attempts
 */

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

// Import interfaces from shared packages
import { IRetryPolicy } from '@austa/interfaces/notification';
import { LogLevel } from '@app/shared/logging';
import { parseBoolean, parseNumber } from '@app/shared/utils';

// Import local constants
import { DEFAULT_PORT, DEFAULT_HOST, ENV } from './constants';
import { RetryPolicyType } from '../retry/constants/policy-types.constants';
import { ErrorType } from '../retry/constants/error-types.constants';

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /** Port the server listens on */
  port: number;
  /** Host the server binds to */
  host: string;
  /** Current environment (development, staging, production) */
  environment: string;
  /** Application name for service discovery and logging */
  appName: string;
  /** Log level for the application */
  logLevel: LogLevel;
  /** Whether to enable debug mode */
  debug: boolean;
}

/**
 * Email channel configuration interface
 */
export interface EmailChannelConfig {
  /** Email provider to use (sendgrid, ses, smtp) */
  provider: string;
  /** API key for the email provider */
  apiKey: string;
  /** Default sender email address */
  defaultSender: string;
  /** SMTP configuration if using SMTP provider */
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  /** Maximum rate of emails per minute */
  rateLimit: number;
  /** Whether to enable the email channel */
  enabled: boolean;
}

/**
 * SMS channel configuration interface
 */
export interface SmsChannelConfig {
  /** SMS provider to use (twilio, sns, etc.) */
  provider: string;
  /** Account SID for Twilio or equivalent */
  accountSid: string;
  /** Auth token for the SMS provider */
  authToken: string;
  /** Default sender phone number */
  defaultSender: string;
  /** Maximum rate of SMS per minute */
  rateLimit: number;
  /** Whether to enable the SMS channel */
  enabled: boolean;
}

/**
 * Push notification channel configuration interface
 */
export interface PushChannelConfig {
  /** Push notification provider (fcm, apns, etc.) */
  provider: string;
  /** API key for the push notification provider */
  apiKey: string;
  /** FCM project ID if using Firebase */
  fcmProjectId?: string;
  /** APNS certificate path if using Apple Push Notification Service */
  apnsCertPath?: string;
  /** APNS key ID if using Apple Push Notification Service */
  apnsKeyId?: string;
  /** APNS team ID if using Apple Push Notification Service */
  apnsTeamId?: string;
  /** Maximum rate of push notifications per minute */
  rateLimit: number;
  /** Whether to enable the push notification channel */
  enabled: boolean;
}

/**
 * In-app notification channel configuration interface
 */
export interface InAppChannelConfig {
  /** Whether to persist in-app notifications to database */
  persistToDatabase: boolean;
  /** Maximum number of unread notifications to keep per user */
  maxUnreadNotifications: number;
  /** Time to live for in-app notifications in days */
  ttlDays: number;
  /** Whether to enable the in-app notification channel */
  enabled: boolean;
}

/**
 * Notification channels configuration interface
 */
export interface ChannelsConfig {
  /** Email channel configuration */
  email: EmailChannelConfig;
  /** SMS channel configuration */
  sms: SmsChannelConfig;
  /** Push notification channel configuration */
  push: PushChannelConfig;
  /** In-app notification channel configuration */
  inApp: InAppChannelConfig;
  /** Whether to enable fallback to alternative channels when primary channel fails */
  enableFallback: boolean;
  /** Order of fallback channels to try */
  fallbackOrder: string[];
}

/**
 * Kafka configuration interface
 */
export interface KafkaConfig {
  /** List of Kafka broker addresses */
  brokers: string[];
  /** Consumer group ID for this service */
  groupId: string;
  /** Prefix for Kafka topics */
  topicPrefix: string;
  /** Topic for notification requests */
  notificationTopic: string;
  /** Topic for notification status updates */
  statusTopic: string;
  /** Client ID for this service */
  clientId: string;
  /** Whether to enable Kafka integration */
  enabled: boolean;
}

/**
 * Retry policy configuration interface
 */
export interface RetryConfig {
  /** Whether to enable retry mechanism */
  enabled: boolean;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay before first retry in milliseconds */
  initialDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Default retry policy type */
  defaultPolicyType: RetryPolicyType;
  /** Channel-specific retry policies */
  policies: {
    [channel: string]: {
      /** Policy type for this channel */
      policyType: RetryPolicyType;
      /** Maximum attempts for this channel */
      maxAttempts: number;
      /** Initial delay for this channel */
      initialDelay: number;
      /** Maximum delay for this channel */
      maxDelay: number;
      /** Backoff factor for exponential policies */
      backoffFactor?: number;
    };
  };
  /** Error type to retry policy mapping */
  errorTypeToPolicy: {
    [key in ErrorType]?: RetryPolicyType;
  };
}

/**
 * Dead Letter Queue configuration interface
 */
export interface DlqConfig {
  /** Whether to enable the Dead Letter Queue */
  enabled: boolean;
  /** Topic prefix for DLQ topics */
  topicPrefix: string;
  /** Whether to automatically retry messages from DLQ */
  autoRetry: boolean;
  /** Interval in milliseconds to check DLQ for retryable messages */
  retryInterval: number;
  /** Maximum age in milliseconds for messages to be retried from DLQ */
  maxAgeMs: number;
}

/**
 * Complete notification service configuration interface
 */
export interface NotificationServiceConfig {
  /** Server configuration */
  server: ServerConfig;
  /** Notification channels configuration */
  channels: ChannelsConfig;
  /** Kafka configuration */
  kafka: KafkaConfig;
  /** Retry configuration */
  retry: RetryConfig;
  /** Dead Letter Queue configuration */
  dlq: DlqConfig;
}

/**
 * Configuration factory for the notification service
 * 
 * Uses NestJS's registerAs pattern to provide a structured configuration object
 * loaded from environment variables with sensible defaults.
 * 
 * @returns The complete notification service configuration
 */
export default registerAs('notification', (): NotificationServiceConfig => {
  return {
    server: {
      port: parseNumber(process.env.PORT, DEFAULT_PORT),
      host: process.env.HOST || DEFAULT_HOST,
      environment: process.env.NODE_ENV || ENV.DEVELOPMENT,
      appName: process.env.APP_NAME || 'notification-service',
      logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      debug: parseBoolean(process.env.DEBUG, false),
    },
    channels: {
      email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY || '',
        defaultSender: process.env.EMAIL_DEFAULT_SENDER || 'noreply@austa.health',
        smtp: process.env.EMAIL_PROVIDER === 'smtp' ? {
          host: process.env.EMAIL_SMTP_HOST || 'localhost',
          port: parseNumber(process.env.EMAIL_SMTP_PORT, 587),
          secure: parseBoolean(process.env.EMAIL_SMTP_SECURE, false),
          auth: {
            user: process.env.EMAIL_SMTP_USER || '',
            pass: process.env.EMAIL_SMTP_PASS || '',
          },
        } : undefined,
        rateLimit: parseNumber(process.env.EMAIL_RATE_LIMIT, 100),
        enabled: parseBoolean(process.env.EMAIL_ENABLED, true),
      },
      sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.SMS_ACCOUNT_SID || '',
        authToken: process.env.SMS_AUTH_TOKEN || '',
        defaultSender: process.env.SMS_DEFAULT_SENDER || '',
        rateLimit: parseNumber(process.env.SMS_RATE_LIMIT, 10),
        enabled: parseBoolean(process.env.SMS_ENABLED, true),
      },
      push: {
        provider: process.env.PUSH_PROVIDER || 'fcm',
        apiKey: process.env.PUSH_API_KEY || '',
        fcmProjectId: process.env.FCM_PROJECT_ID,
        apnsCertPath: process.env.APNS_CERT_PATH,
        apnsKeyId: process.env.APNS_KEY_ID,
        apnsTeamId: process.env.APNS_TEAM_ID,
        rateLimit: parseNumber(process.env.PUSH_RATE_LIMIT, 1000),
        enabled: parseBoolean(process.env.PUSH_ENABLED, true),
      },
      inApp: {
        persistToDatabase: parseBoolean(process.env.IN_APP_PERSIST_TO_DB, true),
        maxUnreadNotifications: parseNumber(process.env.IN_APP_MAX_UNREAD, 100),
        ttlDays: parseNumber(process.env.IN_APP_TTL_DAYS, 30),
        enabled: parseBoolean(process.env.IN_APP_ENABLED, true),
      },
      enableFallback: parseBoolean(process.env.ENABLE_CHANNEL_FALLBACK, true),
      fallbackOrder: process.env.FALLBACK_CHANNEL_ORDER
        ? process.env.FALLBACK_CHANNEL_ORDER.split(',')
        : ['push', 'inApp', 'email', 'sms'],
    },
    kafka: {
      brokers: process.env.KAFKA_BROKERS
        ? process.env.KAFKA_BROKERS.split(',')
        : ['localhost:9092'],
      groupId: process.env.KAFKA_GROUP_ID || 'notification-service',
      topicPrefix: process.env.KAFKA_TOPIC_PREFIX || 'austa.',
      notificationTopic: process.env.KAFKA_NOTIFICATION_TOPIC || 'notifications',
      statusTopic: process.env.KAFKA_STATUS_TOPIC || 'notification-status',
      clientId: process.env.KAFKA_CLIENT_ID || 'notification-service-client',
      enabled: parseBoolean(process.env.KAFKA_ENABLED, true),
    },
    retry: {
      enabled: parseBoolean(process.env.RETRY_ENABLED, true),
      maxAttempts: parseNumber(process.env.RETRY_MAX_ATTEMPTS, 5),
      initialDelay: parseNumber(process.env.RETRY_INITIAL_DELAY, 1000),
      maxDelay: parseNumber(process.env.RETRY_MAX_DELAY, 60000),
      defaultPolicyType: (process.env.RETRY_DEFAULT_POLICY as RetryPolicyType) || RetryPolicyType.EXPONENTIAL_BACKOFF,
      policies: {
        email: {
          policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
          maxAttempts: parseNumber(process.env.EMAIL_RETRY_MAX_ATTEMPTS, 5),
          initialDelay: parseNumber(process.env.EMAIL_RETRY_INITIAL_DELAY, 5000),
          maxDelay: parseNumber(process.env.EMAIL_RETRY_MAX_DELAY, 3600000),
          backoffFactor: parseNumber(process.env.EMAIL_RETRY_BACKOFF_FACTOR, 2),
        },
        sms: {
          policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
          maxAttempts: parseNumber(process.env.SMS_RETRY_MAX_ATTEMPTS, 3),
          initialDelay: parseNumber(process.env.SMS_RETRY_INITIAL_DELAY, 10000),
          maxDelay: parseNumber(process.env.SMS_RETRY_MAX_DELAY, 3600000),
          backoffFactor: parseNumber(process.env.SMS_RETRY_BACKOFF_FACTOR, 3),
        },
        push: {
          policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
          maxAttempts: parseNumber(process.env.PUSH_RETRY_MAX_ATTEMPTS, 3),
          initialDelay: parseNumber(process.env.PUSH_RETRY_INITIAL_DELAY, 1000),
          maxDelay: parseNumber(process.env.PUSH_RETRY_MAX_DELAY, 60000),
          backoffFactor: parseNumber(process.env.PUSH_RETRY_BACKOFF_FACTOR, 2),
        },
        inApp: {
          policyType: RetryPolicyType.FIXED,
          maxAttempts: parseNumber(process.env.IN_APP_RETRY_MAX_ATTEMPTS, 2),
          initialDelay: parseNumber(process.env.IN_APP_RETRY_INITIAL_DELAY, 1000),
          maxDelay: parseNumber(process.env.IN_APP_RETRY_MAX_DELAY, 5000),
        },
      },
      errorTypeToPolicy: {
        [ErrorType.TRANSIENT]: RetryPolicyType.EXPONENTIAL_BACKOFF,
        [ErrorType.EXTERNAL]: RetryPolicyType.EXPONENTIAL_BACKOFF,
        [ErrorType.SYSTEM]: RetryPolicyType.LINEAR,
        // Client errors are not retried by default
      },
    },
    dlq: {
      enabled: parseBoolean(process.env.DLQ_ENABLED, true),
      topicPrefix: process.env.DLQ_TOPIC_PREFIX || 'dlq.',
      autoRetry: parseBoolean(process.env.DLQ_AUTO_RETRY, false),
      retryInterval: parseNumber(process.env.DLQ_RETRY_INTERVAL, 3600000), // 1 hour
      maxAgeMs: parseNumber(process.env.DLQ_MAX_AGE_MS, 86400000 * 7), // 7 days
    },
  };
});