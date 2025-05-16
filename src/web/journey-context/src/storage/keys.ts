/**
 * Storage Keys
 * 
 * This module defines standardized storage keys and key generation utilities
 * for persisting different types of journey-related data across platforms.
 * 
 * It provides constants for authentication sessions, journey preferences, and user settings,
 * along with functions for generating namespaced and journey-specific storage keys.
 */

/**
 * Storage namespace for the AUSTA application
 */
export const STORAGE_NAMESPACE = '@AUSTA';

/**
 * Journey types supported by the application
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Base storage keys for common data types
 */
export enum BaseStorageKey {
  // Authentication related keys
  AUTH_SESSION = 'auth_session',
  AUTH_REFRESH_TOKEN = 'auth_refresh_token',
  AUTH_MFA_TEMP_TOKEN = 'auth_mfa_temp_token',
  
  // User preferences
  USER_PREFERENCES = 'user_preferences',
  LANGUAGE_PREFERENCE = 'language_preference',
  THEME_PREFERENCE = 'theme_preference',
  NOTIFICATION_PREFERENCES = 'notification_preferences',
  
  // Journey preferences
  JOURNEY_PREFERENCES = 'journey_preferences',
  LAST_ACTIVE_JOURNEY = 'last_active_journey',
  
  // Application state
  APP_STATE = 'app_state',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  TERMS_ACCEPTED = 'terms_accepted',
  APP_VERSION = 'app_version',
  
  // Feature flags
  FEATURE_FLAGS = 'feature_flags',
}

/**
 * Health journey specific storage keys
 */
export enum HealthStorageKey {
  HEALTH_METRICS = 'health_metrics',
  HEALTH_GOALS = 'health_goals',
  DEVICE_CONNECTIONS = 'device_connections',
  LAST_SYNC_TIMESTAMP = 'last_sync_timestamp',
  HEALTH_UNITS_PREFERENCE = 'health_units_preference',
}

/**
 * Care journey specific storage keys
 */
export enum CareStorageKey {
  APPOINTMENTS = 'appointments',
  MEDICATIONS = 'medications',
  PREFERRED_PROVIDERS = 'preferred_providers',
  SYMPTOM_HISTORY = 'symptom_history',
  TELEMEDICINE_SETTINGS = 'telemedicine_settings',
}

/**
 * Plan journey specific storage keys
 */
export enum PlanStorageKey {
  INSURANCE_CARDS = 'insurance_cards',
  CLAIM_DRAFTS = 'claim_drafts',
  BENEFIT_FAVORITES = 'benefit_favorites',
  DOCUMENT_CACHE = 'document_cache',
}

/**
 * Creates a namespaced storage key
 * 
 * @param key - The base key to namespace
 * @returns A namespaced storage key
 */
export function createNamespacedKey(key: string): string {
  return `${STORAGE_NAMESPACE}:${key}`;
}

/**
 * Creates a journey-specific storage key
 * 
 * @param journeyType - The journey type (health, care, plan)
 * @param key - The journey-specific key
 * @returns A namespaced journey-specific storage key
 */
export function createJourneyKey(journeyType: JourneyType, key: string): string {
  return createNamespacedKey(`${journeyType}:${key}`);
}

/**
 * Creates a health journey storage key
 * 
 * @param key - The health journey specific key
 * @returns A namespaced health journey storage key
 */
export function createHealthKey(key: HealthStorageKey | string): string {
  return createJourneyKey(JourneyType.HEALTH, key);
}

/**
 * Creates a care journey storage key
 * 
 * @param key - The care journey specific key
 * @returns A namespaced care journey storage key
 */
export function createCareKey(key: CareStorageKey | string): string {
  return createJourneyKey(JourneyType.CARE, key);
}

/**
 * Creates a plan journey storage key
 * 
 * @param key - The plan journey specific key
 * @returns A namespaced plan journey storage key
 */
export function createPlanKey(key: PlanStorageKey | string): string {
  return createJourneyKey(JourneyType.PLAN, key);
}

/**
 * Creates a user-specific storage key
 * 
 * @param userId - The user ID
 * @param key - The base key
 * @returns A namespaced user-specific storage key
 */
