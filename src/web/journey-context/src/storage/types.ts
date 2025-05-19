/**
 * @file types.ts
 * @description TypeScript interfaces and types for storage operations and data structures
 * persisted by journey context across the application. Provides type safety for
 * storing and retrieving journey-specific data with standardized error handling.
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
  /** Item not found in storage */
  NOT_FOUND = 'NOT_FOUND',
  /** Permission denied for storage operation */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** Storage is full */
  STORAGE_FULL = 'STORAGE_FULL',
  /** Invalid data format */
  INVALID_FORMAT = 'INVALID_FORMAT',
  /** Storage is not available */
  UNAVAILABLE = 'UNAVAILABLE',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Base interface for all storage operations
 */
export interface StorageOperations {
  /**
   * Get an item from storage
   * @param key The key to retrieve
   */
  getItem<T>(key: string): Promise<StorageResult<T>>;

  /**
   * Set an item in storage
   * @param key The key to set
   * @param value The value to store
   */
  setItem<T>(key: string, value: T): Promise<StorageResult<void>>;

  /**
   * Remove an item from storage
   * @param key The key to remove
   */
  removeItem(key: string): Promise<StorageResult<void>>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<StorageResult<void>>;
}

/**
 * Available journey IDs in the application
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
 * User journey preferences stored between sessions
 */
export interface JourneyPreferences {
  /** The last active journey selected by the user */
  lastActiveJourney: JourneyId;
  /** Journey-specific preferences */
  journeySettings: {
    /** Health journey preferences */
    [JourneyId.HEALTH]: HealthJourneyPreferences;
    /** Care journey preferences */
    [JourneyId.CARE]: CareJourneyPreferences;
    /** Plan journey preferences */
    [JourneyId.PLAN]: PlanJourneyPreferences;
  };
  /** Timestamp when preferences were last updated */
  lastUpdated: number;
}

/**
 * Health journey specific preferences
 */
export interface HealthJourneyPreferences {
  /** User's preferred units of measurement */
  preferredUnits: {
    /** Weight unit preference */
    weight: 'kg' | 'lb';
    /** Height unit preference */
    height: 'cm' | 'ft';
    /** Temperature unit preference */
    temperature: 'celsius' | 'fahrenheit';
  };
  /** User's health goals visibility preferences */
  goalsVisibility: {
    /** Whether to show completed goals */
    showCompleted: boolean;
    /** Whether to show goals on dashboard */
    showOnDashboard: boolean;
  };
  /** Connected device preferences */
  devices: {
    /** IDs of favorite devices */
    favorites: string[];
    /** Whether to sync automatically */
    autoSync: boolean;
  };
}

/**
 * Care journey specific preferences
 */
export interface CareJourneyPreferences {
  /** Appointment notification preferences */
  appointmentNotifications: {
    /** Whether to receive reminders */
    enableReminders: boolean;
    /** How many hours before appointment to send reminder */
    reminderHours: number;
  };
  /** Provider preferences */
  providers: {
    /** IDs of favorite providers */
    favorites: string[];
    /** Default search radius in kilometers */
    defaultSearchRadius: number;
  };
  /** Telemedicine preferences */
  telemedicine: {
    /** Whether to use video by default */
    defaultVideoEnabled: boolean;
    /** Whether to use audio by default */
    defaultAudioEnabled: boolean;
  };
}

/**
 * Plan journey specific preferences
 */
export interface PlanJourneyPreferences {
  /** Claim submission preferences */
  claims: {
    /** Whether to save draft claims */
    saveDrafts: boolean;
    /** Default reimbursement method */
    defaultReimbursementMethod: 'bankAccount' | 'creditCard' | 'check';
  };
  /** Document preferences */
  documents: {
    /** Whether to automatically download documents */
    autoDownload: boolean;
    /** Default document sort order */
    defaultSortOrder: 'newest' | 'oldest' | 'name';
  };
  /** Coverage display preferences */
  coverage: {
    /** Whether to show monetary values */
    showMonetaryValues: boolean;
    /** Whether to show utilization percentages */
    showUtilizationPercentages: boolean;
  };
}

/**
 * Authentication session data stored between app launches
 */
export interface AuthSession {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** When the access token expires (timestamp) */
  expiresAt: number;
  /** User ID associated with this session */
  userId: string;
  /** When the user last authenticated (timestamp) */
  lastAuthenticated: number;
  /** Whether the user has completed MFA */
  mfaCompleted: boolean;
}

/**
 * User settings stored between sessions
 */
export interface UserSettings {
  /** User interface preferences */
  ui: {
    /** Theme preference */
    theme: 'light' | 'dark' | 'system';
    /** Font size preference */
    fontSize: 'small' | 'medium' | 'large';
    /** Whether to reduce animations */
    reduceAnimations: boolean;
  };
  /** Notification preferences */
  notifications: {
    /** Whether push notifications are enabled */
    pushEnabled: boolean;
    /** Whether email notifications are enabled */
    emailEnabled: boolean;
    /** Whether SMS notifications are enabled */
    smsEnabled: boolean;
    /** Types of notifications to receive */
    types: {
      /** Appointment reminders */
      appointments: boolean;
      /** Achievement notifications */
      achievements: boolean;
      /** Health goal reminders */
      healthGoals: boolean;
      /** Claim status updates */
      claimUpdates: boolean;
    };
  };
  /** Privacy preferences */
  privacy: {
    /** Whether to allow analytics */
    allowAnalytics: boolean;
    /** Whether to allow crash reporting */
    allowCrashReporting: boolean;
    /** Whether to store session data */
    storeSessionData: boolean;
  };
  /** Language preference */
  language: 'en' | 'pt';
}

/**
 * Storage keys used by the journey context
 */
export enum StorageKey {
  /** Key for journey preferences */
  JOURNEY_PREFERENCES = 'journey_preferences',
  /** Key for authentication session */
  AUTH_SESSION = 'auth_session',
  /** Key for user settings */
  USER_SETTINGS = 'user_settings',
}

/**
 * Storage adapter interface for platform-specific implementations
 */
export interface StorageAdapter extends StorageOperations {
  /** Whether the storage is ready to use */
  isReady(): Promise<boolean>;
  /** Initialize the storage adapter */
  initialize(): Promise<void>;
}