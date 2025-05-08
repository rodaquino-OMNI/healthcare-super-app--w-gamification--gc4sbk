/**
 * @file notification-preferences.interface.ts
 * @description Defines interfaces for user notification preferences that determine delivery channels and frequency settings.
 * These interfaces support journey-specific preferences and integrate with the @austa/interfaces package for consistent schemas across services.
 */

// Import from @austa/interfaces for cross-service consistency
import { IBaseEntity } from '@austa/interfaces/common';
import { IErrorResponse } from '@austa/interfaces/common/dto';

/**
 * Enum representing available notification channels
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app'
}

/**
 * Enum representing available user journeys
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Interface for channel-specific preferences
 * Controls which channels are enabled for notifications
 */
export interface IChannelPreferences {
  /**
   * Whether push notifications are enabled
   * @default true
   */
  pushEnabled: boolean;

  /**
   * Whether email notifications are enabled
   * @default true
   */
  emailEnabled: boolean;

  /**
   * Whether SMS notifications are enabled
   * @default false
   */
  smsEnabled: boolean;

  /**
   * Whether in-app notifications are enabled
   * @default true
   */
  inAppEnabled: boolean;
}

/**
 * Interface for frequency settings
 * Controls how often notifications are sent
 */
export interface IFrequencySettings {
  /**
   * Maximum number of notifications per day
   * @default 10
   */
  maxPerDay: number;

  /**
   * Whether to bundle similar notifications
   * @default true
   */
  bundleSimilar: boolean;

  /**
   * Quiet hours start time (24-hour format)
   * @example "22:00"
   */
  quietHoursStart?: string;

  /**
   * Quiet hours end time (24-hour format)
   * @example "07:00"
   */
  quietHoursEnd?: string;
}

/**
 * Interface for journey-specific notification preferences
 * Each journey can have its own channel and frequency settings
 */
export interface IJourneyPreferences {
  /**
   * Whether notifications for this journey are enabled
   * @default true
   */
  enabled: boolean;

  /**
   * Channel preferences specific to this journey
   * Overrides global channel preferences when specified
   */
  channels?: Partial<IChannelPreferences>;

  /**
   * Frequency settings specific to this journey
   * Overrides global frequency settings when specified
   */
  frequency?: Partial<IFrequencySettings>;

  /**
   * Priority level for notifications from this journey
   * Higher priority notifications may override quiet hours
   * @default 1
   */
  priority?: number;
}

/**
 * Main interface for user notification preferences
 * Extends IBaseEntity from @austa/interfaces for cross-service consistency
 */
export interface INotificationPreferences extends IBaseEntity {
  /**
   * The user ID associated with these notification preferences
   * References the user in the authentication system
   */
  userId: string;

  /**
   * Global channel preferences
   * Applied to all notifications unless overridden by journey-specific preferences
   */
  channels: IChannelPreferences;

  /**
   * Global frequency settings
   * Applied to all notifications unless overridden by journey-specific preferences
   */
  frequency: IFrequencySettings;

  /**
   * Journey-specific preferences
   * Allows for fine-grained control over notifications for each journey
   */
  journeyPreferences: {
    [Journey.HEALTH]?: IJourneyPreferences;
    [Journey.CARE]?: IJourneyPreferences;
    [Journey.PLAN]?: IJourneyPreferences;
  };

  /**
   * Whether all notifications are temporarily paused
   * @default false
   */
  paused: boolean;

  /**
   * Timestamp when notifications will automatically unpause
   * If not set, notifications remain paused until manually unpaused
   */
  pauseUntil?: Date;

  /**
   * Timestamp when the preference record was created
   */
  createdAt: Date;

  /**
   * Timestamp when the preference record was last updated
   */
  updatedAt: Date;
}

/**
 * Interface for updating channel preferences
 * Supports partial updates to channel settings
 */
export interface IChannelPreferenceUpdate extends Partial<IChannelPreferences> {}

/**
 * Interface for updating frequency settings
 * Supports partial updates to frequency settings
 */
export interface IFrequencySettingsUpdate extends Partial<IFrequencySettings> {}

/**
 * Interface for updating journey-specific preferences
 * Supports partial updates to journey preferences
 */
export interface IJourneyPreferenceUpdate extends Partial<Omit<IJourneyPreferences, 'channels' | 'frequency'>> {
  /**
   * Channel preferences to update for this journey
   */
  channels?: IChannelPreferenceUpdate;

  /**
   * Frequency settings to update for this journey
   */
  frequency?: IFrequencySettingsUpdate;
}

/**
 * Interface for updating notification preferences
 * Supports partial updates to the notification preferences
 */
export interface IPreferenceUpdate {
  /**
   * Global channel preferences to update
   */
  channels?: IChannelPreferenceUpdate;

  /**
   * Global frequency settings to update
   */
  frequency?: IFrequencySettingsUpdate;

  /**
   * Journey-specific preferences to update
   */
  journeyPreferences?: {
    [Journey.HEALTH]?: IJourneyPreferenceUpdate;
    [Journey.CARE]?: IJourneyPreferenceUpdate;
    [Journey.PLAN]?: IJourneyPreferenceUpdate;
  };