export function createUserKey(userId: string, key: string): string {
  return createNamespacedKey(`user:${userId}:${key}`);
}

/**
 * Creates a user and journey specific storage key
 * 
 * @param userId - The user ID
 * @param journeyType - The journey type
 * @param key - The journey-specific key
 * @returns A namespaced user and journey specific storage key
 */
export function createUserJourneyKey(
  userId: string,
  journeyType: JourneyType,
  key: string
): string {
  return createNamespacedKey(`user:${userId}:${journeyType}:${key}`);
}

/**
 * Standard storage keys used across the application
 * These keys are already namespaced and ready to use
 */
export const StorageKeys = {
  // Authentication keys
  AUTH_SESSION: createNamespacedKey(BaseStorageKey.AUTH_SESSION),
  AUTH_REFRESH_TOKEN: createNamespacedKey(BaseStorageKey.AUTH_REFRESH_TOKEN),
  AUTH_MFA_TEMP_TOKEN: createNamespacedKey(BaseStorageKey.AUTH_MFA_TEMP_TOKEN),
  
  // User preference keys
  USER_PREFERENCES: createNamespacedKey(BaseStorageKey.USER_PREFERENCES),
  LANGUAGE_PREFERENCE: createNamespacedKey(BaseStorageKey.LANGUAGE_PREFERENCE),
  THEME_PREFERENCE: createNamespacedKey(BaseStorageKey.THEME_PREFERENCE),
  NOTIFICATION_PREFERENCES: createNamespacedKey(BaseStorageKey.NOTIFICATION_PREFERENCES),
  
  // Journey preference keys
  JOURNEY_PREFERENCES: createNamespacedKey(BaseStorageKey.JOURNEY_PREFERENCES),
  LAST_ACTIVE_JOURNEY: createNamespacedKey(BaseStorageKey.LAST_ACTIVE_JOURNEY),
  
  // Application state keys
  APP_STATE: createNamespacedKey(BaseStorageKey.APP_STATE),
  ONBOARDING_COMPLETED: createNamespacedKey(BaseStorageKey.ONBOARDING_COMPLETED),
  TERMS_ACCEPTED: createNamespacedKey(BaseStorageKey.TERMS_ACCEPTED),
  APP_VERSION: createNamespacedKey(BaseStorageKey.APP_VERSION),
  
  // Feature flag keys
  FEATURE_FLAGS: createNamespacedKey(BaseStorageKey.FEATURE_FLAGS),
  
  // Journey-specific key generators
  Health: {
    HEALTH_METRICS: createHealthKey(HealthStorageKey.HEALTH_METRICS),
    HEALTH_GOALS: createHealthKey(HealthStorageKey.HEALTH_GOALS),
    DEVICE_CONNECTIONS: createHealthKey(HealthStorageKey.DEVICE_CONNECTIONS),
    LAST_SYNC_TIMESTAMP: createHealthKey(HealthStorageKey.LAST_SYNC_TIMESTAMP),
    HEALTH_UNITS_PREFERENCE: createHealthKey(HealthStorageKey.HEALTH_UNITS_PREFERENCE),
  },
  
  Care: {
    APPOINTMENTS: createCareKey(CareStorageKey.APPOINTMENTS),
    MEDICATIONS: createCareKey(CareStorageKey.MEDICATIONS),
    PREFERRED_PROVIDERS: createCareKey(CareStorageKey.PREFERRED_PROVIDERS),
    SYMPTOM_HISTORY: createCareKey(CareStorageKey.SYMPTOM_HISTORY),
    TELEMEDICINE_SETTINGS: createCareKey(CareStorageKey.TELEMEDICINE_SETTINGS),
  },
  
  Plan: {
    INSURANCE_CARDS: createPlanKey(PlanStorageKey.INSURANCE_CARDS),
    CLAIM_DRAFTS: createPlanKey(PlanStorageKey.CLAIM_DRAFTS),
    BENEFIT_FAVORITES: createPlanKey(PlanStorageKey.BENEFIT_FAVORITES),
    DOCUMENT_CACHE: createPlanKey(PlanStorageKey.DOCUMENT_CACHE),
  },
};