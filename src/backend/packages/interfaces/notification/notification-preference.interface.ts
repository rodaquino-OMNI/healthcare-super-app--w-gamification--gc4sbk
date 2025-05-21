/**
 * Interface for user notification preferences
 * 
 * Represents a user's preferences for receiving notifications through different channels.
 */
export interface INotificationPreference {
  /**
   * ID of the user these preferences belong to
   */
  userId: string;
  
  /**
   * Whether push notifications are enabled
   */
  pushEnabled: boolean;
  
  /**
   * Whether email notifications are enabled
   */
  emailEnabled: boolean;
  
  /**
   * Whether SMS notifications are enabled
   */
  smsEnabled: boolean;
  
  /**
   * Whether in-app notifications are enabled
   */
  inAppEnabled: boolean;
  
  /**
   * Type-specific preferences that override the global settings
   */
  typePreferences?: Record<string, {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    inAppEnabled?: boolean;
  }>;
  
  /**
   * Journey-specific preferences that override the global settings
   */
  journeyPreferences?: Record<string, {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    inAppEnabled?: boolean;
  }>;
  
  /**
   * Quiet hours during which notifications should not be sent
   */
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string; // IANA timezone
  };
}