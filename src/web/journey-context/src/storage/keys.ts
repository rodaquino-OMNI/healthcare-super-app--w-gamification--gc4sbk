/**
 * @file Storage Keys
 * @description Defines standardized storage keys and key generation utilities for persisting
 * different types of journey-related data across web and mobile platforms.
 */

/**
 * Base namespace for all AUSTA app storage keys
 * Used as a prefix to prevent collisions with other apps or libraries
 */
export const STORAGE_NAMESPACE = '@AUSTA';

/**
 * Journey-specific namespaces
 * Used to isolate storage between different journeys
 */
export const JOURNEY_NAMESPACES = {
  /** Health journey namespace */
  HEALTH: 'health',
  /** Care journey namespace */
  CARE: 'care',
  /** Plan journey namespace */
  PLAN: 'plan',
  /** Cross-journey (shared) namespace */
  SHARED: 'shared',
} as const;

/**
 * Type representing valid journey namespaces
 */
export type JourneyNamespace = typeof JOURNEY_NAMESPACES[keyof typeof JOURNEY_NAMESPACES];

/**
 * Authentication related storage keys
 */
export const AUTH_KEYS = {
  /** Authentication session storage key */
  SESSION: `${STORAGE_NAMESPACE}:auth_session`,
  /** Refresh token storage key */
  REFRESH_TOKEN: `${STORAGE_NAMESPACE}:refresh_token`,
  /** User profile storage key */
  USER_PROFILE: `${STORAGE_NAMESPACE}:user_profile`,
  /** Authentication state storage key */
  AUTH_STATE: `${STORAGE_NAMESPACE}:auth_state`,
  /** Multi-factor authentication temporary token */
  MFA_TEMP_TOKEN: `${STORAGE_NAMESPACE}:mfa_temp_token`,
} as const;

/**
 * User preferences storage keys
 */
export const PREFERENCE_KEYS = {
  /** User theme preference */
  THEME: `${STORAGE_NAMESPACE}:theme`,
  /** User language preference */
  LANGUAGE: `${STORAGE_NAMESPACE}:language`,
  /** User notification preferences */
  NOTIFICATIONS: `${STORAGE_NAMESPACE}:notification_preferences`,
  /** User accessibility preferences */
  ACCESSIBILITY: `${STORAGE_NAMESPACE}:accessibility`,
  /** Last active journey */
  LAST_JOURNEY: `${STORAGE_NAMESPACE}:last_journey`,
} as const;

/**
 * Journey-specific storage keys
 */
export const JOURNEY_KEYS = {
  /** Journey state storage key */
  STATE: 'journey_state',
  /** Journey preferences storage key */
  PREFERENCES: 'journey_preferences',
  /** Journey last viewed screen */
  LAST_SCREEN: 'last_screen',
  /** Journey data cache */
  CACHE: 'data_cache',
} as const;

/**
 * Onboarding and tutorial storage keys
 */
export const ONBOARDING_KEYS = {
  /** Completed onboarding steps */
  COMPLETED_STEPS: `${STORAGE_NAMESPACE}:onboarding_completed_steps`,
  /** Dismissed tutorials */
  DISMISSED_TUTORIALS: `${STORAGE_NAMESPACE}:dismissed_tutorials`,
  /** First time user flag */
  FIRST_TIME_USER: `${STORAGE_NAMESPACE}:first_time_user`,
} as const;

/**
 * Offline data storage keys
 */
export const OFFLINE_KEYS = {
  /** Pending operations queue */
  PENDING_OPERATIONS: `${STORAGE_NAMESPACE}:pending_operations`,
  /** Offline data cache */
  DATA_CACHE: `${STORAGE_NAMESPACE}:offline_data_cache`,
  /** Last sync timestamp */
  LAST_SYNC: `${STORAGE_NAMESPACE}:last_sync_timestamp`,
} as const;

/**
 * Creates a namespaced storage key
 * @param key - The base key to namespace
 * @param namespace - Optional additional namespace
 * @returns A fully namespaced storage key
 */
export function createStorageKey(key: string, namespace?: string): string {
  if (namespace) {
    return `${STORAGE_NAMESPACE}:${namespace}:${key}`;
  }
  return `${STORAGE_NAMESPACE}:${key}`;
}

/**
 * Creates a journey-specific storage key
 * @param journeyNamespace - The journey namespace (health, care, plan, or shared)
 * @param key - The base key to namespace
 * @returns A journey-namespaced storage key
 */
export function createJourneyKey(journeyNamespace: JourneyNamespace, key: string): string {
  return createStorageKey(key, journeyNamespace);
}

/**
 * Creates a health journey storage key
 * @param key - The base key to namespace
 * @returns A health journey-namespaced storage key
 */
export function createHealthKey(key: string): string {
  return createJourneyKey(JOURNEY_NAMESPACES.HEALTH, key);
}

/**
 * Creates a care journey storage key
 * @param key - The base key to namespace
 * @returns A care journey-namespaced storage key
 */
export function createCareKey(key: string): string {
  return createJourneyKey(JOURNEY_NAMESPACES.CARE, key);
}

/**
 * Creates a plan journey storage key
 * @param key - The base key to namespace
 * @returns A plan journey-namespaced storage key
 */
export function createPlanKey(key: string): string {
  return createJourneyKey(JOURNEY_NAMESPACES.PLAN, key);
}

/**
 * Creates a shared (cross-journey) storage key
 * @param key - The base key to namespace
 * @returns A shared-namespaced storage key
 */
export function createSharedKey(key: string): string {
  return createJourneyKey(JOURNEY_NAMESPACES.SHARED, key);
}

/**
 * Creates a feature-specific storage key within a journey
 * @param journeyNamespace - The journey namespace
 * @param feature - The feature identifier
 * @param key - The specific key for the feature
 * @returns A feature-specific storage key
 */
export function createFeatureKey(
  journeyNamespace: JourneyNamespace,
  feature: string,
  key: string
): string {
  return createStorageKey(`${feature}:${key}`, journeyNamespace);
}

/**
 * Creates a user-specific storage key
 * @param userId - The user ID
 * @param key - The base key to namespace
 * @returns A user-specific storage key
 */
export function createUserKey(userId: string, key: string): string {
  return createStorageKey(`user:${userId}:${key}`);
}

/**
 * Creates a journey-specific user storage key
 * @param userId - The user ID
 * @param journeyNamespace - The journey namespace
 * @param key - The base key to namespace
 * @returns A journey and user-specific storage key
 */
export function createJourneyUserKey(
  userId: string,
  journeyNamespace: JourneyNamespace,
  key: string
): string {
  return createStorageKey(`user:${userId}:${key}`, journeyNamespace);
}