  /**
   * Whether to pause all notifications
   */
  paused?: boolean;

  /**
   * Timestamp when notifications will automatically unpause
   */
  pauseUntil?: Date;
}

/**
 * Interface for the response when retrieving notification preferences
 */
export interface INotificationPreferencesResponse {
  /**
   * The notification preferences
   */
  preferences: INotificationPreferences;

  /**
   * Whether the preferences were created with default values
   */
  isDefault: boolean;
}

/**
 * Interface for the response when updating notification preferences
 */
export interface IUpdatePreferencesResponse {
  /**
   * The updated notification preferences
   */
  preferences: INotificationPreferences;

  /**
   * Fields that were updated
   */
  updatedFields: string[];
}

/**
 * Interface for channel fallback configuration
 * Defines the fallback strategy when a notification channel fails
 */
export interface IChannelFallbackConfig {
  /**
   * Whether fallback is enabled for this channel
   * @default true
   */
  enabled: boolean;

  /**
   * Ordered list of fallback channels to try when the primary channel fails
   * Channels are tried in the order specified
   * @example [NotificationChannel.EMAIL, NotificationChannel.PUSH]
   */
  fallbackChannels: NotificationChannel[];

  /**
   * Maximum number of fallback attempts
   * @default 2
   */
  maxAttempts: number;

  /**
   * Whether to respect user preferences when falling back
   * If true, will only fall back to channels the user has enabled
   * @default true
   */
  respectUserPreferences: boolean;
}

/**
 * Interface for fallback strategy configuration
 * Defines the fallback strategy for all channels
 */
export interface IFallbackStrategy {
  /**
   * Whether fallback is globally enabled
   * @default true
   */
  enabled: boolean;

  /**
   * Channel-specific fallback configurations
   */
  channelConfigs: {
    [NotificationChannel.PUSH]?: IChannelFallbackConfig;
    [NotificationChannel.EMAIL]?: IChannelFallbackConfig;
    [NotificationChannel.SMS]?: IChannelFallbackConfig;
    [NotificationChannel.IN_APP]?: IChannelFallbackConfig;
  };

  /**
   * Journey-specific fallback configurations
   * Overrides global fallback configurations for specific journeys
   */
  journeyConfigs?: {
    [Journey.HEALTH]?: Partial<IFallbackStrategy>;
    [Journey.CARE]?: Partial<IFallbackStrategy>;
    [Journey.PLAN]?: Partial<IFallbackStrategy>;
  };
}

/**
 * Interface for fallback result
 * Contains information about the fallback attempt
 */
export interface IFallbackResult {
  /**
   * Whether the fallback was successful
   */
  success: boolean;

  /**
   * The original channel that failed
   */
  originalChannel: NotificationChannel;

  /**
   * The channel that was successfully used as fallback
   * Only present if success is true
   */
  fallbackChannel?: NotificationChannel;

  /**
   * Number of attempts made before successful delivery or giving up
   */
  attempts: number;

  /**
   * Error information if fallback was unsuccessful
   * Only present if success is false
   */
  error?: IErrorResponse;
}

/**
 * Interface for preference resolution
 * Provides utility methods to resolve effective preferences based on global and journey-specific settings
 */
export interface IPreferenceResolver {
  /**
   * Resolves the effective channel preferences for a specific journey
   * Combines global and journey-specific channel preferences
   * 
   * @param preferences The user's notification preferences
   * @param journey The journey to resolve preferences for
   * @returns The effective channel preferences for the journey
   */
  resolveChannelPreferences(preferences: INotificationPreferences, journey: Journey): IChannelPreferences;

  /**
   * Resolves the effective frequency settings for a specific journey
   * Combines global and journey-specific frequency settings
   * 
   * @param preferences The user's notification preferences
   * @param journey The journey to resolve preferences for
   * @returns The effective frequency settings for the journey
   */
  resolveFrequencySettings(preferences: INotificationPreferences, journey: Journey): IFrequencySettings;

  /**
   * Determines if a notification should be delivered based on user preferences
   * Considers channel preferences, frequency settings, and quiet hours
   * 
   * @param preferences The user's notification preferences
   * @param journey The journey the notification is from
   * @param channel The channel to deliver the notification through
   * @param timestamp The timestamp when the notification would be delivered
   * @returns Whether the notification should be delivered
   */
  shouldDeliverNotification(
    preferences: INotificationPreferences,
    journey: Journey,
    channel: NotificationChannel,
    timestamp?: Date
  ): boolean;

  /**
   * Gets the fallback channels for a specific channel and journey
   * Based on the fallback strategy and user preferences
   * 
   * @param preferences The user's notification preferences
   * @param journey The journey the notification is from
   * @param channel The channel that failed
   * @param fallbackStrategy The fallback strategy to use
   * @returns Array of fallback channels in priority order
   */
  getFallbackChannels(
    preferences: INotificationPreferences,
    journey: Journey,
    channel: NotificationChannel,
    fallbackStrategy: IFallbackStrategy
  ): NotificationChannel[];
}