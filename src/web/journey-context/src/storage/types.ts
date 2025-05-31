/**
 * @file Types for storage operations in the journey context package
 * 
 * This file defines TypeScript interfaces and types for storage operations
 * and the data structures persisted by journey context across the application.
 * It provides type safety for all storage operations with standardized error handling.
 */

/**
 * Result of a storage operation
 */
export interface StorageResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** The data returned by the operation, if successful */
  data?: T;
  /** Error information if the operation failed */
  error?: StorageError;
}

/**
 * Error information for storage operations
 */
export interface StorageError {
  /** Error code for programmatic handling */
  code: StorageErrorCode;
  /** Human-readable error message */
  message: string;
  /** Original error object, if available */
  originalError?: unknown;
}

/**
 * Error codes for storage operations
 */
export enum StorageErrorCode {
  /** Storage is not available */
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  /** Item not found in storage */
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  /** Error parsing stored data */
  PARSE_ERROR = 'PARSE_ERROR',
  /** Error serializing data for storage */
  SERIALIZE_ERROR = 'SERIALIZE_ERROR',
  /** Storage quota exceeded */
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  /** Permission denied for storage operation */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Storage keys used by the journey context
 */
export enum StorageKey {
  /** Key for storing journey preferences */
  JOURNEY_PREFERENCES = 'austa_journey_preferences',
  /** Key for storing authentication session */
  AUTH_SESSION = 'austa_auth_session',
  /** Key for storing user settings */
  USER_SETTINGS = 'austa_user_settings',
}

/**
 * Journey IDs supported by the application
 */
export enum JourneyId {
  /** Health journey */
  HEALTH = 'health',
  /** Care journey */
  CARE = 'care',
  /** Plan journey */
  PLAN = 'plan',
}

/**
 * Base interface for all journey preferences
 */
export interface JourneyPreferencesBase {
  /** The last active journey */
  lastActiveJourney: JourneyId;
  /** Timestamp when preferences were last updated */
  lastUpdated: number;
}

/**
 * Health journey specific preferences
 */
export interface HealthJourneyPreferences {
  /** Whether to show health metrics on dashboard */
  showMetricsOnDashboard: boolean;
  /** User's preferred health metric units (metric/imperial) */
  preferredUnits: 'metric' | 'imperial';
  /** IDs of connected health devices */
  connectedDeviceIds: string[];
  /** User's health goals */
  healthGoals: {
    /** Goal ID */
    id: string;
    /** Whether the goal is active */
    active: boolean;
  }[];
}

/**
 * Care journey specific preferences
 */
export interface CareJourneyPreferences {
  /** Whether to show upcoming appointments on dashboard */
  showAppointmentsOnDashboard: boolean;
  /** User's preferred healthcare providers */
  preferredProviderIds: string[];
  /** Notification preferences for appointments */
  appointmentNotifications: {
    /** Whether to enable email notifications */
    email: boolean;
    /** Whether to enable SMS notifications */
    sms: boolean;
    /** Whether to enable push notifications */
    push: boolean;
    /** How many minutes before appointment to send reminder */
    reminderMinutesBefore: number;
  };
}

/**
 * Plan journey specific preferences
 */
export interface PlanJourneyPreferences {
  /** Whether to show recent claims on dashboard */
  showClaimsOnDashboard: boolean;
  /** Whether to show coverage information on dashboard */
  showCoverageOnDashboard: boolean;
  /** User's preferred document format for statements */
  preferredDocumentFormat: 'pdf' | 'html';
}

/**
 * Complete journey preferences object
 */
export interface JourneyPreferences extends JourneyPreferencesBase {
  /** Health journey preferences */
  health: HealthJourneyPreferences;
  /** Care journey preferences */
  care: CareJourneyPreferences;
  /** Plan journey preferences */
  plan: PlanJourneyPreferences;
}

/**
 * Default journey preferences
 */
export const DEFAULT_JOURNEY_PREFERENCES: JourneyPreferences = {
  lastActiveJourney: JourneyId.HEALTH,
  lastUpdated: Date.now(),
  health: {
    showMetricsOnDashboard: true,
    preferredUnits: 'metric',
    connectedDeviceIds: [],
    healthGoals: [],
  },
  care: {
    showAppointmentsOnDashboard: true,
    preferredProviderIds: [],
    appointmentNotifications: {
      email: true,
      sms: true,
      push: true,
      reminderMinutesBefore: 60,
    },
  },
  plan: {
    showClaimsOnDashboard: true,
    showCoverageOnDashboard: true,
    preferredDocumentFormat: 'pdf',
  },
};

/**
 * Authentication session data
 */
export interface AuthSession {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** When the access token expires (timestamp) */
  expiresAt: number;
  /** User ID */
  userId: string;
  /** User's roles */
  roles: string[];
  /** Whether the session is active */
  isActive: boolean;
}

/**
 * User settings data
 */
export interface UserSettings {
  /** User's preferred language */
  language: 'pt-BR' | 'en-US';
  /** User's preferred theme */
  theme: 'light' | 'dark' | 'system';
  /** Whether to enable analytics */
  analyticsEnabled: boolean;
  /** Whether to enable notifications */
  notificationsEnabled: boolean;
  /** Whether to use biometric authentication when available */
  useBiometricAuth: boolean;
  /** Whether to enable gamification features */
  gamificationEnabled: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'pt-BR',
  theme: 'system',
  analyticsEnabled: true,
  notificationsEnabled: true,
  useBiometricAuth: false,
  gamificationEnabled: true,
};

/**
 * Storage adapter interface for platform-specific implementations
 */
export interface StorageAdapter {
  /**
   * Get an item from storage
   * @param key Storage key
   * @returns Promise resolving to storage result
   */
  getItem<T>(key: StorageKey): Promise<StorageResult<T>>;

  /**
   * Set an item in storage
   * @param key Storage key
   * @param value Value to store
   * @returns Promise resolving to storage result
   */
  setItem<T>(key: StorageKey, value: T): Promise<StorageResult<T>>;

  /**
   * Remove an item from storage
   * @param key Storage key
   * @returns Promise resolving to storage result
   */
  removeItem(key: StorageKey): Promise<StorageResult<void>>;

  /**
   * Clear all storage
   * @returns Promise resolving to storage result
   */
  clear(): Promise<StorageResult<void>>;
}