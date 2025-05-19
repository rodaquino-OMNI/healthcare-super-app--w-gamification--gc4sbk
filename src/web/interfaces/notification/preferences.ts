/**
 * @austa/interfaces/notification/preferences
 * 
 * This file defines interfaces for user notification preferences in the AUSTA SuperApp.
 * It includes NotificationPreference for global settings and JourneyNotificationPreference
 * for per-journey customization of notification channels (in-app, push, email, SMS).
 * These interfaces ensure users can control how they receive different types of
 * notifications across health, care, and plan journeys while maintaining type safety
 * for preference management.
 */

import { NotificationChannel, NotificationType } from './types';

/**
 * Interface for channel-specific notification preferences.
 * Allows users to enable/disable notifications for specific channels.
 */
export interface ChannelPreference {
  /** Whether notifications are enabled for this channel */
  enabled: boolean;
  
  /** Optional time restrictions for when notifications can be sent (e.g., quiet hours) */
  timeRestrictions?: {
    /** Start time in 24-hour format (HH:MM) */
    startTime?: string;
    /** End time in 24-hour format (HH:MM) */
    endTime?: string;
    /** Days of week when notifications are allowed (0 = Sunday, 6 = Saturday) */
    daysOfWeek?: number[];
  };
}

/**
 * Interface for global notification preferences.
 * Defines user preferences for all notification channels across the application.
 */
export interface NotificationPreference {
  /** User ID associated with these preferences */
  userId: string;
  
  /** Last updated timestamp */
  updatedAt: Date;
  
  /** Global enable/disable flag for all notifications */
  globalEnabled: boolean;
  
  /** Channel-specific preferences */
  channels: {
    /** In-app notification preferences */
    inApp: ChannelPreference;
    
    /** Push notification preferences */
    push: ChannelPreference;
    
    /** Email notification preferences */
    email: ChannelPreference;
    
    /** SMS notification preferences */
    sms: ChannelPreference;
  };
  
  /** Type-specific preferences that override global settings */
  typePreferences?: {
    /** Maps notification type to enabled/disabled state */
    [key in NotificationType]?: {
      /** Whether this notification type is enabled */
      enabled: boolean;
      /** Specific channels to use for this notification type (overrides global channel settings) */
      channels?: NotificationChannel[];
    };
  };
}

/**
 * Interface for journey-specific notification preferences.
 * Allows users to customize notification settings for each journey independently.
 */
export interface JourneyNotificationPreference {
  /** User ID associated with these preferences */
  userId: string;
  
  /** Journey identifier (health, care, plan) */
  journeyId: 'health' | 'care' | 'plan';
  
  /** Last updated timestamp */
  updatedAt: Date;
  
  /** Journey-specific enable/disable flag */
  enabled: boolean;
  
  /** Journey-specific channel preferences (overrides global settings) */
  channels?: {
    /** In-app notification preferences for this journey */
    inApp?: ChannelPreference;
    
    /** Push notification preferences for this journey */
    push?: ChannelPreference;
    
    /** Email notification preferences for this journey */
    email?: ChannelPreference;
    
    /** SMS notification preferences for this journey */
    sms?: ChannelPreference;
  };
  
  /** Type-specific preferences for this journey (overrides global type preferences) */
  typePreferences?: {
    /** Maps notification type to enabled/disabled state */
    [key in NotificationType]?: {
      /** Whether this notification type is enabled for this journey */
      enabled: boolean;
      /** Specific channels to use for this notification type in this journey */
      channels?: NotificationChannel[];
      /** Priority level override for this notification type in this journey */
      priority?: 'low' | 'medium' | 'high' | 'critical';
    };
  };
}

/**
 * Interface for default notification preference templates.
 * Used to initialize user preferences with sensible defaults.
 */
export interface NotificationPreferenceTemplate {
  /** Template identifier */
  templateId: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Default global preferences */
  defaultPreferences: Omit<NotificationPreference, 'userId' | 'updatedAt'>;
  
  /** Default journey-specific preferences */
  journeyPreferences: {
    /** Health journey default preferences */
    health?: Omit<JourneyNotificationPreference, 'userId' | 'updatedAt' | 'journeyId'>;
    
    /** Care journey default preferences */
    care?: Omit<JourneyNotificationPreference, 'userId' | 'updatedAt' | 'journeyId'>;
    
    /** Plan journey default preferences */
    plan?: Omit<JourneyNotificationPreference, 'userId' | 'updatedAt' | 'journeyId'>;
  };
}