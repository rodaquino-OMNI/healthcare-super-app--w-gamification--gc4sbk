import { registerAs } from '@nestjs/config';
import { NotificationChannel } from '@austa/interfaces/notification/types';

/**
 * Configuration interface for notification rate limiting
 */
export interface RateLimitConfig {
  /** Maximum number of notifications per time window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
  /** Whether to enable rate limiting for this channel */
  enabled: boolean;
}

/**
 * Configuration interface for notification channel fallback
 */
export interface FallbackConfig {
  /** Whether to enable fallback for this channel */
  enabled: boolean;
  /** Channels to try in order when the primary channel fails */
  channels: NotificationChannel[];
  /** Maximum number of fallback attempts */
  maxAttempts: number;
  /** Delay between fallback attempts in milliseconds */
  retryDelayMs: number;
}

/**
 * Configuration interface for email channel
 */
export interface EmailChannelConfig {
  /** Email provider settings */
  provider: {
    /** SMTP host */
    host: string;
    /** SMTP port */
    port: number;
    /** Whether to use secure connection */
    secure: boolean;
    /** SMTP authentication user */
    user: string;
    /** SMTP authentication password */
    password: string;
    /** Default sender email address */
    from: string;
  };
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Fallback configuration */
  fallback: FallbackConfig;
  /** Time-to-live for email notifications in seconds */
  ttlSec: number;
}

/**
 * Configuration interface for SMS channel
 */
export interface SmsChannelConfig {
  /** SMS provider settings */
  provider: {
    /** Twilio account SID */
    accountSid: string;
    /** Twilio auth token */
    authToken: string;
    /** Default sender phone number */
    defaultFrom: string;
  };
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Fallback configuration */
  fallback: FallbackConfig;
  /** Time-to-live for SMS notifications in seconds */
  ttlSec: number;
}

/**
 * Configuration interface for push notification channel
 */
export interface PushChannelConfig {
  /** Push notification provider settings */
  provider: {
    /** Firebase Cloud Messaging API key */
    apiKey: string;
    /** Whether to use Firebase Admin SDK */
    useAdminSdk: boolean;
  };
  /** Platform-specific settings */
  platforms: {
    /** Android-specific settings */
    android: {
      /** Priority for Android notifications */
      priority: 'high' | 'normal';
      /** Time-to-live for Android notifications in seconds */
      ttlSec: number;
    };
    /** iOS-specific settings */
    ios: {
      /** Priority for iOS notifications */
      priority: number;
      /** Whether to make the notification critical (bypass Do Not Disturb) */
      critical: boolean;
    };
    /** Web-specific settings */
    web: {
      /** Actions for web notifications */
      actions: Array<{ action: string; title: string }>;
    };
  };
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Fallback configuration */
  fallback: FallbackConfig;
  /** Time-to-live for push notifications in seconds */
  ttlSec: number;
}

/**
 * Configuration interface for in-app notification channel
 */
export interface InAppChannelConfig {
  /** In-app notification storage settings */
  storage: {
    /** Redis key prefix for in-app notifications */
    keyPrefix: string;
    /** Time-to-live for in-app notifications in seconds */
    ttlSec: number;
  };
  /** WebSocket settings for real-time delivery */
  websocket: {
    /** Whether to enable WebSocket delivery */
    enabled: boolean;
    /** Namespace for WebSocket connections */
    namespace: string;
  };
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Fallback configuration */
  fallback: FallbackConfig;
  /** Journey-specific TTL settings in seconds */
  journeyTtl: {
    /** Health journey TTL */
    health: number;
    /** Care journey TTL */
    care: number;
    /** Plan journey TTL */
    plan: number;
    /** Gamification journey TTL */
    game: number;
    /** Default TTL for unknown journeys */
    default: number;
  };
}

/**
 * Configuration interface for all notification channels
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
  /** Global settings for all channels */
  global: {
    /** Default channel to use when none is specified */
    defaultChannel: NotificationChannel;
    /** Whether to enable channel fallback globally */
    enableFallback: boolean;
    /** Default fallback channels in order of preference */
    defaultFallbackChannels: NotificationChannel[];
    /** Whether to enable delivery tracking */
    trackDelivery: boolean;
    /** Whether to retry failed deliveries */
    retryFailedDeliveries: boolean;
    /** Maximum number of retry attempts for failed deliveries */
    maxRetryAttempts: number;
  };
}

/**
 * Notification channels configuration factory
 * Registers the channels configuration with the ConfigService
 */
