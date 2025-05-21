/**
 * Notification Preferences Interfaces
 * 
 * This file defines the interfaces for user notification preferences that determine
 * delivery channels and frequency settings. These interfaces support journey-specific
 * preferences and integrate with the @austa/interfaces package for consistent schemas
 * across services.
 */

import { BaseEntity } from '@austa/interfaces/common';

/**
 * Defines the available notification channels
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in-app'
}

/**
 * Defines the available notification frequency options
 */
export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

/**
 * Defines the available user journeys
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Interface for channel-specific preferences
 * Determines which channels are enabled for notifications
 */
export interface IChannelPreferences {
  /**
   * Whether push notifications are enabled
   * Default is true as push notifications are a primary notification channel
   */
  pushEnabled: boolean;

  /**
   * Whether email notifications are enabled
   * Default is true for important communications
   */
  emailEnabled: boolean;

  /**
   * Whether SMS notifications are enabled
   * Default is false due to potential costs associated with SMS
   */
  smsEnabled: boolean;

  /**
   * Whether in-app notifications are enabled
   * Default is true as in-app notifications are a primary notification channel
   */
  inAppEnabled: boolean;
}

/**
 * Interface for journey-specific notification preferences
 * Allows users to customize notification settings per journey
 */
export interface IJourneyPreferences {
  /**
   * Channel preferences specific to the Health journey
   */
  health: IChannelPreferences;

  /**
   * Channel preferences specific to the Care journey
   */
  care: IChannelPreferences;

  /**
   * Channel preferences specific to the Plan journey
   */
  plan: IChannelPreferences;
}

/**
 * Main interface for user notification preferences
 * Combines global and journey-specific preferences
 */
export interface INotificationPreferences extends BaseEntity {
  /**
   * The user ID associated with these notification preferences
   * References the user in the authentication system
   */
  userId: string;

  /**
   * Global channel preferences that apply to all notifications
   * These can be overridden by journey-specific preferences
   */
  channels: IChannelPreferences;

  /**
   * Journey-specific preferences that override global settings
   * Allows fine-grained control over notifications for each journey
   */
  journeys: IJourneyPreferences;

  /**
   * Default notification frequency for digests
   * Controls how often notification summaries are sent
   */
  defaultFrequency: NotificationFrequency;

  /**
   * Whether all notifications are temporarily paused
   * Useful for "do not disturb" periods
   */
  isPaused: boolean;

  /**
   * If notifications are paused, when they should resume
   * Null indicates indefinite pause
   */
  pauseUntil: Date | null;
}

/**
 * Interface for updating global channel preferences
 * Supports partial updates to avoid overwriting unspecified fields
 */
export interface IChannelPreferencesUpdate extends Partial<IChannelPreferences> {}

/**
 * Interface for updating journey-specific preferences
 * Supports partial updates to avoid overwriting unspecified fields
 */
export interface IJourneyPreferencesUpdate {
  /**
   * Channel preferences update for the Health journey
   */
  health?: IChannelPreferencesUpdate;

  /**
   * Channel preferences update for the Care journey
   */
  care?: IChannelPreferencesUpdate;

  /**
   * Channel preferences update for the Plan journey
   */
  plan?: IChannelPreferencesUpdate;
}

/**
 * Interface for updating notification preferences
 * Supports partial updates to avoid overwriting unspecified fields
 */
export interface IPreferenceUpdate {
  /**
   * Updates to global channel preferences
   */
  channels?: IChannelPreferencesUpdate;

  /**
   * Updates to journey-specific preferences
   */
  journeys?: IJourneyPreferencesUpdate;

  /**
   * Update to default notification frequency
   */
  defaultFrequency?: NotificationFrequency;

  /**
   * Update to notification pause status
   */
  isPaused?: boolean;

  /**
   * Update to notification pause end time
   */
  pauseUntil?: Date | null;
}

/**
 * Interface for notification preference creation
 * Requires userId but makes other fields optional with defaults
 */
export interface ICreateNotificationPreferences {
  /**
   * The user ID to associate with these preferences (required)
   */
  userId: string;

  /**
   * Initial channel preferences (optional, uses defaults if not provided)
   */
  channels?: Partial<IChannelPreferences>;

  /**
   * Initial journey preferences (optional, uses defaults if not provided)
   */
  journeys?: Partial<IJourneyPreferences>;

  /**
   * Initial default frequency (optional, defaults to IMMEDIATE)
   */
  defaultFrequency?: NotificationFrequency;
}

/**
 * Default channel preferences used when creating new preference records
 */
export const DEFAULT_CHANNEL_PREFERENCES: IChannelPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true
};

/**
 * Default journey preferences used when creating new preference records
 */
export const DEFAULT_JOURNEY_PREFERENCES: IJourneyPreferences = {
  health: { ...DEFAULT_CHANNEL_PREFERENCES },
  care: { ...DEFAULT_CHANNEL_PREFERENCES },
  plan: { ...DEFAULT_CHANNEL_PREFERENCES }
};