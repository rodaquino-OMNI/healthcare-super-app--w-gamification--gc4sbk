import { NotificationType, NotificationPriority, NotificationStatus } from '@austa/interfaces/notification/types';
import { JourneyType } from '@austa/interfaces/journey/common';
import { BaseError } from '@austa/interfaces/common/errors';

/**
 * Represents a device token for push notifications.
 * Used to validate and identify the target device for FCM messages.
 */
export interface DeviceToken {
  /** The actual token string provided by FCM */
  token: string;
  
  /** The platform of the device (ios, android, web) */
  platform: 'ios' | 'android' | 'web';
  
  /** The user ID associated with this device token */
  userId: string;
  
  /** When the token was last validated or refreshed */
  lastValidated?: Date;
  
  /** Whether this token is currently active */
  isActive: boolean;
}

/**
 * Base interface for push notification payloads.
 * Provides the common structure for all push notifications.
 */
export interface PushPayload {
  /** The notification title */
  title: string;
  
  /** The notification body text */
  body: string;
  
  /** Additional data to send with the notification */
  data?: Record<string, string>;
  
  /** The type of notification being sent */
  type: NotificationType;
  
  /** The priority level of the notification */
  priority: NotificationPriority;
  
  /** The journey context this notification belongs to */
  journey?: JourneyType;
  
  /** Android-specific configuration */
  android?: AndroidConfig;
  
  /** iOS-specific configuration */
  apns?: APNSConfig;
  
  /** Web-specific configuration */
  webpush?: WebPushConfig;
  
  /** Time-to-live in seconds */
  ttl?: number;
  
  /** Collapse key for grouping notifications */
  collapseKey?: string;
}

/**
 * Android-specific configuration for FCM messages.
 */
export interface AndroidConfig {
  /** The notification channel ID */
  channelId?: string;
  
  /** Priority of the notification (high, normal) */
  priority?: 'high' | 'normal';
  
  /** Small icon to use */
  icon?: string;
  
  /** Color of the notification icon */
  color?: string;
  
  /** Sound to play */
  sound?: string;
  
  /** Tag for notification grouping */
  tag?: string;
  
  /** Whether notification is visible in the lockscreen */
  visibility?: 'public' | 'private' | 'secret';
}

/**
 * iOS-specific configuration for FCM messages (APNS).
 */
export interface APNSConfig {
  /** Headers for the APNS request */
  headers?: Record<string, string>;
  
  /** APNS payload configuration */
  payload?: {
    /** APNS alert configuration */
    aps?: {
      /** Alert configuration */
      alert?: {
        /** Title of the notification */
        title?: string;
        
        /** Body of the notification */
        body?: string;
        
        /** Action to perform when notification is clicked */
        action?: string;
      };
      
      /** Badge count to display */
      badge?: number;
      
      /** Sound to play */
      sound?: string;
      
      /** Content available flag */
      'content-available'?: 1 | 0;
      
      /** Category for actionable notifications */
      category?: string;
      
      /** Thread ID for grouping notifications */
      'thread-id'?: string;
    };
  };
}

/**
 * Web-specific configuration for FCM messages.
 */
export interface WebPushConfig {
  /** Headers for the web push request */
  headers?: Record<string, string>;
  
  /** Data to send with the notification */
  data?: Record<string, any>;
  
  /** Notification configuration */
  notification?: {
    /** Title of the notification */
    title?: string;
    
    /** Body of the notification */
    body?: string;
    
    /** Icon to display */
    icon?: string;
    
    /** Image to display */
    image?: string;
    
    /** Badge to display */
    badge?: string;
    
    /** Direction of the text */
    dir?: 'auto' | 'ltr' | 'rtl';
    
    /** Language of the notification */
    lang?: string;
    
    /** Whether to renotify the user */
    renotify?: boolean;
    
    /** Whether notification requires interaction to dismiss */
    requireInteraction?: boolean;
    
    /** Tag for notification grouping */
    tag?: string;
    
    /** Vibration pattern */
    vibrate?: number[];
    
    /** Actions the user can take */
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  };
}

/**
 * Response from Firebase Cloud Messaging when sending a message.
 */
export interface FCMResponse {
  /** The message ID returned by FCM */
  messageId: string;
  
  /** Error information if the message failed */
  error?: {
    /** Error code returned by FCM */
    code: string;
    
    /** Error message */
    message: string;
    
    /** Whether this error is retryable */
    isRetryable: boolean;
  };
}

/**
 * Configuration for retry behavior when sending push notifications.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay before first retry (in ms) */
  initialDelayMs: number;
  
  /** Maximum delay between retries (in ms) */
  maxDelayMs: number;
  
  /** Backoff factor for exponential backoff */
  backoffFactor: number;
  
  /** Whether to use jitter to randomize delay times */
  useJitter: boolean;
  
  /** Error codes that should trigger a retry */
  retryableErrorCodes: string[];
}

