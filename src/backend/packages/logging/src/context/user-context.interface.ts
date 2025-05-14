import { LoggingContext } from './context.interface';

/**
 * Interface representing user-specific context for structured logging.
 * Extends the base LoggingContext to include user-related information
 * that provides critical context for user-related logs, enabling
 * user journey analysis and security monitoring.
 */
export interface UserContext extends LoggingContext {
  /**
   * Unique identifier for the user.
   * Used for tracking user activity across logs and services.
   */
  userId: string;

  /**
   * Indicates whether the user is authenticated.
   * Useful for distinguishing between authenticated and anonymous user actions.
   */
  isAuthenticated: boolean;

  /**
   * Array of roles assigned to the user.
   * Used for understanding user permissions and access patterns.
   */
  roles: string[];

  /**
   * Optional permissions associated with the user.
   * Provides detailed context about what actions the user is authorized to perform.
   */
  permissions?: string[];

  /**
   * Optional user preferences that affect system behavior.
   * Helps in understanding how user settings impact their experience.
   */
  preferences?: {
    /**
     * User's preferred language.
     * Important for internationalization-related logging.
     */
    language?: string;
    
    /**
     * User's preferred notification channels.
     * Helps in tracking notification delivery preferences.
     */
    notificationChannels?: string[];
    
    /**
     * Other user preferences as key-value pairs.
     * Allows for flexible logging of various user settings.
     */
    [key: string]: any;
  };

  /**
   * Optional user session information.
   * Provides context about the user's current session.
   */
  session?: {
    /**
     * Session identifier.
     * Used for correlating logs within a single user session.
     */
    sessionId: string;
    
    /**
     * Session start timestamp.
     * Helps in tracking session duration and patterns.
     */
    startedAt: Date;
    
    /**
     * Device information for the current session.
     * Provides context about the user's device and environment.
     */
    device?: {
      /**
       * Type of device (mobile, tablet, desktop, etc.).
       */
      type: string;
      
      /**
       * Operating system of the device.
       */
      os?: string;
      
      /**
       * Browser or app information.
       */
      client?: string;
    };
  };

  /**
   * Optional journey-specific user context.
   * Captures user state within specific journeys (Health, Care, Plan).
   */
  journeyContext?: {
    /**
     * Current journey the user is engaged with.
     */
    currentJourney?: string;
    
    /**
     * Journey-specific user state.
     */
    journeyState?: Record<string, any>;
  };
}