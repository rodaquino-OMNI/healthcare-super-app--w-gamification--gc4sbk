/**
 * Interface representing a user's notification preferences.
 * This defines the structure for storing user choices for receiving notifications
 * across different channels.
 */
export interface INotificationPreference {
  /**
   * Unique identifier for the notification preference record
   */
  id: number;

  /**
   * The user ID associated with these notification preferences
   * References the user in the authentication system
   */
  userId: string;

  /**
   * Whether push notifications are enabled for this user
   * Default is true as push notifications are a primary notification channel
   */
  pushEnabled: boolean;

  /**
   * Whether email notifications are enabled for this user
   * Default is true for important communications
   */
  emailEnabled: boolean;

  /**
   * Whether SMS notifications are enabled for this user
   * Default is false due to potential costs associated with SMS
   */
  smsEnabled: boolean;

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
 * Interface for journey-specific notification preferences.
 * Allows users to customize notification settings for each journey.
 */
export interface IJourneyNotificationPreference {
  /**
   * Unique identifier for the journey notification preference
   */
  id: number;

  /**
   * The user ID associated with these preferences
   */
  userId: string;

  /**
   * The journey this preference applies to (health, care, plan)
   */
  journeyType: 'health' | 'care' | 'plan';

  /**
   * Whether notifications for this journey are enabled
   */
  enabled: boolean;

  /**
   * Channel-specific preferences for this journey
   */
  channelPreferences: {
    /**
     * Whether in-app notifications are enabled for this journey
     */
    inApp: boolean;

    /**
     * Whether push notifications are enabled for this journey
     */
    push: boolean;

    /**
     * Whether email notifications are enabled for this journey
     */
    email: boolean;

    /**
     * Whether SMS notifications are enabled for this journey
     */
    sms: boolean;
  };

  /**
   * Timestamp when the preference was created
   */
  createdAt: Date;

  /**
   * Timestamp when the preference was last updated
   */
  updatedAt: Date;
}

/**
 * Interface for notification preference templates.
 * Used to define default preferences for different user types.
 */
export interface INotificationPreferenceTemplate {
  /**
   * Unique identifier for the template
   */
  id: number;

  /**
   * Name of the template
   */
  name: string;

  /**
   * Description of the template
   */
  description: string;

  /**
   * Default global preferences
   */
  globalPreferences: Omit<INotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

  /**
   * Default journey-specific preferences
   */
  journeyPreferences: Array<Omit<IJourneyNotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

  /**
   * Whether this is the default template for new users
   */
  isDefault: boolean;

  /**
   * Timestamp when the template was created
   */
  createdAt: Date;

  /**
   * Timestamp when the template was last updated
   */
  updatedAt: Date;
}