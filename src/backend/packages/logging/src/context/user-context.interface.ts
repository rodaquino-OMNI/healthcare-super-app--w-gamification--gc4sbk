/**
 * @file User Context Interface
 * @description Defines the UserContext interface that extends the base LoggingContext
 * to capture user-specific information for structured logging.
 */

import { LoggingContext } from './context.interface';

/**
 * Enum representing the authentication status of a user.
 */
export enum AuthenticationStatus {
  /** User is authenticated with valid credentials */
  AUTHENTICATED = 'authenticated',
  /** User is not authenticated */
  UNAUTHENTICATED = 'unauthenticated',
  /** User's authentication is in progress */
  IN_PROGRESS = 'in_progress',
  /** User's authentication has failed */
  FAILED = 'failed',
  /** User's authentication token has expired */
  EXPIRED = 'expired',
  /** User is authenticated but requires additional verification */
  REQUIRES_VERIFICATION = 'requires_verification',
}

/**
 * Interface representing a user's role in the system.
 */
export interface UserRole {
  /** Unique identifier for the role */
  id: string;
  /** Name of the role */
  name: string;
  /** Description of the role's purpose and capabilities */
  description?: string;
  /** Timestamp when the role was assigned to the user */
  assignedAt?: string;
}

/**
 * Interface representing a user's permission in the system.
 */
export interface UserPermission {
  /** Unique identifier for the permission */
  id: string;
  /** Resource the permission applies to */
  resource: string;
  /** Action allowed on the resource (read, write, delete, etc.) */
  action: string;
  /** Conditions under which the permission applies */
  conditions?: Record<string, any>;
}

/**
 * Interface representing user preferences that affect system behavior.
 */
export interface UserPreferences {
  /** User's preferred language */
  language?: string;
  /** User's preferred theme */
  theme?: string;
  /** User's notification preferences */
  notifications?: {
    /** Whether email notifications are enabled */
    emailEnabled?: boolean;
    /** Whether push notifications are enabled */
    pushEnabled?: boolean;
    /** Whether SMS notifications are enabled */
    smsEnabled?: boolean;
    /** Types of notifications the user has opted into */
    subscribedTypes?: string[];
  };
  /** User's privacy preferences */
  privacy?: {
    /** Whether data sharing is enabled */
    dataSharingEnabled?: boolean;
    /** Whether analytics tracking is enabled */
    analyticsEnabled?: boolean;
    /** Whether personalization is enabled */
    personalizationEnabled?: boolean;
  };
  /** Journey-specific preferences */
  journeyPreferences?: Record<string, any>;
}

/**
 * UserContext interface that extends the base LoggingContext to capture
 * user-specific information for structured logging.
 * 
 * This interface provides critical context for user-related logs, enabling
 * proper analysis of user journeys, security monitoring, and personalized
 * experiences within the AUSTA SuperApp.
 */
export interface UserContext extends LoggingContext {
  /** Unique identifier for the user */
  userId: string;
  
  /** Authentication status of the user */
  authStatus: AuthenticationStatus;
  
  /** Timestamp of the user's last authentication */
  lastAuthenticatedAt?: string;
  
  /** Authentication method used (password, biometric, SSO, etc.) */
  authMethod?: string;
  
  /** User's roles in the system */
  roles?: UserRole[];
  
  /** User's permissions in the system */
  permissions?: UserPermission[];
  
  /** User's preferences affecting system behavior */
  preferences?: UserPreferences;
  
  /** User's session information */
  session?: {
    /** Unique identifier for the user's session */
    sessionId: string;
    /** Timestamp when the session started */
    startedAt: string;
    /** IP address of the user */
    ipAddress?: string;
    /** User agent information */
    userAgent?: string;
    /** Device information */
    device?: {
      /** Type of device (mobile, tablet, desktop) */
      type?: string;
      /** Operating system of the device */
      os?: string;
      /** Browser or app information */
      browser?: string;
    };
  };
  
  /** User's account information */
  account?: {
    /** Type of account (free, premium, etc.) */
    type?: string;
    /** Status of the account (active, suspended, etc.) */
    status?: string;
    /** Timestamp when the account was created */
    createdAt?: string;
    /** Whether the account is verified */
    isVerified?: boolean;
  };
  
  /** User's journey history */
  journeyHistory?: {
    /** Last journey the user interacted with */
    lastJourney?: string;
    /** Timestamp of the last journey interaction */
    lastJourneyTimestamp?: string;
    /** Count of journey interactions in the current session */
    journeyInteractionCount?: number;
  };
  
  /** User's gamification information */
  gamification?: {
    /** User's current level */
    level?: number;
    /** User's current experience points */
    xp?: number;
    /** User's achievements */
    achievements?: string[];
    /** User's current challenges */
    activeChallenges?: string[];
  };
}