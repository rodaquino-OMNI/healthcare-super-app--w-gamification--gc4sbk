/**
 * Interface for user-specific logging context in the AUSTA SuperApp.
 * Extends the base LoggingContext to capture user-specific information
 * for structured logging and user journey analysis.
 */

import { LoggingContext } from './context.interface';

/**
 * Interface representing user-specific context information for logging.
 * This interface captures user details such as ID, authentication status,
 * roles, and preferences that provide critical context for user-related logs.
 */
export interface UserContext extends LoggingContext {
  /**
   * Unique identifier for the user
   * Used to associate logs with a specific user
   * Note: This overrides the userId in the base LoggingContext
   * to make it a required field in UserContext
   */
  userId: string;

  /**
   * Indicates whether the user is authenticated
   * Used to distinguish between authenticated and anonymous user actions
   */
  isAuthenticated: boolean;

  /**
   * The authentication method used (if authenticated)
   * Examples: 'jwt', 'oauth', 'saml', etc.
   */
  authMethod?: string;

  /**
   * Timestamp when the user was authenticated
   * Useful for tracking session duration and token expiration
   */
  authTimestamp?: Date;

  /**
   * User roles assigned to the user
   * Used for authorization and access control logging
   */
  roles?: string[];

  /**
   * Specific permissions the user has
   * More granular than roles, represents specific actions the user can perform
   */
  permissions?: string[];

  /**
   * User's preferred language
   * Used for localization and content personalization
   */
  preferredLanguage?: string;

  /**
   * User's preferred journey (if any)
   * Indicates which journey (Health, Care, Plan) the user primarily uses
   */
  preferredJourney?: string;

  /**
   * User preferences that affect system behavior
   * Can include notification preferences, display settings, etc.
   */
  preferences?: {
    /**
     * Notification preferences
     * Controls how and when the user receives notifications
     */
    notifications?: {
      /**
       * Whether email notifications are enabled
       */
      emailEnabled?: boolean;
      
      /**
       * Whether push notifications are enabled
       */
      pushEnabled?: boolean;
      
      /**
       * Whether SMS notifications are enabled
       */
      smsEnabled?: boolean;
      
      /**
       * Whether in-app notifications are enabled
       */
      inAppEnabled?: boolean;
    };
    
    /**
     * Display preferences
     * Controls how content is displayed to the user
     */
    display?: {
      /**
       * Theme preference (light, dark, system)
       */
      theme?: 'light' | 'dark' | 'system';
      
      /**
       * Accessibility settings
       */
      accessibility?: {
        /**
         * Font size multiplier
         */
        fontScale?: number;
        
        /**
         * Whether high contrast mode is enabled
         */
        highContrast?: boolean;
        
        /**
         * Whether screen reader optimizations are enabled
         */
        screenReaderOptimized?: boolean;
      };
    };
    
    /**
     * Privacy preferences
     * Controls how user data is collected and used
     */
    privacy?: {
      /**
       * Whether analytics tracking is allowed
       */
      allowAnalytics?: boolean;
      
      /**
       * Whether personalized content is allowed
       */
      allowPersonalization?: boolean;
      
      /**
       * Whether third-party data sharing is allowed
       */
      allowDataSharing?: boolean;
    };
    
    /**
     * Additional user preferences as key-value pairs
     */
    [key: string]: any;
  };

  /**
   * User profile information
   * Basic profile data that might be relevant for logging
   */
  profile?: {
    /**
     * User's display name
     */
    displayName?: string;
    
    /**
     * User's email address
     */
    email?: string;
    
    /**
     * User's account type
     */
    accountType?: string;
    
    /**
     * When the user account was created
     */
    createdAt?: Date;
    
    /**
     * Whether the user has completed onboarding
     */
    onboardingCompleted?: boolean;
    
    /**
     * Additional profile information as key-value pairs
     */
    [key: string]: any;
  };

  /**
   * Device information for the user's current session
   * Useful for troubleshooting device-specific issues
   */
  device?: {
    /**
     * Device type (mobile, tablet, desktop)
     */
    type?: 'mobile' | 'tablet' | 'desktop' | string;
    
    /**
     * Operating system
     */
    os?: string;
    
    /**
     * Browser or app version
     */
    appVersion?: string;
    
    /**
     * Device identifier (when available)
     */
    deviceId?: string;
  };

  /**
   * Additional user-specific data as key-value pairs
   * Can contain any user-specific context that doesn't fit in other properties
   */
  userData?: Record<string, any>;
}