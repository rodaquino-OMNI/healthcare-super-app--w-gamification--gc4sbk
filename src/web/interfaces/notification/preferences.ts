/**
 * Notification Preferences Interfaces
 * 
 * This file defines the interfaces for user notification preferences in the AUSTA SuperApp.
 * These interfaces ensure users can control how they receive different types of notifications
 * across health, care, and plan journeys while maintaining type safety for preference management.
 */

import { NotificationChannel, NotificationPriority, NotificationType } from './types';

/**
 * Interface for channel-specific notification preferences
 * Controls whether notifications are enabled for a specific channel
 */
export interface ChannelPreference {
  /** Whether notifications are enabled for this channel */
  enabled: boolean;
  /** Minimum priority level for notifications on this channel */
  minimumPriority?: NotificationPriority;
}

/**
 * Interface for global notification preferences
 * Controls user's overall notification settings across all journeys
 */
export interface NotificationPreference {
  /** User ID associated with these preferences */
  readonly userId: string;
  /** Last updated timestamp */
  readonly updatedAt: Date;
  /** Whether all notifications are enabled */
  enabled: boolean;
  /** Default quiet hours start time (e.g., "22:00") */
  quietHoursStart?: string;
  /** Default quiet hours end time (e.g., "07:00") */
  quietHoursEnd?: string;
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
  /** Type-specific preferences */
  typePreferences?: {
    [key in NotificationType]?: {
      /** Whether this notification type is enabled */
      enabled: boolean;
      /** Channel overrides for this notification type */
      channelOverrides?: {
        [key in NotificationChannel]?: ChannelPreference;
      };
    };
  };
}

/**
 * Interface for journey-specific notification preferences
 * Allows users to customize notifications for each journey independently
 */
export interface JourneyNotificationPreference {
  /** User ID associated with these preferences */
  readonly userId: string;
  /** Journey identifier (health, care, plan) */
  readonly journeyId: 'health' | 'care' | 'plan';
  /** Last updated timestamp */
  readonly updatedAt: Date;
  /** Whether notifications for this journey are enabled */
  enabled: boolean;
  /** Journey-specific quiet hours start time (overrides global setting) */
  quietHoursStart?: string;
  /** Journey-specific quiet hours end time (overrides global setting) */
  quietHoursEnd?: string;
  /** Channel-specific preferences for this journey (overrides global settings) */
  channelOverrides?: {
    [key in NotificationChannel]?: ChannelPreference;
  };
  /** Type-specific preferences for this journey */
  typePreferences?: {
    [key in NotificationType]?: {
      /** Whether this notification type is enabled for this journey */
      enabled: boolean;
      /** Channel overrides for this notification type in this journey */
      channelOverrides?: {
        [key in NotificationChannel]?: ChannelPreference;
      };
    };
  };
}

/**
 * Interface for default notification preference templates
 * Used to initialize user preferences with sensible defaults
 */
export interface NotificationPreferenceTemplate {
  /** Template identifier */
  readonly id: string;
  /** Template name */
  readonly name: string;
  /** Template description */
  readonly description: string;
  /** Default global preferences */
  globalPreferences: Omit<NotificationPreference, 'userId' | 'updatedAt'>;
  /** Default journey-specific preferences */
  journeyPreferences: {
    [key in 'health' | 'care' | 'plan']?: Omit<JourneyNotificationPreference, 'userId' | 'journeyId' | 'updatedAt'>;
  };
}