/**
 * Status of a push notification delivery attempt.
 */
export interface DeliveryStatus {
  /** Unique identifier for this delivery attempt */
  deliveryId: string;
  
  /** The notification ID being delivered */
  notificationId: string;
  
  /** The device token the notification was sent to */
  deviceToken: string;
  
  /** Current status of the delivery */
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  
  /** Timestamp when the notification was sent */
  sentAt?: Date;
  
  /** Timestamp when the notification was delivered */
  deliveredAt?: Date;
  
  /** Error information if delivery failed */
  error?: {
    /** Error code */
    code: string;
    
    /** Error message */
    message: string;
    
    /** Whether a retry was attempted */
    retried: boolean;
    
    /** Number of retry attempts made */
    retryCount: number;
  };
  
  /** FCM message ID if available */
  messageId?: string;
}

/**
 * Health journey specific push notification payload.
 */
export interface HealthPushPayload extends PushPayload {
  journey: 'health';
  data: {
    /** The health metric type */
    metricType?: string;
    
    /** The health goal ID if related to a goal */
    goalId?: string;
    
    /** The device ID if related to a connected device */
    deviceId?: string;
    
    /** Deep link path to navigate to when clicked */
    deepLink: string;
    
    [key: string]: string;
  };
}

/**
 * Care journey specific push notification payload.
 */
export interface CarePushPayload extends PushPayload {
  journey: 'care';
  data: {
    /** The appointment ID if related to an appointment */
    appointmentId?: string;
    
    /** The provider ID if related to a healthcare provider */
    providerId?: string;
    
    /** The telemedicine session ID if related to a telemedicine session */
    sessionId?: string;
    
    /** Deep link path to navigate to when clicked */
    deepLink: string;
    
    [key: string]: string;
  };
}

/**
 * Plan journey specific push notification payload.
 */
export interface PlanPushPayload extends PushPayload {
  journey: 'plan';
  data: {
    /** The claim ID if related to an insurance claim */
    claimId?: string;
    
    /** The benefit ID if related to a benefit */
    benefitId?: string;
    
    /** The plan ID if related to an insurance plan */
    planId?: string;
    
    /** Deep link path to navigate to when clicked */
    deepLink: string;
    
    [key: string]: string;
  };
}

/**
 * Gamification specific push notification payload.
 */
export interface GamificationPushPayload extends PushPayload {
  type: NotificationType.ACHIEVEMENT | NotificationType.LEVEL_UP | NotificationType.QUEST_COMPLETED;
  data: {
    /** The achievement ID if related to an achievement */
    achievementId?: string;
    
    /** The quest ID if related to a quest */
    questId?: string;
    
    /** The reward ID if related to a reward */
    rewardId?: string;
    
    /** The new level if related to leveling up */
    level?: string;
    
    /** The XP earned if applicable */
    xpEarned?: string;
    
    /** Deep link path to navigate to when clicked */
    deepLink: string;
    
    [key: string]: string;
  };
}

/**
 * Device token validation result.
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  
  /** The validated token if valid */
  token?: DeviceToken;
  
  /** Error information if validation failed */
  error?: {
    /** Error code */
    code: string;
    
    /** Error message */
    message: string;
  };
}

/**
 * Batch notification request for sending to multiple devices.
 */
export interface BatchPushRequest {
  /** Array of device tokens to send to */
  tokens: string[];
  
  /** The notification payload */
  payload: PushPayload;
  
  /** Optional retry configuration */
  retryConfig?: Partial<RetryConfig>;
  
  /** Whether to fail the entire batch if any single notification fails */
  failOnSingleError?: boolean;
}

/**
 * Result of a batch notification operation.
 */
export interface BatchPushResult {
  /** Number of successful deliveries */
  successCount: number;
  
  /** Number of failed deliveries */
  failureCount: number;
  
  /** Array of successful message IDs */
  successfulMessageIds: string[];
  
  /** Array of failed tokens with error information */
  failedTokens: Array<{
    token: string;
    error: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * Push notification error interface extending the base error.
 */
export interface PushNotificationError extends BaseError {
  /** The error code specific to push notifications */
  code: string;
  
  /** Whether this error is retryable */
  isRetryable: boolean;
  
  /** The device token that caused the error, if applicable */
  deviceToken?: string;
  
  /** The notification ID that caused the error, if applicable */
  notificationId?: string;
  
  /** The original error from FCM, if available */
  originalError?: any;
}

/**
 * Token registration request interface.
 */
export interface TokenRegistrationRequest {
  /** The device token to register */
  token: string;
  
  /** The platform of the device */
  platform: 'ios' | 'android' | 'web';
  
  /** The user ID to associate with this token */
  userId: string;
  
  /** App version information */
  appVersion?: string;
  
  /** Device information */
  deviceInfo?: {
    /** Device model */
    model?: string;
    
    /** Operating system */
    os?: string;
    
    /** OS version */
    osVersion?: string;
  };
}