export default registerAs('channels', (): ChannelsConfig => {
  return {
    email: {
      provider: {
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_DEFAULT_FROM || 'noreply@austa.health',
      },
      rateLimit: {
        limit: parseInt(process.env.EMAIL_RATE_LIMIT || '100', 10),
        windowSec: parseInt(process.env.EMAIL_RATE_WINDOW || '3600', 10),
        enabled: process.env.EMAIL_RATE_LIMIT_ENABLED !== 'false',
      },
      fallback: {
        enabled: process.env.EMAIL_FALLBACK_ENABLED !== 'false',
        channels: [
          NotificationChannel.PUSH,
          NotificationChannel.IN_APP,
        ],
        maxAttempts: parseInt(process.env.EMAIL_FALLBACK_MAX_ATTEMPTS || '3', 10),
        retryDelayMs: parseInt(process.env.EMAIL_FALLBACK_RETRY_DELAY || '60000', 10),
      },
      ttlSec: parseInt(process.env.EMAIL_TTL || '604800', 10), // 7 days
    },
    sms: {
      provider: {
        accountSid: process.env.SMS_ACCOUNT_SID || '',
        authToken: process.env.SMS_AUTH_TOKEN || '',
        defaultFrom: process.env.SMS_DEFAULT_FROM || '',
      },
      rateLimit: {
        limit: parseInt(process.env.SMS_RATE_LIMIT || '50', 10),
        windowSec: parseInt(process.env.SMS_RATE_WINDOW || '3600', 10),
        enabled: process.env.SMS_RATE_LIMIT_ENABLED !== 'false',
      },
      fallback: {
        enabled: process.env.SMS_FALLBACK_ENABLED !== 'false',
        channels: [
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
          NotificationChannel.IN_APP,
        ],
        maxAttempts: parseInt(process.env.SMS_FALLBACK_MAX_ATTEMPTS || '3', 10),
        retryDelayMs: parseInt(process.env.SMS_FALLBACK_RETRY_DELAY || '60000', 10),
      },
      ttlSec: parseInt(process.env.SMS_TTL || '86400', 10), // 24 hours
    },
    push: {
      provider: {
        apiKey: process.env.PUSH_API_KEY || '',
        useAdminSdk: process.env.PUSH_USE_ADMIN_SDK !== 'false',
      },
      platforms: {
        android: {
          priority: process.env.PUSH_ANDROID_PRIORITY === 'normal' ? 'normal' : 'high',
          ttlSec: parseInt(process.env.PUSH_ANDROID_TTL || '2419200', 10), // 28 days
        },
        ios: {
          priority: parseInt(process.env.PUSH_IOS_PRIORITY || '10', 10),
          critical: process.env.PUSH_IOS_CRITICAL === 'true',
        },
        web: {
          actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        },
      },
      rateLimit: {
        limit: parseInt(process.env.PUSH_RATE_LIMIT || '500', 10),
        windowSec: parseInt(process.env.PUSH_RATE_WINDOW || '3600', 10),
        enabled: process.env.PUSH_RATE_LIMIT_ENABLED !== 'false',
      },
      fallback: {
        enabled: process.env.PUSH_FALLBACK_ENABLED !== 'false',
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
        ],
        maxAttempts: parseInt(process.env.PUSH_FALLBACK_MAX_ATTEMPTS || '3', 10),
        retryDelayMs: parseInt(process.env.PUSH_FALLBACK_RETRY_DELAY || '30000', 10),
      },
      ttlSec: parseInt(process.env.PUSH_TTL || '259200', 10), // 3 days
    },
    inApp: {
      storage: {
        keyPrefix: process.env.IN_APP_KEY_PREFIX || 'notification:inapp:',
        ttlSec: parseInt(process.env.IN_APP_TTL || '2592000', 10), // 30 days
      },
      websocket: {
        enabled: process.env.IN_APP_WEBSOCKET_ENABLED !== 'false',
        namespace: process.env.IN_APP_WEBSOCKET_NAMESPACE || '/notifications',
      },
      rateLimit: {
        limit: parseInt(process.env.IN_APP_RATE_LIMIT || '1000', 10),
        windowSec: parseInt(process.env.IN_APP_RATE_WINDOW || '3600', 10),
        enabled: process.env.IN_APP_RATE_LIMIT_ENABLED !== 'false',
      },
      fallback: {
        enabled: process.env.IN_APP_FALLBACK_ENABLED !== 'false',
        channels: [
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
        maxAttempts: parseInt(process.env.IN_APP_FALLBACK_MAX_ATTEMPTS || '3', 10),
        retryDelayMs: parseInt(process.env.IN_APP_FALLBACK_RETRY_DELAY || '15000', 10),
      },
      journeyTtl: {
        health: parseInt(process.env.IN_APP_HEALTH_TTL || '2592000', 10), // 30 days
        care: parseInt(process.env.IN_APP_CARE_TTL || '1209600', 10), // 14 days
        plan: parseInt(process.env.IN_APP_PLAN_TTL || '7776000', 10), // 90 days
        game: parseInt(process.env.IN_APP_GAME_TTL || '5184000', 10), // 60 days
        default: parseInt(process.env.IN_APP_DEFAULT_TTL || '2592000', 10), // 30 days
      },
    },
    global: {
      defaultChannel: NotificationChannel.IN_APP,
      enableFallback: process.env.NOTIFICATION_ENABLE_FALLBACK !== 'false',
      defaultFallbackChannels: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
        NotificationChannel.SMS,
      ],
      trackDelivery: process.env.NOTIFICATION_TRACK_DELIVERY !== 'false',
      retryFailedDeliveries: process.env.NOTIFICATION_RETRY_FAILED !== 'false',
      maxRetryAttempts: parseInt(process.env.NOTIFICATION_MAX_RETRY_ATTEMPTS || '3', 10),
    },
  };
});