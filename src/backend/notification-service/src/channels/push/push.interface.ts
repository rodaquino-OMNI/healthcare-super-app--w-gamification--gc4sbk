/**
 * Push Notification Interfaces
 * 
 * This file defines TypeScript interfaces for push notification handling, extending
 * the standardized interfaces from @austa/interfaces. These interfaces ensure type safety
 * across the notification service and standardize data structures for push notifications.
 * 
 * Part of the AUSTA SuperApp refactoring to implement standardized notification handling
 * with improved error handling and retry mechanisms.
 */

import { IPushNotificationPayload } from '@austa/interfaces/notification';
import { DeliveryStatusType, DeliveryChannel } from '../../interfaces/delivery-tracking.interface';

/**
 * Push notification payload interface that extends the base push notification payload
 * from @austa/interfaces with FCM-specific properties.
 */
export interface PushPayload extends IPushNotificationPayload {
  /**
   * Firebase Cloud Messaging specific configurations
   */
  fcm?: {
    /**
     * Android-specific configuration
     */
    android?: {
      /**
       * Notification channel ID (required for Android 8.0+)
       */
      channelId: string;
      
      /**
       * Priority of the notification
       */
      priority?: 'high' | 'normal';
      
      /**
       * Time-to-live in seconds
       */
      ttl?: number;
      
      /**
       * Collapse key for message grouping
       */
      collapseKey?: string;
    };
    
    /**
     * Apple Push Notification Service specific configuration
     */
    apns?: {
      /**
       * Headers for APNs
       */
      headers?: Record<string, string>;
      
      /**
       * Payload for APNs
       */
      payload?: {
        /**
         * APNs alert object
         */
        aps?: {
          /**
           * Alert object or string
           */
          alert?: {
            title?: string;
            body?: string;
            'title-loc-key'?: string;
            'title-loc-args'?: string[];
            'loc-key'?: string;
            'loc-args'?: string[];
          } | string;
          
          /**
           * Badge count to display on app icon
           */
          badge?: number;
          
          /**
           * Sound to play
           */
          sound?: string | { critical?: boolean; name?: string; volume?: number };
          
          /**
           * Content available flag for silent notifications
           */
          'content-available'?: 1;
          
          /**
           * Category for actionable notifications
           */
          category?: string;
          
          /**
           * Thread ID for notification grouping
           */
          'thread-id'?: string;
        };
      };
    };
    
    /**
     * Web Push specific configuration
     */
    webpush?: {
      /**
       * Headers for Web Push
       */
      headers?: Record<string, string>;
      
      /**
       * Data payload for Web Push
       */
      data?: Record<string, any>;
      
      /**
       * Notification payload for Web Push
       */
      notification?: {
        /**
         * Title of the notification
         */
        title?: string;
        
        /**
         * Body of the notification
         */
        body?: string;
        
        /**
         * Icon URL
         */
        icon?: string;
        
        /**
         * URL to open when notification is clicked
         */
        click_action?: string;
      };
      
      /**
       * Urgency of the notification
       */
      urgency?: 'high' | 'normal' | 'low';
      
      /**
       * Time-to-live in seconds
       */
      ttl?: number;
    };
  };
  
  /**
   * Journey-specific data to include in the notification
   */
  journeyData?: {
    /**
     * Journey identifier
     */
    journey: 'health' | 'care' | 'plan' | 'gamification' | 'system';
    
    /**
     * Journey-specific context data
     */
    context?: Record<string, any>;
    
    /**
     * Deep link to open when notification is tapped
     */
    deepLink?: string;
  };
}

/**
 * Device token validation schema
 * Ensures that device tokens are properly formatted for FCM
 */
export interface DeviceToken {
  /**
   * The actual token string
   */
  token: string;
  
  /**
   * Platform the token is for
   */
  platform: 'ios' | 'android' | 'web';
  
  /**
   * User ID associated with this token
   */
  userId: string;
  
  /**
   * App version that generated this token
   */
  appVersion?: string;
  
  /**
   * Device information
   */
  device?: {
    /**
     * Device model
     */
    model?: string;
    
    /**
     * Operating system version
     */
    osVersion?: string;
    
    /**
     * Device language
     */
    language?: string;
  };
  
  /**
   * Timestamp when this token was last used
   */
  lastUsed?: Date;
  
  /**
   * Whether this token is currently active
   */
  isActive: boolean;
}

/**
 * Firebase Cloud Messaging response interface
 * Represents the response from FCM when sending a notification
 */
export interface FCMResponse {
  /**
   * Message ID assigned by FCM
   */
  messageId: string;
  
  /**
   * Error information if the message failed to send
   */
  error?: {
    /**
     * Error code
     */
    code: string;
    
    /**
     * Error message
     */
    message: string;
    
    /**
     * Additional details about the error
     */
    details?: Record<string, any>;
  };
}

/**
 * Retry configuration for push notifications
 * Allows customizing retry behavior for failed push notifications
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Base delay between retries in milliseconds
   */
  baseDelayMs: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelayMs: number;
  
  /**
   * Retry strategy
   */
  strategy: 'exponential' | 'linear' | 'fixed';
  
  /**
   * Factor for exponential backoff (if using exponential strategy)
   */
  backoffFactor?: number;
  
  /**
   * Error codes that should trigger a retry
   */
  retryableErrorCodes?: string[];
  
  /**
   * Error codes that should not trigger a retry
   */
  nonRetryableErrorCodes?: string[];
}

/**
 * Push notification delivery status
 * Tracks the current status of a push notification delivery
 */
export interface PushDeliveryStatus {
  /**
   * Current status of the push notification
   */
  status: DeliveryStatusType;
  
  /**
   * Delivery channel (always 'push' for push notifications)
   */
  channel: DeliveryChannel.PUSH;
  
  /**
   * Device token the notification was sent to
   */
  deviceToken: string;
  
  /**
   * Platform the notification was sent to
   */
  platform: 'ios' | 'android' | 'web';
  
  /**
   * FCM message ID if the notification was sent successfully
   */
  messageId?: string;
  
  /**
   * Timestamp when the notification was sent
   */
  sentAt?: Date;
  
  /**
   * Timestamp when the notification was delivered
   */
  deliveredAt?: Date;
  
  /**
   * Error information if the notification failed to send
   */
  error?: {
    /**
     * Error code
     */
    code: string;
    
    /**
     * Error message
     */
    message: string;
    
    /**
     * Additional details about the error
     */
    details?: Record<string, any>;
  };
  
  /**
   * Retry information if this notification is being retried
   */
  retry?: {
    /**
     * Current retry attempt number
     */
    attemptNumber: number;
    
    /**
     * Maximum number of retry attempts
     */
    maxAttempts: number;
    
    /**
     * Next retry timestamp
     */
    nextRetryAt?: Date;
  };
}